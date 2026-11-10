import type { Stock } from "@/lib/data/schema";
import {
  BASE_WEIGHTS,
  HORIZON_MULTIPLIERS,
  NORMALIZATION_ANCHORS,
  RISK_MULTIPLIERS,
  SHORTLIST_CONFIG,
} from "@/lib/engine/config";
import { round1, round3 } from "@/lib/engine/format";
import type {
  Factor,
  FactorBar,
  MetricSet,
  Profile,
  ScoredStock,
  SubScore,
} from "@/lib/engine/types";

export const FACTORS: readonly Factor[] = [
  "quality",
  "growth",
  "valuation",
  "income",
  "stability",
  "simplicity",
] as const;

export const FACTOR_LABELS: Record<Factor, string> = {
  quality: "Quality",
  growth: "Growth",
  valuation: "Valuation",
  income: "Income",
  stability: "Stability",
  simplicity: "Simplicity",
};

/**
 * Piecewise linear normalisation: x0 -> 0, x50 -> 50, x100 -> 100.
 * Automatically handles standard (increasing) and inverted (decreasing) anchors.
 */
export function normalizeAnchor(
  value: number,
  anchor: { x0: number; x50: number; x100: number },
  invert?: boolean,
): number {
  const isDecreasing = invert ?? anchor.x0 > anchor.x100;

  if (isDecreasing) {
    if (value >= anchor.x0) return 0;
    if (value <= anchor.x100) return 100;
    if (value >= anchor.x50) {
      if (anchor.x0 === anchor.x50) return 50;
      return round1(((value - anchor.x0) / (anchor.x50 - anchor.x0)) * 50);
    } else {
      if (anchor.x50 === anchor.x100) return 100;
      return round1(50 + ((value - anchor.x50) / (anchor.x100 - anchor.x50)) * 50);
    }
  } else {
    if (value <= anchor.x0) return 0;
    if (value >= anchor.x100) return 100;
    if (value <= anchor.x50) {
      if (anchor.x50 === anchor.x0) return 50;
      return round1(((value - anchor.x0) / (anchor.x50 - anchor.x0)) * 50);
    } else {
      if (anchor.x100 === anchor.x50) return 100;
      return round1(50 + ((value - anchor.x50) / (anchor.x100 - anchor.x50)) * 50);
    }
  }
}

/**
 * Computes factor weights for a user profile by multiplying goal base weights
 * by risk and horizon multipliers, then renormalising so the sum equals 1.0.
 */
export function computeGoalWeights(profile: Profile): Record<Factor, number> {
  const base = BASE_WEIGHTS[profile.goal];
  const riskMult = RISK_MULTIPLIERS[profile.riskComfort];
  const horizonMult = HORIZON_MULTIPLIERS[profile.horizon];

  const raw: Record<Factor, number> = {
    quality: base.quality * riskMult.quality * horizonMult.quality,
    growth: base.growth * riskMult.growth * horizonMult.growth,
    valuation: base.valuation * riskMult.valuation * horizonMult.valuation,
    income: base.income * riskMult.income * horizonMult.income,
    stability: base.stability * riskMult.stability * horizonMult.stability,
    simplicity: base.simplicity * riskMult.simplicity * horizonMult.simplicity,
  };

  const totalRaw = Object.values(raw).reduce((sum, w) => sum + w, 0);

  return {
    quality: raw.quality / totalRaw,
    growth: raw.growth / totalRaw,
    valuation: raw.valuation / totalRaw,
    income: raw.income / totalRaw,
    stability: raw.stability / totalRaw,
    simplicity: raw.simplicity / totalRaw,
  };
}

/**
 * Helper to check whether a corporate action occurred in the 5-year observation window.
 */
function hasRecentCorporateAction(stock: Stock): boolean {
  const actions = stock.corporateActions;
  if (!actions || actions.length === 0) return false;

  let refDate = "2026-11-10";
  if (stock.prices?.value?.points?.length) {
    const pts = stock.prices.value.points;
    refDate = pts[pts.length - 1].date;
  } else if (stock.recentPrices?.value?.points?.length) {
    const pts = stock.recentPrices.value.points;
    refDate = pts[pts.length - 1].date;
  } else if (stock.financials?.annual?.asOf) {
    refDate = stock.financials.annual.asOf;
  }

  const [refYearStr, ...rest] = refDate.split("-");
  const fiveYearsAgo = `${Number(refYearStr) - 5}-${rest.join("-")}`;

  return actions.some((ca) => ca.effectiveDate >= fiveYearsAgo && ca.effectiveDate <= refDate);
}

/**
 * Calculates simplicity factor score:
 * Starts at 100, -20 per segment > 2, -25 if corporate action in last 5 years, -15 if financial sector.
 * Floored at 0.
 */
export function computeSimplicity(stock: Stock): number {
  let score = 100;

  const segmentCount = stock.segments?.value?.length ?? 0;
  if (segmentCount > 2) {
    score -= (segmentCount - 2) * 20;
  }

  if (hasRecentCorporateAction(stock)) {
    score -= 25;
  }

  if (stock.sectorModel === "financial") {
    score -= 15;
  }

  return Math.max(0, score);
}

/**
 * Score a single stock against a user profile and derived metrics.
 * Supports both (stock, metrics, profile) and (profile, metrics, stock?) signatures.
 */
export function scoreStock(stock: Stock, metrics: MetricSet, profile: Profile): ScoredStock;
export function scoreStock(profile: Profile, metrics: MetricSet, stock?: Stock): ScoredStock;
export function scoreStock(
  a: Stock | Profile,
  b: MetricSet,
  c?: Profile | Stock,
): ScoredStock {
  let stock: Stock;
  const metrics: MetricSet = b;
  let profile: Profile;

  if ("goal" in a) {
    profile = a as Profile;
    stock = (c as Stock) ?? {
      ticker: metrics.ticker,
      name: metrics.name,
      isin: "INE000000000",
      sectorId: metrics.sectorId,
      sectorModel: metrics.sectorModel,
      nifty50Member: { value: true, asOf: "2026-11-10", source: "default" },
      businessSummary: { value: metrics.name, asOf: "2026-11-10", source: "default" },
      segments: { value: [], asOf: "2026-11-10", source: "default" },
      prices: {
        value: { currency: "INR", granularity: "monthly_close", points: [] },
        asOf: "2026-11-10",
        source: "default",
      },
      recentPrices: {
        value: { currency: "INR", granularity: "daily_close", points: [] },
        asOf: "2026-11-10",
        source: "default",
      },
      financials: {
        currency: "INR",
        units: "crore",
        basis: "consolidated",
        annual: { value: [], asOf: "2026-11-10", source: "default" },
      },
      corporateActions: [],
    };
  } else {
    stock = a as Stock;
    profile = c as Profile;
  }

  // 1. Quality sub-scores (ROE, ROCE)
  const qualitySubs: number[] = [];
  if (metrics.values.roePct != null) {
    qualitySubs.push(normalizeAnchor(metrics.values.roePct, NORMALIZATION_ANCHORS.quality.roe));
  }
  if (metrics.values.rocePct != null) {
    qualitySubs.push(normalizeAnchor(metrics.values.rocePct, NORMALIZATION_ANCHORS.quality.roce));
  }
  const qualityScore =
    qualitySubs.length > 0 ? round1(qualitySubs.reduce((a, b) => a + b, 0) / qualitySubs.length) : null;

  // 2. Growth sub-scores (revenue CAGR, PAT CAGR)
  const growthSubs: number[] = [];
  if (metrics.values.revenueCagrPct != null) {
    growthSubs.push(normalizeAnchor(metrics.values.revenueCagrPct, NORMALIZATION_ANCHORS.growth.revenueCagr));
  }
  if (metrics.values.patCagrPct != null) {
    growthSubs.push(normalizeAnchor(metrics.values.patCagrPct, NORMALIZATION_ANCHORS.growth.patCagr));
  }
  const growthScore =
    growthSubs.length > 0 ? round1(growthSubs.reduce((a, b) => a + b, 0) / growthSubs.length) : null;

  // 3. Valuation sub-scores (PE/PB percentile, PE/PB sector ratio)
  const isFinancial = stock.sectorModel === "financial" || metrics.sectorModel === "financial";
  const valuationSubs: number[] = [];
  if (isFinancial) {
    if (metrics.values.pbPercentile != null) {
      valuationSubs.push(
        normalizeAnchor(metrics.values.pbPercentile, NORMALIZATION_ANCHORS.valuation.pbPercentile),
      );
    }
    if (metrics.values.pbSectorRatio != null) {
      valuationSubs.push(
        normalizeAnchor(metrics.values.pbSectorRatio, NORMALIZATION_ANCHORS.valuation.pbSectorRatio),
      );
    }
  } else {
    if (metrics.values.pePercentile != null) {
      valuationSubs.push(
        normalizeAnchor(metrics.values.pePercentile, NORMALIZATION_ANCHORS.valuation.pePercentile),
      );
    }
    if (metrics.values.peSectorRatio != null) {
      valuationSubs.push(
        normalizeAnchor(metrics.values.peSectorRatio, NORMALIZATION_ANCHORS.valuation.peSectorRatio),
      );
    }
  }
  const valuationScore =
    valuationSubs.length > 0 ? round1(valuationSubs.reduce((a, b) => a + b, 0) / valuationSubs.length) : null;

  // 4. Income sub-scores (dividend yield, years with dividend)
  const incomeSubs: number[] = [];
  if (metrics.values.dividendYieldPct != null) {
    incomeSubs.push(
      normalizeAnchor(metrics.values.dividendYieldPct, NORMALIZATION_ANCHORS.income.dividendYield),
    );
  }
  if (metrics.values.yearsWithDividend != null) {
    incomeSubs.push(
      normalizeAnchor(metrics.values.yearsWithDividend, NORMALIZATION_ANCHORS.income.yearsWithDividend),
    );
  }
  const incomeScore =
    incomeSubs.length > 0 ? round1(incomeSubs.reduce((a, b) => a + b, 0) / incomeSubs.length) : null;

  // 5. Stability sub-scores (volatility, max drawdown, debt to equity)
  const stabilitySubs: number[] = [];
  if (metrics.values.volatilityPct != null) {
    stabilitySubs.push(
      normalizeAnchor(metrics.values.volatilityPct, NORMALIZATION_ANCHORS.stability.volatility),
    );
  }
  if (metrics.values.maxDrawdownPct != null) {
    stabilitySubs.push(
      normalizeAnchor(metrics.values.maxDrawdownPct, NORMALIZATION_ANCHORS.stability.maxDrawdown),
    );
  }
  if (metrics.values.debtToEquity != null) {
    stabilitySubs.push(
      normalizeAnchor(metrics.values.debtToEquity, NORMALIZATION_ANCHORS.stability.debtToEquity),
    );
  }
  const stabilityScore =
    stabilitySubs.length > 0
      ? round1(stabilitySubs.reduce((a, b) => a + b, 0) / stabilitySubs.length)
      : null;

  // 6. Simplicity factor score
  const simplicityScore = round1(computeSimplicity(stock));

  const factorScores: Record<Factor, number | null> = {
    quality: qualityScore,
    growth: growthScore,
    valuation: valuationScore,
    income: incomeScore,
    stability: stabilityScore,
    simplicity: simplicityScore,
  };

  const goalWeights = computeGoalWeights(profile);

  // Coverage is the sum of profile weights of factors that have data
  let coverage = 0;
  for (const f of FACTORS) {
    if (factorScores[f] !== null) {
      coverage += goalWeights[f];
    }
  }
  coverage = round3(coverage);

  // If coverage is below 0.60, the stock is not scored at all
  if (coverage < SHORTLIST_CONFIG.minCoverageToScore) {
    const subScores: Record<Factor, SubScore> = {} as Record<Factor, SubScore>;
    for (const f of FACTORS) {
      subScores[f] = {
        factor: f,
        score: factorScores[f],
        weight: 0,
        contribution: 0,
      };
    }

    return {
      stock,
      metrics,
      score: 0,
      coverage,
      subScores,
      factorBars: [],
      qualifies: false,
    };
  }

  // Weight redistribution across available factors
  const redistributedWeights: Record<Factor, number> = {} as Record<Factor, number>;
  for (const f of FACTORS) {
    if (factorScores[f] !== null) {
      redistributedWeights[f] = goalWeights[f] / coverage;
    } else {
      redistributedWeights[f] = 0;
    }
  }

  let composite = 0;
  for (const f of FACTORS) {
    if (factorScores[f] !== null) {
      composite += redistributedWeights[f] * factorScores[f]!;
    }
  }
  const finalScore = round1(composite);

  const subScores: Record<Factor, SubScore> = {} as Record<Factor, SubScore>;
  for (const f of FACTORS) {
    const sc = factorScores[f];
    const w = redistributedWeights[f];
    subScores[f] = {
      factor: f,
      score: sc,
      weight: w,
      contribution: sc !== null ? round1(w * sc) : 0,
    };
  }

  const isNifty50 = stock.nifty50Member?.value !== false;
  const qualifies =
    isNifty50 &&
    finalScore >= SHORTLIST_CONFIG.qualifyThreshold &&
    coverage >= SHORTLIST_CONFIG.coverageFloor;

  // Factor bars for the three highest-weight factors that have data
  const availableFactors = FACTORS.filter((f) => factorScores[f] !== null);
  availableFactors.sort((a, b) => {
    const wDiff = redistributedWeights[b] - redistributedWeights[a];
    if (Math.abs(wDiff) > 1e-6) return wDiff;
    const sDiff = (factorScores[b] ?? 0) - (factorScores[a] ?? 0);
    if (Math.abs(sDiff) > 1e-6) return sDiff;
    return FACTORS.indexOf(a) - FACTORS.indexOf(b);
  });

  const top3Factors = availableFactors.slice(0, 3);
  const factorBars: FactorBar[] = top3Factors.map((f) => ({
    factor: f,
    label: FACTOR_LABELS[f],
    score: factorScores[f]!,
    weight: round3(redistributedWeights[f]),
  }));

  return {
    stock,
    metrics,
    score: finalScore,
    coverage,
    subScores,
    factorBars,
    qualifies,
  };
}

/**
 * Qualifier comparator according to §7.6:
 * 1. Score desc
 * 2. Coverage desc
 * 3. Stability sub-score desc
 * 4. Ticker asc
 */
function compareQualifiers(a: ScoredStock, b: ScoredStock): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.coverage !== a.coverage) {
    return b.coverage - a.coverage;
  }
  const stabA = a.subScores.stability.score ?? -1;
  const stabB = b.subScores.stability.score ?? -1;
  if (stabB !== stabA) {
    return stabB - stabA;
  }
  return a.stock.ticker.localeCompare(b.stock.ticker);
}

/**
 * Greedy selection pass taking at most `maxPerSector` from each sector.
 */
function runGreedyPass(
  qualifiers: ScoredStock[],
  maxPerSector: number,
  maxPicks: number,
): ScoredStock[] {
  const picked: ScoredStock[] = [];
  const sectorCounts = new Map<string, number>();

  for (const s of qualifiers) {
    const sec = s.stock.sectorId;
    const count = sectorCounts.get(sec) ?? 0;
    if (count < maxPerSector) {
      picked.push(s);
      sectorCounts.set(sec, count + 1);
      if (picked.length === maxPicks) {
        break;
      }
    }
  }

  return picked;
}

/**
 * Select the final shortlist cards from scored stocks according to §7.6:
 * - Only qualified stocks are eligible
 * - Sort by score desc, coverage desc, stability desc, ticker asc
 * - Sector cap: max 2 per sector
 * - If fewer than 3 sectors are represented at the end, relax the cap to 3 per sector and rebuild once
 * - Max 5 picks
 * - Thin fit: < 3 qualifiers (1 qualifier returns 0 cards)
 */
export function selectShortlist(scoredStocks: ScoredStock[]): {
  cards: ScoredStock[];
  thinFit: boolean;
  sectorsCount: number;
} {
  const qualifiers = scoredStocks.filter((s) => s.qualifies).sort(compareQualifiers);

  if (qualifiers.length === 0) {
    return { cards: [], thinFit: true, sectorsCount: 0 };
  }

  if (qualifiers.length === 1) {
    return { cards: [], thinFit: true, sectorsCount: 0 };
  }

  if (qualifiers.length === 2) {
    const sectorsCount = new Set(qualifiers.map((s) => s.stock.sectorId)).size;
    return { cards: qualifiers, thinFit: true, sectorsCount };
  }

  // 3 or more qualifiers: normal fit
  let cards = runGreedyPass(qualifiers, SHORTLIST_CONFIG.maxPerSector, SHORTLIST_CONFIG.maxPicks);
  let sectorsCount = new Set(cards.map((s) => s.stock.sectorId)).size;

  if (sectorsCount < SHORTLIST_CONFIG.minSectorsRequired) {
    // Relax cap to 3 per sector and rebuild once
    cards = runGreedyPass(
      qualifiers,
      SHORTLIST_CONFIG.relaxedMaxPerSector,
      SHORTLIST_CONFIG.maxPicks,
    );
    sectorsCount = new Set(cards.map((s) => s.stock.sectorId)).size;
  }

  return {
    cards,
    thinFit: false,
    sectorsCount,
  };
}
