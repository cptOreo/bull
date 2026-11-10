"use client";

import React, { useEffect, useRef } from "react";

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
  details: MetricProvenanceDetails | null;
  className?: string;
}

export function ProvenanceDrawer({
  isOpen,
  onClose,
  details,
  className = "",
}: ProvenanceDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Accessible ESC key listener & focus management
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    const prevActiveElement = document.activeElement as HTMLElement | null;

    // Focus close button on mount
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      prevActiveElement?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !details) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="provenance-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-250 ${className}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                4-Rung Audit Trail
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {details.id}
              </span>
            </div>
            <h2
              id="provenance-title"
              className="text-xl font-serif font-bold text-zinc-950 dark:text-zinc-50 mt-1"
            >
              {details.name}
            </h2>
            <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-1">
              {details.value}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close provenance drawer"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Audit Trail */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Rung 1: Source Document */}
          <section className="relative pl-6 border-l-2 border-emerald-500/80 dark:border-emerald-500/60">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">
              1
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Rung 1 · Source Document
              </div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {details.rung1.document}
              </p>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
                <div>Source: <span className="font-medium text-zinc-900 dark:text-zinc-200">{details.rung1.source}</span></div>
                {details.rung1.pageOrNote && (
                  <div>Reference: <span className="font-mono text-zinc-700 dark:text-zinc-300">{details.rung1.pageOrNote}</span></div>
                )}
                {details.rung1.timestamp && (
                  <div>Verified Instant: <span className="font-mono">{details.rung1.timestamp}</span></div>
                )}
              </div>
              {details.rung1.sourceUrl && (
                <a
                  href={details.rung1.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline mt-1"
                >
                  View filing reference &rarr;
                </a>
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
  );
}
