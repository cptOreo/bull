"use client";

import React from "react";
import Link from "next/link";
import { PROVENANCE_RUNGS } from "@/components/stock/provenance-drawer";
import { WHY_DATED } from "@/lib/data/provenance";
import { DataBadge } from "@/components/ui/data-badge";
import { EducationNote } from "@/components/ui/education-note";

export default function MethodPage() {
  const invariants = [
    {
      num: 1,
      name: "Pure Deterministic Engine",
      rule: "The core engine in lib/engine/* has zero side effects, zero I/O, zero network, zero process.env, and accepts `now` as a strict parameter.",
    },
    {
      num: 2,
      name: "No Single Composite Score",
      rule: "Stocks are evaluated across 4 distinct financial pillars (Quality, Valuation, Risk, Profile Fit). They are never flattened into a fake single letter grade or composite score.",
    },
    {
      num: 3,
      name: "Zero Buy / Sell Recommendations",
      rule: "Bull is strictly an educational research tool. We provide factual ratio analysis and risk literacy, never buy, sell, or hold advice.",
    },
    {
      num: 4,
      name: "Zero Price Targets or Return Promises",
      rule: "Equity markets carry fundamental risk. The platform explicitly forbids target prices, upside percentages, or return promises.",
    },
    {
      num: 5,
      name: "Strict Numeric Traceability",
      rule: "Every number displayed in text or cards resolves directly to an audited Ref cryptographic identifier (§9.3). Untraced numbers are rejected at the safety choke point.",
    },
    {
      num: 6,
      name: "Sector Diversity Enforcement",
      rule: "No shortlist may concentrate more than 2 companies from the same sector, preventing false diversification.",
    },
    {
      num: 7,
      name: "Static Audited Offline Snapshot",
      rule: "All financial figures trace to an immutable offline snapshot dated 10 November 2026 to ensure 100% auditable reproducibility.",
    },
    {
      num: 8,
      name: "Bilingual English & Hinglish Parity",
      rule: "All static copy, templates, and explanations maintain strict 1:1 key parity between Indian English and natural Romanized Hinglish (zero Devanagari script).",
    },
    {
      num: 9,
      name: "Closed Gamification XP Whitelist",
      rule: "XP rewards follow a strictly closed whitelist (§8.7) tied only to learning actions (lessons, checks, missions, quizzes). XP cannot be earned from trading or portfolio size.",
    },
    {
      num: 10,
      name: "IST Clock Integrity",
      rule: "All daily streaks and calendar actions are strictly evaluated against the Asia/Kolkata timezone, avoiding timezone drift.",
    },
  ];

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                §10 System Architecture
              </span>
              <DataBadge asOf="2026-11-10" sourceLabel="Audit Contract" freshness="current" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Methodology & Safety Architecture
            </h1>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Back to Discovery →
          </Link>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          How Bull delivers rigorous, reproducible fundamental research for first-time Indian investors without advisory bias or hallucinated claims.
        </p>
      </section>

      {/* 4-Rung Provenance Ladder */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            The 4-Rung Cryptographic Provenance Ladder (§10.10)
          </h2>
          <p className="text-xs text-zinc-500">
            Every figure displayed on Bull traces through an auditable 4-rung chain from raw regulatory filings to UI narrative claims.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVENANCE_RUNGS.map((rung) => (
            <div
              key={rung.rung}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                    {rung.rung}
                  </span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {rung.source}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-zinc-400">
                  {rung.code}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {rung.description}
              </p>
              <div className="pt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                Output: {rung.expectedOutcome}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Snapshot Disclosure */}
      <section className="p-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
        <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Why an Immutable Static Offline Snapshot?</span>
        </h2>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          {WHY_DATED}
        </p>
        <div className="pt-2 flex flex-wrap gap-4 text-[11px] font-mono text-amber-900/80 dark:text-amber-300/80 border-t border-amber-200/60 dark:border-amber-900/40">
          <span>Snapshot Date: 10 November 2026</span>
          <span>Universe: 12 Constituent Companies from Nifty 50</span>
          <span>Primary Sources: Screener.in & NSE Bhavcopy</span>
        </div>
      </section>

      {/* The 10 Invariants */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            The 10 Invariants of Bull (§1.2)
          </h2>
          <p className="text-xs text-zinc-500">
            These technical and behavioral constraints are enforced at compile time, in unit test contracts, and through runtime safety choke points.
          </p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
          {invariants.map((inv) => (
            <div key={inv.num} className="p-4 flex items-start gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                INV-{inv.num}
              </span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {inv.name}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {inv.rule}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEBI Compliance & Regulatory Statement */}
      <section className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 font-mono">
          SEBI Compliance & Regulatory Boundaries
        </h2>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
          <p>
            Bull is an applied educational research project submitted as part of the IIIT Hyderabad Applied AI Product Management Capstone. It is NOT a SEBI-registered Investment Adviser (RIA), Research Analyst (RA), Portfolio Manager, or Broker.
          </p>
          <p>
            The software produces zero buy recommendations, zero sell recommendations, zero stop-loss targets, and zero forward return projections. All information is presented exclusively for applied investor literacy and educational simulation.
          </p>
        </div>
      </section>

      <EducationNote />
    </main>
  );
}
