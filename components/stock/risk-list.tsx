import React from "react";
import type { RiskFlag } from "@/lib/engine/types";
import { RiskBadge } from "./risk-badge";

export interface RiskListProps {
  flags: RiskFlag[];
  ticker?: string;
  onSelectMetricRef?: (refId: string) => void;
  className?: string;
}

const SEVERITY_WEIGHT = {
  high: 0,
  medium: 1,
  low: 2,
};

export function RiskList({
  flags,
  ticker,
  onSelectMetricRef,
  className = "",
}: RiskListProps) {
  const sortedFlags = [...flags].sort(
    (a, b) => (SEVERITY_WEIGHT[a.severity] ?? 3) - (SEVERITY_WEIGHT[b.severity] ?? 3)
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50">
          Assessed Risk Flags {ticker ? `(${ticker})` : ""}
        </h2>
        <span className="text-xs font-mono text-zinc-500">
          {sortedFlags.length} {sortedFlags.length === 1 ? "flag" : "flags"}
        </span>
      </div>

      {sortedFlags.length === 0 ? (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>No elevated risk flags identified for this stock in the current snapshot.</span>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {sortedFlags.map((flag) => (
            <li
              key={flag.id}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5">
                <RiskBadge
                  label={flag.label}
                  severity={flag.severity}
                  sentence={flag.sentence}
                />
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mt-0.5">
                  {flag.sentence}
                </p>
              </div>

              {flag.metricRefId && onSelectMetricRef && (
                <button
                  type="button"
                  onClick={() => onSelectMetricRef(flag.metricRefId!)}
                  className="self-start sm:self-center shrink-0 px-2 py-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  Inspect metric &rarr;
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
