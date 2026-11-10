"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { snapshot } from "@/lib/data/snapshot";
import { getStockMetrics } from "@/lib/engine/metrics";
import { formatPrice, formatSignedPercent } from "@/lib/engine/format";
import { SectorTag } from "@/components/shortlist/sector-tag";
import { DataBadge } from "@/components/ui/data-badge";
import { EducationNote } from "@/components/ui/education-note";

function CompareContent() {
  const searchParams = useSearchParams();
  const initialA = searchParams.get("stockA") || "TCS";
  const initialB = searchParams.get("stockB") || "INFY";

  const [tickerA, setTickerA] = useState<string>(initialA);
  const [tickerB, setTickerB] = useState<string>(initialB);

  const stockA = useMemo(
    () => snapshot.stocks.find((s) => s.ticker === tickerA) || snapshot.stocks[0],
    [tickerA]
  );
  const stockB = useMemo(
    () => snapshot.stocks.find((s) => s.ticker === tickerB) || snapshot.stocks[1],
    [tickerB]
  );

  const now = "2026-11-10T14:00:00Z";
  const metricsA = useMemo(() => getStockMetrics(stockA, snapshot, now), [stockA]);
  const metricsB = useMemo(() => getStockMetrics(stockB, snapshot, now), [stockB]);
  const sectorA = snapshot.sectors.find((s) => s.id === stockA.sectorId);
  const sectorB = snapshot.sectors.find((s) => s.id === stockB.sectorId);
  const sectorNameA = sectorA?.name ?? stockA.sectorId;
  const sectorNameB = sectorB?.name ?? stockB.sectorId;

  const rows = [
    {
      label: "P/E Ratio",
      valA: metricsA.values.pe !== null ? metricsA.values.pe.toFixed(1) : "N/A",
      valB: metricsB.values.pe !== null ? metricsB.values.pe.toFixed(1) : "N/A",
      note: "Lower P/E may reflect cheaper multiple relative to earnings or lower expected growth.",
    },
    {
      label: "P/B Ratio",
      valA: metricsA.values.pb !== null ? metricsA.values.pb.toFixed(1) : "N/A",
      valB: metricsB.values.pb !== null ? metricsB.values.pb.toFixed(1) : "N/A",
      note: "Price relative to net book value per share.",
    },
    {
      label: "ROE (Return on Equity)",
      valA: metricsA.values.roePct !== null ? `${metricsA.values.roePct.toFixed(1)}%` : "N/A",
      valB: metricsB.values.roePct !== null ? `${metricsB.values.roePct.toFixed(1)}%` : "N/A",
      note: "Net income generated per rupee of shareholder equity.",
    },
    {
      label: "ROCE",
      valA: metricsA.values.rocePct !== null ? `${metricsA.values.rocePct.toFixed(1)}%` : "N/A",
      valB: metricsB.values.rocePct !== null ? `${metricsB.values.rocePct.toFixed(1)}%` : "N/A",
      note: "Operating profit generated per rupee of total capital employed.",
    },
    {
      label: "Operating Margin",
      valA:
        metricsA.values.operatingMarginPct !== null
          ? `${metricsA.values.operatingMarginPct.toFixed(1)}%`
          : "N/A",
      valB:
        metricsB.values.operatingMarginPct !== null
          ? `${metricsB.values.operatingMarginPct.toFixed(1)}%`
          : "N/A",
      note: "EBIT divided by revenue.",
    },
    {
      label: "Debt-to-Equity",
      valA:
        metricsA.values.debtToEquity !== null ? metricsA.values.debtToEquity.toFixed(2) : "N/A",
      valB:
        metricsB.values.debtToEquity !== null ? metricsB.values.debtToEquity.toFixed(2) : "N/A",
      note:
        stockA.sectorModel === "financial" || stockB.sectorModel === "financial"
          ? "For banks, deposits are omitted from funded debt."
          : "Total borrowings relative to total net worth.",
    },
    {
      label: "1Y Realized Volatility",
      valA:
        metricsA.values.volatilityPct !== null
          ? `${metricsA.values.volatilityPct.toFixed(1)}%`
          : "N/A",
      valB:
        metricsB.values.volatilityPct !== null
          ? `${metricsB.values.volatilityPct.toFixed(1)}%`
          : "N/A",
      note: "Annualized standard deviation of daily logarithmic price returns.",
    },
    {
      label: "Max Drawdown (3Y)",
      valA:
        metricsA.values.maxDrawdownPct !== null
          ? `${metricsA.values.maxDrawdownPct.toFixed(1)}%`
          : "N/A",
      valB:
        metricsB.values.maxDrawdownPct !== null
          ? `${metricsB.values.maxDrawdownPct.toFixed(1)}%`
          : "N/A",
      note: "Largest recorded peak-to-trough decline over trailing 36 months.",
    },
  ];

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                §7.4
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Side-by-Side Stock Comparison
              </h1>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Compare fundamental financial metrics and risk profiles of two Nifty 50 companies.
              Bull never declares a single winner or issues buy/sell recommendations.
            </p>
          </div>
          <DataBadge asOf="2026-11-10" sourceLabel="Audited Snapshot" freshness="current" />
        </div>

        {/* Stock Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <label htmlFor="select-stock-a" className="text-xs font-mono font-bold uppercase text-zinc-500">
              Stock A
            </label>
            <select
              id="select-stock-a"
              value={tickerA}
              onChange={(e) => setTickerA(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {snapshot.stocks.map((s) => {
                const sSec = snapshot.sectors.find((sec) => sec.id === s.sectorId);
                return (
                  <option key={s.ticker} value={s.ticker}>
                    {s.ticker} — {s.name} ({sSec?.name ?? s.sectorId})
                  </option>
                );
              })}
            </select>
            <div className="flex items-center justify-between pt-1">
              <SectorTag sector={sectorNameA} id={stockA.sectorId} size="sm" />
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {formatPrice(metricsA.values.latestClose)}{" "}
                <span
                  className={`text-xs ${
                    (metricsA.values.oneSessionMovePct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  ({formatSignedPercent(metricsA.values.oneSessionMovePct ?? 0)})
                </span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <label htmlFor="select-stock-b" className="text-xs font-mono font-bold uppercase text-zinc-500">
              Stock B
            </label>
            <select
              id="select-stock-b"
              value={tickerB}
              onChange={(e) => setTickerB(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {snapshot.stocks.map((s) => {
                const sSec = snapshot.sectors.find((sec) => sec.id === s.sectorId);
                return (
                  <option key={s.ticker} value={s.ticker}>
                    {s.ticker} — {s.name} ({sSec?.name ?? s.sectorId})
                  </option>
                );
              })}
            </select>
            <div className="flex items-center justify-between pt-1">
              <SectorTag sector={sectorNameB} id={stockB.sectorId} size="sm" />
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {formatPrice(metricsB.values.latestClose)}{" "}
                <span
                  className={`text-xs ${
                    (metricsB.values.oneSessionMovePct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  ({formatSignedPercent(metricsB.values.oneSessionMovePct ?? 0)})
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-xs font-mono text-zinc-500 uppercase border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-bold">Metric / Ratio</th>
                <th scope="col" className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                  {stockA.ticker}
                </th>
                <th scope="col" className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                  {stockB.ticker}
                </th>
                <th scope="col" className="px-5 py-3.5 font-bold hidden md:table-cell">
                  Context & Definition
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    {row.label}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {row.valA}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {row.valB}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-500 hidden md:table-cell">
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Action Links */}
      <section className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${stockA.ticker}`}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Deep Dive {stockA.ticker} →
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <Link
            href={`/stock/${stockB.ticker}`}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Deep Dive {stockB.ticker} →
          </Link>
        </div>

        <Link
          href={`/?q=Compare ${stockA.ticker} and ${stockB.ticker}`}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Ask Bull to analyze in chat →
        </Link>
      </section>

      {/* Educational Disclaimer */}
      <EducationNote />
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-mono text-zinc-500">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
