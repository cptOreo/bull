<<<<<<< HEAD
"use client";

import React, { useState } from "react";
import type { Freshness, FreshnessKind } from "@/lib/data/provenance";
import { badgeFor, WHY_DATED } from "@/lib/data/provenance";

export interface DataBadgeProps {
  asOf: string;
  sourceLabel?: string;
  kind?: FreshnessKind;
  now?: string;
  freshness?: Freshness;
  text?: string;
  detail?: string | null;
  className?: string;
=======
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Freshness } from "@/lib/data/provenance";

export interface DataBadgeProps extends React.HTMLAttributes<HTMLAnchorElement> {
  asOf: string;
  freshness?: Freshness;
  sourceLabel?: string;
  href?: string;
>>>>>>> subagent-Batch-12-Implementer-self-78083b73
}

export function DataBadge({
  asOf,
<<<<<<< HEAD
  sourceLabel = "Audited filings",
  kind = "financials",
  now,
  freshness,
  text,
  detail,
  className = "",
}: DataBadgeProps) {
  const [open, setOpen] = useState(false);

  const safeNow = now || new Date().toISOString();
  const calculated = badgeFor(asOf, kind, safeNow, sourceLabel);
  const effectiveFreshness: Freshness = freshness ?? calculated.freshness;
  const displayText = text ?? calculated.text;
  const displayDetail = detail ?? calculated.detail;

  const colorStyles: Record<Freshness, { dot: string; badge: string; text: string }> = {
    current: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
      text: "Current snapshot data",
    },
    stale: {
      dot: "bg-amber-500",
      badge: "amber bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
      text: "Potentially stale data",
    },
    expired: {
      dot: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
      text: "Expired data (learning only)",
    },
  };

  const currentStyle = colorStyles[effectiveFreshness] || colorStyles.current;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        data-testid="data-badge"
        aria-expanded={open}
        aria-haspopup="dialog"
        title={displayDetail ?? displayText}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${currentStyle.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentStyle.dot}`} />
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
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Data Provenance Note"
            className="absolute left-0 mt-2 z-50 w-72 sm:w-80 p-3.5 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentStyle.dot}`} />
                {currentStyle.text}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {displayDetail && (
              <p className="mb-2 font-medium text-amber-700 dark:text-amber-400">
                {displayDetail}
              </p>
            )}

            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
              {WHY_DATED}
            </p>

            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>As of: {asOf}</span>
              <span>Source: {sourceLabel}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DataBadge;
=======
  freshness = "current",
  sourceLabel,
  href = "/method",
  className,
  ...props
}: DataBadgeProps) {
  const statusStyles: Record<Freshness, { dot: string; text: string; bg: string }> = {
    current: {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60",
    },
    stale: {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60",
    },
    expired: {
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-300",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/60",
    },
  };

  const style = statusStyles[freshness];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        style.bg,
        style.text,
        className
      )}
      title={sourceLabel ? `Source: ${sourceLabel} (as of ${asOf})` : `As of ${asOf}`}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} aria-hidden="true" />
      <span>As of {asOf}</span>
      {sourceLabel && <span className="opacity-75">· {sourceLabel}</span>}
    </Link>
  );
}
>>>>>>> subagent-Batch-12-Implementer-self-78083b73
