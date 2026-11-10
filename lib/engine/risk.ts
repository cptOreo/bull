import { RISK_THRESHOLDS } from "@/lib/engine/config";
import { formatPercent, formatRatio } from "@/lib/engine/format";
import type { MetricSet, RiskFlag, RiskSeverity, ScoredStock } from "@/lib/engine/types";
import type { Stock } from "@/lib/data/schema";

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Derives risk flags for an individual stock from its computed metrics and raw schema data.
 * Flags are sorted by severity: high before medium before low.
 */
export function deriveRiskFlags(metrics: MetricSet, stock: Stock): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const ticker = stock.ticker;

  // 1. High Debt (non-financials only)
  const isNonFinancial = stock.sectorModel !== "financial" && metrics.sectorModel !== "financial";
  if (isNonFinancial && metrics.values.debtToEquity !== null) {
    if (metrics.values.debtToEquity >= RISK_THRESHOLDS.highDebtDe) {
      const severity: RiskSeverity =
        metrics.values.debtToEquity >= RISK_THRESHOLDS.heavyDebtDe ? "high" : "medium";
      const metricRefId = metrics.refs["debtToEquity"]?.id ?? `${ticker}:debtToEquity`;
      flags.push({
        id: "high_debt",
        ticker,
        severity,
        label: "High Debt",
        sentence: `Debt-to-equity ratio of ${formatRatio(metrics.values.debtToEquity)} exceeds the threshold of ${RISK_THRESHOLDS.highDebtDe}.`,
        metricRefId,
      });
    }
  }

  // 2. Deep Drawdown
  if (metrics.values.maxDrawdownPct !== null) {
    if (metrics.values.maxDrawdownPct <= RISK_THRESHOLDS.deepDrawdownPct) {
      const severity: RiskSeverity =
        metrics.values.maxDrawdownPct <= RISK_THRESHOLDS.severeDrawdownPct ? "high" : "medium";
      const metricRefId = metrics.refs["maxDrawdown"]?.id ?? `${ticker}:maxDrawdown`;
      flags.push({
        id: "deep_drawdown",
        ticker,
        severity,
        label: "Deep Drawdown",
        sentence: `Maximum 5-year drawdown was ${formatPercent(metrics.values.maxDrawdownPct)}, exceeding the -20% threshold.`,
        metricRefId,
      });
    }
  }

  // 3. High Volatility
  if (metrics.values.volatilityPct !== null) {
    if (metrics.values.volatilityPct >= RISK_THRESHOLDS.highVolatilityPct) {
      const metricRefId = metrics.refs["volatility"]?.id ?? `${ticker}:volatility`;
      flags.push({
        id: "high_volatility",
        ticker,
        severity: "medium",
        label: "High Volatility",
        sentence: `Annualised price volatility is ${formatPercent(metrics.values.volatilityPct)}, exceeding 30%.`,
        metricRefId,
      });
    }
  }

  // 4. Profit Decline
  if (metrics.values.patCagrPct !== null) {
    if (metrics.values.patCagrPct < RISK_THRESHOLDS.negativePatGrowthPct) {
      const metricRefId = metrics.refs["patCagr"]?.id ?? `${ticker}:patCagr`;
      flags.push({
        id: "profit_decline",
        ticker,
        severity: "medium",
        label: "Profit Decline",
        sentence: `Profit after tax (PAT) CAGR is negative (${formatPercent(metrics.values.patCagrPct)}) over the period.`,
        metricRefId,
      });
    }
  }

  // 5. Low Return on Capital
  if (metrics.values.roePct !== null) {
    if (metrics.values.roePct < RISK_THRESHOLDS.lowRoePct) {
      const metricRefId = metrics.refs["roe"]?.id ?? `${ticker}:roe`;
      flags.push({
        id: "low_return_on_capital",
        ticker,
        severity: "medium",
        label: "Low Return on Capital",
        sentence: `Return on equity of ${formatPercent(metrics.values.roePct)} is below the 10% benchmark.`,
        metricRefId,
      });
    }
  }

  // 6. Corporate Action Gap
  if (stock.corporateActions && stock.corporateActions.length > 0) {
    flags.push({
      id: "corporate_action_gap",
      ticker,
      severity: "low",
      label: "Corporate Action History",
      sentence: `Stock has ${stock.corporateActions.length} corporate action(s) affecting historical price series continuity.`,
    });
  }

  // 7. Missing Valuation
  if (metrics.values.pe === null && metrics.values.pb === null) {
    flags.push({
      id: "missing_valuation",
      ticker,
      severity: "medium",
      label: "Missing Valuation",
      sentence: "Both P/E and P/B valuation multiples are unavailable.",
    });
  }

  // Sort flags deterministically: high -> medium -> low
  flags.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return flags;
}

/**
 * Derives portfolio-level sector concentration risk flag across the shortlist.
 * Returns null if the shortlist has <= 1 stock or if all sectors constitute <= 40% of the shortlist.
 */
export function deriveConcentrationRisk(shortlist: ScoredStock[]): RiskFlag | null {
  if (shortlist.length <= 1) {
    return null;
  }

  const sectorCounts = new Map<string, { name: string; count: number }>();

  for (const item of shortlist) {
    const sectorId = item.stock.sectorId ?? item.metrics.sectorId;
    const sectorName = item.metrics.sectorName ?? sectorId;
    const existing = sectorCounts.get(sectorId) ?? { name: sectorName, count: 0 };
    existing.count++;
    sectorCounts.set(sectorId, existing);
  }

  let topSector: { id: string; name: string; count: number } | null = null;
  for (const [id, data] of sectorCounts) {
    if (!topSector || data.count > topSector.count) {
      topSector = { id, name: data.name, count: data.count };
    }
  }

  if (!topSector) {
    return null;
  }

  const pct = (topSector.count / shortlist.length) * 100;
  if (pct > RISK_THRESHOLDS.concentrationSectorPct && topSector.count > 1) {
    const severity: RiskSeverity = pct >= 60 ? "high" : "medium";
    return {
      id: "sector_concentration",
      severity,
      label: "Sector Concentration",
      sentence: `Portfolio is concentrated in ${topSector.name} (${formatPercent(pct)} of shortlist).`,
    };
  }

  return null;
}
