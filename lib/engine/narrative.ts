import type { Snapshot, Stock } from "@/lib/data/schema";
import {
  NORMALIZATION_ANCHORS,
  RISK_THRESHOLDS,
  SHORTLIST_CONFIG,
} from "@/lib/engine/config";
import {
  formatDateLong,
  formatPercent,
  formatRatio,
} from "@/lib/engine/format";
import { deriveRiskFlags } from "@/lib/engine/risk";
import { computeGoalWeights, FACTORS } from "@/lib/engine/score";
import {
  extractSlots,
  getReasonTemplate,
  getTemplate,
} from "@/lib/engine/templates";
import type {
  EngineDeps,
  Factor,
  Goal,
  HowChosenView,
  Locale,
  MetricSet,
  Profile,
  RiskFlag,
  RiskSeverity,
  ScoredStock,
  ShortlistCard,
  Template,
  TemplateBand,
} from "@/lib/engine/types";

const GOAL_ASSOCIATED_FACTOR: Record<Goal, Factor> = {
  grow_wealth: "growth",
  dividends: "income",
  learn: "simplicity",
  preserve: "stability",
};

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function formatDateSafe(iso?: string, fallback = "31 October 2026"): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return fallback;
  return formatDateLong(iso);
}

/**
 * Computes comparative direction dynamically between a stock metric and a comparison/benchmark value.
 * Returns "similar" if within 10% of benchmark, "higher" if greater, "lower" if lesser.
 * Direction is computed, never asserted (§7.8).
 */
export function composeDirection(
  stockVal: number,
  compVal: number,
): "higher" | "lower" | "similar" {
  if (compVal === 0) {
    if (stockVal === 0) return "similar";
    return stockVal > 0 ? "higher" : "lower";
  }
  const relDiff = Math.abs(stockVal - compVal) / Math.abs(compVal);
  if (relDiff <= 0.10 + 1e-9) {
    return "similar";
  }
  return stockVal > compVal ? "higher" : "lower";
}

/**
 * Fills template placeholders {slotName} with provided slot values.
 * Throws an Error if any {slot} tag remains unfilled after substitution.
 */
export function fillTemplate(
  template: Template | string,
  slots: Record<string, string | number>,
): string {
  const text = typeof template === "string" ? template : template.text;
  let result = text;
  for (const [key, val] of Object.entries(slots)) {
    if (val !== undefined && val !== null) {
      result = result.replaceAll(`{${key}}`, String(val));
    }
  }
  const remaining = extractSlots(result);
  if (remaining.length > 0) {
    throw new Error(
      `Unfilled template slots: ${remaining.join(", ")} in "${result}"`,
    );
  }
  return result;
}

/**
 * Selects band category according to score threshold:
 * high: >= 70, mid: 40-69.9, low: < 40 (§7.8).
 */
function getBand(score: number | null): TemplateBand {
  if (score === null || score < 40) return "low";
  if (score >= 70) return "high";
  return "mid";
}

/**
 * Resolves slot values for a specific factor, band, and stock.
 */
function resolveFactorSlots(
  factor: Factor,
  band: TemplateBand,
  stock: ScoredStock,
  snapshot?: Snapshot,
): Record<string, string | number> {
  const m = stock.metrics;
  const values = m.values;
  const asOfDates = m.asOfDates;

  // Find sector medians if available
  let sectorPe = 25.0;
  let sectorPb = 5.5;
  if (snapshot) {
    const sec = snapshot.sectors.find((s) => s.id === stock.stock.sectorId);
    if (sec?.medianPe?.value != null) sectorPe = sec.medianPe.value;
    if (sec?.medianPb?.value != null) sectorPb = sec.medianPb.value;
  } else {
    const peRef = m.refs[`${m.sectorId}:medianPe`];
    if (peRef && typeof peRef.value === "number") sectorPe = peRef.value;
    const pbRef = m.refs[`${m.sectorId}:medianPb`];
    if (pbRef && typeof pbRef.value === "number") sectorPb = pbRef.value;
  }

  switch (factor) {
    case "quality": {
      if (band === "high") {
        const roe = values.roePct ?? 0;
        const benchRoe = NORMALIZATION_ANCHORS.quality.roe.x50;
        return {
          roe: formatRatio(roe, 1),
          date: formatDateSafe(asOfDates["roe"] || asOfDates["financials"]),
          direction: composeDirection(roe, benchRoe),
          benchmarkRoe: benchRoe.toFixed(1),
        };
      }
      if (band === "mid") {
        const margin = values.operatingMarginPct ?? 0;
        const benchMargin = 12.0;
        return {
          margin: formatRatio(margin, 1),
          date: formatDateSafe(
            asOfDates["operatingMargin"] || asOfDates["financials"],
          ),
          direction: composeDirection(margin, benchMargin),
          benchmarkMargin: benchMargin.toFixed(1),
        };
      }
      const roce = values.rocePct ?? 0;
      const benchRoce = NORMALIZATION_ANCHORS.quality.roce.x50;
      return {
        roce: formatRatio(roce, 1),
        date: formatDateSafe(asOfDates["roce"] || asOfDates["financials"]),
        direction: composeDirection(roce, benchRoce),
        benchmarkRoce: benchRoce.toFixed(1),
      };
    }

    case "growth": {
      if (band === "mid") {
        const patCagr = values.patCagrPct ?? 0;
        const benchPatCagr = NORMALIZATION_ANCHORS.growth.patCagr.x50;
        return {
          patCagr: formatRatio(patCagr, 1),
          date: formatDateSafe(
            asOfDates["patCagr"] || asOfDates["financials"],
          ),
          direction: composeDirection(patCagr, benchPatCagr),
          benchmarkCagr: benchPatCagr.toFixed(1),
        };
      }
      const cagr = values.revenueCagrPct ?? 0;
      const benchCagr = NORMALIZATION_ANCHORS.growth.revenueCagr.x50;
      return {
        cagr: formatRatio(cagr, 1),
        date: formatDateSafe(
          asOfDates["revenueCagr"] || asOfDates["financials"],
        ),
        direction: composeDirection(cagr, benchCagr),
        benchmarkCagr: benchCagr.toFixed(1),
      };
    }

    case "valuation": {
      if (band === "mid") {
        const pb = values.pb ?? 0;
        return {
          pb: formatRatio(pb, 1),
          date: formatDateSafe(asOfDates["pb"] || asOfDates["latestClose"]),
          direction: composeDirection(pb, sectorPb),
          sectorPb: formatRatio(sectorPb, 1),
        };
      }
      const pe = values.pe ?? 0;
      return {
        pe: formatRatio(pe, 1),
        date: formatDateSafe(asOfDates["pe"] || asOfDates["latestClose"]),
        direction: composeDirection(pe, sectorPe),
        sectorPe: formatRatio(sectorPe, 1),
      };
    }

    case "income": {
      if (band === "mid") {
        const years = values.yearsWithDividend ?? 0;
        return {
          years: String(years),
          date: formatDateSafe(asOfDates["financials"]),
          direction: composeDirection(years, 3),
          peers: "peers",
        };
      }
      const yieldPct = values.dividendYieldPct ?? 0;
      const benchYield = NORMALIZATION_ANCHORS.income.dividendYield.x50;
      return {
        yield: formatRatio(yieldPct, 1),
        date: formatDateSafe(
          asOfDates["dividendYield"] || asOfDates["latestClose"],
        ),
        direction: composeDirection(yieldPct, benchYield),
        sectorYield: benchYield.toFixed(1),
      };
    }

    case "stability": {
      if (band === "high") {
        const vol = values.volatilityPct ?? 0;
        const indexVol = 16.8;
        return {
          volatility: formatRatio(vol, 1),
          date: formatDateSafe(asOfDates["prices"]),
          direction: composeDirection(vol, indexVol),
          indexVolatility: indexVol.toFixed(1),
        };
      }
      if (band === "mid") {
        const de = values.debtToEquity ?? 0;
        const benchDe = NORMALIZATION_ANCHORS.stability.debtToEquity.x50;
        return {
          debtToEquity: formatRatio(de, 2),
          date: formatDateSafe(
            asOfDates["debtToEquity"] || asOfDates["financials"],
          ),
          direction: composeDirection(de, benchDe),
          benchmarkDe: benchDe.toFixed(1),
        };
      }
      const dd = values.maxDrawdownPct ?? 0;
      const indexDd = -22.4;
      return {
        drawdown: formatRatio(dd, 1),
        date: formatDateSafe(asOfDates["prices"]),
        direction: composeDirection(dd, indexDd),
        indexDrawdown: indexDd.toFixed(1),
      };
    }

    case "simplicity": {
      const segCount = stock.stock.segments?.value?.length ?? 1;
      return {
        segments: String(segCount),
        date: formatDateSafe(
          stock.stock.segments?.asOf || asOfDates["financials"],
        ),
        direction: composeDirection(segCount, 3),
        peerGroup: "peers",
      };
    }
  }
}

/**
 * Composes two narrative reason sentences for a stock.
 * Guaranteed:
 * - Priority rule: at least one reason matches the goal-associated factor (§7.8).
 * - Contribution rule: two highest contributions, swapping in goal factor if not present.
 * - Band selection: high (>= 70), mid (40-69.9), low (< 40).
 * - Length: each reason <= 28 words.
 * - Second person, present tense, no evaluative adjectives.
 */
export function composeReasons(
  stock: ScoredStock,
  profile: Profile,
  depsOrLocale?: EngineDeps | { snapshot: Snapshot } | Locale,
): string[] {
  let locale: Locale = profile.locale ?? "en";
  let snapshot: Snapshot | undefined = undefined;

  if (typeof depsOrLocale === "string") {
    locale = depsOrLocale;
  } else if (depsOrLocale && typeof depsOrLocale === "object") {
    if ("snapshot" in depsOrLocale && depsOrLocale.snapshot) {
      snapshot = depsOrLocale.snapshot;
    }
  }

  const goalFactor = GOAL_ASSOCIATED_FACTOR[profile.goal];

  // Rank factors by contribution descending
  const rankedFactors = (Object.keys(stock.subScores) as Factor[])
    .map((f) => ({
      factor: f,
      contribution: stock.subScores[f]?.contribution ?? 0,
      score: stock.subScores[f]?.score ?? 0,
    }))
    .sort((a, b) => {
      if (b.contribution !== a.contribution) {
        return b.contribution - a.contribution;
      }
      return FACTORS.indexOf(a.factor) - FACTORS.indexOf(b.factor);
    });

  const topFactors: Factor[] = [rankedFactors[0].factor, rankedFactors[1].factor];

  // Priority rule: if neither of the top two is the goal-associated factor,
  // replace the lower of the two (index 1) with the goal factor.
  if (!topFactors.includes(goalFactor)) {
    topFactors[1] = goalFactor;
  }

  const reasons: string[] = [];

  for (const factor of topFactors) {
    const score = stock.subScores[factor]?.score ?? 0;
    const band = getBand(score);
    const template = getReasonTemplate(factor, band, locale);

    if (!template) {
      throw new Error(
        `Reason template missing for factor "${factor}", band "${band}", locale "${locale}"`,
      );
    }

    const slots = resolveFactorSlots(factor, band, stock, snapshot);
    const text = fillTemplate(template, slots);
    reasons.push(text);
  }

  return reasons;
}

/**
 * Composes a single risk sentence for a stock.
 * Uses highest-severity flag's template, or falls back to default_risk if empty (§7.8).
 */
export function composeRiskSentence(
  stockOrFlags: Stock | RiskFlag[],
  metricsOrLocale?: MetricSet | Locale,
  flags?: RiskFlag[],
  locale?: Locale,
): string {
  let stock: Stock | undefined;
  let metrics: MetricSet | undefined;
  let riskFlags: RiskFlag[] = [];
  let loc: Locale = "en";

  if (Array.isArray(stockOrFlags)) {
    riskFlags = stockOrFlags;
    loc = (metricsOrLocale as Locale) ?? "en";
  } else {
    stock = stockOrFlags;
    metrics = metricsOrLocale as MetricSet | undefined;
    riskFlags = flags ?? [];
    loc = locale ?? "en";
  }

  if (riskFlags.length === 0) {
    const defaultTemplate = getTemplate("default_risk", loc);
    if (defaultTemplate) {
      return fillTemplate(defaultTemplate, {});
    }
    return loc === "hi-en"
      ? "Yeh snapshot management quality, promoter governance, ya anjaan bhavishya ke ghatnakram ko measure nahi karta."
      : "This snapshot does not measure management quality, promoter governance, or unforeseen future events.";
  }

  const sortedFlags = [...riskFlags].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  const topFlag = sortedFlags[0];
  const template = getTemplate(topFlag.id, loc);

  if (!template) {
    return topFlag.sentence;
  }

  const slots: Record<string, string | number> = {};
  switch (topFlag.id) {
    case "high_debt": {
      const de = metrics?.values.debtToEquity ?? 0.3;
      slots["debtToEquity"] = formatRatio(de, 2);
      slots["threshold"] = formatRatio(RISK_THRESHOLDS.highDebtDe, 1);
      break;
    }
    case "deep_drawdown": {
      const dd = metrics?.values.maxDrawdownPct ?? RISK_THRESHOLDS.deepDrawdownPct;
      slots["maxDrawdownPct"] = formatPercent(dd, 1);
      slots["threshold"] = `${formatPercent(RISK_THRESHOLDS.deepDrawdownPct, 0)}`;
      break;
    }
    case "high_volatility": {
      const vol = metrics?.values.volatilityPct ?? RISK_THRESHOLDS.highVolatilityPct;
      slots["volatilityPct"] = formatPercent(vol, 1);
      slots["threshold"] = `${formatPercent(RISK_THRESHOLDS.highVolatilityPct, 0)}`;
      break;
    }
    case "profit_decline": {
      const pat = metrics?.values.patCagrPct ?? 0;
      slots["patCagrPct"] = formatPercent(pat, 1);
      break;
    }
    case "low_return_on_capital": {
      const roe = metrics?.values.roePct ?? RISK_THRESHOLDS.lowRoePct;
      slots["roePct"] = formatPercent(roe, 1);
      slots["threshold"] = `${formatPercent(RISK_THRESHOLDS.lowRoePct, 0)}`;
      break;
    }
    case "corporate_action_gap": {
      slots["count"] = stock?.corporateActions?.length ?? 1;
      break;
    }
    case "sector_concentration": {
      const flagRecord = topFlag as unknown as Record<string, unknown>;
      slots["sectorName"] =
        typeof flagRecord.sectorName === "string"
          ? flagRecord.sectorName
          : "Information Technology";
      slots["pct"] =
        typeof flagRecord.pct === "string" ? flagRecord.pct : "40%";
      break;
    }
    case "missing_valuation":
      break;
  }

  return fillTemplate(template, slots);
}

/**
 * Returns the four required limitation sentences:
 * monthly drawdown, snapshot staleness, sector coverage, and not-advice (§7.8).
 */
export function composeLimitations(
  optsOrMetrics?:
    | { asOfDate?: string; locale?: Locale; metrics?: MetricSet }
    | MetricSet,
  maybeLocale?: Locale,
): string[] {
  let loc: Locale = "en";
  let asOfDate = "10 November 2026";

  if (optsOrMetrics && "values" in optsOrMetrics) {
    loc = maybeLocale ?? "en";
    asOfDate =
      optsOrMetrics.asOfDates?.latestClose ||
      optsOrMetrics.asOfDates?.prices ||
      "10 November 2026";
  } else if (optsOrMetrics && typeof optsOrMetrics === "object") {
    loc = optsOrMetrics.locale ?? maybeLocale ?? "en";
    asOfDate = optsOrMetrics.asOfDate ?? "10 November 2026";
  } else if (maybeLocale) {
    loc = maybeLocale;
  }

  const formattedDate = asOfDate.includes("-")
    ? formatDateSafe(asOfDate)
    : asOfDate;

  const tMonthly = getTemplate("monthly_drawdown", loc);
  const tStaleness = getTemplate("snapshot_staleness", loc);
  const tCoverage = getTemplate("sector_coverage", loc);
  const tNotAdvice = getTemplate("not_advice", loc);

  return [
    fillTemplate(tMonthly ?? "Five-year price series uses monthly closes, which may smooth intra-month peak-to-trough drawdowns.", {}),
    fillTemplate(tStaleness ?? "Data reflects a point-in-time snapshot as of {asOfDate} and does not include subsequent market events.", { asOfDate: formattedDate }),
    fillTemplate(tCoverage ?? "Coverage is limited to selected benchmark index constituents and excludes unlisted or smaller firms.", {}),
    fillTemplate(tNotAdvice ?? "Bull provides educational analysis for learning purposes and does not offer financial or investment advice.", {}),
  ];
}

/**
 * Produces HowChosenView for disclosure in shortlist card view (§7.8, §6.4).
 */
export function composeHowChosen(
  profile: Profile,
  config?:
    | typeof SHORTLIST_CONFIG
    | {
        sectorCap?: number;
        maxPerSector?: number;
        threshold?: number;
        qualifyThreshold?: number;
      },
): HowChosenView {
  const cfg = config ?? SHORTLIST_CONFIG;
  const weights = computeGoalWeights(profile);
  const cfgRecord = cfg as unknown as Record<string, unknown>;
  const sectorCap =
    typeof cfgRecord.maxPerSector === "number"
      ? cfgRecord.maxPerSector
      : typeof cfgRecord.sectorCap === "number"
        ? cfgRecord.sectorCap
        : SHORTLIST_CONFIG.maxPerSector;
  const threshold =
    typeof cfgRecord.qualifyThreshold === "number"
      ? cfgRecord.qualifyThreshold
      : typeof cfgRecord.threshold === "number"
        ? cfgRecord.threshold
        : SHORTLIST_CONFIG.qualifyThreshold;

  const anchorsSummary =
    "Scores are calculated using piecewise linear interpolation against fixed historical benchmarks across 6 factors (quality, growth, valuation, income, stability, simplicity).";

  return {
    weights,
    anchorsSummary,
    sectorCap,
    threshold,
  };
}

/**
 * Composes a full ShortlistCard for a qualified stock (§7.8).
 */
export function composeShortlistCard(
  scoredStock: ScoredStock,
  profile: Profile,
  options?: {
    flags?: RiskFlag[];
    deps?: EngineDeps | { snapshot: Snapshot };
    locale?: Locale;
  },
): ShortlistCard {
  const loc = options?.locale ?? profile.locale ?? "en";
  const flags =
    options?.flags ??
    deriveRiskFlags(scoredStock.metrics, scoredStock.stock);

  const reasons = composeReasons(scoredStock, profile, options?.deps ?? loc);
  const riskSentence = composeRiskSentence(
    scoredStock.stock,
    scoredStock.metrics,
    flags,
    loc,
  );

  return {
    ticker: scoredStock.stock.ticker,
    name: scoredStock.stock.name,
    sectorName: scoredStock.metrics.sectorName ?? scoredStock.stock.sectorId,
    businessDescription: scoredStock.stock.businessSummary?.value ?? "",
    reasons,
    riskSentence,
    factorBars: scoredStock.factorBars,
    asOf:
      scoredStock.metrics.asOfDates["latestClose"] ??
      scoredStock.stock.prices?.asOf ??
      "",
    sourceLabel:
      scoredStock.stock.prices?.source ?? "manual:google-finance:2026-11-10",
  };
}
