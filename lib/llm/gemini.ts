import type { Locale, LiveStockSnapshot } from "@/lib/engine/types";
import {
  CircuitBreaker,
  DEFAULT_LLM_TIMEOUT_MS,
  type LlmProvider,
  type RephraseItemInput,
  type RephraseItemOutput,
} from "./provider";
import { safeRephraseBatch } from "./verify";
import { SLOPMONSTER_SYSTEM_PROMPT, containsSlop } from "./slopmonster";

export { SLOPMONSTER_SYSTEM_PROMPT };

export const GEMINI_REPHRASE_PROMPT =
  "Rephrase the following sentences naturally. DO NOT change, add or remove any numbers, percentages, or entities. DO NOT provide investment advice or price targets. Return ONLY a valid JSON array of objects with 'id' and 'text' keys matching the input items.";

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  circuitBreaker?: CircuitBreaker;
}

export class GeminiLlmProvider implements LlmProvider {
  readonly name = "gemini";
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(options: GeminiProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    this.model = options.model ?? "gemini-3.5-flash";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;
    this.circuitBreaker = options.circuitBreaker ?? new CircuitBreaker();
  }

  async rephrase(
    items: Array<{ id: string; text: string; locale: Locale }>,
    signal?: AbortSignal
  ): Promise<Array<{ id: string; text: string }>> {
    // If no items, return empty
    if (items.length === 0) {
      return [];
    }

    // Fallback verbatim generator
    const fallback = () => items.map((i) => ({ id: i.id, text: i.text }));

    // Zero network call if unconfigured or circuit breaker open
    if (!this.apiKey || this.circuitBreaker.isOpen()) {
      return fallback();
    }

    try {
      const candidates = await this.callWithRetry(items, signal);
      if (!candidates) {
        this.circuitBreaker.recordFailure();
        return fallback();
      }

      this.circuitBreaker.recordSuccess();
      return safeRephraseBatch(items, candidates);
    } catch {
      this.circuitBreaker.recordFailure();
      return fallback();
    }
  }

  private async callWithRetry(
    items: RephraseItemInput[],
    signal?: AbortSignal
  ): Promise<RephraseItemOutput[] | null> {
    const maxAttempts = 2; // 1 initial + 1 retry
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
        const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          this.model
        )}:generateContent?key=${encodeURIComponent(this.apiKey!)}`;

        const payload = {
          systemInstruction: {
            parts: [{ text: GEMINI_REPHRASE_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: JSON.stringify(items) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: combinedSignal,
        });

        if (!response.ok) {
          if (attempt < maxAttempts && (response.status >= 500 || response.status === 429)) {
            continue;
          }
          return null;
        }

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent || typeof rawContent !== "string") {
          return null;
        }

        return this.parseCandidates(rawContent);
      } catch (err) {
        lastError = err;
        if (attempt >= maxAttempts) {
          break;
        }
      }
    }

    if (lastError) {
      // Re-throw so caller records failure and logs in dev
      throw lastError;
    }
    return null;
  }

  private parseCandidates(rawText: string): RephraseItemOutput[] | null {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      }
      const parsed = JSON.parse(cleaned);
      let arr: unknown = null;
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.items)) {
          arr = obj.items;
        } else if (Array.isArray(obj.result)) {
          arr = obj.result;
        }
      }
      if (!Array.isArray(arr)) return null;

      const results: RephraseItemOutput[] = [];
      for (const item of arr) {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as { id: unknown }).id === "string" &&
          typeof (item as { text: unknown }).text === "string"
        ) {
          results.push({
            id: (item as { id: string }).id,
            text: (item as { text: string }).text,
          });
        }
      }
      return results;
    } catch {
      return null;
    }
  }

  async generateStockCommentary(
    snapshot: LiveStockSnapshot,
    userQuery: string,
    signal?: AbortSignal,
    history?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<string | null> {
    if (!this.apiKey || this.circuitBreaker.isOpen()) {
      return null;
    }

    try {
      const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
      const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        this.model
      )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      const contextPrefix = `Live snapshot for ${snapshot.name} (${snapshot.ticker}):\n- Price: ₹${snapshot.price} (${snapshot.change >= 0 ? "+" : ""}${snapshot.changePercent}%)\n- Market Cap: ${snapshot.marketCapFormatted}\n- P/E Ratio: ${snapshot.peRatio ?? "N/A"}\n- Business: ${snapshot.summary}\n- Strengths: ${snapshot.strengths.join("; ")}\n- Watchouts: ${snapshot.watchouts.join("; ")}\n\n`;

      const userPrompt = `${contextPrefix}User question: "${userQuery}"\n\nExplain this business or question to a friend over chai in 2-3 short paragraphs using a kirana shop or apartment analogy for valuation. Strictly obey all SlopMonster anti-slop rules.`;

      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      if (history && history.length > 0) {
        for (const msg of history) {
          if (!msg.content || !msg.content.trim()) continue;
          const role = msg.role === "assistant" ? "model" : "user";
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
          } else {
            contents.push({
              role,
              parts: [{ text: msg.content }],
            });
          }
        }
      }

      if (contents.length > 0 && contents[0].role === "model") {
        contents.shift();
      }

      contents.push({
        role: "user",
        parts: [{ text: userPrompt }],
      });

      const payload = {
        systemInstruction: {
          parts: [{ text: SLOPMONSTER_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.2,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: combinedSignal,
      });

      if (!response.ok) {
        this.circuitBreaker.recordFailure();
        return null;
      }

      const data = await response.json();
      const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent || typeof rawContent !== "string") {
        this.circuitBreaker.recordFailure();
        return null;
      }

      const cleaned = rawContent.trim();
      if (containsSlop(cleaned)) {
        return null; // Fall back to clean verified template
      }

      this.circuitBreaker.recordSuccess();
      return cleaned;
    } catch {
      this.circuitBreaker.recordFailure();
      return null;
    }
  }
}

export const GeminiProvider = GeminiLlmProvider;
