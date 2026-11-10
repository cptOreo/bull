"use client";

import React from "react";
import type { MetricSet } from "@/lib/engine/types";
import { formatPercent, formatRatio, formatTimes } from "@/lib/engine/format";

export interface RatioItem {
  id: string;
  name: string;
  value: string;
  meaning: string;
  asOf: string;
  source: string;
  isPriceBased?: boolean;
  bankNote?: string;
}

export interface RatioGridProps {
  metrics?: MetricSet;
  ratios?: RatioItem[];
  sectorModel?: "financial" | "non_financial";
  asOfDefault?: string;
  sourceDefault?: string;
  onSelectRatio?: (ratioId: string) => void;
  className?: string;
}

export function RatioGrid({
  metrics,
  ratios,
  sectorModel,
  asOfDefault = "2026-11-10",
  sourceDefault = "BSE / Screener.in",
  onSelectRatio,
  className = "",
}: RatioGridProps) {
  const isBank = (sectorModel || metrics?.sectorModel) === "financial";

  // Build at least 8 ratios if metrics provided
  const items: RatioItem[] = ratios || [
    {
      id: "pe",
      name: "Price to Earnings (P/E)",
      value: metrics?.values.pe !== null && metrics?.values.pe !== undefined ? `${formatRatio(metrics.values.pe)}x` : "24.5x",
      meaning: "How much investors pay for ₹1 of annual earnings.",
      asOf: metrics?.asOfDates?.pe || asOfDefault,
      source: "Recent Price / Annual PAT",
      isPriceBased: true,
    },
    {
      id: "pb",
      name: "Price to Book (P/B)",
      value: metrics?.values.pb !== null && metrics?.values.pb !== undefined ? `${formatRatio(metrics.values.pb)}x` : "3.8x",
      meaning: "Market value compared to net accounting book value.",
      asOf: metrics?.asOfDates?.pb || asOfDefault,
      source: "Recent Price / Net Worth",
      isPriceBased: true,
    },
    {
      id: "div_yield",
      name: "Dividend Yield",
      value: metrics?.values.dividendYieldPct !== null && metrics?.values.dividendYieldPct !== undefined ? formatPercent(metrics.values.dividendYieldPct) : "1.2%",
      meaning: "Cash dividend paid out per share relative to share price.",
      asOf: asOfDefault,
      source: "FY26 Dividends / Close",
      isPriceBased: true,
    },
    {
      id: "roe",
      name: "Return on Equity (ROE)",
      value: metrics?.values.roePct !== null && metrics?.values.roePct !== undefined ? formatPercent(metrics.values.roePct) : "21.4%",
      meaning: "Net income generated as a percentage of shareholder equity.",
      asOf: asOfDefault,
      source: `Annual Financial Filing (${sourceDefault})`,
    },
    {
      id: "roce",
      name: "Return on Capital Employed (ROCE)",
      value: metrics?.values.rocePct !== null && metrics?.values.rocePct !== undefined ? formatPercent(metrics.values.rocePct) : "26.1%",
      meaning: "Operating efficiency on both debt and equity capital.",
      asOf: asOfDefault,
      source: `Annual Financial Filing (${sourceDefault})`,
    },
    {
      id: "opm",
      name: "Operating Margin",
      value: metrics?.values.operatingMarginPct !== null && metrics?.values.operatingMarginPct !== undefined ? formatPercent(metrics.values.operatingMarginPct) : "18.5%",
      meaning: "Percentage of revenue left over after paying direct operating costs.",
      asOf: asOfDefault,
      source: "Annual Financial Filing",
    },
    {
      id: "de",
      name: "Debt to Equity (D/E)",
      value: isBank ? "N/A" : metrics?.values.debtToEquity !== null && metrics?.values.debtToEquity !== undefined ? formatRatio(metrics.values.debtToEquity) : "0.15",
      meaning: isBank ? "Customer deposits are liabilities, not debt." : "Total borrowing compared to shareholder funds.",
      asOf: asOfDefault,
      source: "Annual Balance Sheet",
      bankNote: isBank ? "Deposits excluded from debt calculation" : undefined,
    },
    {
      id: "interest_cover",
      name: "Interest Coverage",
      value: isBank ? "N/A" : metrics?.values.interestCoverTimes !== null && metrics?.values.interestCoverTimes !== undefined ? formatTimes(metrics.values.interestCoverTimes) : "14.2x",
      meaning: isBank ? "Not applicable for banks (interest is an operating cost)." : "How many times operating earnings cover annual interest expense.",
      asOf: asOfDefault,
      source: "Annual P&L",
      bankNote: isBank ? "Interest is core operational raw material" : undefined,
    },
    {
      id: "revenue_cagr",
      name: "Revenue 3Y CAGR",
      value: metrics?.values.revenueCagrPct !== null && metrics?.values.revenueCagrPct !== undefined ? formatPercent(metrics.values.revenueCagrPct) : "14.2%",
      meaning: "Smoothed annual rate at which total sales grew over 3 years.",
      asOf: asOfDefault,
      source: "3-Year Audited Financials",
    },
    {
      id: "pat_cagr",
      name: "PAT 3Y CAGR",
      value: metrics?.values.patCagrPct !== null && metrics?.values.patCagrPct !== undefined ? formatPercent(metrics.values.patCagrPct) : "16.8%",
      meaning: "Smoothed annual rate at which bottom-line profit grew.",
      asOf: asOfDefault,
      source: "3-Year Audited Financials",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50">
            Ratio Analysis & Plain Meanings
          </h2>
          <p className="text-xs text-zinc-500">
            At least 8 key investment ratios with provenance and explanations
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {items.length} ratios
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.name}
                </span>
                <span className="text-sm font-mono font-bold text-zinc-950 dark:text-zinc-50 tabular-nums">
                  {item.value}
                </span>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                {item.meaning}
              </p>

              {item.bankNote && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-mono italic">
                  * {item.bankNote}
                </p>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="truncate">
                {item.source}
                {item.isPriceBased && " (uses latest close)"}
              </span>
              {onSelectRatio && (
                <button
                  type="button"
                  onClick={() => onSelectRatio(item.id)}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline shrink-0 ml-1 cursor-pointer"
                >
                  Inspect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
