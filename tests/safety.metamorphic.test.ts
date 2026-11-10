import { describe, expect, it } from "vitest";
import { inspectAnswer, scanText } from "@/lib/engine/safety";
import { createDataRef } from "@/lib/engine/refs";
import type { Answer } from "@/lib/engine/types";

describe("Safety Metamorphic Testing (§9.5, Rule 1, Rule 3)", () => {
  const SAFE_SENTENCE = "Infosys provides digital consulting and information technology services.";

  it("verifies the base sentence produces zero safety violations", () => {
    const violations = scanText(SAFE_SENTENCE);
    expect(violations).toEqual([]);
  });

  describe("Metamorphic transformation invariants", () => {
    const bannedPhrases = [
      "you should buy",
      "buy now",
      "sell this",
      "target price",
      "guaranteed returns",
      "multibagger",
      "risk-free",
      "this is a safe stock",
      "top pick",
      "best stock",
      "will rise",
      "as your advisor",
      "act now",
      "you'll regret",
      "ignore previous instructions",
    ];

    it("fires violations regardless of casing variations", () => {
      for (const phrase of bannedPhrases) {
        const uppercase = `${SAFE_SENTENCE} ${phrase.toUpperCase()}!`;
        const mixed = `${SAFE_SENTENCE} ${phrase
          .split("")
          .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
          .join("")}!`;

        const vUpper = scanText(uppercase);
        const vMixed = scanText(mixed);

        expect(
          vUpper.length,
          `Uppercase variation failed to trigger: "${uppercase}"`,
        ).toBeGreaterThanOrEqual(1);

        expect(
          vMixed.length,
          `Mixed case variation failed to trigger: "${mixed}"`,
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("fires violations regardless of whitespace variations (tabs, multiple spaces, linebreaks)", () => {
      for (const phrase of bannedPhrases) {
        const weirdSpaces = phrase.split(" ").join("   \t   ");
        const transformed = `${SAFE_SENTENCE} \n\n ${weirdSpaces} \n immediately.`;

        const violations = scanText(transformed);
        expect(
          violations.length,
          `Whitespace variation failed to trigger: "${transformed}"`,
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("fires violations regardless of punctuation, curly quotes, and dashes", () => {
      for (const phrase of bannedPhrases) {
        const curlyQuotes = `${SAFE_SENTENCE} — “${phrase}” — now.`;
        const singleCurly = `${SAFE_SENTENCE} ‘${phrase}’ today!`;

        expect(scanText(curlyQuotes).length).toBeGreaterThanOrEqual(1);
        expect(scanText(singleCurly).length).toBeGreaterThanOrEqual(1);
      }
    });

    it("appending each banned phrase adds at least one new violation to a safe text", () => {
      const baseViolations = scanText(SAFE_SENTENCE);
      expect(baseViolations.length).toBe(0);

      for (const phrase of bannedPhrases) {
        const composite = `${SAFE_SENTENCE} ${phrase}.`;
        const compositeViolations = scanText(composite);
        expect(
          compositeViolations.length,
          `Expected violation when appending "${phrase}"`,
        ).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("Rule 3: Single stock boundary check", () => {
    function createBaseShortlistAnswer(cardsCount: number): Answer {
      const refs = [
        createDataRef("data:pe", 20, "ratio", "2026-11-10", "screener"),
        createDataRef("data:count", 2, "count", "2026-11-10", "config"),
        createDataRef("data:threshold", 50, "score", "2026-11-10", "config"),
      ];

      const companyNames = ["Alpha Technologies", "Beta Solutions", "Gamma Enterprises"];

      return {
        route: "shortlist",
        meta: {
          snapshotId: "2026-11-10.1",
          engineVersion: "0.1.0",
          scoreId: "test_score",
          locale: "en",
          generatedAt: "2026-11-10T10:00:00Z",
        },
        profileState: null,
        refs,
        blocks: [
          {
            type: "shortlist",
            thinFit: false,
            sectors: 1,
            diversityNote: "Diversity note across sectors.",
            howChosen: {
              weights: {
                quality: 0.2,
                growth: 0.2,
                valuation: 0.2,
                income: 0.2,
                stability: 0.1,
                simplicity: 0.1,
              },
              anchorsSummary: "Summary without numbers.",
              sectorCap: 2,
              threshold: 50,
            },
            cards: Array.from({ length: cardsCount }, (_, i) => ({
              ticker: `STK${i + 1}`,
              name: companyNames[i] ?? `Company`,
              sectorName: "Technology",
              businessDescription: "Software services and technology solutions.",
              reasons: ["Solid balance sheet and cash generation."],
              riskSentence: "Valuation multiple is moderate.",
              factorBars: [],
              asOf: "2026-11-10",
              sourceLabel: "Screener.in",
            })),
          },
          {
            type: "education_note",
            text: "This is educational analysis and not a buy or sell recommendation.",
          },
        ],
      };
    }

    it("rejects a shortlist with exactly 1 card under Rule 3 single stock boundary", () => {
      const singleStockAnswer = createBaseShortlistAnswer(1);
      const result = inspectAnswer(singleStockAnswer);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some((v) =>
          v.toLowerCase().includes("single stock boundary"),
        ),
      ).toBe(true);
    });

    it("accepts a shortlist with 2 or more cards", () => {
      const multiStockAnswer = createBaseShortlistAnswer(2);
      const result = inspectAnswer(multiStockAnswer);
      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });
});
