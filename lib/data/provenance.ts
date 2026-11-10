import { formatDate, istDate } from "../engine/format";

export type FreshnessKind = "price" | "monthly_price" | "financials" | "news" | "static";
export type Freshness = "current" | "stale" | "expired";

/** Thresholds in calendar days from §10.7. `staleMax` is inclusive. */
export const FRESHNESS_THRESHOLDS: Record<FreshnessKind, { currentMax: number; staleMax: number }> = {
  price: { currentMax: 4, staleMax: 30 },
  monthly_price: { currentMax: 45, staleMax: 75 },
  financials: { currentMax: 400, staleMax: 550 },
  news: { currentMax: 30, staleMax: 90 },
  static: { currentMax: Number.POSITIVE_INFINITY, staleMax: Number.POSITIVE_INFINITY },
};

/** Whole IST calendar days from `asOf` to the instant `now`. Never negative. */
export function daysBetween(asOf: string, now: string): number {
  const from = Date.parse(`${asOf.slice(0, 10)}T00:00:00+05:30`);
  const to = Date.parse(`${istDate(now)}T00:00:00+05:30`);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

export function freshness(asOf: string, kind: FreshnessKind, now: string): Freshness {
  const age = daysBetween(asOf, now);
  const { currentMax, staleMax } = FRESHNESS_THRESHOLDS[kind];
  if (age <= currentMax) return "current";
  if (age <= staleMax) return "stale";
  return "expired";
}

export type DataBadge = {
  asOf: string;
  sourceLabel: string;
  freshness: Freshness;
  text: string;
  detail: string | null;
};

const EXPIRED_DETAIL: Partial<Record<FreshnessKind, string>> = {
  price: "This session is old; the figures shown use the latest monthly close.",
  monthly_price: "This figure is too old to use for fit. It is shown for learning only.",
  financials: "This figure is too old to use for fit. It is shown for learning only.",
  news: "This item is too old to show as recent.",
};

export function badgeFor(
  asOf: string,
  kind: FreshnessKind,
  now: string,
  sourceLabel: string,
): DataBadge {
  const state = freshness(asOf, kind, now);
  const age = daysBetween(asOf, now);
  let detail: string | null = null;
  if (state === "stale") {
    detail = `This figure is ${age} days old. Prices may have moved since.`;
  } else if (state === "expired") {
    detail = EXPIRED_DETAIL[kind] ?? null;
  }
  return {
    asOf,
    sourceLabel,
    freshness: state,
    text: `As of ${formatDate(asOf)} · ${sourceLabel}`,
    detail,
  };
}

/** The fixed explainer from §10.7, shown in /method and the first badge popover. */
export const WHY_DATED =
  "Bull reads one saved file so that every number can be checked. The file was built on 10 November 2026 from Screener.in and Google Finance, by hand. Markets move every day, so treat these figures as a dated snapshot, not today's price. The date on each figure tells you how old it is.";
