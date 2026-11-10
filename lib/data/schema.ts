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

/** Alias replaced in Task 6 by `baseSnapshotSchema.superRefine(refineSnapshot)`. */
export const snapshotSchema = baseSnapshotSchema;

export type Snapshot = z.infer<typeof baseSnapshotSchema>;

