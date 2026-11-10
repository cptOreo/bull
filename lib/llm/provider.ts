import type { Locale } from "@/lib/engine/types";

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
}

export type RephraseProvider = LlmProvider;

export type RephraseInput = {
  items: Array<{ id: string; text: string; locale: Locale }>;
  glossary?: Record<string, string>;
};

export type RephraseOutput = Array<{ id: string; text: string }>;

export const DEFAULT_LLM_TIMEOUT_MS = 8000;
export const CIRCUIT_BREAKER_THRESHOLD = 3;

export class CircuitBreaker {
  private consecutiveFailures = 0;
  private readonly threshold: number;

  constructor(threshold = CIRCUIT_BREAKER_THRESHOLD) {
    this.threshold = threshold;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
  }

  isOpen(): boolean {
    return this.consecutiveFailures >= this.threshold;
  }

  reset(): void {
    this.consecutiveFailures = 0;
  }

  get failureCount(): number {
    return this.consecutiveFailures;
  }
}
