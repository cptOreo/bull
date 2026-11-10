"use client";

import React from "react";
import Link from "next/link";
import { SectorTag } from "./sector-tag";
import { RiskBadge } from "@/components/stock/risk-badge";
import type { RiskSeverity, FactorBar } from "@/lib/engine/types";

export interface ShortlistTableRow {
  rank: number;
  ticker: string;
  name: string;
  sector: string;
  sectorId?: string;
  keyDrivers: string[];
  riskLevel: RiskSeverity;
  riskLabel?: string;
  riskSentence?: string;
  factorBars?: FactorBar[];
  businessDescription?: string;
  asOf?: string;
}

export interface ShortlistTableProps {
  stocks: ShortlistTableRow[];
  diversityRule?: string;
  onViewDetails?: (ticker: string) => void;
  onCompare?: (ticker: string) => void;
  className?: string;
}

export function ShortlistTable({
  stocks,
  diversityRule,
  onViewDetails,
  onCompare,
  className = "",
}: ShortlistTableProps) {
  // Compute sector counts for diversity rule indicator if not provided
  const sectorCounts = stocks.reduce<Record<string, number>>((acc, s) => {
    acc[s.sector] = (acc[s.sector] || 0) + 1;
    return acc;
  }, {});

  const diversityBreakdown = Object.entries(sectorCounts)
    .map(([sec, count]) => `${count} ${sec}`)
    .join(", ");

  const computedDiversityNote =
    diversityRule ||
    (Object.keys(sectorCounts).length > 0
      ? `Max 2 per sector enforced: ${diversityBreakdown}`
      : "Max 2 per sector enforced across all candidates");

  return (
    <div
      role="region"
      aria-label="Ranked Shortlist Table"
      className={`space-y-4 ${className}`}
    >
      {/* Header and Diversity Rule Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-zinc-950 dark:text-zinc-50">
            Company Shortlist
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ranked by multi-factor profile alignment. Max 5 candidates shown.
          </p>
        </div>

        {/* Diversity Rule Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{computedDiversityNote}</span>
        </div>
      </div>

      {stocks.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
          No stocks currently clear the qualification criteria.
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[11px] uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4 w-12 text-center">Rank</th>
                    <th scope="col" className="py-3 px-4 w-56">Company & Ticker</th>
                    <th scope="col" className="py-3 px-4 w-36">Sector</th>
                    <th scope="col" className="py-3 px-4">3 Key Drivers</th>
                    <th scope="col" className="py-3 px-4 w-36">Risk Level</th>
                    <th scope="col" className="py-3 px-4 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stocks.map((stock) => {
                    const topDrivers = stock.keyDrivers.slice(0, 3);
                    const riskLabel =
                      stock.riskLabel ||
                      (stock.riskLevel === "high"
                        ? "High Risk"
                        : stock.riskLevel === "medium"
                        ? "Moderate Risk"
                        : "Low Risk");

                    return (
                      <tr
                        key={stock.ticker}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-400 dark:text-zinc-500 text-sm tabular-nums">
                          #{stock.rank}
                        </td>

                        {/* Company Name & Ticker */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <div className="font-serif font-bold text-zinc-950 dark:text-zinc-50 text-sm tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {stock.name}
                            </div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {stock.ticker}
                            </span>
                          </div>
                        </td>

                        {/* Sector Tag */}
                        <td className="py-4 px-4">
                          <SectorTag
                            sector={stock.sector}
                            id={stock.sectorId}
                            size="sm"
                          />
                        </td>

                        {/* 3 Key Drivers */}
                        <td className="py-4 px-4">
                          <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 leading-snug">
                            {topDrivers.map((driver, dIdx) => (
                              <li key={dIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold text-[11px] shrink-0">✓</span>
                                <span>{driver}</span>
                              </li>
                            ))}
                          </ul>
                        </td>

                        {/* Risk Level */}
                        <td className="py-4 px-4">
                          <RiskBadge
                            label={riskLabel}
                            severity={stock.riskLevel}
                            sentence={stock.riskSentence}
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 font-mono text-[11px]">
                            {onViewDetails ? (
                              <button
                                type="button"
                                onClick={() => onViewDetails(stock.ticker)}
                                className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer font-medium"
                              >
                                Details
                              </button>
                            ) : (
                              <Link
                                href={`/stock/${stock.ticker}`}
                                className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity font-medium"
                              >
                                Details
                              </Link>
                            )}

                            {onCompare && (
                              <button
                                type="button"
                                onClick={() => onCompare(stock.ticker)}
                                className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                Compare
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Stack */}
          <div className="block md:hidden space-y-3.5">
            {stocks.map((stock) => {
              const topDrivers = stock.keyDrivers.slice(0, 3);
              const riskLabel =
                stock.riskLabel ||
                (stock.riskLevel === "high"
                  ? "High Risk"
                  : stock.riskLevel === "medium"
                  ? "Moderate Risk"
                  : "Low Risk");

              return (
                <div
                  key={stock.ticker}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        #{stock.rank}
                      </span>
                      <div>
                        <h3 className="font-serif font-bold text-sm text-zinc-950 dark:text-zinc-50">
                          {stock.name}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {stock.ticker}
                        </span>
                      </div>
                    </div>

                    <SectorTag
                      sector={stock.sector}
                      id={stock.sectorId}
                      size="sm"
                    />
                  </div>

                  {/* 3 Drivers */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                      Key Drivers
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                      {topDrivers.map((driver, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold text-[11px] shrink-0">✓</span>
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Badge */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <RiskBadge
                      label={riskLabel}
                      severity={stock.riskLevel}
                      sentence={stock.riskSentence}
                    />

                    <div className="flex items-center gap-2 font-mono text-xs">
                      {onViewDetails ? (
                        <button
                          type="button"
                          onClick={() => onViewDetails(stock.ticker)}
                          className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium cursor-pointer"
                        >
                          View
                        </button>
                      ) : (
                        <Link
                          href={`/stock/${stock.ticker}`}
                          className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                        >
                          View
                        </Link>
                      )}

                      {onCompare && (
                        <button
                          type="button"
                          onClick={() => onCompare(stock.ticker)}
                          className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                        >
                          Compare
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
