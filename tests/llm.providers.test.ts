import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiLlmProvider } from "@/lib/llm/gemini";
import { GroqLlmProvider } from "@/lib/llm/groq";
import { OpenRouterLlmProvider } from "@/lib/llm/openrouter";
import { NullLlmProvider } from "@/lib/llm/null";
import { CircuitBreaker } from "@/lib/llm/provider";

describe("LLM Provider Adapters Suite", () => {
  const sampleItems = [
    {
      id: "r1",
      text: "You prioritise capital efficiency; this company reports an ROE of 28.5% as of 31 Mar 2024, which is higher compared to the sector benchmark of 15.0%.",
      locale: "en" as const,
    },
  ];

  const validRephrased =
    "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";

  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("NullLlmProvider", () => {
    it("returns input verbatim with zero network calls", async () => {
      const provider = new NullLlmProvider();
      expect(provider.name).toBe("null");
      const result = await provider.rephrase(sampleItems);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(sampleItems[0].text);
    });
  });

  describe("GeminiLlmProvider", () => {
    it("falls back to verbatim text when unconfigured (no API key)", async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const provider = new GeminiLlmProvider({ apiKey: undefined });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].text).toBe(sampleItems[0].text);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("successfully rephrases and verifies candidate when API returns valid response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify([{ id: "r1", text: validRephrased }]) }],
              },
            },
          ],
        }),
      });

      const provider = new GeminiLlmProvider({ apiKey: "test-gemini-key" });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(validRephrased);
    });

    it("falls back to verbatim text when candidate fails 6-pillar verification", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify([{ id: "r1", text: "Buy this multibagger stock now." }]) }],
              },
            },
          ],
        }),
      });

      const provider = new GeminiLlmProvider({ apiKey: "test-gemini-key" });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(sampleItems[0].text);
    });

    it("falls back to verbatim text when network call throws", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const provider = new GeminiLlmProvider({ apiKey: "test-gemini-key" });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].text).toBe(sampleItems[0].text);
    });

    it("opens circuit breaker after 3 consecutive failures", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("500 Internal Error"));
      global.fetch = fetchSpy;

      const breaker = new CircuitBreaker(3);
      const provider = new GeminiLlmProvider({ apiKey: "test-gemini-key", circuitBreaker: breaker });

      // Call 1: fails
      await provider.rephrase(sampleItems);
      expect(breaker.isOpen()).toBe(false);

      // Call 2: fails
      await provider.rephrase(sampleItems);
      expect(breaker.isOpen()).toBe(false);

      // Call 3: fails -> trips breaker
      await provider.rephrase(sampleItems);
      expect(breaker.isOpen()).toBe(true);

      // Call 4: immediately returns fallback without calling fetch
      fetchSpy.mockClear();
      const result = await provider.rephrase(sampleItems);
      expect(result[0].text).toBe(sampleItems[0].text);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("GroqLlmProvider", () => {
    it("falls back to verbatim text when unconfigured (no API key)", async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const provider = new GroqLlmProvider({ apiKey: undefined });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].text).toBe(sampleItems[0].text);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("successfully rephrases when API returns valid response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify([{ id: "r1", text: validRephrased }]),
              },
            },
          ],
        }),
      });

      const provider = new GroqLlmProvider({ apiKey: "test-groq-key" });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(validRephrased);
    });
  });

  describe("OpenRouterLlmProvider", () => {
    it("falls back to verbatim text when unconfigured (no API key)", async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const provider = new OpenRouterLlmProvider({ apiKey: undefined });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].text).toBe(sampleItems[0].text);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("successfully rephrases when API returns valid response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify([{ id: "r1", text: validRephrased }]),
              },
            },
          ],
        }),
      });

      const provider = new OpenRouterLlmProvider({ apiKey: "test-openrouter-key" });
      const result = await provider.rephrase(sampleItems);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(validRephrased);
    });
  });
});
