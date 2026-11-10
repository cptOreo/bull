import type { Snapshot, Stock } from "@/lib/data/schema";
export type { Snapshot, Stock };

export type Locale = "en" | "hi-en";
export type Goal = "grow_wealth" | "dividends" | "learn" | "preserve";
export type Horizon = "1_3y" | "3_5y" | "5_10y" | "10y_plus";
export type RiskComfort = "low" | "medium" | "high" | "unsure";
export type Experience = "none" | "few" | "sip";
export type ProfileField = "goal" | "horizon" | "riskComfort" | "experience" | "locale";

export type Profile = {
  goal: Goal;
  horizon: Horizon;
  riskComfort: RiskComfort;
  experience: Experience;
  locale: Locale;
};

export type PartialProfile = Partial<Profile>;

export type ProfileState = {
  profile: PartialProfile;
  assumed: ProfileField[];
  missing: ProfileField[];
  complete: boolean;
};

export type Factor = "quality" | "growth" | "valuation" | "income" | "stability" | "simplicity";

export type RefKind = "data" | "derived" | "config" | "profile";
export type RefUnit = "price" | "percent" | "ratio" | "crore" | "times" | "score" | "text" | "count";

export type DataRef = { kind: "data"; id: string; value: number | string; unit: RefUnit; asOf: string; source: string };
export type DerivedRef = { kind: "derived"; id: string; value: number | string; unit: RefUnit; formulaId: string; inputRefIds: string[] };
export type ConfigRef = { kind: "config"; id: string; value: number | string; unit: RefUnit };
export type ProfileRef = { kind: "profile"; id: string; value: string; displayValue: string };

export type Ref = DataRef | DerivedRef | ConfigRef | ProfileRef;

export type FreshnessKind = "fresh" | "stale" | "expired";
export type Freshness = {
  kind: FreshnessKind;
  ageDays: number;
  asOf: string;
  source: string;
  warning?: string;
};

export type MetricValues = {
  pe: number | null;
  pb: number | null;
  dividendYieldPct: number | null;
  roePct: number | null;
  rocePct: number | null;
  operatingMarginPct: number | null;
  debtToEquity: number | null;
  interestCoverTimes: number | null;
  revenueCagrPct: number | null;
  patCagrPct: number | null;
  volatilityPct: number | null;
  maxDrawdownPct: number | null;
  pePercentile: number | null;
  pbPercentile: number | null;
  peSectorRatio: number | null;
  pbSectorRatio: number | null;
  yearsWithDividend: number;
  latestClose: number;
  oneSessionMovePct: number;
  fiveYearReturnPct: number;
  indexReturnPct: number;
};

export type ChartPoint = { date: string; stockIndexed: number; indexIndexed: number };
export type ChartSegment = { points: ChartPoint[]; corporateActionLabel?: string };

export type MetricSet = {
  ticker: string;
  name: string;
  sectorId: string;
  sectorName: string;
  sectorModel: "financial" | "non_financial";
  values: MetricValues;
  refs: Record<string, Ref>;
  chartSegments: ChartSegment[];
  asOfDates: Record<string, string>;
  isTailExpired: boolean;
  isMonthlyExpired: boolean;
};

export type SubScore = {
  factor: Factor;
  score: number | null;
  weight: number;
  contribution: number;
};

export type FactorBar = {
  factor: Factor;
  label: string;
  score: number;
  weight: number;
};

export type ScoredStock = {
  stock: Stock;
  metrics: MetricSet;
  score: number;
  coverage: number;
  subScores: Record<Factor, SubScore>;
  factorBars: FactorBar[];
  qualifies: boolean;
};

export type RiskSeverity = "high" | "medium" | "low";
export type RiskFlagId =
  | "high_debt"
  | "deep_drawdown"
  | "high_volatility"
  | "profit_decline"
  | "low_return_on_capital"
  | "corporate_action_gap"
  | "missing_valuation"
  | "sector_concentration";

export type RiskFlag = {
  id: RiskFlagId;
  ticker?: string;
  severity: RiskSeverity;
  label: string;
  sentence: string;
  metricRefId?: string;
};

export type ShortlistCard = {
  ticker: string;
  name: string;
  sectorName: string;
  businessDescription: string;
  reasons: string[];
  riskSentence: string;
  factorBars: FactorBar[];
  asOf: string;
  sourceLabel: string;
};

export type HowChosenView = {
  weights: Record<Factor, number>;
  anchorsSummary: string;
  sectorCap: number;
  threshold: number;
};

export type Option = { label: string; value: string };
export type DetailSection = { id: string; title: string; rows: Array<{ label: string; value: string; note?: string }> };
export type ComparisonRow = { label: string; stockAValue: string; stockBValue: string };
export type NewsItemView = { headline: string; summary: string; sourceName: string; publishedAt: string; kind: "fact" | "commentary" | "announcement"; sourceUrl: string | null };

export type LiveStockSnapshot = {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketCap: number | null;
  marketCapFormatted: string;
  peRatio: number | null;
  dividendYield: number | null;
  sector: string | null;
  industry: string | null;
  summary: string | null;
  strengths: string[];
  watchouts: string[];
  asOf: string;
};

export type Block =
  | { type: "text"; text: string }
  | { type: "intake_question"; field: ProfileField; question: string; options: Option[] }
  | { type: "choices"; question: string; options: Option[] }
  | { type: "profile_summary"; profile: Profile; assumed: ProfileField[] }
  | { type: "shortlist"; cards: ShortlistCard[]; thinFit: boolean; sectors: number; diversityNote: string; howChosen: HowChosenView }
  | { type: "stock_detail"; ticker: string; sections: DetailSection[] }
  | { type: "stock_snapshot"; snapshot: LiveStockSnapshot }
  | { type: "comparison"; tickers: [string, string]; rows: ComparisonRow[] }
  | { type: "news"; items: NewsItemView[] }
  | { type: "coverage_miss"; name: string; reason: string | null }
  | { type: "boundary"; topic: "advice" | "concentration" | "injection" | "universe"; explanation: string }
  | { type: "limitations"; items: string[] }
  | { type: "education_note"; text: string };

export type Route =
  | "shortlist"
  | "compare"
  | "history"
  | "news"
  | "stock_detail"
  | "coverage_miss"
  | "boundary"
  | "intake"
  | "clarify"
  | "concept";

export type Answer = {
  route: Route;
  blocks: Block[];
  refs: Ref[];
  profileState: ProfileState | null;
  meta: {
    snapshotId: string;
    engineVersion: string;
    scoreId: string;
    locale: Locale;
    generatedAt: string;
  };
  followUps?: string[];
};

export type TurnInput = {
  message: string;
  profile: PartialProfile | null;
  locale: Locale;
  now: string;
  events: LearningEvent[];
};

export type EngineDeps = {
  snapshot: Snapshot;
  rephrase?: (items: Array<{ id: string; text: string; locale: Locale }>) => Promise<Array<{ id: string; text: string }>>;
};

export type ConceptId = "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8";
export type MasteryState = "locked" | "seen" | "practised" | "applied" | "mastered";

export type EventType =
  | "lesson_completed"
  | "check_answered_correct"
  | "mission_passed"
  | "quiz_passed"
  | "stock_viewed"
  | "chart_viewed"
  | "shortlist_generated"
  | "risk_named"
  | "quiz_completed"
  | "comparison_viewed";

export type LearningEvent = {
  type: EventType;
  conceptId?: ConceptId;
  ticker?: string;
  score?: number;
  timestamp: string;
  itemId?: string;
  locale?: Locale;
  data?: Record<string, unknown>;
};

export type ConceptState = {
  conceptId: ConceptId;
  state: MasteryState;
  unlocked: boolean;
  correctCheckItemIds: string[];
  appliedMissionPassed: boolean;
};

export type CheckItem = {
  id: string;
  conceptId: ConceptId;
  question: string;
  options: [string, string, string];
  correctIndex: number;
  explanation: string;
};

export type Mission = {
  conceptId: ConceptId;
  prompt: string;
  targetTicker?: string;
  tolerancePct?: number;
  toleranceAbsolute?: number;
  expectedValue: number | string;
  unit: string;
  formulaNote: string;
};

export type TemplateCategory = "reason" | "risk" | "limitation" | "note";
export type TemplateBand = "high" | "mid" | "low";

export type Template = {
  id: string;
  category: TemplateCategory;
  locale: Locale;
  factor?: Factor;
  band?: TemplateBand;
  text: string;
  pattern: string;
  slotNames: string[];
};

