import { describe, expect, it } from "vitest";
import {
  extractNumericTokens,
  inspectAnswer,
  verifyTraceability,
} from "@/lib/engine/safety";
import {
  createConfigRef,
  createDataRef,
  createDerivedRef,
  createProfileRef,
} from "@/lib/engine/refs";
import type { Answer, Ref } from "@/lib/engine/types";

describe("Safety Numeric Traceability (§9.3, §10.3)", () => {
  describe("extractNumericTokens", () => {
    it("extracts percentage tokens with signs and decimals", () => {
      const text = "ROE is 31.8% and one session move was -2.5% compared to +1.2% index move.";
      const tokens = extractNumericTokens(text);
      expect(tokens).toContain("31.8%");
      expect(tokens).toContain("-2.5%");
      expect(tokens).toContain("+1.2%");
    });

    it("extracts rupee amounts with commas and decimals", () => {
      const text = "Latest close is ₹1,550.25 and SIP minimum is Rs. 500.";
      const tokens = extractNumericTokens(text);
      expect(tokens).toContain("₹1,550.25");
      expect(tokens).toContain("Rs. 500");
    });

    it("extracts crore values with Indian grouping", () => {
      const text = "Annual revenue was 15,340 crore with net profit of 2,450 crore.";
      const tokens = extractNumericTokens(text);
      expect(tokens).toContain("15,340");
      expect(tokens).toContain("2,450");
    });

    it("extracts multipliers and ratios", () => {
      const text = "Interest coverage is 12.5x with a P/E of 25.40 and D/E of 0.15.";
      const tokens = extractNumericTokens(text);
      expect(tokens).toContain("12.5x");
      expect(tokens).toContain("25.40");
      expect(tokens).toContain("0.15");
    });

    it("excludes date and time tokens", () => {
      const text = "Snapshot dated 2026-11-10 and annual report from 31 October 2026 for FY2026.";
      const tokens = extractNumericTokens(text);
      expect(tokens).not.toContain("2026-11-10");
      expect(tokens).not.toContain("2026");
      expect(tokens).not.toContain("31");
      expect(tokens).not.toContain("FY2026");
    });

    it("excludes ref IDs and version strings", () => {
      const text = "Ref data:INFY:pe with engine v0.1.0 and schema 1.0.0.";
      const tokens = extractNumericTokens(text);
      expect(tokens).not.toContain("data:INFY:pe");
      expect(tokens).not.toContain("0.1.0");
      expect(tokens).not.toContain("1.0.0");
    });

    it("excludes index name 'Nifty 50'", () => {
      const text = "Outperformed the Nifty 50 benchmark index by 4.5%.";
      const tokens = extractNumericTokens(text);
      expect(tokens).not.toContain("50");
      expect(tokens).toContain("4.5%");
    });
  });

  describe("verifyTraceability", () => {
    const sampleRefs: Ref[] = [
      createDataRef("data:INFY:pe", 25.4, "ratio", "2026-11-10", "screener"),
      createDerivedRef("derived:INFY:roe", 31.8, "percent", "formula:roe", ["data:INFY:pat"]),
      createDataRef("data:INFY:close", 1550.25, "price", "2026-11-10", "google_finance"),
      createConfigRef("config:weight:quality", 0.20, "percent"),
      createProfileRef("profile:horizon", "5_10y", "5+ years"),
    ];

    it("returns true when every numeric token resolves to a provided Ref", () => {
      const text = "INFY has a P/E of 25.4, ROE of 31.8%, price of ₹1,550.25, and quality weight of 20%.";
      expect(verifyTraceability(text, sampleRefs)).toBe(true);
    });

    it("tolerates minor rounding differences within ±0.01", () => {
      // 25.40 vs 25.4
      const text = "P/E is 25.40 and ROE is 31.8%.";
      expect(verifyTraceability(text, sampleRefs)).toBe(true);
    });

    it("returns false when an untraced number appears in text", () => {
      const text = "INFY has a P/E of 25.4 and an untraced metric of 99.99.";
      expect(verifyTraceability(text, sampleRefs)).toBe(false);
    });

    it("returns true for exact approved exemptions even if they contain numbers", () => {
      const exemptText = "This is educational analysis and not a buy or sell recommendation.";
      expect(verifyTraceability(exemptText, sampleRefs)).toBe(true);
    });
  });

  describe("inspectAnswer choke point", () => {
    const validRefs: Ref[] = [
      createDataRef("data:INFY:pe", 25.4, "ratio", "2026-11-10", "screener"),
      createDerivedRef("derived:INFY:roe", 31.8, "percent", "formula:roe", []),
      createDataRef("data:TCS:pe", 28.1, "ratio", "2026-11-10", "screener"),
      createDerivedRef("derived:TCS:roe", 38.5, "percent", "formula:roe", []),
      createConfigRef("config:factors:count", 6, "count"),
      createConfigRef("config:shortlist:cap", 2, "count"),
      createConfigRef("config:shortlist:threshold", 50, "score"),
      createConfigRef("config:weight:quality", 0.20, "percent"),
      createConfigRef("config:weight:growth", 0.30, "percent"),
      createConfigRef("config:weight:valuation", 0.15, "percent"),
      createConfigRef("config:weight:income", 0.05, "percent"),
      createConfigRef("config:weight:stability", 0.20, "percent"),
      createConfigRef("config:weight:simplicity", 0.10, "percent"),
    ];

    function createValidAnswer(): Answer {
      return {
        route: "shortlist",
        meta: {
          snapshotId: "2026-11-10.1",
          engineVersion: "0.1.0",
          scoreId: "test1234",
          locale: "en",
          generatedAt: "2026-11-10T10:00:00Z",
        },
        profileState: null,
        refs: validRefs,
        blocks: [
          {
            type: "shortlist",
            thinFit: false,
            sectors: 2,
            diversityNote: "Shortlist spans 2 distinct economic sectors.",
            howChosen: {
              weights: {
                quality: 0.2,
                growth: 0.3,
                valuation: 0.15,
                income: 0.05,
                stability: 0.2,
                simplicity: 0.1,
              },
              anchorsSummary:
                "Scores are calculated using piecewise linear interpolation against fixed historical benchmarks across 6 factors (quality, growth, valuation, income, stability, simplicity).",
              sectorCap: 2,
              threshold: 50,
            },
            cards: [
              {
                ticker: "INFY",
                name: "Infosys Limited",
                sectorName: "Information Technology",
                businessDescription: "IT consulting and software services.",
                reasons: ["Strong Return on Equity at 31.8%."],
                riskSentence: "Valuation multiple P/E is 25.4.",
                factorBars: [],
                asOf: "2026-11-10",
                sourceLabel: "Screener.in",
              },
              {
                ticker: "TCS",
                name: "Tata Consultancy Services",
                sectorName: "Information Technology",
                businessDescription: "Global IT services and digital solutions.",
                reasons: ["Superior capital efficiency with ROE of 38.5%."],
                riskSentence: "Premium valuation with P/E at 28.1.",
                factorBars: [],
                asOf: "2026-11-10",
                sourceLabel: "Screener.in",
              },
            ],
          },
          {
            type: "education_note",
            text: "This is educational analysis and not a buy or sell recommendation.",
          },
        ],
      };
    }

    it("passes a valid Answer with all numbers traced and safe copy", () => {
      const answer = createValidAnswer();
      const result = inspectAnswer(answer);
      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("fails when an untraced number is injected into card reasons", () => {
      const answer = createValidAnswer();
      const shortlist = answer.blocks[0] as Extract<Answer["blocks"][number], { type: "shortlist" }>;
      shortlist.cards[0].reasons.push("Expected dividend yield of 9.75% next year.");

      const result = inspectAnswer(answer);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("9.75%"))).toBe(true);
    });

    it("fails when an untraced rupee price is injected into stock detail", () => {
      const answer = createValidAnswer();
      answer.blocks.push({
        type: "stock_detail",
        ticker: "INFY",
        sections: [
          {
            id: "valuation",
            title: "Valuation Metrics",
            rows: [
              { label: "P/E Ratio", value: "25.4" },
              { label: "Rumored Price", value: "₹9,999.00" }, // Untraced
            ],
          },
        ],
      });

      const result = inspectAnswer(answer);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("₹9,999.00"))).toBe(true);
    });

    it("fails when an untraced number is injected into news summary", () => {
      const answer = createValidAnswer();
      answer.blocks.push({
        type: "news",
        items: [
          {
            headline: "Quarterly Results",
            summary: "Management announced an unexpected dividend of 42.5 rupees per share.",
            sourceName: "Economic Times",
            publishedAt: "2026-11-09",
            kind: "fact",
            sourceUrl: null,
          },
        ],
      });

      const result = inspectAnswer(answer);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("42.5"))).toBe(true);
    });
  });
});
