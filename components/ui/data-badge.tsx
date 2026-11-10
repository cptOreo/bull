import React from "react";
import type { FreshnessKind } from "@/lib/data/provenance";
import { badgeFor } from "@/lib/data/provenance";

export interface DataBadgeProps {
  asOf: string;
  kind?: FreshnessKind;
  sourceLabel?: string;
  now?: string;
  className?: string;
}

/**
 * DataBadge renders the date and source with green/amber/red freshness styling.
 * Stale figures apply an amber indicator.
 */
export function DataBadge({
  asOf,
  kind = "financials",
  sourceLabel = "Audited filings",
  now = new Date().toISOString(),
  className = "",
}: DataBadgeProps) {
  const badge = badgeFor(asOf, kind, now, sourceLabel);

  const freshnessStyles = {
    current: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    stale: "amber bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    expired: "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  };

  return (
    <a
      href="/method"
      title={badge.detail ?? badge.text}
      aria-label={`Data provenance: ${badge.text}`}
      data-testid="data-badge"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border transition-colors hover:underline ${
        freshnessStyles[badge.freshness]
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          badge.freshness === "current"
            ? "bg-emerald-500"
            : badge.freshness === "stale"
            ? "bg-amber-500"
            : "bg-rose-500"
        }`}
      />
      <span>{badge.text}</span>
    </a>
  );
}

export default DataBadge;
