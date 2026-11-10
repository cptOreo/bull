import { describe, expect, it } from "vitest";
import {
  TEMPLATES_EN,
  TEMPLATES_HI_EN,
  extractSlots,
  getAllTemplates,
  getReasonTemplate,
  getTemplate,
  validateTemplateParity,
} from "@/lib/engine/templates";
import type { Factor, TemplateBand } from "@/lib/engine/types";

const ALL_FACTORS: Factor[] = [
  "quality",
  "growth",
  "valuation",
  "income",
  "stability",
  "simplicity",
];

const ALL_BANDS: TemplateBand[] = ["high", "mid", "low"];

const REQUIRED_RISK_IDS = [
  "high_debt",
  "deep_drawdown",
  "high_volatility",
  "profit_decline",
  "low_return_on_capital",
  "corporate_action_gap",
  "missing_valuation",
  "default_risk",
];

const REQUIRED_LIMITATION_IDS = [
  "monthly_drawdown",
  "snapshot_staleness",
  "sector_coverage",
  "not_advice",
];

const REQUIRED_NOTE_IDS = [
  "deposit_debt_exclusion",
  "simplicity_definition",
];

const BANNED_EVALUATIVE_WORDS = [
  "strong",
  "cheap",
  "best",
  "solid",
  "attractive",
  "great",
  "excellent",
  "poor",
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fillMockSlots(templateText: string, slotNames: string[]): string {
  let filled = templateText;
  const mockValues: Record<string, string> = {
    roe: "24.5",
    roce: "21.2",
    margin: "18.4",
    cagr: "15.8",
    patCagr: "14.2",
    pe: "22.4",
    pb: "4.8",
    yield: "2.8",
    years: "5",
    volatility: "16.2",
    drawdown: "-18.5",
    debtToEquity: "0.25",
    segments: "2",
    direction: "higher",
    date: "31 October 2026",
    benchmarkRoe: "15.0",
    benchmarkRoce: "14.5",
    benchmarkMargin: "12.0",
    benchmarkCagr: "10.0",
    benchmarkDe: "1.0",
    sectorPe: "24.8",
    sectorPb: "5.2",
    sectorYield: "1.8",
    indexVolatility: "16.8",
    indexDrawdown: "-22.4",
    peers: "peers",
    peerGroup: "peers",
    threshold: "0.3",
    maxDrawdownPct: "-24.5%",
    volatilityPct: "32.1%",
    patCagrPct: "-5.2%",
    roePct: "7.8%",
    count: "2",
    sectorName: "Information Technology",
    pct: "50%",
    asOfDate: "31 October 2026",
  };

  for (const slot of slotNames) {
    const val = mockValues[slot] ?? "10";
    filled = filled.replaceAll(`{${slot}}`, val);
  }
  return filled;
}

describe("template registry and parity", () => {
  it("passes strict 1:1 parity validation between EN and HI-EN", () => {
    const parity = validateTemplateParity();
    expect(parity.errors).toEqual([]);
    expect(parity.valid).toBe(true);
  });

  it("exports identical template keys for EN and HI-EN", () => {
    const enKeys = Object.keys(TEMPLATES_EN).sort();
    const hiKeys = Object.keys(TEMPLATES_HI_EN).sort();
    expect(enKeys).toEqual(hiKeys);
    expect(enKeys.length).toBeGreaterThanOrEqual(31);
  });

  it("preserves exact slotNames order and names between EN and HI-EN for every template", () => {
    for (const id of Object.keys(TEMPLATES_EN)) {
      const en = TEMPLATES_EN[id];
      const hi = TEMPLATES_HI_EN[id];
      expect(en.slotNames, `template ${id} slotNames match`).toEqual(hi.slotNames);
    }
  });

  it("extractSlots correctly identifies and deduplicates slots preserving appearance order", () => {
    const testStr = "Values {a} and {b} with another {a} and {c}";
    expect(extractSlots(testStr)).toEqual(["a", "b", "c"]);
  });
});

describe("reason templates constraints", () => {
  const enReasons = Object.values(TEMPLATES_EN).filter((t) => t.category === "reason");

  it("has exactly 18 reason templates in EN covering all factors and bands", () => {
    expect(enReasons.length).toBe(18);
  });

  it("every EN reason template is <= 28 words in raw template format", () => {
    for (const t of enReasons) {
      const words = countWords(t.text);
      expect(words, `Template ${t.id} has ${words} words (must be <= 28)`).toBeLessThanOrEqual(28);
    }
  });

  it("every EN reason template is <= 28 words when slots are populated with realistic values", () => {
    for (const t of enReasons) {
      const populated = fillMockSlots(t.text, t.slotNames);
      const words = countWords(populated);
      expect(words, `Populated template ${t.id} has ${words} words (must be <= 28)`).toBeLessThanOrEqual(28);
    }
  });

  it("every EN reason template is exactly one sentence ending with a period", () => {
    for (const t of enReasons) {
      expect(t.text.endsWith("."), `Template ${t.id} must end with period`).toBe(true);
      // Ensure no interior sentence-terminating periods (excluding decimal points or acronyms)
      const sentences = t.text.split(/(?<=[a-zA-Z]{3,})\.\s+/);
      expect(sentences.length, `Template ${t.id} should be a single sentence`).toBe(1);
    }
  });

  it("every EN reason template starts in the second person ('You')", () => {
    for (const t of enReasons) {
      expect(t.text.startsWith("You "), `Template ${t.id} must start with 'You '`).toBe(true);
    }
  });

  it("every reason template contains the computed dynamic direction slot {direction}", () => {
    for (const t of enReasons) {
      expect(t.slotNames, `Template ${t.id} must have 'direction' slot`).toContain("direction");
      expect(t.text, `Template ${t.id} must include '{direction}' in text`).toContain("{direction}");
    }
  });

  it("contains no evaluative adjectives in EN reason templates", () => {
    for (const t of enReasons) {
      const lower = t.text.toLowerCase();
      for (const banned of BANNED_EVALUATIVE_WORDS) {
        // Match whole word
        const regex = new RegExp(`\\b${banned}\\b`, "i");
        expect(regex.test(lower), `Template ${t.id} contains banned evaluative word "${banned}"`).toBe(false);
      }
    }
  });
});

describe("factor and band coverage", () => {
  it("contains high, mid, low reason templates for all 6 factors in both locales", () => {
    for (const factor of ALL_FACTORS) {
      for (const band of ALL_BANDS) {
        const enTpl = getReasonTemplate(factor, band, "en");
        expect(enTpl, `Missing EN reason template for factor=${factor}, band=${band}`).toBeDefined();
        expect(enTpl?.category).toBe("reason");
        expect(enTpl?.factor).toBe(factor);
        expect(enTpl?.band).toBe(band);

        const hiTpl = getReasonTemplate(factor, band, "hi-en");
        expect(hiTpl, `Missing HI-EN reason template for factor=${factor}, band=${band}`).toBeDefined();
        expect(hiTpl?.category).toBe("reason");
        expect(hiTpl?.factor).toBe(factor);
        expect(hiTpl?.band).toBe(band);
      }
    }
  });
});

describe("risk, limitation, and note templates", () => {
  it("all required risk template IDs are present in both locales", () => {
    for (const id of REQUIRED_RISK_IDS) {
      const en = getTemplate(id, "en");
      expect(en, `Missing EN risk template ${id}`).toBeDefined();
      expect(en?.category).toBe("risk");

      const hi = getTemplate(id, "hi-en");
      expect(hi, `Missing HI-EN risk template ${id}`).toBeDefined();
      expect(hi?.category).toBe("risk");
    }
  });

  it("all required limitation template IDs are present in both locales", () => {
    for (const id of REQUIRED_LIMITATION_IDS) {
      const en = getTemplate(id, "en");
      expect(en, `Missing EN limitation template ${id}`).toBeDefined();
      expect(en?.category).toBe("limitation");

      const hi = getTemplate(id, "hi-en");
      expect(hi, `Missing HI-EN limitation template ${id}`).toBeDefined();
      expect(hi?.category).toBe("limitation");
    }
  });

  it("all required note template IDs are present in both locales", () => {
    for (const id of REQUIRED_NOTE_IDS) {
      const en = getTemplate(id, "en");
      expect(en, `Missing EN note template ${id}`).toBeDefined();
      expect(en?.category).toBe("note");

      const hi = getTemplate(id, "hi-en");
      expect(hi, `Missing HI-EN note template ${id}`).toBeDefined();
      expect(hi?.category).toBe("note");
    }
  });
});

describe("template access API", () => {
  it("getAllTemplates returns all templates for the given locale", () => {
    const enAll = getAllTemplates("en");
    expect(enAll.length).toBe(Object.keys(TEMPLATES_EN).length);
    expect(enAll.every((t) => t.locale === "en")).toBe(true);

    const hiAll = getAllTemplates("hi-en");
    expect(hiAll.length).toBe(Object.keys(TEMPLATES_HI_EN).length);
    expect(hiAll.every((t) => t.locale === "hi-en")).toBe(true);
  });

  it("getTemplate returns undefined for non-existent template ID", () => {
    expect(getTemplate("non_existent_id", "en")).toBeUndefined();
    expect(getTemplate("non_existent_id", "hi-en")).toBeUndefined();
  });
});
