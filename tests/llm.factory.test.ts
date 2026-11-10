import { describe, expect, it, vi } from "vitest";
import {
  getLlmProvider,
  handleTurnWithRephrase,
  NullLlmProvider,
  GeminiLlmProvider,
  GroqLlmProvider,
  OpenRouterLlmProvider,
  rephraseItems,
} from "@/lib/llm";
import type { Answer, TurnInput } from "@/lib/engine/types";
import type { Snapshot } from "@/lib/data/schema";

describe("LLM Provider Factory & Index Wire-up Suite", () => {
  describe("Provider Factory Precedence (§11.2)", () => {
    it("returns GeminiLlmProvider when GEMINI_API_KEY is present", () => {
      const provider = getLlmProvider({
        GEMINI_API_KEY: "gemini-secret",
        GROQ_API_KEY: "groq-secret",
        OPENROUTER_API_KEY: "openrouter-secret",
      });
      expect(provider).toBeInstanceOf(GeminiLlmProvider);
      expect(provider.name).toBe("gemini");
    });

    it("returns GroqLlmProvider when GROQ_API_KEY is present and GEMINI is unset", () => {
      const provider = getLlmProvider({
        GROQ_API_KEY: "groq-secret",
        OPENROUTER_API_KEY: "openrouter-secret",
      });
      expect(provider).toBeInstanceOf(GroqLlmProvider);
      expect(provider.name).toBe("groq");
    });

    it("returns OpenRouterLlmProvider when OPENROUTER_API_KEY is present and others unset", () => {
      const provider = getLlmProvider({
        OPENROUTER_API_KEY: "openrouter-secret",
      });
      expect(provider).toBeInstanceOf(OpenRouterLlmProvider);
      expect(provider.name).toBe("openrouter");
    });

    it("defaults to NullLlmProvider when all keys are unset", () => {
      const provider = getLlmProvider({});
      expect(provider).toBeInstanceOf(NullLlmProvider);
      expect(provider.name).toBe("null");
    });

    it("defaults to NullLlmProvider when keys are whitespace or empty", () => {
      const provider = getLlmProvider({
        GEMINI_API_KEY: "   ",
        GROQ_API_KEY: "",
      });
      expect(provider).toBeInstanceOf(NullLlmProvider);
      expect(provider.name).toBe("null");
    });
  });

  describe("rephraseItems helper", () => {
    it("rephrases items using default NullProvider when unconfigured", async () => {
      const items = [
        { id: "1", text: "Sentence text.", locale: "en" as const },
      ];
      const result = await rephraseItems(items, new NullLlmProvider());
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("Sentence text.");
    });
  });

  describe("handleTurnWithRephrase", () => {
    it("wires provider and snapshot into handleTurn function", async () => {
      const mockSnapshot = {
        snapshotId: "snap-123",
        asOf: "2026-11-10",
        stocks: [],
        indices: [],
        sources: {},
      } as unknown as Snapshot;

      const mockTurnInput: TurnInput = {
        message: "Hello",
        profile: null,
        locale: "en",
        now: "2026-11-10T10:00:00Z",
        events: [],
      };

      const mockAnswer: Answer = {
        route: "clarify",
        blocks: [],
        refs: [],
        profileState: null,
        meta: {
          snapshotId: "snap-123",
          engineVersion: "0.1.0",
          scoreId: "s1",
          locale: "en",
          generatedAt: "2026-11-10T10:00:00Z",
        },
      };

      const handleTurnMock = vi.fn().mockResolvedValue(mockAnswer);

      const result = await handleTurnWithRephrase(mockTurnInput, mockSnapshot, {
        provider: new NullLlmProvider(),
        handleTurn: handleTurnMock,
      });

      expect(result).toBe(mockAnswer);
      expect(handleTurnMock).toHaveBeenCalledWith(
        mockTurnInput,
        expect.objectContaining({
          snapshot: mockSnapshot,
          rephrase: expect.any(Function),
        })
      );
    });

    it("throws clear error when handleTurn is not provided", async () => {
      const mockSnapshot = {} as unknown as Snapshot;
      const mockTurnInput = { message: "test" } as unknown as TurnInput;

      await expect(
        handleTurnWithRephrase(mockTurnInput, mockSnapshot)
      ).rejects.toThrow("handleTurn implementation must be supplied to handleTurnWithRephrase");
    });
  });
});
