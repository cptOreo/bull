"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Freshness, FreshnessKind } from "@/lib/data/provenance";
import { badgeFor } from "@/lib/data/provenance";

export interface DataBadgeProps extends React.HTMLAttributes<HTMLAnchorElement> {
  asOf: string;
  sourceLabel?: string;
  kind?: FreshnessKind;
  now?: string;
  freshness?: Freshness;
  text?: string;
  detail?: string | null;
  href?: string;
  className?: string;
}

export function DataBadge({
  asOf,
  sourceLabel = "Audited filings",
  kind = "financials",
  now,
  freshness,
  text,
  detail,
  href = "/method",
  className = "",
  ...props
}: DataBadgeProps) {
  const safeNow = now || new Date().toISOString();
  const calculated = badgeFor(asOf, kind, safeNow, sourceLabel);
  const effectiveFreshness: Freshness = freshness ?? calculated.freshness;
  const displayText = text ?? `As of ${asOf} · ${sourceLabel}`;
  const displayDetail = detail ?? calculated.detail;

  const colorStyles: Record<Freshness, { dot: string; badge: string }> = {
    current: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
    },
    stale: {
      dot: "bg-amber-500",
      badge: "amber bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
    },
    expired: {
      dot: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
    },
  };

  const currentStyle = colorStyles[effectiveFreshness] || colorStyles.current;

  return (
    <Link
      href={href}
      data-testid="data-badge"
      title={displayDetail ?? displayText}
      aria-label={`Data provenance: ${displayText}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500",
        currentStyle.badge,
        className
      )}
      {...props}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentStyle.dot)} />
      <span className="truncate">{displayText}</span>
      <svg
        className="w-3 h-3 opacity-60 ml-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </Link>
  );
}

export default DataBadge;
