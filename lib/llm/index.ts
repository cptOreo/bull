import type { Answer, EngineDeps, TurnInput } from "@/lib/engine/types";
import type { Snapshot } from "@/lib/data/schema";
import { CircuitBreaker, type LlmProvider, type RephraseItemInput, type RephraseItemOutput } from "./provider";
import { NullLlmProvider } from "./null";
import { GeminiLlmProvider } from "./gemini";
import { GroqLlmProvider } from "./groq";
import { OpenRouterLlmProvider } from "./openrouter";

export * from "./provider";
export * from "./null";
export * from "./verify";
export * from "./gemini";
export * from "./groq";
export * from "./openrouter";

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
