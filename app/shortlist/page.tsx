"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { snapshot } from "@/lib/data/snapshot";
import { getStockMetrics } from "@/lib/engine/metrics";
import { scoreStock, selectShortlist } from "@/lib/engine/score";
import { deriveRiskFlags } from "@/lib/engine/risk";
import { composeShortlistCard, composeHowChosen } from "@/lib/engine/narrative";
import type { ShortlistCard, ScoredStock, Profile } from "@/lib/engine/types";
import { ShortlistTable, type ShortlistTableRow } from "@/components/shortlist/shortlist-table";
import { RankFactorCard } from "@/components/shortlist/rank-factor-card";
import { HowChosen } from "@/components/shortlist/how-chosen";
import { DataBadge } from "@/components/ui/data-badge";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export default function ShortlistPage() {
  const { profile, locale, updateProfile } = useBull();
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Ensure full profile with defaults
  const effectiveProfile: Profile = useMemo(() => ({
    goal: profile.goal ?? "grow_wealth",
    horizon: profile.horizon ?? "3_5y",
    riskComfort: profile.riskComfort ?? "unsure",
    experience: profile.experience ?? "sip",
    locale,
  }), [profile, locale]);

  const now = "2026-11-10T14:00:00Z";

  // Compute multi-factor scored stocks and shortlist
  const { shortlistCards } = useMemo(() => {
    const scored: ScoredStock[] = snapshot.stocks.map((stock) => {
      const metrics = getStockMetrics(stock, snapshot, now);
      return scoreStock(stock, metrics, effectiveProfile);
    });
    const result = selectShortlist(scored);

    const cards: ShortlistCard[] = result.cards.map((s) => {
      const flags = deriveRiskFlags(s.metrics, s.stock);
      return composeShortlistCard(s, effectiveProfile, { flags, locale, deps: { snapshot } });
    });

    return { shortlistCards: cards };
  }, [effectiveProfile, locale]);

  const howChosenData = useMemo(() => composeHowChosen(effectiveProfile), [effectiveProfile]);

  // Sector list for filter pill
  const sectors = useMemo(() => snapshot.sectors.map((s) => s.name), []);

  const tableRows: ShortlistTableRow[] = useMemo(() => {
    return shortlistCards.map((c, idx) => {
      const stock = snapshot.stocks.find((s) => s.ticker === c.ticker);
      const sector = snapshot.sectors.find((sec) => sec.id === stock?.sectorId);
      const stockMetrics = stock ? getStockMetrics(stock, snapshot, now) : null;
      const flags = stock && stockMetrics ? deriveRiskFlags(stockMetrics, stock) : [];
      const riskLevel = flags.some((f) => f.severity === "high")
        ? "high"
        : flags.some((f) => f.severity === "medium")
        ? "medium"
        : "low";

      return {
        rank: idx + 1,
        ticker: c.ticker,
        name: c.name,
        sector: sector?.name ?? stock?.sectorId ?? "",
        sectorId: stock?.sectorId,
        keyDrivers: c.reasons,
        riskLevel,
        riskSentence: c.riskSentence,
        factorBars: c.factorBars,
      };
    });
  }, [shortlistCards]);

  const filteredRows = useMemo(() => {
    if (selectedSector === "all") return tableRows;
    return tableRows.filter((r) => r.sector === selectedSector);
  }, [tableRows, selectedSector]);

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                §6 Multi-Factor
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {copy.shortlist.title}
              </h1>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {copy.shortlist.howChosenIntro}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DataBadge asOf="2026-11-10" sourceLabel="Audited Snapshot" freshness="current" />
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Ask in Chat →
            </Link>
          </div>
        </div>

        {/* Profile Dimension Quick Switchers */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="font-medium text-zinc-500 font-mono">Horizon:</span>
          {(["1_3y", "3_5y", "5_10y", "10y_plus"] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => updateProfile({ horizon: h })}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors cursor-pointer ${
                effectiveProfile.horizon === h
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {h}
            </button>
          ))}

          <span className="ml-4 font-medium text-zinc-500 font-mono">Risk:</span>
          {(["low", "medium", "high", "unsure"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => updateProfile({ riskComfort: r })}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors cursor-pointer ${
                effectiveProfile.riskComfort === r
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* Sector Diversity Filter Pill */}
      <section className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-mono text-zinc-400 mr-1">Sector:</span>
        <button
          type="button"
          onClick={() => setSelectedSector("all")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            selectedSector === "all"
              ? "bg-emerald-600 text-white font-bold"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          All ({shortlistCards.length})
        </button>
        {sectors.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSelectedSector(sec)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              selectedSector === sec
                ? "bg-emerald-600 text-white font-bold"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200"
            }`}
          >
            {sec}
          </button>
        ))}
      </section>

      {/* Main Shortlist Table */}
      <section className="space-y-4">
        <ShortlistTable stocks={filteredRows} />
      </section>

      {/* Multi-Factor Scoring Architecture (Invariant 2) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <RankFactorCard
          ticker={shortlistCards[0]?.ticker}
          name={shortlistCards[0]?.name}
        />

        <HowChosen howChosen={howChosenData} />
      </section>
    </main>
  );
}
