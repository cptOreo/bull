import { describe, expect, it } from "vitest";
import {
  deriveConcentrationRisk,
  deriveRiskFlags,
} from "@/lib/engine/risk";
import type { CorporateAction, Stock } from "@/lib/data/schema";
import type { MetricSet, MetricValues, ScoredStock } from "@/lib/engine/types";

function makeStock(overrides?: Partial<Stock>): Stock {
  return {
    ticker: "TEST",
    name: "Test Corp",
    isin: "INE000A01000",
    sectorId: "it",
    sectorModel: "non_financial",
    nifty50Member: { value: true, asOf: "2026-11-10", source: "s1" },
    businessSummary: { value: "Test company summary.", asOf: "2026-11-10", source: "s1" },
    segments: { value: ["Software"], asOf: "2026-11-10", source: "s1" },
    prices: {
      value: {
        currency: "INR",
        granularity: "monthly_close",
        points: [
          { date: "2021-11-28", close: 100 },
          { date: "2026-10-31", close: 200 },
        ],
      },
      asOf: "2026-10-31",
      source: "s1",
    },
    recentPrices: {
      value: {
        currency: "INR",
        granularity: "daily_close",
        points: [
          { date: "2026-11-09", close: 200 },
          { date: "2026-11-10", close: 202 },
        ],
      },
      asOf: "2026-11-10",
      source: "s1",
    },
    financials: {
      currency: "INR",
      units: "crore",
      basis: "consolidated",
      annual: {
        value: [],
        asOf: "2026-03-31",
        source: "s1",
      },
    },
    corporateActions: [],
    ...overrides,
  };
}

function makeMetricSet(
  overrides?: Partial<MetricSet>,
  metricValuesOverrides?: Partial<MetricValues>,
): MetricSet {
  return {
    ticker: "TEST",
    name: "Test Corp",
    sectorId: "it",
    sectorName: "Information Technology",
    sectorModel: "non_financial",
    values: {
      pe: 20.0,
      pb: 4.0,
      dividendYieldPct: 2.0,
      roePct: 15.0,
      rocePct: 15.0,
      operatingMarginPct: 20.0,
      debtToEquity: 0.1,
      interestCoverTimes: 10.0,
      revenueCagrPct: 12.0,
      patCagrPct: 14.0,
      volatilityPct: 18.0,
      maxDrawdownPct: -15.0,
      pePercentile: 40.0,
      pbPercentile: 40.0,
      peSectorRatio: 1.0,
      pbSectorRatio: 1.0,
      yearsWithDividend: 5,
      latestClose: 2000,
      oneSessionMovePct: 1.0,
      fiveYearReturnPct: 100.0,
      indexReturnPct: 60.0,
      ...metricValuesOverrides,
    },
    refs: {},
    chartSegments: [],
    asOfDates: {},
    isTailExpired: false,
    isMonthlyExpired: false,
    ...overrides,
  };
}

function makeScoredStock(
  ticker: string,
  sectorId: string,
  sectorName: string = sectorId,
): ScoredStock {
  const stock = makeStock({ ticker, sectorId });
  const metrics = makeMetricSet({ ticker, sectorId, sectorName });
  return {
    stock,
    metrics,
    score: 75,
    coverage: 1,
    subScores: {
      quality: { factor: "quality", score: 75, weight: 0.2, contribution: 15 },
      growth: { factor: "growth", score: 75, weight: 0.2, contribution: 15 },
      valuation: { factor: "valuation", score: 75, weight: 0.2, contribution: 15 },
      income: { factor: "income", score: 75, weight: 0.1, contribution: 7.5 },
      stability: { factor: "stability", score: 75, weight: 0.2, contribution: 15 },
      simplicity: { factor: "simplicity", score: 75, weight: 0.1, contribution: 7.5 },
    },
    factorBars: [],
    qualifies: true,
  };
}

describe("deriveRiskFlags", () => {
  it("returns no flags for clean healthy non-financial stock", () => {
    const stock = makeStock();
    const metrics = makeMetricSet();
    const flags = deriveRiskFlags(metrics, stock);
    expect(flags).toHaveLength(0);
  });

  describe("high_debt", () => {
    it("fires medium severity when D/E >= 0.3 for non-financial stock", () => {
      const stock = makeStock({ sectorModel: "non_financial" });
      const metrics = makeMetricSet({ sectorModel: "non_financial" }, { debtToEquity: 0.35 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "high_debt");
      expect(flag).toBeDefined();
      expect(flag?.severity).toBe("medium");
      expect(flag?.metricRefId).toBeDefined();
    });

    it("fires high severity when D/E >= 1.5 for non-financial stock", () => {
      const stock = makeStock({ sectorModel: "non_financial" });
      const metrics = makeMetricSet({ sectorModel: "non_financial" }, { debtToEquity: 1.8 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "high_debt");
      expect(flag).toBeDefined();
      expect(flag?.severity).toBe("high");
    });

    it("omits high_debt on financial stock even with high D/E", () => {
      const stock = makeStock({ sectorModel: "financial" });
      const metrics = makeMetricSet({ sectorModel: "financial" }, { debtToEquity: 6.5 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "high_debt");
      expect(flag).toBeUndefined();
    });

    it("omits high_debt when D/E is below 0.3 for non-financial stock", () => {
      const stock = makeStock({ sectorModel: "non_financial" });
      const metrics = makeMetricSet({ sectorModel: "non_financial" }, { debtToEquity: 0.25 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "high_debt");
      expect(flag).toBeUndefined();
    });
  });

  describe("deep_drawdown", () => {
    it("fires medium severity when maxDrawdown <= -20%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { maxDrawdownPct: -25.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "deep_drawdown");
      expect(flag).toBeDefined();
      expect(flag?.severity).toBe("medium");
    });

    it("fires high severity when maxDrawdown <= -40%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { maxDrawdownPct: -45.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "deep_drawdown");
      expect(flag).toBeDefined();
      expect(flag?.severity).toBe("high");
    });

    it("does not fire when maxDrawdown > -20%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { maxDrawdownPct: -15.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "deep_drawdown");
      expect(flag).toBeUndefined();
    });
  });

  describe("high_volatility", () => {
    it("fires when volatility >= 30%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { volatilityPct: 32.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "high_volatility");
      expect(flag).toBeDefined();
    });

    it("does not fire when volatility < 30%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { volatilityPct: 28.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "high_volatility");
      expect(flag).toBeUndefined();
    });
  });

  describe("profit_decline", () => {
    it("fires when patCagr < 0%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { patCagrPct: -3.5 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "profit_decline");
      expect(flag).toBeDefined();
    });

    it("does not fire when patCagr >= 0%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { patCagrPct: 5.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "profit_decline");
      expect(flag).toBeUndefined();
    });
  });

  describe("low_return_on_capital", () => {
    it("fires when roe < 10%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { roePct: 8.5 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "low_return_on_capital");
      expect(flag).toBeDefined();
    });

    it("does not fire when roe >= 10%", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { roePct: 15.0 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "low_return_on_capital");
      expect(flag).toBeUndefined();
    });
  });

  describe("corporate_action_gap", () => {
    it("fires when corporateActions exist", () => {
      const ca: CorporateAction = {
        id: "ca-1",
        type: "demerger",
        effectiveDate: "2025-10-01",
        listingDate: "2025-11-12",
        description: "Demerger into two entities",
        successorTickers: ["TEST1", "TEST2"],
        sourceId: "s1",
      };
      const stock = makeStock({ corporateActions: [ca] });
      const metrics = makeMetricSet();
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "corporate_action_gap");
      expect(flag).toBeDefined();
    });

    it("does not fire when corporateActions is empty", () => {
      const stock = makeStock({ corporateActions: [] });
      const metrics = makeMetricSet();
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "corporate_action_gap");
      expect(flag).toBeUndefined();
    });
  });

  describe("missing_valuation", () => {
    it("fires when PE and PB are both null", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { pe: null, pb: null });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "missing_valuation");
      expect(flag).toBeDefined();
    });

    it("does not fire when PE is present even if PB is null", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { pe: 22.0, pb: null });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "missing_valuation");
      expect(flag).toBeUndefined();
    });

    it("does not fire when PB is present even if PE is null", () => {
      const stock = makeStock();
      const metrics = makeMetricSet({}, { pe: null, pb: 3.2 });
      const flags = deriveRiskFlags(metrics, stock);
      const flag = flags.find((f) => f.id === "missing_valuation");
      expect(flag).toBeUndefined();
    });
  });

  describe("severity sorting order", () => {
    it("sorts high before medium before low", () => {
      const ca: CorporateAction = {
        id: "ca-1",
        type: "split",
        effectiveDate: "2024-05-10",
        listingDate: null,
        description: "Stock split 1:2",
        successorTickers: [],
        sourceId: "s1",
      };
      const stock = makeStock({
        sectorModel: "non_financial",
        corporateActions: [ca], // low severity flag
      });
      const metrics = makeMetricSet(
        { sectorModel: "non_financial" },
        {
          debtToEquity: 1.8, // high debt -> high severity (>= 1.5)
          patCagrPct: -5.0, // profit decline -> medium severity (< 0)
        },
      );
      const flags = deriveRiskFlags(metrics, stock);
      expect(flags.length).toBeGreaterThanOrEqual(3);

      const severities = flags.map((f) => f.severity);
      // High severity must precede Medium, and Medium must precede Low
      const firstHigh = severities.indexOf("high");
      const firstMedium = severities.indexOf("medium");
      const firstLow = severities.indexOf("low");

      expect(firstHigh).toBeGreaterThanOrEqual(0);
      expect(firstMedium).toBeGreaterThanOrEqual(0);
      expect(firstLow).toBeGreaterThanOrEqual(0);

      expect(firstHigh).toBeLessThan(firstMedium);
      expect(firstMedium).toBeLessThan(firstLow);
    });
  });
});

describe("deriveConcentrationRisk", () => {
  it("returns null for empty shortlist", () => {
    expect(deriveConcentrationRisk([])).toBeNull();
  });

  it("returns null for single-stock list", () => {
    const single = makeScoredStock("TCS", "it");
    expect(deriveConcentrationRisk([single])).toBeNull();
  });

  it("returns null when all sectors constitute <= 40% of shortlist", () => {
    // 5 stocks: 2 IT (40%), 1 Banking (20%), 1 Auto (20%), 1 Pharma (20%)
    const shortlist = [
      makeScoredStock("TCS", "it", "Information Technology"),
      makeScoredStock("INFY", "it", "Information Technology"),
      makeScoredStock("HDFCBANK", "banking", "Banking"),
      makeScoredStock("TATAMOTORS", "auto", "Automobile"),
      makeScoredStock("SUNPHARMA", "pharma", "Pharmaceuticals"),
    ];
    expect(deriveConcentrationRisk(shortlist)).toBeNull();
  });

  it("returns sector_concentration RiskFlag when any sector constitutes > 40% of shortlist", () => {
    // 5 stocks: 3 IT (60% > 40%), 1 Banking (20%), 1 Auto (20%)
    const shortlist = [
      makeScoredStock("TCS", "it", "Information Technology"),
      makeScoredStock("INFY", "it", "Information Technology"),
      makeScoredStock("WIPRO", "it", "Information Technology"),
      makeScoredStock("HDFCBANK", "banking", "Banking"),
      makeScoredStock("TATAMOTORS", "auto", "Automobile"),
    ];
    const risk = deriveConcentrationRisk(shortlist);
    expect(risk).not.toBeNull();
    expect(risk?.id).toBe("sector_concentration");
    expect(["medium", "high"]).toContain(risk?.severity);
    expect(risk?.sentence).toContain("Information Technology");
  });
});
