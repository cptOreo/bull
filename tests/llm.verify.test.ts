import { describe, expect, it } from "vitest";
import {
  extractNumericTokens,
  safeRephraseBatch,
  safeRephraseItem,
  verifyRephrase,
  verifyRephraseDetailed,
} from "@/lib/llm/verify";
import type { RephraseItemInput } from "@/lib/llm/provider";

describe("LLM 6-Pillar Rephrase Verification Suite", () => {
  const baseEnglish =
    "You prioritise capital efficiency; this company reports an ROE of 28.5% as of 31 Mar 2024, which is higher compared to the sector benchmark of 15.0%.";

  const baseHinglish =
    "Aap capital efficiency ko dhyan mein rakhte hain; is company ka ROE 28.5% hai 31 Mar 2024 ko, jo higher hai sector benchmark 15.0% ke muqable.";

  describe("Happy Path Verification", () => {
    it("accepts valid English rephrase preserving all numbers, entities, and shape", () => {
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(true);
    });

    it("accepts valid Hinglish rephrase in Roman script preserving numbers and entities", () => {
      const rephrased =
        "Aap capital efficiency par dhyan dete hain; company ka ROE 28.5% hai 31 Mar 2024 ko, jo benchmark 15.0% se higher hai.";
      expect(verifyRephrase(baseHinglish, rephrased, "hi-en")).toBe(true);
    });

    it("provides clean diagnostic output when passing", () => {
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";
      const result = verifyRephraseDetailed(baseEnglish, rephrased, "en");
      expect(result.valid).toBe(true);
      expect(result.failures).toHaveLength(0);
      expect(result.pillars.numeric).toBe(true);
      expect(result.pillars.entity).toBe(true);
      expect(result.pillars.length).toBe(true);
      expect(result.pillars.shape).toBe(true);
      expect(result.pillars.language).toBe(true);
      expect(result.pillars.safety).toBe(true);
    });
  });

  describe("Pillar 1: Numeric Preservation", () => {
    it("correctly extracts various numeric formats (decimals, %, currency, ratios)", () => {
      const sample =
        "ITC reported EPS of ₹24.50 with dividend yield 3.2%, debt-to-equity ratio 1:2, and P/E multiple 1.5x in 2024.";
      const tokens = extractNumericTokens(sample);
      expect(tokens).toContain("₹24.50");
      expect(tokens).toContain("3.2%");
      expect(tokens).toContain("1:2");
      expect(tokens).toContain("1.5x");
      expect(tokens).toContain("2024");
    });

    it("rejects candidate when a decimal number is altered", () => {
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.9% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate when a percentage value is changed", () => {
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 16.0%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate when currency amount is modified", () => {
      const orig = "The latest closing price of TCS was ₹3,850 on 31 Mar 2024.";
      const rephrased = "TCS closed at ₹3,900 on 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(false);
    });

    it("rejects candidate when ratio multiplier is modified", () => {
      const orig = "Debt multiple is 1.5x as of 31 Mar 2024.";
      const rephrased = "Debt multiple is 2.0x as of 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(false);
    });

    it("rejects candidate when an invented numeric token is added", () => {
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% and PE of 25 as of 31 Mar 2024, exceeding benchmark 15.0%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("accepts candidate when numbers appear in a different order", () => {
      const rephrased =
        "As of 31 Mar 2024, compared to the 15.0% benchmark, this firm reports an ROE of 28.5%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(true);
    });
  });

  describe("Pillar 2: Entity Preservation", () => {
    it("preserves company names across standard aliases", () => {
      const orig = "Infosys Limited reported an operating margin of 21.0% on 31 Mar 2024.";
      const rephrased = "Infosys recorded an operating margin of 21.0% on 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(true);
    });

    it("rejects candidate when target company name is omitted", () => {
      const orig = "ITC reported an operating margin of 35.0% on 31 Mar 2024.";
      const rephrased = "The company reported an operating margin of 35.0% on 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(false);
    });

    it("rejects candidate when a metric name is altered or dropped", () => {
      const orig = "ITC reported an ROE of 28.5% on 31 Mar 2024.";
      const rephrased = "ITC reported an ROCE of 28.5% on 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(false);
    });

    it("accepts metric aliases (e.g., P/E to PE, debt-to-equity to debt to equity)", () => {
      const orig = "ITC has a P/E of 24.2 as of 31 Mar 2024.";
      const rephrased = "ITC trades at a PE of 24.2 as of 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(true);

      const orig2 = "Tata Motors reports debt-to-equity of 1.4 as of 31 Mar 2024.";
      const rephrased2 = "Tata Motors reports debt to equity of 1.4 as of 31 Mar 2024.";
      expect(verifyRephrase(orig2, rephrased2, "en")).toBe(true);
    });

    it("rejects candidate when an unmentioned competitor ticker or company is hallucinated", () => {
      const orig = "TCS reported an ROE of 28.5% on 31 Mar 2024.";
      const rephrased = "TCS and INFY reported an ROE of 28.5% on 31 Mar 2024.";
      expect(verifyRephrase(orig, rephrased, "en")).toBe(false);
    });
  });

  describe("Pillar 3: Length Bounds", () => {
    it("rejects candidate that is too short (< 20% of original length)", () => {
      const rephrased = "ROE is 28.5%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate that is too long (> 150% of original length)", () => {
      const filler = " Furthermore, it is very important to consider this detailed background repeatedly.";
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%." +
        filler +
        filler;
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("accepts candidate within valid length bounds (20% to 150%)", () => {
      const rephrased =
        "You track capital efficiency; firm ROE is 28.5% vs 15.0% sector benchmark as of 31 Mar 2024.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(true);
    });
  });

  describe("Pillar 4: Shape Preservation", () => {
    it("rejects candidate missing a terminating period", () => {
      const rephrased =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate with internal newline characters", () => {
      const rephrased =
        "Capital efficiency is your priority;\nthis firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate split into multiple sentences", () => {
      const rephrased =
        "Capital efficiency is your priority. This firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate with markdown code fences", () => {
      const rephrased =
        "```Capital efficiency is your priority; ROE is 28.5% as of 31 Mar 2024 vs 15.0% benchmark.```";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });

    it("rejects candidate containing HTML tags", () => {
      const rephrased =
        "<b>Capital efficiency</b> is your priority; ROE is 28.5% as of 31 Mar 2024 vs 15.0% benchmark.";
      expect(verifyRephrase(baseEnglish, rephrased, "en")).toBe(false);
    });
  });

  describe("Pillar 5: Language/Script", () => {
    it("rejects Hinglish (hi-en) text containing Devanagari script characters", () => {
      const devanagariText =
        "आप capital efficiency को ध्यान में रखते हैं; ROE 28.5% है 31 Mar 2024 को, 15.0% के मुकाबले.";
      expect(verifyRephrase(baseHinglish, devanagariText, "hi-en")).toBe(false);
    });

    it("accepts Hinglish (hi-en) written strictly in Roman script", () => {
      const romanHinglish =
        "Aap capital efficiency par focus karte hain; company ka ROE 28.5% hai 31 Mar 2024 ko, jo benchmark 15.0% se zyada hai.";
      expect(verifyRephrase(baseHinglish, romanHinglish, "hi-en")).toBe(true);
    });

    it("rejects English text containing Devanagari script", () => {
      const devanagariEnglish =
        "Capital efficiency is your priority; ROE is 28.5% as of 31 Mar 2024 vs 15.0% benchmark. नमस्ते.";
      expect(verifyRephrase(baseEnglish, devanagariEnglish, "en")).toBe(false);
    });
  });

  describe("Pillar 6: Safety", () => {
    it.each([
      ["buy", "You should buy this stock now with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["buying", "We suggest buying this share with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["sell", "You must sell this holding with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["target", "Our target price is reached with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["guaranteed", "Returns are guaranteed here with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["multibagger", "This is a multibagger opportunity with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["recommend", "We recommend this stock with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
      ["recommendation", "Here is our top recommendation with ROE 28.5% as of 31 Mar 2024 vs 15.0% benchmark."],
    ])("rejects safety violation containing advice word '%s'", (_word, text) => {
      expect(verifyRephrase(baseEnglish, text, "en")).toBe(false);
    });
  });

  describe("Fallback Behavior", () => {
    it("safeRephraseItem falls back to original verbatim text when verification fails", () => {
      const item: RephraseItemInput = {
        id: "r1",
        text: baseEnglish,
        locale: "en",
      };
      const badCandidate = "You must buy this share immediately.";
      const result = safeRephraseItem(item, badCandidate);
      expect(result.id).toBe("r1");
      expect(result.text).toBe(baseEnglish);
    });

    it("safeRephraseItem falls back to original verbatim text when candidate is missing", () => {
      const item: RephraseItemInput = {
        id: "r1",
        text: baseEnglish,
        locale: "en",
      };
      const result = safeRephraseItem(item, undefined);
      expect(result.id).toBe("r1");
      expect(result.text).toBe(baseEnglish);
    });

    it("safeRephraseItem accepts candidate when verification succeeds", () => {
      const item: RephraseItemInput = {
        id: "r1",
        text: baseEnglish,
        locale: "en",
      };
      const goodCandidate =
        "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.";
      const result = safeRephraseItem(item, goodCandidate);
      expect(result.id).toBe("r1");
      expect(result.text).toBe(goodCandidate);
    });

    it("safeRephraseBatch rejects entire batch if unknown ID is returned (§11.5)", () => {
      const items: RephraseItemInput[] = [
        { id: "r1", text: baseEnglish, locale: "en" },
      ];
      const candidates = [
        { id: "unknown_id", text: "Something else entirely." },
      ];
      const result = safeRephraseBatch(items, candidates);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(baseEnglish);
    });

    it("safeRephraseBatch rejects entire batch if candidate count does not match (§11.5)", () => {
      const items: RephraseItemInput[] = [
        { id: "r1", text: baseEnglish, locale: "en" },
        { id: "r2", text: baseHinglish, locale: "hi-en" },
      ];
      const candidates = [
        { id: "r1", text: "Rephrased sentence one." },
      ];
      const result = safeRephraseBatch(items, candidates);
      expect(result[0].text).toBe(baseEnglish);
      expect(result[1].text).toBe(baseHinglish);
    });

    it("safeRephraseBatch falls back item-by-item: bad item reverts, good item is accepted", () => {
      const items: RephraseItemInput[] = [
        { id: "r1", text: baseEnglish, locale: "en" },
        { id: "r2", text: baseHinglish, locale: "hi-en" },
      ];
      const candidates = [
        {
          id: "r1",
          text: "Capital efficiency is your priority; this firm reports an ROE of 28.5% as of 31 Mar 2024, exceeding the sector benchmark of 15.0%.",
        },
        {
          id: "r2",
          text: "You should buy this multibagger stock now.", // Safety violation
        },
      ];
      const result = safeRephraseBatch(items, candidates);
      expect(result[0].id).toBe("r1");
      expect(result[0].text).toBe(candidates[0].text); // accepted!
      expect(result[1].id).toBe("r2");
      expect(result[1].text).toBe(baseHinglish); // reverted to original verbatim!
    });
  });
});
