import { describe, expect, it } from "vitest";
import {
  composeDirection,
  composeHowChosen,
  composeLimitations,
  composeReasons,
  composeRiskSentence,
  composeShortlistCard,
  fillTemplate,
} from "@/lib/engine/narrative";
import { SHORTLIST_CONFIG } from "@/lib/engine/config";
import type { Snapshot, Stock } from "@/lib/data/schema";
import type {
  EngineDeps,
  Factor,
  Goal,
  MetricSet,
  MetricValues,
  Profile,
  RiskFlag,
  ScoredStock,
  SubScore,
} from "@/lib/engine/types";

const BANNED_ADJECTIVES = [
  "strong",
  "cheap",
  "expensive",
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
    ticker: "ITC",
    name: "ITC Limited",
    isin: "INE154A01025",
    sectorId: "fmcg",
    sectorModel: "non_financial",
    nifty50Member: { value: true, asOf: "2026-11-10", source: "s1" },
    businessSummary: {
      value: "Cigarettes, packaged foods, hotels and paperboards.",
      asOf: "2026-03-31",
      source: "s1",
    },
    segments: {
      value: ["Cigarettes", "Foods", "Hotels", "Paperboards"],
      asOf: "2026-03-31",
      source: "s1",
    },
    prices: {
      value: {
        currency: "INR",
        granularity: "monthly_close",
        points: [
          { date: "2021-11-28", close: 200 },
          { date: "2026-10-31", close: 400 },
        ],
      },
      asOf: "2026-10-31",
      source: "manual:google-finance:2026-11-10",
    },
    recentPrices: {
      value: {
        currency: "INR",
        granularity: "daily_close",
        points: [
          { date: "2026-11-09", close: 410 },
          { date: "2026-11-10", close: 412 },
        ],
      },
      asOf: "2026-11-10",
      source: "manual:google-finance:2026-11-10",
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
    ticker: "ITC",
    name: "ITC Limited",
    sectorId: "fmcg",
    sectorName: "FMCG",
    sectorModel: "non_financial",
    values: {
      pe: 24.0,
      pb: 5.0,
      dividendYieldPct: 3.5,
      roePct: 28.0,
      rocePct: 32.0,
      operatingMarginPct: 35.0,
      debtToEquity: 0.05,
      interestCoverTimes: 50.0,
      revenueCagrPct: 11.5,
      patCagrPct: 13.0,
      volatilityPct: 15.0,
      maxDrawdownPct: -18.0,
      pePercentile: 45.0,
      pbPercentile: 50.0,
      peSectorRatio: 0.95,
      pbSectorRatio: 0.90,
      yearsWithDividend: 5,
      latestClose: 412,
      oneSessionMovePct: 0.5,
      fiveYearReturnPct: 106.0,
      indexReturnPct: 75.0,
      ...metricValuesOverrides,
    },
    refs: {},
    chartSegments: [],
    asOfDates: {
      latestClose: "2026-11-10",
      prices: "2026-10-31",
      financials: "2026-03-31",
      pe: "2026-11-10",
      pb: "2026-11-10",
      dividendYield: "2026-11-10",
      roe: "2026-03-31",
      roce: "2026-03-31",
      operatingMargin: "2026-03-31",
      debtToEquity: "2026-03-31",
      revenueCagr: "2026-03-31",
      patCagr: "2026-03-31",
    },
    isTailExpired: false,
    isMonthlyExpired: false,
    ...overrides,
  };
}

function makeScoredStock(
  factorScores: Record<Factor, number | null>,
  weights: Record<Factor, number>,
  overrides?: Partial<ScoredStock>,
): ScoredStock {
  const stock = makeStock();
  const metrics = makeMetricSet();
  const subScores = {} as Record<Factor, SubScore>;
  const factors: Factor[] = ["quality", "growth", "valuation", "income", "stability", "simplicity"];

  let composite = 0;
  for (const f of factors) {
    const sc = factorScores[f];
    const w = weights[f];
    const c = sc !== null ? w * sc : 0;
    composite += c;
    subScores[f] = {
      factor: f,
      score: sc,
      weight: w,
      contribution: c,
    };
  }

  const factorBars = factors.map((f) => ({
    factor: f,
    label: f.charAt(0).toUpperCase() + f.slice(1),
    score: factorScores[f] ?? 0,
    weight: weights[f],
  }));

  return {
    stock,
    metrics,
    score: composite,
    coverage: 1.0,
    subScores,
    factorBars,
    qualifies: true,
    ...overrides,
  };
}

function makeDeps(): EngineDeps {
  const snapshot: Snapshot = {
    schemaVersion: "1.0.0",
    snapshotId: "2026-11-10.1",
    generatedAt: "2026-11-10T18:30:00+05:30",
    generatedBy: "manual_transcription",
    note: "Test snapshot",
    sources: [],
    index: {
      id: "NIFTY50",
      name: "Nifty 50",
      prices: {
        value: {
          granularity: "monthly_close",
          points: [
            { date: "2021-11-28", close: 17000 },
            { date: "2026-10-31", close: 24000 },
          ],
        },
        asOf: "2026-10-31",
        source: "s1",
      },
    },
    sectors: [
      {
        id: "fmcg",
        name: "FMCG",
        description: { value: "Fast moving consumer goods", asOf: "2026-11-10", source: "s1" },
        medianPe: { value: 25.0, asOf: "2026-11-10", source: "s1" },
        medianPb: { value: 5.5, asOf: "2026-11-10", source: "s1" },
      },
    ],
    stocks: [],
    news: [],
    exclusions: [],
  };
  return { snapshot };
}

describe("composeDirection", () => {
  it("returns 'similar' when values are within 10% of benchmark", () => {
    expect(composeDirection(105, 100)).toBe("similar");
    expect(composeDirection(95, 100)).toBe("similar");
    expect(composeDirection(100, 100)).toBe("similar");
    expect(composeDirection(110, 100)).toBe("similar");
    expect(composeDirection(90, 100)).toBe("similar");
    // Volatility example from spec §7.8: 16.2 vs 16.8
    expect(composeDirection(16.2, 16.8)).toBe("similar");
  });

  it("returns 'higher' when stock value exceeds benchmark by more than 10%", () => {
    expect(composeDirection(115, 100)).toBe("higher");
    expect(composeDirection(140, 100)).toBe("higher");
    expect(composeDirection(25, 15)).toBe("higher");
  });

  it("returns 'lower' when stock value is less than benchmark by more than 10%", () => {
    expect(composeDirection(85, 100)).toBe("lower");
    expect(composeDirection(50, 100)).toBe("lower");
    expect(composeDirection(8, 15)).toBe("lower");
  });

  it("handles zero comparison values safely", () => {
    expect(composeDirection(0, 0)).toBe("similar");
    expect(composeDirection(5, 0)).toBe("higher");
    expect(composeDirection(-5, 0)).toBe("lower");
  });

  it("handles negative values appropriately", () => {
    // -18.0 vs -22.4 -> -18.0 is greater (shallower drawdown)
    expect(composeDirection(-18.0, -22.4)).toBe("higher");
    // -35.0 vs -22.4 -> -35.0 is lesser (deeper drawdown)
    expect(composeDirection(-35.0, -22.4)).toBe("lower");
  });
});

describe("fillTemplate", () => {
  it("substitutes placeholders correctly", () => {
    const template = {
      id: "test",
      category: "reason" as const,
      locale: "en" as const,
      text: "Stock {ticker} has P/E of {pe} as of {date}.",
      pattern: "Stock {ticker} has P/E of {pe} as of {date}.",
      slotNames: ["ticker", "pe", "date"],
    };
    const filled = fillTemplate(template, {
      ticker: "ITC",
      pe: "24.0",
      date: "31 October 2026",
    });
    expect(filled).toBe("Stock ITC has P/E of 24.0 as of 31 October 2026.");
  });

  it("accepts a raw template string", () => {
    const raw = "Return is {ret}% which is {direction} than benchmark.";
    const filled = fillTemplate(raw, { ret: "15.5", direction: "higher" });
    expect(filled).toBe("Return is 15.5% which is higher than benchmark.");
  });

  it("throws an error when any placeholder remains unfilled", () => {
    const raw = "Metric is {val} and date is {date}.";
    expect(() => fillTemplate(raw, { val: "10" })).toThrow(/unfilled.*date/i);
  });

  it("handles numeric slot values by converting to string", () => {
    const raw = "Segments count is {segments}.";
    const filled = fillTemplate(raw, { segments: 4 });
    expect(filled).toBe("Segments count is 4.");
  });
});

describe("composeReasons", () => {
  const equalWeights: Record<Factor, number> = {
    quality: 0.20,
    growth: 0.20,
    valuation: 0.15,
    income: 0.15,
    stability: 0.15,
    simplicity: 0.15,
  };

  it("enforces Priority rule: at least one reason matches the goal-associated factor", () => {
    const deps = makeDeps();
    const goals: Array<{ goal: Goal; expectedFactorText: string | RegExp }> = [
      { goal: "grow_wealth", expectedFactorText: /growth|revenue|profit after tax/i },
      { goal: "dividends", expectedFactorText: /dividend|yield/i },
      { goal: "learn", expectedFactorText: /simplicity|segments|divisions/i },
      { goal: "preserve", expectedFactorText: /stability|volatility|debt|drawdown/i },
    ];

    for (const { goal, expectedFactorText } of goals) {
      const profile = makeProfile({ goal });
      // Give quality and valuation the top contributions, so goal factor is not in top 2 naturally
      const factorScores: Record<Factor, number> = {
        quality: 95,
        growth: 45,
        valuation: 90,
        income: 40,
        stability: 40,
        simplicity: 40,
      };
      const scored = makeScoredStock(factorScores, equalWeights);
      const reasons = composeReasons(scored, profile, deps);

      expect(reasons).toHaveLength(2);
      const matchesGoal = reasons.some((r) => expectedFactorText instanceof RegExp ? expectedFactorText.test(r) : r.includes(expectedFactorText));
      expect(matchesGoal, `Goal ${goal} should yield at least one reason matching its factor`).toBe(true);
    }
  });

  it("enforces Contribution rule: takes the two highest contributions w_f * sub_f, swapping in the goal factor if not present", () => {
    const deps = makeDeps();
    const profile = makeProfile({ goal: "dividends" }); // Goal factor: income

    // Quality has contribution 0.20 * 90 = 18
    // Growth has contribution 0.20 * 80 = 16
    // Valuation has contribution 0.15 * 50 = 7.5
    // Income has contribution 0.15 * 40 = 6.0 (lower than quality and growth)
    const factorScores: Record<Factor, number> = {
      quality: 90,
      growth: 80,
      valuation: 50,
      income: 40,
      stability: 30,
      simplicity: 30,
    };
    const scored = makeScoredStock(factorScores, equalWeights);
    const reasons = composeReasons(scored, profile, deps);

    expect(reasons).toHaveLength(2);
    // Highest is quality (18). Lower of the top two was growth (16).
    // Swapping in income should retain quality (18) and replace growth with income!
    const hasQuality = reasons.some((r) => /capital efficiency|ROE|margin|ROCE/i.test(r));
    const hasIncome = reasons.some((r) => /dividend/i.test(r));
    expect(hasQuality).toBe(true);
    expect(hasIncome).toBe(true);
  });

  it("preserves top 2 contributions when the goal factor is already among the top 2", () => {
    const deps = makeDeps();
    const profile = makeProfile({ goal: "grow_wealth" }); // Goal factor: growth

    // Quality: 0.20 * 90 = 18
    // Growth: 0.20 * 85 = 17
    // Others lower
    const factorScores: Record<Factor, number> = {
      quality: 90,
      growth: 85,
      valuation: 30,
      income: 30,
      stability: 30,
      simplicity: 30,
    };
    const scored = makeScoredStock(factorScores, equalWeights);
    const reasons = composeReasons(scored, profile, deps);

    expect(reasons).toHaveLength(2);
    const hasQuality = reasons.some((r) => /capital efficiency|ROE/i.test(r));
    const hasGrowth = reasons.some((r) => /revenue expansion|revenue CAGR/i.test(r));
    expect(hasQuality).toBe(true);
    expect(hasGrowth).toBe(true);
  });

  it("selects correct band: high (>= 70), mid (40-69.9), low (< 40)", () => {
    const deps = makeDeps();
    const profile = makeProfile({ goal: "dividends" }); // Income

    // 1. High band for income (score >= 70)
    const scoredHigh = makeScoredStock(
      { quality: 50, growth: 50, valuation: 50, income: 75, stability: 50, simplicity: 50 },
      equalWeights,
    );
    const reasonsHigh = composeReasons(scoredHigh, profile, deps);
    const incomeReasonHigh = reasonsHigh.find((r) => /dividend/i.test(r))!;
    // High template text: "You favour regular dividends; its dividend yield of..."
    expect(incomeReasonHigh).toContain("favour regular dividends");

    // 2. Mid band for income (40 <= score < 70)
    const scoredMid = makeScoredStock(
      { quality: 50, growth: 50, valuation: 50, income: 55, stability: 50, simplicity: 50 },
      equalWeights,
    );
    const reasonsMid = composeReasons(scoredMid, profile, deps);
    const incomeReasonMid = reasonsMid.find((r) => /dividend/i.test(r))!;
    // Mid template text: "You look for income distributions; this company paid dividends in..."
    expect(incomeReasonMid).toContain("look for income distributions");

    // 3. Low band for income (score < 40)
    const scoredLow = makeScoredStock(
      { quality: 50, growth: 50, valuation: 50, income: 30, stability: 50, simplicity: 50 },
      equalWeights,
    );
    const reasonsLow = composeReasons(scoredLow, profile, deps);
    const incomeReasonLow = reasonsLow.find((r) => /dividend/i.test(r))!;
    // Low template text: "You track cash payouts; this company records a dividend yield of..."
    expect(incomeReasonLow).toContain("track cash payouts");
  });

  it("strictly enforces sentence rules: <= 28 words, single sentence, second person, no evaluative adjectives", () => {
    const deps = makeDeps();
    const allGoals: Goal[] = ["grow_wealth", "dividends", "learn", "preserve"];
    const scoreBands = [85, 55, 25];

    for (const goal of allGoals) {
      for (const score of scoreBands) {
        const profile = makeProfile({ goal });
        const factorScores: Record<Factor, number> = {
          quality: score,
          growth: score,
          valuation: score,
          income: score,
          stability: score,
          simplicity: score,
        };
        const scored = makeScoredStock(factorScores, equalWeights);
        const reasons = composeReasons(scored, profile, deps);

        for (const reason of reasons) {
          // Word count <= 28 words
          const words = countWords(reason);
          expect(words, `Reason "${reason}" exceeds 28 words (${words})`).toBeLessThanOrEqual(28);

          // Second person
          expect(reason.startsWith("You"), `Reason "${reason}" must start with second person "You"`).toBe(true);

          // Single sentence ending with a period
          expect(reason.endsWith("."), `Reason "${reason}" must end with a period`).toBe(true);
          const sentenceParts = reason.split(/(?<=[a-zA-Z]{3,})\.\s+/);
          expect(sentenceParts.length, `Reason "${reason}" should be a single sentence`).toBe(1);

          // No evaluative adjectives
          const lower = reason.toLowerCase();
          for (const banned of BANNED_ADJECTIVES) {
            const regex = new RegExp(`\\b${banned}\\b`, "i");
            expect(regex.test(lower), `Reason "${reason}" contains banned adjective "${banned}"`).toBe(false);
          }
        }
      }
    }
  });

  it("supports Hinglish (hi-en) locale", () => {
    const deps = makeDeps();
    const profile = makeProfile({ goal: "dividends", locale: "hi-en" });
    const factorScores: Record<Factor, number> = {
      quality: 80,
      growth: 40,
      valuation: 40,
      income: 85,
      stability: 40,
      simplicity: 40,
    };
    const scored = makeScoredStock(factorScores, equalWeights);
    const reasons = composeReasons(scored, profile, deps);

    expect(reasons).toHaveLength(2);
    for (const reason of reasons) {
      expect(reason.startsWith("Aap"), `Hinglish reason "${reason}" should start with "Aap"`).toBe(true);
      expect(countWords(reason)).toBeLessThanOrEqual(32);
    }
  });
});

describe("composeRiskSentence", () => {
  it("uses the highest severity flag's template when flags are present", () => {
    const stock = makeStock();
    const metrics = makeMetricSet({}, { debtToEquity: 0.55 });
    const flags: RiskFlag[] = [
      {
        id: "high_debt",
        severity: "high",
        label: "High Debt",
        sentence: "Debt-to-equity ratio of 0.55 exceeds threshold of 0.3.",
      },
      {
        id: "high_volatility",
        severity: "medium",
        label: "High Volatility",
        sentence: "Annualised price volatility is 35%.",
      },
    ];

    const sentence = composeRiskSentence(stock, metrics, flags, "en");
    expect(sentence).toContain("Debt-to-equity ratio of 0.55 exceeds the threshold of 0.3");
  });

  it("falls back to default_risk template when flags array is empty", () => {
    const stock = makeStock();
    const metrics = makeMetricSet();
    const sentence = composeRiskSentence(stock, metrics, [], "en");
    expect(sentence).toBe(
      "This snapshot does not measure management quality, promoter governance, or unforeseen future events.",
    );
  });

  it("supports overloaded signature (flags, locale)", () => {
    const flags: RiskFlag[] = [];
    const sentence = composeRiskSentence(flags, "en");
    expect(sentence).toBe(
      "This snapshot does not measure management quality, promoter governance, or unforeseen future events.",
    );
  });

  it("renders Hinglish default risk when locale is hi-en", () => {
    const stock = makeStock();
    const metrics = makeMetricSet();
    const sentence = composeRiskSentence(stock, metrics, [], "hi-en");
    expect(sentence).toContain("Yeh snapshot management quality");
  });
});

describe("composeLimitations", () => {
  it("returns limitation sentences for monthly drawdown, staleness, sector coverage, and not-advice", () => {
    const limitations = composeLimitations({ asOfDate: "31 October 2026", locale: "en" });
    expect(limitations).toHaveLength(4);

    // 1. monthly_drawdown
    expect(limitations[0]).toContain("Five-year price series uses monthly closes");
    // 2. snapshot_staleness
    expect(limitations[1]).toContain("Data reflects a point-in-time snapshot as of 31 October 2026");
    // 3. sector_coverage
    expect(limitations[2]).toContain("Coverage is limited to selected benchmark index constituents");
    // 4. not_advice
    expect(limitations[3]).toContain("Bull provides educational analysis for learning purposes");
  });

  it("supports Hinglish locale for limitations", () => {
    const limitations = composeLimitations({ asOfDate: "31 October 2026", locale: "hi-en" });
    expect(limitations).toHaveLength(4);
    expect(limitations[0]).toContain("Paanch saal ki price series monthly closes use karti hai");
    expect(limitations[1]).toContain("31 October 2026");
    expect(limitations[3]).toContain("Bull sirf sikhne ke liye educational analysis");
  });
});

describe("composeHowChosen", () => {
  it("produces a valid HowChosenView with normalized weights, anchorsSummary, sectorCap, and threshold", () => {
    const profile = makeProfile({ goal: "dividends", riskComfort: "low", horizon: "5_10y" });
    const view = composeHowChosen(profile, SHORTLIST_CONFIG);

    expect(view).toBeDefined();
    expect(view.sectorCap).toBe(SHORTLIST_CONFIG.maxPerSector);
    expect(view.threshold).toBe(SHORTLIST_CONFIG.qualifyThreshold);
    expect(typeof view.anchorsSummary).toBe("string");
    expect(view.anchorsSummary.length).toBeGreaterThan(10);

    // Weights sum to 1.0 (unrounded)
    const factorSum = Object.values(view.weights).reduce((a, b) => a + b, 0);
    expect(factorSum).toBeCloseTo(1.0, 5);

    // Dividends base weight for income is 0.35, should be prominent
    expect(view.weights.income).toBeGreaterThan(0.25);
  });
});

describe("composeShortlistCard", () => {
  it("composes a complete ShortlistCard with reasons, riskSentence, and factorBars", () => {
    const profile = makeProfile({ goal: "grow_wealth" });
    const factorScores: Record<Factor, number> = {
      quality: 80,
      growth: 75,
      valuation: 60,
      income: 50,
      stability: 65,
      simplicity: 70,
    };
    const weights: Record<Factor, number> = {
      quality: 0.20,
      growth: 0.30,
      valuation: 0.15,
      income: 0.05,
      stability: 0.20,
      simplicity: 0.10,
    };
    const scored = makeScoredStock(factorScores, weights);
    const deps = makeDeps();

    const card = composeShortlistCard(scored, profile, { deps });

    expect(card.ticker).toBe("ITC");
    expect(card.name).toBe("ITC Limited");
    expect(card.sectorName).toBe("FMCG");
    expect(card.businessDescription).toContain("Cigarettes, packaged foods");
    expect(card.reasons).toHaveLength(2);
    expect(card.riskSentence).toBeDefined();
    expect(card.factorBars).toHaveLength(6);
    expect(card.asOf).toBeDefined();
    expect(card.sourceLabel).toBeDefined();
  });
});
