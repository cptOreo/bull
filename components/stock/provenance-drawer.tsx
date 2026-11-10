import React, { useEffect } from "react";
import { WHY_DATED } from "@/lib/data/provenance";

export interface ProvenanceRung {
  rung: number;
  source: string;
  code: string;
  expectedOutcome: string;
  description: string;
}

export const PROVENANCE_RUNGS: ProvenanceRung[] = [
  {
    rung: 1,
    source: "NSE bhavcopy (official EOD)",
    code: "nse",
    expectedOutcome: "Official Exchange Closes",
    description: "Official National Stock Exchange end-of-day trading reports and Bhavcopy bulletins.",
  },
  {
    rung: 2,
    source: "Yahoo Finance chart endpoint",
    code: "yahoo",
    expectedOutcome: "Historical Adjusted Closes",
    description: "Multi-year adjusted price time series and split-adjusted corporate action histories.",
  },
  {
    rung: 3,
    source: "Stooq CSV",
    code: "stooq",
    expectedOutcome: "Secondary Continuity Mirror",
    description: "International financial time series repository providing secondary quote verification.",
  },
  {
    rung: 4,
    source: "Manual CSV template",
    code: "manual_transcription",
    expectedOutcome: "Audited Manual Transcription",
    description: "Manually transcribed from audited annual reports, Screener.in, and official exchange filings.",
  },
];

export interface ProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRung?: number;
  ticker?: string;
  asOf?: string;
  sourceLabel?: string;
  className?: string;
}

export function ProvenanceDrawer({
  isOpen,
  onClose,
  activeRung = 4,
  ticker,
  asOf = "2026-11-10",
  sourceLabel = "Audited annual reports & exchange filings (manually transcribed)",
  className = "",
}: ProvenanceDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-950/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Data Provenance Hierarchy"
      data-testid="provenance-drawer"
    >
      <div
        className={`w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200 ${className}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  §10.10
                </span>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Data Provenance Hierarchy
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                4-rung fallback ladder for verifiable financial facts
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close provenance drawer"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Active Data Context */}
          {ticker && (
            <div className="mb-5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs font-mono">
              <div className="flex justify-between text-zinc-500 mb-1">
                <span>Inspecting: <strong className="text-zinc-800 dark:text-zinc-200">{ticker}</strong></span>
                <span>As of: {asOf}</span>
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans">
                Source: {sourceLabel}
              </div>
            </div>
          )}

          {/* 4-Rung Hierarchy Display */}
          <div className="space-y-3 mb-6" data-testid="provenance-rungs">
            {PROVENANCE_RUNGS.map((item) => {
              const isActive = activeRung === item.rung;
              return (
                <div
                  key={item.rung}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 opacity-80"
                  }`}
                  data-testid={`provenance-rung-${item.rung}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {item.rung}
                      </span>
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {item.source}
                      </span>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Active Rung
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-7">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Why Dated Educational Note */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200">
            <span className="font-semibold text-amber-900 dark:text-amber-100 block mb-1">
              Why Figures are Dated:
            </span>
            <p className="leading-relaxed font-sans text-[11px]">{WHY_DATED}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProvenanceDrawer;
