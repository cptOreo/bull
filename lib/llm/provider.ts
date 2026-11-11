import type { Locale, LiveStockSnapshot } from "@/lib/engine/types";

export interface RephraseItemInput {
  id: string;
  text: string;
  locale: Locale;
}

export interface RephraseItemOutput {
  id: string;
  text: string;
}

export interface LlmProvider {
  readonly name: string;
  rephrase(
    items: Array<{ id: string; text: string; locale: Locale }>,
    signal?: AbortSignal
  ): Promise<Array<{ id: string; text: string }>>;
  generateStockCommentary?(
    snapshot: LiveStockSnapshot,
    userQuery: string,
    signal?: AbortSignal,
    history?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<string | null>;
}

export type RephraseProvider = LlmProvider;

export type RephraseInput = {
  items: Array<{ id: string; text: string; locale: Locale }>;
  glossary?: Record<string, string>;
};

export type RephraseOutput = Array<{ id: string; text: string }>;

export const DEFAULT_LLM_TIMEOUT_MS = 10000;
export const CIRCUIT_BREAKER_THRESHOLD = 3;
export const CIRCUIT_BREAKER_COOLDOWN_MS = 30000;

export class CircuitBreaker {
  private consecutiveFailures = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private lastFailureTime = 0;

  constructor(threshold = CIRCUIT_BREAKER_THRESHOLD, cooldownMs = CIRCUIT_BREAKER_COOLDOWN_MS) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    this.lastFailureTime = Date.now();
  }

  isOpen(): boolean {
    if (this.consecutiveFailures >= this.threshold) {
      if (this.cooldownMs > 0 && Date.now() - this.lastFailureTime > this.cooldownMs) {
        return false;
      }
      return true;
    }
    return false;
  }

  reset(): void {
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }

  get failureCount(): number {
    return this.consecutiveFailures;
  }
}
