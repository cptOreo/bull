import React from "react";
import Link from "next/link";
import { SectorTag } from "./sector-tag";
import { FactorBars } from "./factor-bars";
import { DataBadge } from "@/components/ui/data-badge";
import type { FactorBar } from "@/lib/engine/types";

export interface ShortlistCardProps {
  ticker: string;
  name: string;
  sectorName: string;
  sectorId?: string;
  businessDescription: string;
  reasons: string[];
  riskSentence: string;
  factorBars: FactorBar[];
  asOf: string;
  sourceLabel?: string;
  onCompare?: (ticker: string) => void;
  className?: string;
}

export function ShortlistCard({
  ticker,
  name,
  sectorName,
  sectorId,
  businessDescription,
  reasons,
  riskSentence,
  factorBars,
  asOf,
  sourceLabel = "BSE / Screener.in",
  onCompare,
  className = "",
}: ShortlistCardProps) {
  return (
    <article
      role="article"
      aria-label={`Shortlist card for ${name} (${ticker})`}
      className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all ${className}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-serif font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                {name}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {ticker}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
              {businessDescription}
            </p>
          </div>

          <SectorTag sector={sectorName} id={sectorId} size="sm" />
        </div>

        {/* Data Badge */}
        <div className="mb-4">
          <DataBadge asOf={asOf} sourceLabel={sourceLabel} />
        </div>

        {/* Fit Reasons (Invariant: 2 reasons) */}
        <div className="space-y-2 mb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Why this fits your profile
          </span>
          <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            {reasons.slice(0, 2).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mandatory Risk Sentence */}
        <div className="mb-4 p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">⚠</span>
            <div className="space-y-0.5">
              <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Identified Risk Point
              </span>
              <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {riskSentence}
              </p>
            </div>
          </div>
        </div>

        {/* Factor Bars (Top 3) - No composite score displayed! */}
        <div className="mb-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
            Multi-Factor Drivers (No composite score)
          </span>
          <FactorBars factorBars={factorBars} maxBars={3} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${ticker}`}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1"
          >
            See details &rarr;
          </Link>
          <Link
            href={`/academy`}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
          >
            Learn the ratio
          </Link>
        </div>

        {onCompare && (
          <button
            type="button"
            onClick={() => onCompare(ticker)}
            className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] transition-colors cursor-pointer"
          >
            Compare
          </button>
        )}
      </div>
    </article>
  );
}
