"use client";

import React, { useEffect, useRef } from "react";
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

export interface ProvenanceRung1 {
  source: string;
  document: string;
  pageOrNote?: string;
  timestamp?: string;
  sourceUrl?: string;
}

export interface ProvenanceRung2 {
  formula: string;
  inputs?: Array<{ label: string; value: string }>;
}

export interface ProvenanceRung3 {
  percentile: number;
  sampleSize?: number;
  universeName?: string;
  interpretation?: string;
}

export interface ProvenanceRung4 {
  claimText: string;
  context?: string;
}

export interface MetricProvenanceDetails {
  id: string;
  name: string;
  value: string;
  asOf?: string;
  rung1: ProvenanceRung1;
  rung2: ProvenanceRung2;
  rung3: ProvenanceRung3;
  rung4: ProvenanceRung4;
}

export interface ProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  details?: MetricProvenanceDetails | null;
  activeRung?: number;
  ticker?: string;
  asOf?: string;
  sourceLabel?: string;
  className?: string;
}

export function ProvenanceDrawer({
  isOpen,
  onClose,
  details,
  activeRung = 4,
  ticker,
  asOf = "2026-11-10",
  sourceLabel = "Audited annual reports & exchange filings (manually transcribed)",
  className = "",
}: ProvenanceDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // Mode A: Metric-specific 4-rung audit trail when details are provided
  if (details) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        aria-labelledby="provenance-drawer-title"
        role="dialog"
        aria-modal="true"
        data-testid="provenance-drawer"
      >
        <div
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div
            ref={drawerRef}
            className={`w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 ${className}`}
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                  Verifiable Audit Trail (§10.10)
                </span>
                <h2
                  id="provenance-drawer-title"
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tracking-tight"
                >
                  Data Provenance · {details.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-mono">
                  <span>Current value:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {details.value}
                  </span>
                  {details.asOf && <span>· As of {details.asOf}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close provenance drawer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 4 Rungs Audit Flow */}
            <div className="p-5 space-y-6 flex-1">
              {/* Rung 1: Source Document */}
              <section className="relative pl-6 border-l-2 border-emerald-500/80 dark:border-emerald-500/60">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                  1
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Rung 1 · Source Document
                  </div>
                  <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {details.rung1.document}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Source: <span className="font-mono">{details.rung1.source}</span>
                    {details.rung1.pageOrNote && (
                      <>
                        <span> · </span>
                        <span>{details.rung1.pageOrNote}</span>
                      </>
                    )}
                  </div>
                  {details.rung1.timestamp && (
                    <div className="text-[11px] font-mono text-zinc-400">
                      Filed: {details.rung1.timestamp}
                    </div>
                  )}
                </div>
              </section>

              {/* Rung 2: Raw Values & Formula */}
              <section className="relative pl-6 border-l-2 border-blue-500/80 dark:border-blue-500/60">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                  2
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Rung 2 · Raw Values & Formula
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all leading-relaxed">
                    {details.rung2.formula}
                  </div>
                  {details.rung2.inputs && details.rung2.inputs.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {details.rung2.inputs.map((inp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800"
                        >
                          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">
                            {inp.label}
                          </div>
                          <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                            {inp.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Rung 3: Universe Ranking */}
              <section className="relative pl-6 border-l-2 border-purple-500/80 dark:border-purple-500/60">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                  3
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Rung 3 · Universe Ranking
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {details.rung3.percentile}th
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      percentile across {details.rung3.sampleSize ?? 50} stocks in{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">
                        {details.rung3.universeName ?? "Nifty 50"}
                      </span>
                    </div>
                  </div>
                  {details.rung3.interpretation && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                      {details.rung3.interpretation}
                    </p>
                  )}
                </div>
              </section>

              {/* Rung 4: Narrative Claim Text */}
              <section className="relative pl-6 border-l-2 border-amber-500/80 dark:border-amber-500/60">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                  4
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Rung 4 · UI Narrative Claim
                  </div>
                  <blockquote className="p-3 rounded-lg border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-xs italic text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    &ldquo;{details.rung4.claimText}&rdquo;
                  </blockquote>
                  {details.rung4.context && (
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Displayed in: {details.rung4.context}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>Traceable cryptographic data chain</span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode B: Universal 4-rung hierarchy view
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-950/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Data Provenance Hierarchy"
      data-testid="provenance-drawer"
    >
      <div
        ref={drawerRef}
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
                4-rung fallback ladder for verifiable financial fact
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>

          {/* Context ticker / As of */}
          {(ticker || asOf) && (
            <div className="p-3 mb-5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
              <div className="flex justify-between items-center font-mono">
                {ticker && (
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Stock: {ticker}
                  </span>
                )}
                <span className="text-zinc-500">As of: {asOf}</span>
              </div>
              <div className="text-zinc-600 dark:text-zinc-400 mt-1 text-[11px] truncate">
                Source: {sourceLabel}
              </div>
            </div>
          )}

          {/* 4 Rungs */}
          <div className="space-y-3">
            {PROVENANCE_RUNGS.map((rung) => {
              const isActive = rung.rung === activeRung;
              return (
                <div
                  key={rung.rung}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {rung.rung}
                      </span>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {rung.source}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold">
                        ACTIVE RUNG
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 pl-7 leading-relaxed">
                    {rung.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Why Dated Educational Note */}
          <div className="mt-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
            <div className="font-semibold mb-1 flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>Why Static Offline Snapshot?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              {WHY_DATED}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close provenance drawer"
            className="px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProvenanceDrawer;
