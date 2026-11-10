import { z } from "zod";

/**
 * `Dated<T>` is the provenance unit from §10.2. Every number the UI can
 * display sits inside one. `value` may be null, and then `note` is required
 * and the UI renders "Not available" with that note.
 *
 * The schema is a factory so that `Dated<boolean>`, `Dated<string>` and
 * `Dated<PriceSeries>` are all checked at parse time.
 */
export type Dated<T> = {
  value: T | null;
  asOf: string;
  source: string;
  note?: string;
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date, expected YYYY-MM-DD");

const isoInstant = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    "Invalid instant, expected ISO 8601 with an offset",
  );

export function DatedSchema<T extends z.ZodTypeAny>(inner: T) {
  return z.strictObject({
    value: inner.nullable(),
    asOf: isoDate,
    source: z.string().min(1),
    note: z.string().min(1).optional(),
  });
}

export const datedSchema = DatedSchema;

export { isoDate, isoInstant };

export const sourceSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().regex(/^https:\/\//, "Source URL must be https").nullable(),
  retrievedAt: isoInstant,
  method: z.enum(["manual_transcription", "api", "derived"]),
  licence: z.enum(["personal_research", "public_licence", "derived"]),
  note: z.string().nullable(),
});
export type Source = z.infer<typeof sourceSchema>;

const closePointSchema = z.strictObject({
  date: isoDate,
  close: z.number().positive("A close must be positive"),
});

export const priceSeriesSchema = z.strictObject({
  currency: z.literal("INR"),
  granularity: z.enum(["monthly_close", "daily_close"]),
  points: z.array(closePointSchema).min(2),
});
export type PriceSeries = z.infer<typeof priceSeriesSchema>;

export const sectorSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: DatedSchema(z.string().min(1)),
  medianPe: DatedSchema(z.number().positive()),
  medianPb: DatedSchema(z.number().positive()),
});
export type Sector = z.infer<typeof sectorSchema>;

const indexPriceBlockSchema = z.strictObject({
  granularity: z.enum(["monthly_close", "daily_close"]),
  points: z.array(closePointSchema).min(12),
});

export const indexSeriesSchema = z.strictObject({
  id: z.literal("NIFTY50"),
  name: z.string().min(1),
  prices: DatedSchema(indexPriceBlockSchema),
});
export type IndexSeries = z.infer<typeof indexSeriesSchema>;

export const newsItemSchema = z.strictObject({
  id: z.string().min(1),
  ticker: z.string().min(1).nullable(),
  headline: z.string().min(1),
  summary: z.string().min(20, "A summary must be at least 20 characters").max(280, "A summary must be at most 280 characters"),
  publishedAt: isoInstant,
  sourceName: z.string().min(1),
  sourceUrl: z.string().regex(/^https:\/\//, "News source URL must be https"),
  kind: z.enum(["fact", "commentary", "announcement"]),
  sourceId: z.string().min(1),
});
export type NewsItem = z.infer<typeof newsItemSchema>;

export const exclusionSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  reason: z.string().min(1),
  asOf: isoDate,
  sourceId: z.string().min(1),
});
export type Exclusion = z.infer<typeof exclusionSchema>;

export const corporateActionSchema = z.strictObject({
  id: z.string().min(1),
  type: z.enum(["merger", "demerger", "split", "bonus", "rights", "delisting", "rename"]),
  effectiveDate: isoDate,
  listingDate: isoDate.nullable(),
  description: z.string().min(1),
  successorTickers: z.array(z.string().min(1)),
  sourceId: z.string().min(1),
});
export type CorporateAction = z.infer<typeof corporateActionSchema>;

export const financialYearSchema = z.strictObject({
  fy: z.string().regex(/^FY\d{4}$/, "Invalid financial year label"),
  periodEnd: isoDate,
  sourceId: z.string().min(1),
  revenueCr: z.number().positive("Revenue must be positive"),
  ebitdaCr: z.number(),
  ebitCr: z.number(),
  patCr: z.number(),
  epsInr: z.number().nonnegative(),
  dpsInr: z.number().nonnegative(),
  netWorthCr: z.number(),
  totalDebtCr: z.number().nonnegative(),
  interestExpenseCr: z.number().nonnegative(),
  operatingCashFlowCr: z.number(),
  sharesOutstandingCr: z.number().nonnegative(),
});
export type FinancialYear = z.infer<typeof financialYearSchema>;

export const financialsSchema = z.strictObject({
  currency: z.literal("INR"),
  units: z.literal("crore"),
  basis: z.enum(["consolidated", "standalone"]),
  annual: DatedSchema(z.array(financialYearSchema)),
});
export type Financials = z.infer<typeof financialsSchema>;

export const stockSchema = z.strictObject({
  ticker: z.string().regex(/^[A-Z0-9&-]{2,15}$/, "Invalid ticker"),
  name: z.string().min(1),
  isin: z.string().regex(/^IN[A-Z0-9]{10}$/, "Invalid ISIN"),
  sectorId: z.string().min(1),
  sectorModel: z.enum(["non_financial", "financial"]),
  nifty50Member: DatedSchema(z.boolean()),
  businessSummary: DatedSchema(z.string().min(1).max(240, "A business summary must be at most 240 characters")),
  segments: DatedSchema(z.array(z.string().min(1))),
  prices: DatedSchema(priceSeriesSchema),
  recentPrices: DatedSchema(priceSeriesSchema),
  financials: financialsSchema,
  corporateActions: z.array(corporateActionSchema),
});
export type Stock = z.infer<typeof stockSchema>;

/**
 * The base object is exported separately so the refinements in Task 6 can be
 * layered on top without rewriting the shape.
 */
export const baseSnapshotSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  snapshotId: z.string().regex(/^\d{4}-\d{2}-\d{2}\.\d+$/, "Invalid snapshot id"),
  generatedAt: isoInstant,
  generatedBy: z.enum(["manual_transcription", "api"]),
  note: z.string().min(1),
  sources: z.array(sourceSchema),
  index: indexSeriesSchema,
  sectors: z.array(sectorSchema),
  stocks: z.array(stockSchema),
  news: z.array(newsItemSchema),
  exclusions: z.array(exclusionSchema),
});

export const snapshotSchema = baseSnapshotSchema.superRefine(refineSnapshot);

type SnapshotShape = z.infer<typeof baseSnapshotSchema>;

const DATE_FIELDS = new Set(["asOf", "publishedAt", "periodEnd", "effectiveDate", "listingDate"]);

function addIssue(ctx: z.RefinementCtx, path: (string | number)[], message: string) {
  ctx.addIssue({ code: "custom", path, message });
}

/** Every §10.8 refinement, in table order. */
export function refineSnapshot(snap: SnapshotShape, ctx: z.RefinementCtx) {
  const sourceIds = new Set(snap.sources.map((s) => s.id));
  const generatedAtDate = snap.generatedAt.slice(0, 10);

  // Tickers and ISINs are unique.
  const tickers = new Set<string>();
  const isins = new Set<string>();
  snap.stocks.forEach((stock, index) => {
    if (tickers.has(stock.ticker) || isins.has(stock.isin)) {
      addIssue(ctx, ["stocks", index], "Duplicate stock identity");
    }
    tickers.add(stock.ticker);
    isins.add(stock.isin);
  });

  // Every source and sourceId exists in sources[].
  const usedSources: Array<{ path: (string | number)[]; id: string }> = [];
  snap.stocks.forEach((stock, si) => {
    usedSources.push({ path: ["stocks", si, "nifty50Member", "source"], id: stock.nifty50Member.source });
    usedSources.push({ path: ["stocks", si, "businessSummary", "source"], id: stock.businessSummary.source });
    usedSources.push({ path: ["stocks", si, "segments", "source"], id: stock.segments.source });
    usedSources.push({ path: ["stocks", si, "prices", "source"], id: stock.prices.source });
    usedSources.push({ path: ["stocks", si, "recentPrices", "source"], id: stock.recentPrices.source });
    usedSources.push({ path: ["stocks", si, "financials", "annual", "source"], id: stock.financials.annual.source });
    stock.financials.annual.value?.forEach((year, yi) => {
      usedSources.push({ path: ["stocks", si, "financials", "annual", "value", yi, "sourceId"], id: year.sourceId });
    });
    stock.corporateActions.forEach((action, ai) => {
      usedSources.push({ path: ["stocks", si, "corporateActions", ai, "sourceId"], id: action.sourceId });
    });
  });
  snap.sectors.forEach((sector, si) => {
    usedSources.push({ path: ["sectors", si, "description", "source"], id: sector.description.source });
    usedSources.push({ path: ["sectors", si, "medianPe", "source"], id: sector.medianPe.source });
    usedSources.push({ path: ["sectors", si, "medianPb", "source"], id: sector.medianPb.source });
  });
  usedSources.push({ path: ["index", "prices", "source"], id: snap.index.prices.source });
  snap.news.forEach((item, ni) => usedSources.push({ path: ["news", ni, "sourceId"], id: item.sourceId }));
  snap.exclusions.forEach((item, ei) => usedSources.push({ path: ["exclusions", ei, "sourceId"], id: item.sourceId }));

  for (const used of usedSources) {
    if (!sourceIds.has(used.id)) addIssue(ctx, used.path, `Unknown source: ${used.id}`);
  }

  // A Dated value of null has a non-empty note; nothing is dated in the future.
  const walk = (node: unknown, path: (string | number)[]) => {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, [...path, i]));
      return;
    }
    const record = node as Record<string, unknown>;
    if ("value" in record && "asOf" in record && "source" in record) {
      if (record.value === null && (typeof record.note !== "string" || record.note.trim() === "")) {
        addIssue(ctx, [...path, "value"], "Missing null explanation");
      }
    }
    for (const [key, child] of Object.entries(record)) {
      if (DATE_FIELDS.has(key) && typeof child === "string" && child.slice(0, 10) > generatedAtDate) {
        addIssue(ctx, [...path, key], "Future-dated or mislabelled value");
      }
      walk(child, [...path, key]);
    }
  };
  walk(snap, []);

  // Financial history: exactly five ascending, contiguous years; block asOf is the latest periodEnd.
  snap.stocks.forEach((stock, si) => {
    const years = stock.financials.annual.value;
    const path = ["stocks", si, "financials", "annual", "value"] as (string | number)[];
    if (!years || years.length !== 5) {
      addIssue(ctx, path, "Financial history incomplete: exactly five annual periods are required");
      return;
    }
    const expected = [2022, 2023, 2024, 2025, 2026];
    years.forEach((year, yi) => {
      const yearNumber = Number(year.fy.slice(2));
      if (yearNumber !== expected[yi]) {
        addIssue(ctx, [...path, yi, "fy"], "Financial history incomplete: years must be FY2022 to FY2026, oldest first");
      }
      if (year.periodEnd.slice(0, 4) !== String(expected[yi])) {
        addIssue(ctx, [...path, yi, "periodEnd"], "Financial history incomplete: periodEnd does not match the FY label");
      }
    });
    const latest = years[years.length - 1].periodEnd;
    if (stock.financials.annual.asOf !== latest) {
      addIssue(ctx, ["stocks", si, "financials", "annual", "asOf"], "Future-dated or mislabelled value: financials asOf must equal the latest periodEnd");
    }
  });

  // Price granularity, ordering, contiguity and endpoint identity.
  snap.stocks.forEach((stock, si) => {
    const monthly = stock.prices.value;
    const recent = stock.recentPrices.value;
    if (!monthly || !recent) {
      addIssue(ctx, ["stocks", si, "prices", "value"], "Price series invalid");
      return;
    }
    if (monthly.granularity !== "monthly_close" || recent.granularity !== "daily_close") {
      addIssue(ctx, ["stocks", si, "prices", "value", "granularity"], "Price series granularity invalid");
    }
    const points = monthly.points;
    if (points.length < 12) {
      addIssue(ctx, ["stocks", si, "prices", "value", "points"], "Price series invalid: at least 12 monthly points are required");
    }
    const months = new Set<string>();
    for (let i = 0; i < points.length; i += 1) {
      const month = points[i].date.slice(0, 7);
      if (months.has(month)) {
        addIssue(ctx, ["stocks", si, "prices", "value", "points", i, "date"], "Price series invalid: duplicate month");
      }
      months.add(month);
      if (i > 0 && points[i].date <= points[i - 1].date) {
        addIssue(ctx, ["stocks", si, "prices", "value", "points", i, "date"], "Price series invalid: dates must be ascending");
      }
    }
    if (points[points.length - 1]?.date !== stock.prices.asOf) {
      addIssue(ctx, ["stocks", si, "prices", "asOf"], "Price series invalid: the last point date must equal asOf");
    }

    const daily = recent.points;
    const dailyPath = ["stocks", si, "recentPrices", "value", "points"] as (string | number)[];
    if (daily.length < 10 || daily.length > 30) {
      addIssue(ctx, dailyPath, "Recent price series invalid: 10 to 30 daily points are required");
    }
    const days = new Set<string>();
    for (let i = 0; i < daily.length; i += 1) {
      if (days.has(daily[i].date)) {
        addIssue(ctx, [...dailyPath, i, "date"], "Recent price series invalid: duplicate trading day");
      }
      days.add(daily[i].date);
      if (i > 0 && daily[i].date <= daily[i - 1].date) {
        addIssue(ctx, [...dailyPath, i, "date"], "Recent price series invalid: dates must be ascending");
      }
    }
    if (daily[daily.length - 1]?.date !== stock.recentPrices.asOf) {
      addIssue(ctx, ["stocks", si, "recentPrices", "asOf"], "Recent price series invalid: the last point date must equal asOf");
    }
    if (stock.recentPrices.asOf >= generatedAtDate) {
      addIssue(ctx, ["stocks", si, "recentPrices", "asOf"], "Recent price series invalid: the last session must be completed before generatedAt");
    }
    if (stock.recentPrices.asOf < stock.prices.asOf) {
      addIssue(ctx, ["stocks", si, "recentPrices", "asOf"], "Recent series predates the monthly series");
    }
  });

  // Covered stocks need dated sector valuations.
  const sectorsById = new Map(snap.sectors.map((sector) => [sector.id, sector]));
  snap.stocks.forEach((stock, si) => {
    const sector = sectorsById.get(stock.sectorId);
    if (!sector) {
      addIssue(ctx, ["stocks", si, "sectorId"], `Unknown sector: ${stock.sectorId}`);
      return;
    }
    if (sector.medianPe.value === null || sector.medianPb.value === null) {
      addIssue(ctx, ["sectors"], "Sector valuation missing: every covered sector needs medianPe and medianPb");
    }
  });

  // Stock and index windows start within 31 days of each other.
  const indexStart = snap.index.prices.value?.points[0]?.date;
  if (indexStart) {
    snap.stocks.forEach((stock, si) => {
      const start = stock.prices.value?.points[0]?.date;
      if (!start) return;
      const gapDays = Math.abs(Date.parse(start) - Date.parse(indexStart)) / 86_400_000;
      if (gapDays > 31) addIssue(ctx, ["stocks", si, "prices", "value", "points", 0], "Series not comparable: windows start more than 31 days apart");
    });
  }

  // At most one corporate action of each type per stock per year.
  snap.stocks.forEach((stock, si) => {
    const seen = new Set<string>();
    stock.corporateActions.forEach((action, ai) => {
      const key = `${action.type}:${action.effectiveDate.slice(0, 4)}`;
      if (seen.has(key)) {
        addIssue(ctx, ["stocks", si, "corporateActions", ai], "Duplicate corporate action");
      }
      seen.add(key);
    });
  });
}

export type Snapshot = z.infer<typeof baseSnapshotSchema>;

