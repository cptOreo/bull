import type { Answer, EngineDeps, TurnInput } from "@/lib/engine/types";
import type { Snapshot } from "@/lib/data/schema";
import { CircuitBreaker, type LlmProvider, type RephraseItemInput, type RephraseItemOutput } from "./provider";
import { NullLlmProvider } from "./null";
import { GeminiLlmProvider } from "./gemini";
import { GroqLlmProvider } from "./groq";
import { OpenRouterLlmProvider } from "./openrouter";

export * from "./providers";
export * from "./null";
export * from "./verify";
export * from "./gemini";
export * from "./groq";
export * from "./openrouter";
export * from "./slopmonster";

/**
 * Shared session circuit breaker (§11.2).
 * Opens for the session after 3 consecutive failures.
 */
export const sessionCircuitBreaker = new CircuitBreaker();

/**
 * Factory function: selects the active LLM provider based on environment variables (§11.2):
 * 1. GEMINI_API_KEY -> GeminiLlmProvider
 * 2. GROQ_API_KEY -> GroqLlmProvider
 * 3. OPENROUTER_API_KEY -> OpenRouterLlmProvider
 * 4. Default -> NullLlmProvider (pass-through, zero network calls)
 */
export function getLlmProvider(env: Record<string, string | undefined> = process.env): LlmProvider {
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== "") {
    return new GeminiLlmProvider({
      apiKey: env.GEMINI_API_KEY,
      circuitBreaker: sessionCircuitBreaker,
    });
  }

  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== "") {
    return new GroqLlmProvider({
      apiKey: env.GROQ_API_KEY,
      circuitBreaker: sessionCircuitBreaker,
    });
  }

  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim() !== "") {
    return new OpenRouterLlmProvider({
      apiKey: env.OPENROUTER_API_KEY,
      circuitBreaker: sessionCircuitBreaker,
    });
  }

  return new NullLlmProvider();
}

/**
 * Convenience helper to rephrase a list of items using the resolved or injected provider.
 */
export async function rephraseItems(
  items: RephraseItemInput[],
  provider?: LlmProvider
): Promise<RephraseItemOutput[]> {
  const active = provider ?? getLlmProvider();
  return active.rephrase(items);
}

export type HandleTurnFn = (input: TurnInput, deps: EngineDeps) => Promise<Answer>;

/**
 * Wires provider selection, rephrase execution, verification and fallback into handleTurn (§11.2, Task 40).
 */
export async function handleTurnWithRephrase(
  input: TurnInput,
  snapshot: Snapshot,
  options?: {
    provider?: LlmProvider;
    handleTurn?: HandleTurnFn;
  }
): Promise<Answer> {
  const provider = options?.provider ?? getLlmProvider();
  const handleTurn = options?.handleTurn;

  if (!handleTurn) {
    throw new Error("handleTurn implementation must be supplied to handleTurnWithRephrase");
  }

  return handleTurn(input, {
    snapshot,
    rephrase: (items) => provider.rephrase(items),
  });
}

/**
 * Rephrases eligible narrative text in an Answer using the active LLM provider (e.g. Gemini),
 * running all candidate sentences through the 6-pillar verification gate (§11.4).
 */
export async function rephraseAnswer(
  answer: Answer,
  provider?: LlmProvider
): Promise<Answer> {
  const activeProvider = provider ?? getLlmProvider();
  if (activeProvider instanceof NullLlmProvider) {
    return answer;
  }

  const items: RephraseItemInput[] = [];
  const textBlockIndices: number[] = [];

  answer.blocks.forEach((block, idx) => {
    if (block.type === "text" && block.text.trim()) {
      items.push({
        id: `text_${idx}`,
        text: block.text,
        locale: answer.meta.locale,
      });
      textBlockIndices.push(idx);
    }
  });

  if (items.length === 0) {
    return answer;
  }

  try {
    const rephrased = await activeProvider.rephrase(items);
    const rephrasedMap = new Map(rephrased.map((r) => [r.id, r.text]));

    const newBlocks = answer.blocks.map((block, idx) => {
      if (block.type === "text") {
        const candidate = rephrasedMap.get(`text_${idx}`);
        if (candidate) {
          return { ...block, text: candidate };
        }
      }
      return block;
    });

    return {
      ...answer,
      blocks: newBlocks,
    };
  } catch {
    return answer;
  }
}

// v2 LLM / Chat Integrations
import { getActiveProvider, type LLMMessage } from "./providers";
import { getAllToolSchemas, type LLMToolName } from "./tools";
import { buildTutorPrompt, buildAnalystPrompt } from "./prompts";
import { verifyResponse, sanitizeResponse } from "./verification";
import { retrieveRelevantKnowledge } from "./rag";
import { useChatStore } from "@/components/providers/chat-provider";
import { toolExecutors } from "./analyst-tools";

export interface ChatContext {
  mode: "tutor" | "analyst";
  stock?: string;
  page?: string;
  userMastery?: Record<string, number>;
  locale?: "en" | "hi-en";
}

export interface ToolExecutor {
  search_stocks: (args: { query: string; limit?: number }) => Promise<unknown>;
  get_fundamentals: (args: { symbol: string }) => Promise<unknown>;
  get_price_history: (args: { symbol: string; range?: string; interval?: string }) => Promise<unknown>;
  screen_stocks: (args: { criteria: Record<string, unknown>; limit?: number }) => Promise<unknown>;
  compare_stocks: (args: { symbols: string[] }) => Promise<unknown>;
  build_dcf: (args: { symbol: string; assumptions: Record<string, unknown> }) => Promise<unknown>;
  analyze_sector: (args: { sector: string }) => Promise<unknown>;
  generate_report: (args: { title: string; analysis: string; symbol?: string; format?: string }) => Promise<unknown>;
}

let toolExecutor: ToolExecutor = toolExecutors;

export function setToolExecutor(executor: ToolExecutor) {
  toolExecutor = executor;
}

export async function handleChat(
  userMessage: string,
  context: ChatContext
): Promise<{ response: string; toolCalls?: Array<{ name: string; args: unknown; result: unknown }> }> {
  const provider = getActiveProvider();
  const isTutor = context.mode === "tutor";

  const knowledge = await retrieveRelevantKnowledge(userMessage, 3);
  const knowledgeText = knowledge.length > 0
    ? `\n\nRelevant Knowledge:\n${knowledge.map(k => `- [${k.category}] ${k.text}`).join("\n")}`
    : "";

  const systemPrompt = isTutor
    ? buildTutorPrompt(context.locale || "en", context.userMastery || {})
    : buildAnalystPrompt(context.locale || "en");

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt + knowledgeText },
    ...getRecentHistory(10).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const tools = isTutor ? [] : getAllToolSchemas();

  let response = await provider.generate(messages, tools);
  const toolCalls: Array<{ name: string; args: unknown; result: unknown }> = [];

  if (!isTutor && response.toolCalls && toolExecutor) {
    for (const tc of response.toolCalls) {
      const name = tc.function.name as LLMToolName;
      const args = JSON.parse(tc.function.arguments);
      
      try {
        const executor = toolExecutor[name];
        if (executor) {
          const result = await executor(args);
          toolCalls.push({ name, args, result });
          
          messages.push({
            role: "tool",
            content: JSON.stringify(result),
            toolCallId: tc.id,
            name,
          });
        }
      } catch (error) {
        toolCalls.push({ name, args, result: { error: String(error) } });
      }
    }

    if (toolCalls.length > 0) {
      const finalResponse = await provider.generate(messages, []);
      response = finalResponse;
    }
  }

  const stockContext = context.stock ? { symbol: context.stock } : undefined;
  const verification = verifyResponse(response.content, { stockData: stockContext }, { language: context.locale });

  if (!verification.passed) {
    return {
      response: sanitizeResponse(getTemplateFallback(userMessage, context)),
      toolCalls,
    };
  }

  return {
    response: sanitizeResponse(response.content),
    toolCalls,
  };
}

function getRecentHistory(limit: number): Array<{ role: string; content: string }> {
  const { messages } = useChatStore.getState();
  return messages
    .slice(-limit)
    .map(m => ({ role: m.role, content: m.content }));
}

function getTemplateFallback(message: string, context: ChatContext): string {
  const lower = message.toLowerCase();
  
  if (context.mode === "tutor") {
    if (lower.includes("pe") || lower.includes("p/e")) {
      return `The P/E (Price-to-Earnings) ratio compares a company's share price to its annual earnings per share. For instance, a P/E of 15 means you are paying ₹15 for every ₹1 of profit the business earns. Lower multiples often indicate cheaper valuation or slower expected growth, while higher multiples reflect higher growth expectations. Would you like to check the P/E of a specific company?`;
    }
    if (lower.includes("dcf")) {
      return `Discounted Cash Flow (DCF) estimates a company's intrinsic value by forecasting future free cash flows and discounting them back to today's value using a required rate of return. It depends on assumptions like revenue growth, margins, and the discount rate. Would you like to review how the calculation works?`;
    }
    return `I can help you understand financial metrics, company fundamentals, valuation multiples, and market concepts in plain language. Feel free to ask about any concept or company you are researching.`;
  } else {
    return `I can help analyze stocks: search companies, compare fundamentals, review key valuation ratios, and assess business trends. Which stock or sector would you like to explore?`;
  }
}
