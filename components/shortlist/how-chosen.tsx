"use client";

import React, { useState } from "react";
import type { HowChosenView, Factor } from "@/lib/engine/types";

export interface HowChosenProps {
  howChosen?: Partial<HowChosenView>;
  className?: string;
}

const DEFAULT_HOW_CHOSEN: HowChosenView = {
  weights: {
    quality: 0.35,
    growth: 0.15,
    valuation: 0.25,
    income: 0.05,
    stability: 0.20,
    simplicity: 0.0,
  },
  anchorsSummary: "Anchored to historical Nifty 50 medians and cross-sector balance sheets.",
  sectorCap: 2,
  threshold: 0.40,
};

const FACTOR_NAMES: Record<Factor, string> = {
  quality: "Quality (ROE/Debt)",
  growth: "Growth (Sales/Profit)",
  valuation: "Valuation (P/E, P/B)",
  income: "Income (Dividends)",
  stability: "Stability (Drawdown)",
  simplicity: "Simplicity (Purity)",
};

export function HowChosen({
  howChosen = DEFAULT_HOW_CHOSEN,
  className = "",
}: HowChosenProps) {
  const [isOpen, setIsOpen] = useState(false);

  const data: HowChosenView = {
    ...DEFAULT_HOW_CHOSEN,
    ...howChosen,
    weights: {
      ...DEFAULT_HOW_CHOSEN.weights,
      ...(howChosen.weights || {}),
    },
  };

  return (
    <div
      role="region"
      aria-label="How shortlist companies were chosen"
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              How these companies were chosen
            </h3>
            <p className="text-[11px] text-zinc-500">
              Deterministic multi-factor weights, sector diversity caps, and qualification thresholds
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-400">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 text-xs space-y-3 animate-in fade-in duration-150">
          {/* Rules and Anchors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                Diversity & Sector Cap
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                Max {data.sectorCap} companies per sector enforced. Prevents over-concentration in any single industry.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                Qualification Bar
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                Minimum composite threshold: {Math.round(data.threshold * 100)}%. Companies failing this bar are excluded.
              </p>
            </div>
          </div>

          {/* Factor Weights */}
          <div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5 text-[11px]">
              Profile-derived Factor Weights:
            </span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(data.weights) as Factor[]).map((factor) => {
                const weight = data.weights[factor] ?? 0;
                if (weight <= 0) return null;
                return (
                  <div
                    key={factor}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono flex items-center gap-1.5"
                  >
                    <span className="text-zinc-600 dark:text-zinc-400">{FACTOR_NAMES[factor]}:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 italic">
            {data.anchorsSummary}
          </p>
        </div>
      )}
    </div>
  );
}
