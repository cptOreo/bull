import type { Template } from "@/lib/engine/types";

/**
 * English narrative, risk, limitation, and note templates.
 * All reason templates adhere strictly to:
 * - Second person ("You...")
 * - Present tense
 * - British/Indian spelling (e.g., prioritise, annualised, analyse, favour)
 * - Maximum 28 words in length
 * - No evaluative adjectives (no 'strong', 'cheap', 'best', 'solid', 'attractive')
 * - Dynamic direction slot {direction}
 */
export const TEMPLATES_EN: Record<string, Template> = {
  // --- REASON TEMPLATES (6 factors x 3 bands = 18 templates) ---

  // 1. Quality
  reason_quality_high: {
    id: "reason_quality_high",
    category: "reason",
    factor: "quality",
    band: "high",
    locale: "en",
    text: "You prioritise capital efficiency; this company reports an ROE of {roe}% as of {date}, which is {direction} compared to the sector benchmark of {benchmarkRoe}%.",
    pattern: "You prioritise capital efficiency; this company reports an ROE of {roe}% as of {date}, which is {direction} compared to the sector benchmark of {benchmarkRoe}%.",
    slotNames: ["roe", "date", "direction", "benchmarkRoe"],
  },
  reason_quality_mid: {
    id: "reason_quality_mid",
    category: "reason",
    factor: "quality",
    band: "mid",
    locale: "en",
    text: "You track operational profitability; this company reports an operating margin of {margin}% as of {date}, which is {direction} compared to the benchmark of {benchmarkMargin}%.",
    pattern: "You track operational profitability; this company reports an operating margin of {margin}% as of {date}, which is {direction} compared to the benchmark of {benchmarkMargin}%.",
    slotNames: ["margin", "date", "direction", "benchmarkMargin"],
  },
  reason_quality_low: {
    id: "reason_quality_low",
    category: "reason",
    factor: "quality",
    band: "low",
    locale: "en",
    text: "You monitor capital productivity; this company records an ROCE of {roce}% as of {date}, which is {direction} compared to the benchmark of {benchmarkRoce}%.",
    pattern: "You monitor capital productivity; this company records an ROCE of {roce}% as of {date}, which is {direction} compared to the benchmark of {benchmarkRoce}%.",
    slotNames: ["roce", "date", "direction", "benchmarkRoce"],
  },

  // 2. Growth
  reason_growth_high: {
    id: "reason_growth_high",
    category: "reason",
    factor: "growth",
    band: "high",
    locale: "en",
    text: "You seek revenue expansion; this company records a revenue CAGR of {cagr}% as of {date}, which is {direction} compared to the benchmark of {benchmarkCagr}%.",
    pattern: "You seek revenue expansion; this company records a revenue CAGR of {cagr}% as of {date}, which is {direction} compared to the benchmark of {benchmarkCagr}%.",
    slotNames: ["cagr", "date", "direction", "benchmarkCagr"],
  },
  reason_growth_mid: {
    id: "reason_growth_mid",
    category: "reason",
    factor: "growth",
    band: "mid",
    locale: "en",
    text: "You track earnings expansion; its profit after tax CAGR of {patCagr}% as of {date} is {direction} compared to the benchmark rate of {benchmarkCagr}%.",
    pattern: "You track earnings expansion; its profit after tax CAGR of {patCagr}% as of {date} is {direction} compared to the benchmark rate of {benchmarkCagr}%.",
    slotNames: ["patCagr", "date", "direction", "benchmarkCagr"],
  },
  reason_growth_low: {
    id: "reason_growth_low",
    category: "reason",
    factor: "growth",
    band: "low",
    locale: "en",
    text: "You review historical expansion; its revenue CAGR of {cagr}% as of {date} is {direction} compared to the benchmark rate of {benchmarkCagr}%.",
    pattern: "You review historical expansion; its revenue CAGR of {cagr}% as of {date} is {direction} compared to the benchmark rate of {benchmarkCagr}%.",
    slotNames: ["cagr", "date", "direction", "benchmarkCagr"],
  },

  // 3. Valuation
  reason_valuation_high: {
    id: "reason_valuation_high",
    category: "reason",
    factor: "valuation",
    band: "high",
    locale: "en",
    text: "You focus on valuation multiples; its price-to-earnings ratio of {pe} as of {date} is {direction} compared to the sector median of {sectorPe}.",
    pattern: "You focus on valuation multiples; its price-to-earnings ratio of {pe} as of {date} is {direction} compared to the sector median of {sectorPe}.",
    slotNames: ["pe", "date", "direction", "sectorPe"],
  },
  reason_valuation_mid: {
    id: "reason_valuation_mid",
    category: "reason",
    factor: "valuation",
    band: "mid",
    locale: "en",
    text: "You evaluate balance sheet pricing; its price-to-book ratio of {pb} as of {date} is {direction} compared to the sector median of {sectorPb}.",
    pattern: "You evaluate balance sheet pricing; its price-to-book ratio of {pb} as of {date} is {direction} compared to the sector median of {sectorPb}.",
    slotNames: ["pb", "date", "direction", "sectorPb"],
  },
  reason_valuation_low: {
    id: "reason_valuation_low",
    category: "reason",
    factor: "valuation",
    band: "low",
    locale: "en",
    text: "You examine valuation levels; its P/E ratio of {pe} as of {date} stands {direction} compared to the sector benchmark of {sectorPe}.",
    pattern: "You examine valuation levels; its P/E ratio of {pe} as of {date} stands {direction} compared to the sector benchmark of {sectorPe}.",
    slotNames: ["pe", "date", "direction", "sectorPe"],
  },

  // 4. Income
  reason_income_high: {
    id: "reason_income_high",
    category: "reason",
    factor: "income",
    band: "high",
    locale: "en",
    text: "You favour regular dividends; its dividend yield of {yield}% as of {date} is {direction} compared to the sector median of {sectorYield}%.",
    pattern: "You favour regular dividends; its dividend yield of {yield}% as of {date} is {direction} compared to the sector median of {sectorYield}%.",
    slotNames: ["yield", "date", "direction", "sectorYield"],
  },
  reason_income_mid: {
    id: "reason_income_mid",
    category: "reason",
    factor: "income",
    band: "mid",
    locale: "en",
    text: "You look for income distributions; this company paid dividends in {years} of the past five years to {date}, which is {direction} compared to {peers}.",
    pattern: "You look for income distributions; this company paid dividends in {years} of the past five years to {date}, which is {direction} compared to {peers}.",
    slotNames: ["years", "date", "direction", "peers"],
  },
  reason_income_low: {
    id: "reason_income_low",
    category: "reason",
    factor: "income",
    band: "low",
    locale: "en",
    text: "You track cash payouts; this company records a dividend yield of {yield}% as of {date}, which is {direction} compared to the sector median of {sectorYield}%.",
    pattern: "You track cash payouts; this company records a dividend yield of {yield}% as of {date}, which is {direction} compared to the sector median of {sectorYield}%.",
    slotNames: ["yield", "date", "direction", "sectorYield"],
  },

  // 5. Stability
  reason_stability_high: {
    id: "reason_stability_high",
    category: "reason",
    factor: "stability",
    band: "high",
    locale: "en",
    text: "You favour price stability; its annualised volatility of {volatility}% over five years to {date} is {direction} compared to the benchmark index of {indexVolatility}%.",
    pattern: "You favour price stability; its annualised volatility of {volatility}% over five years to {date} is {direction} compared to the benchmark index of {indexVolatility}%.",
    slotNames: ["volatility", "date", "direction", "indexVolatility"],
  },
  reason_stability_mid: {
    id: "reason_stability_mid",
    category: "reason",
    factor: "stability",
    band: "mid",
    locale: "en",
    text: "You prioritise balance sheet stability; its debt-to-equity ratio of {debtToEquity} as of {date} is {direction} compared to the benchmark threshold of {benchmarkDe}.",
    pattern: "You prioritise balance sheet stability; its debt-to-equity ratio of {debtToEquity} as of {date} is {direction} compared to the benchmark threshold of {benchmarkDe}.",
    slotNames: ["debtToEquity", "date", "direction", "benchmarkDe"],
  },
  reason_stability_low: {
    id: "reason_stability_low",
    category: "reason",
    factor: "stability",
    band: "low",
    locale: "en",
    text: "You assess downside risk; its five-year maximum drawdown of {drawdown}% to {date} is {direction} compared to the index benchmark of {indexDrawdown}%.",
    pattern: "You assess downside risk; its five-year maximum drawdown of {drawdown}% to {date} is {direction} compared to the index benchmark of {indexDrawdown}%.",
    slotNames: ["drawdown", "date", "direction", "indexDrawdown"],
  },

  // 6. Simplicity
  reason_simplicity_high: {
    id: "reason_simplicity_high",
    category: "reason",
    factor: "simplicity",
    band: "high",
    locale: "en",
    text: "You prefer business simplicity; this company operates across {segments} reporting segments as of {date}, which is {direction} compared to {peerGroup}.",
    pattern: "You prefer business simplicity; this company operates across {segments} reporting segments as of {date}, which is {direction} compared to {peerGroup}.",
    slotNames: ["segments", "date", "direction", "peerGroup"],
  },
  reason_simplicity_mid: {
    id: "reason_simplicity_mid",
    category: "reason",
    factor: "simplicity",
    band: "mid",
    locale: "en",
    text: "You value clear structures; this company reports {segments} operating divisions as of {date}, which is {direction} compared to {peerGroup}.",
    pattern: "You value clear structures; this company reports {segments} operating divisions as of {date}, which is {direction} compared to {peerGroup}.",
    slotNames: ["segments", "date", "direction", "peerGroup"],
  },
  reason_simplicity_low: {
    id: "reason_simplicity_low",
    category: "reason",
    factor: "simplicity",
    band: "low",
    locale: "en",
    text: "You analyse corporate complexity; this company operates in {segments} business divisions as of {date}, which is {direction} compared to {peerGroup}.",
    pattern: "You analyse corporate complexity; this company operates in {segments} business divisions as of {date}, which is {direction} compared to {peerGroup}.",
    slotNames: ["segments", "date", "direction", "peerGroup"],
  },

  // --- RISK TEMPLATES (8 stock-level + 1 portfolio-level) ---
  high_debt: {
    id: "high_debt",
    category: "risk",
    locale: "en",
    text: "Debt-to-equity ratio of {debtToEquity} exceeds the threshold of {threshold}.",
    pattern: "Debt-to-equity ratio of {debtToEquity} exceeds the threshold of {threshold}.",
    slotNames: ["debtToEquity", "threshold"],
  },
  deep_drawdown: {
    id: "deep_drawdown",
    category: "risk",
    locale: "en",
    text: "Maximum five-year drawdown was {maxDrawdownPct}, exceeding the {threshold} threshold.",
    pattern: "Maximum five-year drawdown was {maxDrawdownPct}, exceeding the {threshold} threshold.",
    slotNames: ["maxDrawdownPct", "threshold"],
  },
  high_volatility: {
    id: "high_volatility",
    category: "risk",
    locale: "en",
    text: "Annualised price volatility is {volatilityPct}, exceeding the {threshold} benchmark.",
    pattern: "Annualised price volatility is {volatilityPct}, exceeding the {threshold} benchmark.",
    slotNames: ["volatilityPct", "threshold"],
  },
  profit_decline: {
    id: "profit_decline",
    category: "risk",
    locale: "en",
    text: "Profit after tax CAGR is negative at {patCagrPct} over the observation period.",
    pattern: "Profit after tax CAGR is negative at {patCagrPct} over the observation period.",
    slotNames: ["patCagrPct"],
  },
  low_return_on_capital: {
    id: "low_return_on_capital",
    category: "risk",
    locale: "en",
    text: "Return on equity of {roePct} is below the {threshold} benchmark.",
    pattern: "Return on equity of {roePct} is below the {threshold} benchmark.",
    slotNames: ["roePct", "threshold"],
  },
  corporate_action_gap: {
    id: "corporate_action_gap",
    category: "risk",
    locale: "en",
    text: "Stock has {count} corporate action(s) affecting historical price series continuity.",
    pattern: "Stock has {count} corporate action(s) affecting historical price series continuity.",
    slotNames: ["count"],
  },
  missing_valuation: {
    id: "missing_valuation",
    category: "risk",
    locale: "en",
    text: "Both P/E and P/B valuation multiples are unavailable in the current snapshot.",
    pattern: "Both P/E and P/B valuation multiples are unavailable in the current snapshot.",
    slotNames: [],
  },
  default_risk: {
    id: "default_risk",
    category: "risk",
    locale: "en",
    text: "This snapshot does not measure management quality, promoter governance, or unforeseen future events.",
    pattern: "This snapshot does not measure management quality, promoter governance, or unforeseen future events.",
    slotNames: [],
  },
  sector_concentration: {
    id: "sector_concentration",
    category: "risk",
    locale: "en",
    text: "Portfolio is concentrated in {sectorName} ({pct} of shortlist).",
    pattern: "Portfolio is concentrated in {sectorName} ({pct} of shortlist).",
    slotNames: ["sectorName", "pct"],
  },

  // --- LIMITATION TEMPLATES (4 templates) ---
  monthly_drawdown: {
    id: "monthly_drawdown",
    category: "limitation",
    locale: "en",
    text: "Five-year price series uses monthly closes, which may smooth intra-month peak-to-trough drawdowns.",
    pattern: "Five-year price series uses monthly closes, which may smooth intra-month peak-to-trough drawdowns.",
    slotNames: [],
  },
  snapshot_staleness: {
    id: "snapshot_staleness",
    category: "limitation",
    locale: "en",
    text: "Data reflects a point-in-time snapshot as of {asOfDate} and does not include subsequent market events.",
    pattern: "Data reflects a point-in-time snapshot as of {asOfDate} and does not include subsequent market events.",
    slotNames: ["asOfDate"],
  },
  sector_coverage: {
    id: "sector_coverage",
    category: "limitation",
    locale: "en",
    text: "Coverage is limited to selected benchmark index constituents and excludes unlisted or smaller firms.",
    pattern: "Coverage is limited to selected benchmark index constituents and excludes unlisted or smaller firms.",
    slotNames: [],
  },
  not_advice: {
    id: "not_advice",
    category: "limitation",
    locale: "en",
    text: "Bull provides educational analysis for learning purposes and does not offer financial or investment advice.",
    pattern: "Bull provides educational analysis for learning purposes and does not offer financial or investment advice.",
    slotNames: [],
  },

  // --- NOTE TEMPLATES (2 templates) ---
  deposit_debt_exclusion: {
    id: "deposit_debt_exclusion",
    category: "note",
    locale: "en",
    text: "For banking and financial institutions, customer deposits are excluded from debt-to-equity calculations.",
    pattern: "For banking and financial institutions, customer deposits are excluded from debt-to-equity calculations.",
    slotNames: [],
  },
  simplicity_definition: {
    id: "simplicity_definition",
    category: "note",
    locale: "en",
    text: "Simplicity score evaluates business clarity based on reporting segments and corporate structural history.",
    pattern: "Simplicity score evaluates business clarity based on reporting segments and corporate structural history.",
    slotNames: [],
  },
};
