"use client";

import React from "react";
import type { MetricValues } from "@/lib/engine/types";
import { formatPercent, formatRatio, formatTimes } from "@/lib/engine/format";

export interface MetricGridProps {
  ticker: string;
  values: Partial<MetricValues>;
  sectorModel?: "financial" | "non_financial";
  sectorMedianPe?: number | null;
  sectorMedianPb?: number | null;
  asOf?: string;
  onSelectMetric?: (metricId: string, metricLabel: string, valueFormatted: string) => void;
  className?: string;
}

interface MetricItem {
  id: string;
  label: string;
  value: string;
  benchmark?: string;
  note?: string;
  unit?: string;
}

export function MetricGrid({
  ticker,
  values,
  sectorModel = "non_financial",
  sectorMedianPe,
  sectorMedianPb,
  asOf,
  onSelectMetric,
  className = "",
}: MetricGridProps) {
  const isBank = sectorModel === "financial";

  // Card 1: Valuation
  const valuationMetrics: MetricItem[] = [
    {
      id: `${ticker}:pe`,
      label: "Price to Earnings (P/E)",
      value: values.pe !== null && values.pe !== undefined ? `${formatRatio(values.pe)}x` : "N/A",
      benchmark: sectorMedianPe ? `Sector Median: ${formatRatio(sectorMedianPe)}x` : undefined,
      note: "Price per ₹1 of annual earnings",
    },
    {
      id: `${ticker}:pb`,
      label: "Price to Book (P/B)",
      value: values.pb !== null && values.pb !== undefined ? `${formatRatio(values.pb)}x` : "N/A",
      benchmark: sectorMedianPb ? `Sector Median: ${formatRatio(sectorMedianPb)}x` : undefined,
      note: "Market value vs net worth",
    },
    {
      id: `${ticker}:dividendYield`,
      label: "Dividend Yield",
      value: values.dividendYieldPct !== null && values.dividendYieldPct !== undefined ? formatPercent(values.dividendYieldPct) : "0.0%",
      note: "Annual dividend return on current price",
    },
  ];

  // Card 2: Profitability & Returns
  const profitabilityMetrics: MetricItem[] = [
    {
      id: `${ticker}:roe`,
      label: "Return on Equity (ROE)",
      value: values.roePct !== null && values.roePct !== undefined ? formatPercent(values.roePct) : "N/A",
      note: "Net profit generated per ₹100 equity",
    },
    {
      id: `${ticker}:roce`,
      label: "Return on Capital (ROCE)",
      value: values.rocePct !== null && values.rocePct !== undefined ? formatPercent(values.rocePct) : "N/A",
      note: "EBIT return on total capital deployed",
    },
    {
      id: `${ticker}:operatingMargin`,
      label: "Operating Margin (OPM)",
      value: values.operatingMarginPct !== null && values.operatingMarginPct !== undefined ? formatPercent(values.operatingMarginPct) : "N/A",
      note: "Core operational profit margin",
    },
  ];

  // Card 3: Balance Sheet & Solvency
  const solvencyMetrics: MetricItem[] = isBank
    ? [
        {
          id: `${ticker}:debtToEquity`,
          label: "Debt to Equity (D/E)",
          value: "N/A (Bank)",
          note: "Deposits excluded from debt for financial institutions",
        },
        {
          id: `${ticker}:interestCover`,
          label: "Interest Coverage",
          value: "Not Applicable",
          note: "Interest is an operational raw material for banks",
        },
        {
          id: `${ticker}:capitalAdequacy`,
          label: "Solvency Model",
          value: "Reserve Bank Norms",
          note: "Bank stability governed by regulatory CRAR tiers",
        },
      ]
    : [
        {
          id: `${ticker}:debtToEquity`,
          label: "Debt to Equity (D/E)",
          value: values.debtToEquity !== null && values.debtToEquity !== undefined ? formatRatio(values.debtToEquity) : "N/A",
          benchmark: "Safe: < 1.0x",
          note: "Ratio of borrowed funds to owner equity",
        },
        {
          id: `${ticker}:interestCover`,
          label: "Interest Coverage",
          value: values.interestCoverTimes !== null && values.interestCoverTimes !== undefined ? formatTimes(values.interestCoverTimes) : "N/A",
          benchmark: "Healthy: > 3.0x",
          note: "Times earnings can pay interest expense",
        },
        {
          id: `${ticker}:balanceHealth`,
          label: "Balance Sheet Health",
          value: (values.debtToEquity ?? 0) < 0.5 ? "Low Leverage" : (values.debtToEquity ?? 0) < 1.5 ? "Moderate" : "Elevated Debt",
          note: "Capital structure solvency assessment",
        },
      ];

  // Card 4: Growth & Volatility
  const growthMetrics: MetricItem[] = [
    {
      id: `${ticker}:revenueCagr`,
      label: "3Y Sales CAGR",
      value: values.revenueCagrPct !== null && values.revenueCagrPct !== undefined ? formatPercent(values.revenueCagrPct) : "N/A",
      note: "Compound annual top-line revenue growth",
    },
    {
      id: `${ticker}:patCagr`,
      label: "3Y Profit CAGR",
      value: values.patCagrPct !== null && values.patCagrPct !== undefined ? formatPercent(values.patCagrPct) : "N/A",
      note: "Compound annual net profit after tax growth",
    },
    {
      id: `${ticker}:volatility`,
      label: "1Y Annualized Volatility",
      value: values.volatilityPct !== null && values.volatilityPct !== undefined ? formatPercent(values.volatilityPct) : "N/A",
      note: "Standard deviation of periodic returns",
    },
    {
      id: `${ticker}:maxDrawdown`,
      label: "5Y Max Drawdown",
      value: values.maxDrawdownPct !== null && values.maxDrawdownPct !== undefined ? formatPercent(values.maxDrawdownPct) : "N/A",
      note: "Deepest peak-to-trough decline over 5 years",
    },
  ];

  const cards = [
    {
      title: "1. Valuation",
      subtitle: "Price paid relative to business earnings and book value",
      metrics: valuationMetrics,
      accent: "border-blue-500/30",
    },
    {
      title: "2. Profitability & Returns",
      subtitle: "Capital efficiency and margins generated on equity",
      metrics: profitabilityMetrics,
      accent: "border-emerald-500/30",
    },
    {
      title: "3. Balance Sheet & Solvency",
      subtitle: isBank ? "Banking model: customer deposits excluded from debt" : "Solvency buffer, leverage, and interest coverage",
      metrics: solvencyMetrics,
      accent: "border-amber-500/30",
    },
    {
      title: "4. Growth & Volatility",
      subtitle: "Compound earnings trajectory and drawdown risk profile",
      metrics: growthMetrics,
      accent: "border-purple-500/30",
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-zinc-950 dark:text-zinc-50">
            Core Financial Metrics & Ratios
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Click any metric info icon to inspect its 4-rung provenance trail
          </p>
        </div>
        {asOf && (
          <span className="text-xs font-mono text-zinc-400">
            As of: {asOf}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, cardIdx) => (
          <div
            key={cardIdx}
            className={`p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors`}
          >
            <div>
              <div className="pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {card.title}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {card.subtitle}
                </p>
              </div>

              <div className="space-y-3">
                {card.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group"
                  >
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {metric.label}
                        </span>
                        {onSelectMetric && (
                          <button
                            type="button"
                            onClick={() => onSelectMetric(metric.id, metric.label, metric.value)}
                            title="Inspect 4-rung provenance"
                            aria-label={`Inspect audit trail for ${metric.label}`}
                            className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {metric.note}
                      </div>
                      {metric.benchmark && (
                        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                          {metric.benchmark}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {metric.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {cardIdx === 2 && isBank && (
              <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-amber-700 dark:text-amber-400 italic">
                * Banking note: Customer deposits are primary liabilities, not debt.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
