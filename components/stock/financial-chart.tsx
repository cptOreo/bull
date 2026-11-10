"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { FinancialYear } from "@/lib/data/schema";
import { formatCrore, formatPercent } from "@/lib/engine/format";

export interface FinancialChartProps {
  ticker: string;
  financials: FinancialYear[];
  initialView?: "revenue_profit" | "margins";
  className?: string;
}

export function FinancialChart({
  ticker,
  financials,
  initialView = "revenue_profit",
  className = "",
}: FinancialChartProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"revenue_profit" | "margins">(initialView);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare chart dataset
  const chartData = financials.map((fy) => {
    const revenue = fy.revenueCr;
    const pat = fy.patCr;
    const opm = revenue > 0 ? (fy.ebitCr / revenue) * 100 : 0;
    const npm = revenue > 0 ? (pat / revenue) * 100 : 0;

    return {
      fy: fy.fy,
      periodEnd: fy.periodEnd,
      revenueCr: revenue,
      patCr: pat,
      opmPct: Number(opm.toFixed(1)),
      npmPct: Number(npm.toFixed(1)),
    };
  });

  return (
    <div
      role="region"
      aria-label={`Financial historical trends for ${ticker}`}
      className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs ${className}`}
    >
      {/* Header and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
        <div>
          <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50">
            Multi-Year Financial Trends
          </h2>
          <p className="text-xs text-zinc-500">
            Audited annual trajectory ({financials.length}-year comparison)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setView("revenue_profit")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              view === "revenue_profit"
                ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Revenue & PAT (₹ Cr)
          </button>
          <button
            type="button"
            onClick={() => setView("margins")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              view === "margins"
                ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Operating & Net Margins (%)
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full h-72 sm:h-80">
        {!mounted ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-xs font-mono text-zinc-400 animate-pulse">
            Loading interactive financial chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-xs text-zinc-400">
            No annual financial statements available.
          </div>
        ) : view === "revenue_profit" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="fy"
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                tickFormatter={(val: number) => `₹${formatCrore(val)}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg shadow-xl border border-zinc-800 text-xs font-mono space-y-1.5">
                      <div className="text-zinc-400 text-[10px] font-semibold">
                        Financial Year: {label}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-blue-400">
                        <span>Revenue:</span>
                        <span className="font-bold">₹{formatCrore(Number(payload[0]?.value))} Cr</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>Net Profit (PAT):</span>
                        <span className="font-bold">₹{formatCrore(Number(payload[1]?.value))} Cr</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey="revenueCr"
                name="Revenue (₹ Cr)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="patCr"
                name="Net Profit / PAT (₹ Cr)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="fy"
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                tickFormatter={(val: number) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg shadow-xl border border-zinc-800 text-xs font-mono space-y-1.5">
                      <div className="text-zinc-400 text-[10px] font-semibold">
                        Financial Year: {label}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-purple-400">
                        <span>Operating Margin:</span>
                        <span className="font-bold">{Number(payload[0]?.value).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>Net Profit Margin:</span>
                        <span className="font-bold">{Number(payload[1]?.value).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="opmPct"
                name="Operating Margin (%)"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: "#7c3aed" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="npmPct"
                name="Net Margin (%)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#059669" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Accessible Table Fallback */}
      <details className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <summary className="font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200">
          View tabular statement data (accessible screen-reader fallback)
        </summary>
        <div className="mt-2 overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <table className="w-full text-left text-[11px] font-mono">
            <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="p-2">Financial Year</th>
                <th className="p-2">Revenue (₹ Cr)</th>
                <th className="p-2">PAT (₹ Cr)</th>
                <th className="p-2">Operating Margin</th>
                <th className="p-2">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {chartData.map((d, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-2 font-semibold">{d.fy}</td>
                  <td className="p-2 tabular-nums">₹{formatCrore(d.revenueCr)}</td>
                  <td className="p-2 tabular-nums text-emerald-600 font-medium">₹{formatCrore(d.patCr)}</td>
                  <td className="p-2 tabular-nums text-purple-600">{formatPercent(d.opmPct)}</td>
                  <td className="p-2 tabular-nums">{formatPercent(d.npmPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
