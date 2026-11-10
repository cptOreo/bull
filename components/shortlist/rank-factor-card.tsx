"use client";

import React from "react";
import type { Factor } from "@/lib/engine/types";

export interface FactorBreakdownItem {
  factor: Factor | "quality" | "valuation" | "stability" | "alignment";
  label: string;
  score: number; // 0 to 1 or 0 to 10
  weight: number; // 0 to 1
  description: string;
}

export interface RankFactorCardProps {
  ticker?: string;
  name?: string;
  factors?: FactorBreakdownItem[];
  className?: string;
}

const DEFAULT_FACTORS: FactorBreakdownItem[] = [
  {
    factor: "quality",
    label: "Financial Quality",
    score: 8.5,
    weight: 0.35,
    description: "Evaluates return on equity (ROE), operating cash flows, and balance sheet solvency.",
  },
  {
    factor: "valuation",
    label: "Valuation & Margin of Safety",
    score: 7.2,
    weight: 0.25,
    description: "Relative P/E and P/B percentile compared to historical bands and industry peers.",
  },
  {
    factor: "stability",
    label: "Risk & Resilience",
    score: 8.0,
    weight: 0.20,
    description: "Downside cushion, historical drawdown limit, and low annualized price volatility.",
  },
  {
    factor: "alignment",
    label: "Profile Alignment",
    score: 9.0,
    weight: 0.20,
    description: "Direct match with stated investment horizon, risk comfort, and primary financial goal.",
  },
];

export function RankFactorCard({
  ticker,
  name,
  factors = DEFAULT_FACTORS,
  className = "",
}: RankFactorCardProps) {
  return (
    <div
      role="region"
      aria-label={`Multi-factor ranking breakdown ${ticker ? `for ${ticker}` : ""}`}
      className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs ${className}`}
    >
      <div className="pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              Multi-Factor Analysis · Invariant 2 Enforced
            </span>
            <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
              Factor Contribution Breakdown {name ? `${name} (${ticker})` : ticker ? `(${ticker})` : ""}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            No single composite grade
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Stocks are ranked across multidimensional vectors rather than compressed into a misleading single score.
        </p>
      </div>

      <div className="space-y-4">
        {factors.map((item) => {
          // Normalize score to percentage 0-100
          const pct = item.score <= 1 ? item.score * 100 : item.score <= 10 ? item.score * 10 : item.score;
          const weightPct = Math.round(item.weight * 100);

          return (
            <div key={item.factor} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                  <span className="text-zinc-400">Weight: {weightPct}%</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500 italic">
        * Rankings reflect relative alignment to the stated investor profile, not absolute guarantees or buy recommendations.
      </div>
    </div>
  );
}
