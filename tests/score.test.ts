import { describe, expect, it } from "vitest";
import {
  computeGoalWeights,
  normalizeAnchor,
  scoreStock,
  selectShortlist,
} from "@/lib/engine/score";
import {
  BASE_WEIGHTS,
  NORMALIZATION_ANCHORS,
  SHORTLIST_CONFIG,
} from "@/lib/engine/config";
import type { Stock } from "@/lib/data/schema";
import type {
  Goal,
  Horizon,
  MetricSet,
  MetricValues,
  Profile,
  RiskComfort,
  ScoredStock,
} from "@/lib/engine/types";

function makeProfile(overrides?: Partial<Profile>): Profile {
  return {
    goal: "grow_wealth",
    horizon: "3_5y",
    riskComfort: "medium",
    experience: "sip",
    locale: "en",
    ...overrides,
  };
}

function makeStock(overrides?: Partial<Stock>): Stock {
  return {
    ticker: "TEST",
    name: "Test Corp",
    isin: "INE000A01000",
    sectorId: "it",
    sectorModel: "non_financial",
    nifty50Member: { value: true, asOf: "2026-11-10", source: "s1" },
    businessSummary: { value: "Software test.", asOf: "2026-11-10", source: "s1" },
    segments: { value: ["Software", "Consulting"], asOf: "2026-11-10", source: "s1" },
    prices: {
      value: {
        currency: "INR",
        granularity: "monthly_close",
        points: [
          { date: "2021-11-28", close: 1000 },
          { date: "2026-10-31", close: 2000 },
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
          { date: "2026-11-09", close: 2000 },
          { date: "2026-11-10", close: 2020 },
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
      debtToEquity: 0.5,
      interestCoverTimes: 10.0,
      revenueCagrPct: 12.0,
      patCagrPct: 14.0,
      volatilityPct: 20.0,
      maxDrawdownPct: -25.0,
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

function makeScoredStock(overrides?: Partial<ScoredStock>): ScoredStock {
  const stock = makeStock(overrides?.stock);
  const metrics = makeMetricSet(overrides?.metrics);
  return {
    stock,
    metrics,
    score: 70.0,
    coverage: 1.0,
    subScores: {
      quality: { factor: "quality", score: 70, weight: 0.2, contribution: 14 },
      growth: { factor: "growth", score: 70, weight: 0.2, contribution: 14 },
      valuation: { factor: "valuation", score: 70, weight: 0.15, contribution: 10.5 },
      income: { factor: "income", score: 70, weight: 0.1, contribution: 7 },
      stability: { factor: "stability", score: 70, weight: 0.2, contribution: 14 },
      simplicity: { factor: "simplicity", score: 70, weight: 0.15, contribution: 10.5 },
    },
    factorBars: [],
    qualifies: true,
    ...overrides,
  };
}

describe("computeGoalWeights", () => {
  it("base weights sum to 1.0 with neutral multipliers (medium risk, 3_5y horizon)", () => {
    const goals: Goal[] = ["grow_wealth", "dividends", "learn", "preserve"];
    for (const goal of goals) {
      const profile = makeProfile({ goal, riskComfort: "medium", horizon: "3_5y" });
      const weights = computeGoalWeights(profile);
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);

      for (const [factor, expectedWeight] of Object.entries(BASE_WEIGHTS[goal])) {
        expect(weights[factor as keyof typeof weights]).toBeCloseTo(expectedWeight, 5);
      }
    }
  });

  it("applies risk and horizon multipliers and renormalises to 1.0", () => {
    // Worked example from §7.7:
    // Goal: dividends, risk: low, horizon: 5_10y
    const profile = makeProfile({ goal: "dividends", riskComfort: "low", horizon: "5_10y" });
    const weights = computeGoalWeights(profile);

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Raw weights from §7.7:
    // quality: 0.20 * 1.10 * 1.00 = 0.220
    // growth: 0.10 * 0.70 * 1.10 = 0.077
    // valuation: 0.15 * 1.00 * 1.00 = 0.150
    // income: 0.35 * 1.00 * 1.00 = 0.350
    // stability: 0.15 * 1.40 * 0.90 = 0.189
    // simplicity: 0.05 * 1.00 * 1.00 = 0.050
    // Total raw = 1.036
    expect(weights.quality).toBeCloseTo(0.22 / 1.036, 4); // ~0.212
    expect(weights.growth).toBeCloseTo(0.077 / 1.036, 4); // ~0.074
    expect(weights.valuation).toBeCloseTo(0.15 / 1.036, 4); // ~0.145
    expect(weights.income).toBeCloseTo(0.35 / 1.036, 4); // ~0.338
    expect(weights.stability).toBeCloseTo(0.189 / 1.036, 4); // ~0.182
    expect(weights.simplicity).toBeCloseTo(0.05 / 1.036, 4); // ~0.048
  });

  it("always sums to 1.0 across all combinations of goal, risk and horizon", () => {
    const goals: Goal[] = ["grow_wealth", "dividends", "learn", "preserve"];
    const risks: RiskComfort[] = ["low", "medium", "high", "unsure"];
    const horizons: Horizon[] = ["1_3y", "3_5y", "5_10y", "10y_plus"];

    for (const goal of goals) {
      for (const riskComfort of risks) {
        for (const horizon of horizons) {
          const profile = makeProfile({ goal, riskComfort, horizon });
          const weights = computeGoalWeights(profile);
          const sum = Object.values(weights).reduce((a, b) => a + b, 0);
          expect(sum).toBeCloseTo(1.0, 5);
        }
      }
    }
  });
});

describe("normalizeAnchor", () => {
  it("normalizes quality ROE anchor (increasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.quality.roe; // { x0: 5, x50: 15, x100: 25 }
    expect(normalizeAnchor(5, anchor)).toBe(0);
    expect(normalizeAnchor(15, anchor)).toBe(50);
    expect(normalizeAnchor(25, anchor)).toBe(100);
    expect(normalizeAnchor(10, anchor)).toBe(25);
    expect(normalizeAnchor(20, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(2, anchor)).toBe(0);
    expect(normalizeAnchor(35, anchor)).toBe(100);
  });

  it("normalizes growth Revenue CAGR anchor (increasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.growth.revenueCagr; // { x0: 0, x50: 10, x100: 20 }
    expect(normalizeAnchor(0, anchor)).toBe(0);
    expect(normalizeAnchor(10, anchor)).toBe(50);
    expect(normalizeAnchor(20, anchor)).toBe(100);
    expect(normalizeAnchor(5, anchor)).toBe(25);
    expect(normalizeAnchor(15, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(-5, anchor)).toBe(0);
    expect(normalizeAnchor(30, anchor)).toBe(100);
  });

  it("normalizes inverted valuation PE percentile anchor (decreasing: lower is better)", () => {
    const anchor = NORMALIZATION_ANCHORS.valuation.pePercentile; // { x0: 100, x50: 50, x100: 0 }
    expect(normalizeAnchor(100, anchor)).toBe(0);
    expect(normalizeAnchor(50, anchor)).toBe(50);
    expect(normalizeAnchor(0, anchor)).toBe(100);
    expect(normalizeAnchor(75, anchor)).toBe(25);
    expect(normalizeAnchor(25, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(120, anchor)).toBe(0);
    expect(normalizeAnchor(-10, anchor)).toBe(100);
  });

  it("normalizes inverted valuation PE sector ratio anchor (decreasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.valuation.peSectorRatio; // { x0: 2.0, x50: 1.0, x100: 0.5 }
    expect(normalizeAnchor(2.0, anchor)).toBe(0);
    expect(normalizeAnchor(1.0, anchor)).toBe(50);
    expect(normalizeAnchor(0.5, anchor)).toBe(100);
    expect(normalizeAnchor(1.5, anchor)).toBe(25);
    expect(normalizeAnchor(0.75, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(2.5, anchor)).toBe(0);
    expect(normalizeAnchor(0.2, anchor)).toBe(100);
  });

  it("normalizes income dividend yield anchor (increasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.income.dividendYield; // { x0: 0, x50: 2, x100: 4 }
    expect(normalizeAnchor(0, anchor)).toBe(0);
    expect(normalizeAnchor(2, anchor)).toBe(50);
    expect(normalizeAnchor(4, anchor)).toBe(100);
    expect(normalizeAnchor(1, anchor)).toBe(25);
    expect(normalizeAnchor(3, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(-1, anchor)).toBe(0);
    expect(normalizeAnchor(6, anchor)).toBe(100);
  });

  it("normalizes inverted stability volatility anchor (decreasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.stability.volatility; // { x0: 45, x50: 25, x100: 15 }
    expect(normalizeAnchor(45, anchor)).toBe(0);
    expect(normalizeAnchor(25, anchor)).toBe(50);
    expect(normalizeAnchor(15, anchor)).toBe(100);
    expect(normalizeAnchor(35, anchor)).toBe(25);
    expect(normalizeAnchor(20, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(50, anchor)).toBe(0);
    expect(normalizeAnchor(10, anchor)).toBe(100);
  });

  it("normalizes stability max drawdown anchor (-60 to -10, increasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.stability.maxDrawdown; // { x0: -60, x50: -30, x100: -10 }
    expect(normalizeAnchor(-60, anchor)).toBe(0);
    expect(normalizeAnchor(-30, anchor)).toBe(50);
    expect(normalizeAnchor(-10, anchor)).toBe(100);
    expect(normalizeAnchor(-45, anchor)).toBe(25);
    expect(normalizeAnchor(-20, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(-70, anchor)).toBe(0);
    expect(normalizeAnchor(-5, anchor)).toBe(100);
  });

  it("normalizes inverted stability debt-to-equity anchor (decreasing)", () => {
    const anchor = NORMALIZATION_ANCHORS.stability.debtToEquity; // { x0: 2.0, x50: 1.0, x100: 0.2 }
    expect(normalizeAnchor(2.0, anchor)).toBe(0);
    expect(normalizeAnchor(1.0, anchor)).toBe(50);
    expect(normalizeAnchor(0.2, anchor)).toBe(100);
    expect(normalizeAnchor(1.5, anchor)).toBe(25);
    expect(normalizeAnchor(0.6, anchor)).toBe(75);

    // Clamping
    expect(normalizeAnchor(2.5, anchor)).toBe(0);
    expect(normalizeAnchor(0.05, anchor)).toBe(100);
  });
});

describe("simplicity factor calculation", () => {
  it("scores 100 for non-financial stock with 2 segments and no corporate action", () => {
    const stock = makeStock({
      sectorModel: "non_financial",
      segments: { value: ["Core", "Services"], asOf: "2026-11-10", source: "s1" },
      corporateActions: [],
    });
    const metrics = makeMetricSet();
    const profile = makeProfile();
    const scored = scoreStock(stock, metrics, profile);
    expect(scored.subScores.simplicity.score).toBe(100);
  });

  it("deducts 20 per segment above 2", () => {
    const stock3 = makeStock({
      segments: { value: ["A", "B", "C"], asOf: "2026-11-10", source: "s1" },
    });
    expect(scoreStock(stock3, makeMetricSet(), makeProfile()).subScores.simplicity.score).toBe(80);

    const stock4 = makeStock({
      segments: { value: ["A", "B", "C", "D"], asOf: "2026-11-10", source: "s1" },
    });
    expect(scoreStock(stock4, makeMetricSet(), makeProfile()).subScores.simplicity.score).toBe(60);
  });

  it("deducts 25 for corporate action in last 5 years", () => {
    const stock = makeStock({
      corporateActions: [
        {
          id: "ca-1",
          type: "split",
          effectiveDate: "2024-05-01",
          listingDate: null,
          description: "Sub-division",
          successorTickers: [],
          sourceId: "s1",
        },
      ],
    });
    expect(scoreStock(stock, makeMetricSet(), makeProfile()).subScores.simplicity.score).toBe(75);
  });

  it("does not deduct for corporate action older than 5 years", () => {
    const stock = makeStock({
      corporateActions: [
        {
          id: "ca-old",
          type: "split",
          effectiveDate: "2018-05-01",
          listingDate: null,
          description: "Old sub-division",
          successorTickers: [],
          sourceId: "s1",
        },
      ],
    });
    expect(scoreStock(stock, makeMetricSet(), makeProfile()).subScores.simplicity.score).toBe(100);
  });

  it("deducts 15 for financial sector", () => {
    const stock = makeStock({ sectorModel: "financial" });
    const metrics = makeMetricSet({ sectorModel: "financial" });
    expect(scoreStock(stock, metrics, makeProfile()).subScores.simplicity.score).toBe(85);
  });

  it("combines deductions and floors at 0", () => {
    // 3 segments (-20), corporate action (-25), financial (-15) -> 100 - 60 = 40
    const stock = makeStock({
      sectorModel: "financial",
      segments: { value: ["A", "B", "C"], asOf: "2026-11-10", source: "s1" },
      corporateActions: [
        {
          id: "ca-1",
          type: "merger",
          effectiveDate: "2023-07-01",
          listingDate: null,
          description: "Merger",
          successorTickers: [],
          sourceId: "s1",
        },
      ],
    });
    const metrics = makeMetricSet({ sectorModel: "financial" });
    expect(scoreStock(stock, metrics, makeProfile()).subScores.simplicity.score).toBe(40);

    // Huge deductions floor at 0
    const stockExcessive = makeStock({
      sectorModel: "financial",
      segments: { value: ["1", "2", "3", "4", "5", "6", "7", "8"], asOf: "2026-11-10", source: "s1" }, // (8-2)*20 = 120
      corporateActions: [
        {
          id: "ca-1",
          type: "merger",
          effectiveDate: "2023-07-01",
          listingDate: null,
          description: "Merger",
          successorTickers: [],
          sourceId: "s1",
        },
      ],
    });
    expect(scoreStock(stockExcessive, metrics, makeProfile()).subScores.simplicity.score).toBe(0);
  });
});

describe("missing factor redistribution and coverage tracking", () => {
  it("has coverage 1.0 when all factor data is present", () => {
    const stock = makeStock();
    const metrics = makeMetricSet();
    const profile = makeProfile();
    const scored = scoreStock(stock, metrics, profile);

    expect(scored.coverage).toBe(1.0);
    expect(scored.qualifies).toBe(true);
    expect(scored.score).toBeGreaterThan(0);
  });

  it("handles bank / financial models where ROCE and D/E are omitted", () => {
    const stock = makeStock({ sectorModel: "financial" });
    const metrics = makeMetricSet(
      { sectorModel: "financial" },
      {
        rocePct: null,
        debtToEquity: null,
        interestCoverTimes: null,
        pePercentile: null,
        peSectorRatio: null,
        pbPercentile: 30.0,
        pbSectorRatio: 0.9,
      },
    );
    const profile = makeProfile();
    const scored = scoreStock(stock, metrics, profile);

    // Quality has ROE; Stability has volatility and maxDrawdown; Valuation has PB
    // All 6 factors have at least one usable sub-metric, so coverage remains 1.0!
    expect(scored.coverage).toBe(1.0);
    expect(scored.subScores.quality.score).not.toBeNull();
    expect(scored.subScores.stability.score).not.toBeNull();
    expect(scored.subScores.valuation.score).not.toBeNull();
  });

  it("redistributes weight proportionally when an entire factor is null", () => {
    const stock = makeStock();
    // Omit both revenueCagr and patCagr so growth factor is null
    const metrics = makeMetricSet({}, { revenueCagrPct: null, patCagrPct: null });
    const profile = makeProfile({ goal: "grow_wealth" }); // base growth weight = 0.30

    const scored = scoreStock(stock, metrics, profile);
    const baseWeights = computeGoalWeights(profile);

    expect(scored.subScores.growth.score).toBeNull();
    expect(scored.coverage).toBeCloseTo(1.0 - baseWeights.growth, 3);

    // Sum of weights of non-null factors in subScores should equal 1.0
    const nonNullWeightSum = Object.values(scored.subScores)
      .filter((s) => s.score !== null)
      .reduce((sum, s) => sum + s.weight, 0);
    expect(nonNullWeightSum).toBeCloseTo(1.0, 4);
  });

  it("does not score stock if coverage is below 0.60", () => {
    const stock = makeStock();
    // Drop quality, growth, valuation, and income data
    const metrics = makeMetricSet(
      {},
      {
        roePct: null,
        rocePct: null,
        revenueCagrPct: null,
        patCagrPct: null,
        pePercentile: null,
        peSectorRatio: null,
        pbPercentile: null,
        pbSectorRatio: null,
        dividendYieldPct: null,
        yearsWithDividend: 0,
      },
    );
    // Even if yearsWithDividend is 0, let's null all inputs of quality, growth, valuation
    // In grow_wealth: quality(0.20) + growth(0.30) + valuation(0.15) = 0.65 missing -> coverage 0.35
    const profile = makeProfile({ goal: "grow_wealth" });
    const scored = scoreStock(stock, metrics, profile);

    expect(scored.coverage).toBeLessThan(0.60);
    expect(scored.score).toBe(0);
    expect(scored.qualifies).toBe(false);
    expect(scored.factorBars).toEqual([]);
  });

  it("scores stock but does not qualify if coverage is between 0.60 and 0.80", () => {
    const stock = makeStock();
    // Grow wealth goal has growth weight 0.30. Nulling growth leaves coverage ~0.70
    const metrics = makeMetricSet({}, { revenueCagrPct: null, patCagrPct: null });
    const profile = makeProfile({ goal: "grow_wealth" });
    const scored = scoreStock(stock, metrics, profile);

    expect(scored.coverage).toBeGreaterThanOrEqual(0.60);
    expect(scored.coverage).toBeLessThan(0.80);
    expect(scored.score).toBeGreaterThan(50.0);
    // Coverage floor is 0.80, so it must not qualify
    expect(scored.qualifies).toBe(false);
  });
});

describe("qualification logic", () => {
  it("qualifies when score >= 50.0 and coverage >= 0.80 and is nifty50Member", () => {
    const stock = makeStock({ nifty50Member: { value: true, asOf: "2026-11-10", source: "s1" } });
    const stockNotNifty = makeStock({ nifty50Member: { value: false, asOf: "2026-11-10", source: "s1" } });

    // High quality/growth/stability -> score > 50
    const metricsGood = makeMetricSet();
    const scoredGood = scoreStock(stock, metricsGood, makeProfile());
    expect(scoredGood.score).toBeGreaterThanOrEqual(50.0);
    expect(scoredGood.coverage).toBeGreaterThanOrEqual(0.80);
    expect(scoredGood.qualifies).toBe(true);

    // Non-Nifty50 stock cannot qualify even with high score
    const scoredNotNifty = scoreStock(stockNotNifty, metricsGood, makeProfile());
    expect(scoredNotNifty.qualifies).toBe(false);
  });

  it("does not qualify if score < 50.0 even with full coverage", () => {
    const stock = makeStock();
    // Terrible metrics that yield low score
    const metricsBad = makeMetricSet(
      {},
      {
        roePct: 5.0, // 0
        rocePct: 5.0, // 0
        revenueCagrPct: 0.0, // 0
        patCagrPct: 0.0, // 0
        pePercentile: 100.0, // 0
        peSectorRatio: 2.0, // 0
        dividendYieldPct: 0.0, // 0
        yearsWithDividend: 0, // 0
        volatilityPct: 45.0, // 0
        maxDrawdownPct: -60.0, // 0
        debtToEquity: 2.0, // 0
      },
    );
    const scored = scoreStock(stock, metricsBad, makeProfile());
    expect(scored.coverage).toBe(1.0);
    expect(scored.score).toBeLessThan(50.0);
    expect(scored.qualifies).toBe(false);
  });
});

describe("selectShortlist", () => {
  it("sorts qualifiers by score desc, coverage desc, stability desc, ticker asc", () => {
    const stockA = makeScoredStock({
      stock: makeStock({ ticker: "STOCK_A", sectorId: "it" }),
      score: 80,
      coverage: 1.0,
    });
    const stockB = makeScoredStock({
      stock: makeStock({ ticker: "STOCK_B", sectorId: "fmcg" }),
      score: 75,
      coverage: 1.0,
    });
    const stockC = makeScoredStock({
      stock: makeStock({ ticker: "STOCK_C", sectorId: "auto" }),
      score: 75,
      coverage: 0.9,
    });
    const stockD = makeScoredStock({
      stock: makeStock({ ticker: "STOCK_D", sectorId: "energy" }),
      score: 75,
      coverage: 1.0,
      subScores: {
        ...makeScoredStock().subScores,
        stability: { factor: "stability", score: 85, weight: 0.2, contribution: 17 },
      },
    });
    const stockE = makeScoredStock({
      stock: makeStock({ ticker: "STOCK_E", sectorId: "pharma" }),
      score: 75,
      coverage: 1.0,
      subScores: {
        ...makeScoredStock().subScores,
        stability: { factor: "stability", score: 70, weight: 0.2, contribution: 14 },
      },
    });

    const result = selectShortlist([stockC, stockE, stockB, stockA, stockD]);
    const tickers = result.cards.map((c) => c.stock.ticker);

    // 1st: STOCK_A (score 80)
    // 2nd: between B, D, E (score 75, coverage 1.0) -> D has stability 85
    // 3rd & 4th: between B and E -> both have stability 70, B comes before E alphabetically
    // 5th: STOCK_C (coverage 0.9)
    expect(tickers).toEqual(["STOCK_A", "STOCK_D", "STOCK_B", "STOCK_E", "STOCK_C"]);
  });

  it("applies sector cap of at most 2 per sector when >= 3 sectors are present", () => {
    const s1 = makeScoredStock({ stock: makeStock({ ticker: "IT_1", sectorId: "it" }), score: 90 });
    const s2 = makeScoredStock({ stock: makeStock({ ticker: "IT_2", sectorId: "it" }), score: 85 });
    const s3 = makeScoredStock({ stock: makeStock({ ticker: "IT_3", sectorId: "it" }), score: 80 }); // Should be capped
    const s4 = makeScoredStock({ stock: makeStock({ ticker: "FMCG_1", sectorId: "fmcg" }), score: 75 });
    const s5 = makeScoredStock({ stock: makeStock({ ticker: "FMCG_2", sectorId: "fmcg" }), score: 70 });
    const s6 = makeScoredStock({ stock: makeStock({ ticker: "AUTO_1", sectorId: "auto" }), score: 65 });

    const result = selectShortlist([s1, s2, s3, s4, s5, s6]);
    const tickers = result.cards.map((c) => c.stock.ticker);

    expect(tickers).toEqual(["IT_1", "IT_2", "FMCG_1", "FMCG_2", "AUTO_1"]);
    expect(tickers).not.toContain("IT_3");
    expect(result.sectorsCount).toBe(3);
    expect(result.thinFit).toBe(false);
  });

  it("relaxes sector cap to 3 when greedy pass yields fewer than 3 sectors", () => {
    // Only 2 sectors exist among qualifiers: 4 from IT, 2 from FMCG
    const it1 = makeScoredStock({ stock: makeStock({ ticker: "IT_1", sectorId: "it" }), score: 90 });
    const it2 = makeScoredStock({ stock: makeStock({ ticker: "IT_2", sectorId: "it" }), score: 85 });
    const it3 = makeScoredStock({ stock: makeStock({ ticker: "IT_3", sectorId: "it" }), score: 80 });
    const it4 = makeScoredStock({ stock: makeStock({ ticker: "IT_4", sectorId: "it" }), score: 75 });
    const fmcg1 = makeScoredStock({ stock: makeStock({ ticker: "FMCG_1", sectorId: "fmcg" }), score: 70 });
    const fmcg2 = makeScoredStock({ stock: makeStock({ ticker: "FMCG_2", sectorId: "fmcg" }), score: 65 });

    const result = selectShortlist([it1, it2, it3, it4, fmcg1, fmcg2]);
    const tickers = result.cards.map((c) => c.stock.ticker);

    // Initial pass with cap 2 gave: IT_1, IT_2, FMCG_1, FMCG_2 (only 2 sectors)
    // Relaxed cap 3 gives: IT_1, IT_2, IT_3, FMCG_1, FMCG_2 (5 picks, IT has 3)
    expect(tickers).toEqual(["IT_1", "IT_2", "IT_3", "FMCG_1", "FMCG_2"]);
    expect(result.cards.length).toBe(5);
    expect(result.sectorsCount).toBe(2);
    expect(result.thinFit).toBe(false);
  });

  it("returns at most 5 picks even if many qualify", () => {
    const stocks = Array.from({ length: 10 }, (_, i) =>
      makeScoredStock({
        stock: makeStock({ ticker: `STOCK_${i}`, sectorId: `sec_${i % 5}` }),
        score: 90 - i,
      }),
    );
    const result = selectShortlist(stocks);
    expect(result.cards.length).toBe(SHORTLIST_CONFIG.maxPicks);
  });

  it("handles thin fit when fewer than 3 qualify", () => {
    // 0 qualifiers
    const emptyResult = selectShortlist([]);
    expect(emptyResult.cards).toEqual([]);
    expect(emptyResult.thinFit).toBe(true);
    expect(emptyResult.sectorsCount).toBe(0);

    // 1 qualifier: spec §7.6: "except that exactly one qualifier returns zero cards and a link to that stock's detail page"
    const single = makeScoredStock({ stock: makeStock({ ticker: "SOLO" }), score: 80 });
    const singleResult = selectShortlist([single]);
    expect(singleResult.cards).toEqual([]);
    expect(singleResult.thinFit).toBe(true);
    expect(singleResult.sectorsCount).toBe(0);

    // 2 qualifiers: returns both with thinFit = true
    const q1 = makeScoredStock({ stock: makeStock({ ticker: "PAIR_1", sectorId: "it" }), score: 80 });
    const q2 = makeScoredStock({ stock: makeStock({ ticker: "PAIR_2", sectorId: "fmcg" }), score: 75 });
    const pairResult = selectShortlist([q1, q2]);
    expect(pairResult.cards.map((c) => c.stock.ticker)).toEqual(["PAIR_1", "PAIR_2"]);
    expect(pairResult.thinFit).toBe(true);
    expect(pairResult.sectorsCount).toBe(2);
  });

  it("ignores non-qualifying stocks", () => {
    const q1 = makeScoredStock({ stock: makeStock({ ticker: "Q1", sectorId: "it" }), score: 80, qualifies: true });
    const q2 = makeScoredStock({ stock: makeStock({ ticker: "Q2", sectorId: "fmcg" }), score: 75, qualifies: true });
    const q3 = makeScoredStock({ stock: makeStock({ ticker: "Q3", sectorId: "auto" }), score: 70, qualifies: true });
    const fail1 = makeScoredStock({ stock: makeStock({ ticker: "FAIL_1" }), score: 45, qualifies: false });
    const fail2 = makeScoredStock({ stock: makeStock({ ticker: "FAIL_2" }), score: 80, coverage: 0.7, qualifies: false });

    const result = selectShortlist([q1, fail1, q2, fail2, q3]);
    expect(result.cards.map((c) => c.stock.ticker)).toEqual(["Q1", "Q2", "Q3"]);
    expect(result.thinFit).toBe(false);
  });
});
