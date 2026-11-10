import React from "react";
import type { FactorBar } from "@/lib/engine/types";

export interface FactorBarsProps {
  factorBars: FactorBar[];
  maxBars?: number;
  className?: string;
}

export function FactorBars({
  factorBars,
  maxBars = 3,
  className = "",
}: FactorBarsProps) {
  // Take top N factors by weight/score
  const displayedBars = factorBars.slice(0, maxBars);

  return (
    <div
      role="group"
      aria-label="Factor contribution bars"
      className={`space-y-2.5 ${className}`}
    >
      {displayedBars.map((bar) => {
        const scorePct = Math.min(100, Math.max(0, Math.round(bar.score * 100)));
        const weightPct = Math.round(bar.weight * 100);

        return (
          <div key={bar.factor} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {bar.label}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-zinc-500">
                <span>Weight: {weightPct}%</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {scorePct}%
                </span>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
