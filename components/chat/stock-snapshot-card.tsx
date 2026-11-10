import React from "react";
import Link from "next/link";
import type { LiveStockSnapshot } from "@/lib/engine/types";
import { formatPrice, formatSignedPercent } from "@/lib/engine/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StockSnapshotCardProps {
  snapshot: LiveStockSnapshot;
  className?: string;
}

export function StockSnapshotCard({ snapshot, className }: StockSnapshotCardProps) {
  const isPositive = snapshot.change >= 0;

  // 52-week position calculation (0 to 100%)
  const has52w =
    snapshot.fiftyTwoWeekHigh !== null &&
    snapshot.fiftyTwoWeekLow !== null &&
    snapshot.fiftyTwoWeekHigh > snapshot.fiftyTwoWeekLow;

  const positionPercent = has52w
    ? Math.min(
        100,
        Math.max(
          0,
          ((snapshot.price - (snapshot.fiftyTwoWeekLow as number)) /
            ((snapshot.fiftyTwoWeekHigh as number) - (snapshot.fiftyTwoWeekLow as number))) *
            100
        )
      )
    : 50;

  return (
    <Card
      className={cn(
        "w-full overflow-hidden border-zinc-200/90 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900/90",
        className
      )}
    >
      {/* Top Header: Ticker pill + Company name + Sector badge + As of date */}
      <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              {snapshot.ticker}
            </span>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              {snapshot.name}
            </h3>
            {snapshot.sector && (
              <Badge variant="outline" className="text-[11px] font-normal text-zinc-600 dark:text-zinc-300">
                {snapshot.sector}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>As of {snapshot.asOf}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Live Price Display & 1D Move Pill */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-0.5">
              Live Market Price
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums text-zinc-950 dark:text-zinc-50">
                ₹{formatPrice(snapshot.price)}
              </span>
              <span className="font-mono text-xs text-zinc-400">{snapshot.currency}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold tabular-nums border",
                isPositive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
              )}
            >
              <span>{isPositive ? "▲" : "▼"}</span>
              <span>₹{Math.abs(snapshot.change).toFixed(2)}</span>
              <span>({formatSignedPercent(snapshot.changePercent)})</span>
            </div>
          </div>
        </div>

        {/* Metric Grid: Market Cap, P/E Ratio, 52-Week Range */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1">
          {/* Market Cap */}
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-850/40">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Market Capitalization
            </span>
            <p className="mt-1 font-mono text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {snapshot.marketCapFormatted}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-400">Total company equity value</p>
          </div>

          {/* P/E Ratio */}
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-850/40">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Price to Earnings (P/E)
            </span>
            <p className="mt-1 font-mono text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {snapshot.peRatio !== null ? `${snapshot.peRatio.toFixed(1)}x` : "N/A (Loss/Fin)"}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-400">
              {snapshot.dividendYield !== null
                ? `Div Yield: ${snapshot.dividendYield.toFixed(2)}%`
                : "Valuation multiple"}
            </p>
          </div>

          {/* 52-Week Range with visual min/max bar */}
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-850/40 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span>52-Week Range</span>
              <span className="font-mono text-[10px] text-zinc-400">
                {Math.round(positionPercent)}% of high
              </span>
            </div>

            {has52w ? (
              <div className="space-y-1">
                <div className="relative pt-1 pb-1">
                  <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500"
                      style={{ width: `${positionPercent}%` }}
                    />
                  </div>
                  {/* Position pointer */}
                  <div
                    aria-hidden="true"
                    className="absolute top-1/2 -mt-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-zinc-900 shadow-xs dark:border-zinc-900 dark:bg-zinc-100"
                    style={{ left: `${positionPercent}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                  <span>₹{formatPrice(snapshot.fiftyTwoWeekLow as number)}</span>
                  <span>₹{formatPrice(snapshot.fiftyTwoWeekHigh as number)}</span>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-zinc-500">Historical range unavailable</p>
            )}
          </div>
        </div>

        {/* Business One-liner */}
        {snapshot.summary && (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Business Model: </span>
            {snapshot.summary}
          </div>
        )}

        {/* Why Investors Like It (2 bullets with checkmark icons) */}
        {snapshot.strengths && snapshot.strengths.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                ✓
              </span>
              Why Investors Like It
            </h4>
            <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
              {snapshot.strengths.slice(0, 2).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Things to Watch / Risks (1-2 bullets with alert icons) */}
        {snapshot.watchouts && snapshot.watchouts.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                ⚠
              </span>
              Things to Watch / Risks
            </h4>
            <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
              {snapshot.watchouts.slice(0, 2).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0 mt-0.5">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer: Deep dive link */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            SEBI Academic Sample · Not buy/sell advice
          </span>
          <Link
            href={`/stock/${snapshot.ticker.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-2xs"
          >
            <span>Full Deep Dive</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
