"use client";

import React, { useState } from "react";
import type { RiskSeverity } from "@/lib/engine/types";

export interface RiskBadgeProps {
  label: string;
  severity?: RiskSeverity;
  sentence?: string;
  className?: string;
}

export function RiskBadge({
  label,
  severity = "medium",
  sentence,
  className = "",
}: RiskBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const severityStyles: Record<
    RiskSeverity,
    { pill: string; dot: string; indicator: string; title: string }
  > = {
    high: {
      pill: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
      dot: "bg-rose-500",
      indicator: "High Risk",
      title: "Significant caution point",
    },
    medium: {
      pill: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
      dot: "bg-amber-500",
      indicator: "Moderate Risk",
      title: "Area requiring attention",
    },
    low: {
      pill: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      dot: "bg-zinc-400",
      indicator: "Low / Note",
      title: "Informational note",
    },
  };

  const style = severityStyles[severity] || severityStyles.medium;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-expanded={showTooltip}
        aria-haspopup="true"
        title={sentence || label}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400 ${style.pill}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
        <span className="font-semibold">{label}</span>
        {sentence && (
          <svg
            className="w-3 h-3 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {sentence && showTooltip && (
        <div
          role="tooltip"
          className="absolute left-0 bottom-full mb-1.5 z-40 w-64 p-2.5 bg-zinc-900 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 text-xs rounded-lg shadow-xl border border-zinc-700 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-700 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            <span>{style.indicator}</span>
            <span>First-Time Investor Note</span>
          </div>
          <p className="leading-snug text-zinc-200">{sentence}</p>
        </div>
      )}
    </div>
  );
}
