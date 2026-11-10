export const ENGINE_VERSION = "0.1.0";
export const CONFIG_VERSION = "1.0.0";
export const PRICE_LAG_DAYS = 0;

export const BASE_WEIGHTS = {
  grow_wealth: { quality: 0.20, growth: 0.30, valuation: 0.15, income: 0.05, stability: 0.20, simplicity: 0.10 },
  dividends:   { quality: 0.20, growth: 0.10, valuation: 0.15, income: 0.35, stability: 0.15, simplicity: 0.05 },
  learn:       { quality: 0.20, growth: 0.15, valuation: 0.15, income: 0.05, stability: 0.20, simplicity: 0.25 },
  preserve:    { quality: 0.25, growth: 0.05, valuation: 0.20, income: 0.20, stability: 0.25, simplicity: 0.05 },
} as const;

export const RISK_MULTIPLIERS = {
  low:    { quality: 1.10, growth: 0.70, valuation: 1.00, income: 1.00, stability: 1.40, simplicity: 1.00 },
  medium: { quality: 1.00, growth: 1.00, valuation: 1.00, income: 1.00, stability: 1.00, simplicity: 1.00 },
  high:   { quality: 0.95, growth: 1.25, valuation: 1.00, income: 0.90, stability: 0.75, simplicity: 1.00 },
  unsure: { quality: 1.05, growth: 0.85, valuation: 1.00, income: 1.00, stability: 1.20, simplicity: 1.00 },
} as const;

export const HORIZON_MULTIPLIERS = {
  "1_3y":     { quality: 1.00, growth: 0.80, valuation: 1.00, income: 1.00, stability: 1.25, simplicity: 1.00 },
  "3_5y":     { quality: 1.00, growth: 1.00, valuation: 1.00, income: 1.00, stability: 1.00, simplicity: 1.00 },
  "5_10y":    { quality: 1.00, growth: 1.10, valuation: 1.00, income: 1.00, stability: 0.90, simplicity: 1.00 },
  "10y_plus": { quality: 1.00, growth: 1.20, valuation: 1.00, income: 1.00, stability: 0.80, simplicity: 1.00 },
} as const;

export const NORMALIZATION_ANCHORS = {
  quality: {
    roe: { x0: 5, x50: 15, x100: 25 },
    roce: { x0: 5, x50: 15, x100: 25 },
  },
  growth: {
    revenueCagr: { x0: 0, x50: 10, x100: 20 },
    patCagr: { x0: 0, x50: 10, x100: 20 },
  },
  valuation: {
    pePercentile: { x0: 100, x50: 50, x100: 0 },
    pbPercentile: { x0: 100, x50: 50, x100: 0 },
    peSectorRatio: { x0: 2.0, x50: 1.0, x100: 0.5 },
    pbSectorRatio: { x0: 2.0, x50: 1.0, x100: 0.5 },
  },
  income: {
    dividendYield: { x0: 0, x50: 2, x100: 4 },
    yearsWithDividend: { x0: 0, x50: 3, x100: 5 },
  },
  stability: {
    volatility: { x0: 45, x50: 25, x100: 15 },
    maxDrawdown: { x0: -60, x50: -30, x100: -10 },
    debtToEquity: { x0: 2.0, x50: 1.0, x100: 0.2 },
  },
} as const;

export const SHORTLIST_CONFIG = {
  qualifyThreshold: 50.0,
  coverageFloor: 0.80,
  minCoverageToScore: 0.60,
  maxPerSector: 2,
  relaxedMaxPerSector: 3,
  minSectorsRequired: 3,
  maxPicks: 5,
  minPicksForNormalFit: 3,
} as const;

export const RISK_THRESHOLDS = {
  highDebtDe: 0.3,
  heavyDebtDe: 1.5,
  lowInterestCover: 3.0,
  deepDrawdownPct: -20.0,
  severeDrawdownPct: -40.0,
  highVolatilityPct: 30.0,
  negativePatGrowthPct: 0.0,
  lowRoePct: 10.0,
  concentrationSectorPct: 40.0,
} as const;
