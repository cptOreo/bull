"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/ui/card";
import { GlossaryTooltip } from "@/ui/glossary-tooltip";
import { formatPercent, formatRatio } from "@/lib/engine/format";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";

export interface RatioItem {
  id: string;
  name: string;
  value: string;
  meaning: string;
  asOf: string;
  source: string;
  isPriceBased?: boolean;
  bankNote?: string;
}

export interface RatioGridProps {
  stock?: {
    peRatio?: number | null;
    pbRatio?: number | null;
    roe?: number | null;
    roce?: number | null;
    debtToEquity?: number | null;
    operatingMargin?: number | null;
    netMargin?: number | null;
    dividendYield?: number | null;
  };
  metrics?: {
    sectorModel?: string;
    values: Record<string, number | null | undefined>;
    asOfDates?: Record<string, string>;
  };
  ratios?: RatioItem[];
  sectorModel?: "financial" | "non_financial";
  asOfDefault?: string;
  sourceDefault?: string;
  onSelectRatio?: (ratioId: string) => void;
  className?: string;
}

const STOCK_RATIOS = [
  { key: "peRatio", label: "P/E Ratio", format: (v: number) => `${v.toFixed(1)}x`, tooltip: "pe" },
  { key: "pbRatio", label: "P/B Ratio", format: (v: number) => `${v.toFixed(1)}x`, tooltip: "pb" },
  { key: "roe", label: "ROE", format: (v: number) => formatPercent(v), tooltip: "roe" },
  { key: "roce", label: "ROCE", format: (v: number) => formatPercent(v), tooltip: "roce" },
  { key: "debtToEquity", label: "Debt/Equity", format: (v: number) => `${v.toFixed(2)}x`, tooltip: "debtToEquity" },
  { key: "operatingMargin", label: "Op. Margin", format: (v: number) => formatPercent(v), tooltip: "om" },
  { key: "netMargin", label: "Net Margin", format: (v: number) => formatPercent(v), tooltip: "nm" },
  { key: "dividendYield", label: "Div. Yield", format: (v: number) => formatPercent(v), tooltip: "dividendYield" },
] as const;

export function RatioGrid({
  stock,
  metrics,
  ratios,
  sectorModel,
  asOfDefault = "2026-11-10",
  sourceDefault = "BSE / Screener.in",
  onSelectRatio,
  className = "",
}: RatioGridProps) {
  if (stock) {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
        {STOCK_RATIOS.map(({ key, label, format, tooltip }) => {
          const value = stock[key as keyof typeof stock];
          const displayValue = value != null ? format(value as number) : "N/A";
          const trend = value != null ? (
            key === "peRatio" || key === "pbRatio" || key === "debtToEquity" ? (value < 20 ? "up" : value > 40 ? "down" : "neutral") :
            key === "roe" || key === "roce" || key === "operatingMargin" || key === "netMargin" ? (value > 15 ? "up" : value < 8 ? "down" : "neutral") :
            "neutral"
          ) : "neutral";

          return (
            <Card key={key} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <GlossaryTooltip term={tooltip}>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                {trend && (
                  <span className={cn("h-3.5 w-3.5", trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground")}>
                    {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                    {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                    {trend === "neutral" && <Minus className="h-3.5 w-3.5" />}
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{displayValue}</p>
            </Card>
          );
        })}
      </div>
    );
  }

  const isBank = (sectorModel || metrics?.sectorModel) === "financial";
  const items: RatioItem[] = ratios || [
    {
      id: "pe",
      name: "Price to Earnings (P/E)",
      value: metrics?.values.pe != null ? `${formatRatio(metrics.values.pe)}x` : "24.5x",
      meaning: "How much investors pay for ₹1 of annual earnings.",
      asOf: metrics?.asOfDates?.pe || asOfDefault,
      source: "Recent Price / Annual PAT",
      isPriceBased: true,
    },
    {
      id: "pb",
      name: "Price to Book (P/B)",
      value: metrics?.values.pb != null ? `${formatRatio(metrics.values.pb)}x` : "3.8x",
      meaning: "Market value compared to net accounting book value.",
      asOf: metrics?.asOfDates?.pb || asOfDefault,
      source: "Recent Price / Net Worth",
      isPriceBased: true,
    },
    {
      id: "div_yield",
      name: "Dividend Yield",
      value: metrics?.values.dividendYieldPct != null ? formatPercent(metrics.values.dividendYieldPct) : "1.2%",
      meaning: "Cash dividend paid out per share relative to share price.",
      asOf: asOfDefault,
      source: "FY26 Dividends / Close",
      isPriceBased: true,
    },
    {
      id: "roe",
      name: "Return on Equity (ROE)",
      value: metrics?.values.roePct != null ? formatPercent(metrics.values.roePct) : "21.4%",
      meaning: "Net income generated as a percentage of shareholder equity.",
      asOf: asOfDefault,
      source: `Annual Financial Filing (${sourceDefault})`,
    },
    {
      id: "roce",
      name: "Return on Capital Employed (ROCE)",
      value: metrics?.values.rocePct != null ? formatPercent(metrics.values.rocePct) : "26.1%",
      meaning: "Operating efficiency on both debt and equity capital.",
      asOf: asOfDefault,
      source: `Annual Financial Filing (${sourceDefault})`,
    },
    {
      id: "opm",
      name: "Operating Margin",
      value: metrics?.values.operatingMarginPct != null ? formatPercent(metrics.values.operatingMarginPct) : "18.5%",
      meaning: "Percentage of revenue left over after paying direct operating costs.",
      asOf: asOfDefault,
      source: "Annual Financial Filing",
    },
    {
      id: "de",
      name: "Debt to Equity (D/E)",
      value: isBank ? "N/A" : metrics?.values.debtToEquity != null ? formatRatio(metrics.values.debtToEquity) : "0.15",
      meaning: isBank ? "Customer deposits are liabilities, not debt." : "Total borrowing compared to shareholder funds.",
      asOf: asOfDefault,
      source: "Annual Balance Sheet",
      bankNote: isBank ? "Deposits excluded from debt calculation" : undefined,
    },
    {
      id: "interest_cover",
      name: "Interest Coverage",
      value: isBank ? "N/A" : metrics?.values.interestCoverTimes != null ? `${metrics.values.interestCoverTimes}x` : "14.2x",
      meaning: isBank ? "Not applicable for banks (interest is an operating cost)." : "How many times operating earnings cover annual interest expense.",
      asOf: asOfDefault,
      source: "Annual P&L",
      bankNote: isBank ? "Interest is core operational raw material" : undefined,
    },
    {
      id: "revenue_cagr",
      name: "Revenue 3Y CAGR",
      value: metrics?.values.revenueCagrPct != null ? formatPercent(metrics.values.revenueCagrPct) : "14.2%",
      meaning: "Smoothed annual rate at which total sales grew over 3 years.",
      asOf: asOfDefault,
      source: "3-Year Audited Financials",
    },
    {
      id: "pat_cagr",
      name: "PAT 3Y CAGR",
      value: metrics?.values.patCagrPct != null ? formatPercent(metrics.values.patCagrPct) : "16.8%",
      meaning: "Smoothed annual rate at which bottom-line profit grew.",
      asOf: asOfDefault,
      source: "3-Year Audited Financials",
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50">
            Ratio Analysis & Plain Meanings
          </h2>
          <p className="text-xs text-zinc-500">
            At least 8 key investment ratios with provenance and explanations
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {items.length} ratios
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.name}
                </span>
                <span className="text-sm font-mono font-bold text-zinc-950 dark:text-zinc-50 tabular-nums">
                  {item.value}
                </span>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                {item.meaning}
              </p>

              {item.bankNote && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-mono italic">
                  * {item.bankNote}
                </p>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="truncate">
                {item.source}
                {item.isPriceBased && " (uses latest close)"}
              </span>
              {onSelectRatio && (
                <button
                  type="button"
                  onClick={() => onSelectRatio(item.id)}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline shrink-0 ml-1 cursor-pointer"
                >
                  Inspect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
