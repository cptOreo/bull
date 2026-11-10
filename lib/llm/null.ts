import type { LlmProvider, RephraseItemInput, RephraseItemOutput } from "./provider";

/**
 * NullLlmProvider is the zero-network fallback and default provider.
 * It returns all candidate items verbatim without modification.
 */
export class NullLlmProvider implements LlmProvider {
  readonly name = "null";

  async rephrase(
    items: RephraseItemInput[]
  ): Promise<RephraseItemOutput[]> {
    return items.map((item) => ({
      id: item.id,
      text: item.text,
    }));
  }
}

export const NullProvider = NullLlmProvider;
