"use client";

import React from "react";
import { SectorTag } from "@/components/shortlist/sector-tag";
import { DataBadge } from "@/components/ui/data-badge";
import { formatCrore, formatPrice, formatSignedPercent } from "@/lib/engine/format";
import type { Freshness } from "@/lib/data/provenance";

export interface StockHeaderProps {
  ticker: string;
  name: string;
  sector: string;
  sectorId?: string;
  latestClose: number;
  oneSessionMovePct: number;
  marketCapCr?: number;
  asOf: string;
  sourceLabel?: string;
  freshness?: Freshness;
  isTailExpired?: boolean;
  isMonthlyExpired?: boolean;
  className?: string;
}

export function StockHeader({
  ticker,
  name,
  sector,
  sectorId,
  latestClose,
  oneSessionMovePct,
  marketCapCr,
  asOf,
  sourceLabel = "BSE / NSE",
  freshness = "current",
  isTailExpired = false,
  isMonthlyExpired = false,
  className = "",
}: StockHeaderProps) {
  const isPositive = oneSessionMovePct > 0;
  const isNegative = oneSessionMovePct < 0;

  return (
    <div className={`p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs ${className}`}>
      {/* Expired / Fallback Alerts */}
      {isMonthlyExpired && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Monthly series expired. Valuation metrics are disabled for fit and shown for historical study only.</span>
        </div>
      )}

      {isTailExpired && !isMonthlyExpired && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>Recent daily price tail expired. Price displayed reflects latest available monthly close.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Company Identity */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              {name}
            </h1>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {ticker}
            </span>
            <SectorTag sector={sector} id={sectorId} size="sm" />
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <DataBadge
              asOf={asOf}
              sourceLabel={sourceLabel}
              freshness={freshness}
            />
            {marketCapCr !== undefined && (
              <span className="tabular-nums font-mono">
                M-Cap: ₹{formatCrore(marketCapCr)} Cr
              </span>
            )}
          </div>
        </div>

        {/* Right: Price & Move */}
        <div className="flex md:flex-col md:items-end justify-between items-center border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100 dark:border-zinc-800">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
            ₹{formatPrice(latestClose)}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold tabular-nums ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                  : isNegative
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {isPositive && "▲ "}
              {isNegative && "▼ "}
              {formatSignedPercent(oneSessionMovePct)}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              1-session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
