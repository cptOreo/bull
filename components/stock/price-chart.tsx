"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { ChartWrapper } from "@/ui/chart-wrapper";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatPrice } from "@/lib/engine/format";
import type { ChartPoint, ChartSegment } from "@/lib/engine/types";

export interface PriceChartProps {
  ticker: string;
  name?: string;
  currency?: string;
  data?: { date: string; close: number }[];
  indexData?: { date: string; close: number }[];
  segments?: ChartSegment[];
  fiveYearReturnPct?: number;
  indexReturnPct?: number;
  className?: string;
}

export function PriceChart({
  ticker,
  name,
  currency = "INR",
  data,
  indexData,
  segments,
  fiveYearReturnPct,
  indexReturnPct,
  className = "",
}: PriceChartProps) {
  const currencySymbol = currency === "INR" ? "₹" : "$";

  if (segments && segments.length > 0) {
    const allPoints: Array<ChartPoint & { splitLabel?: string }> = [];
    const corporateActionNotices: string[] = [];

    segments.forEach((seg, sIdx) => {
      if (seg.corporateActionLabel) {
        corporateActionNotices.push(seg.corporateActionLabel);
      }
      seg.points.forEach((pt, pIdx) => {
        allPoints.push({
          ...pt,
          splitLabel: pIdx === 0 && sIdx > 0 ? seg.corporateActionLabel : undefined,
        });
      });
    });

    return (
      <div
        role="region"
        aria-label={`5-year normalized price performance chart for ${ticker} vs Nifty 50`}
        className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <div>
            <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50">
              5-Year Performance (Indexed to 100)
            </h2>
            <p className="text-xs text-zinc-500">
              Normalized price comparison against Nifty 50 benchmark
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {name ? `${name} (${ticker})` : ticker}
              </span>
              {fiveYearReturnPct !== undefined && (
                <span className="text-zinc-500">({fiveYearReturnPct >= 0 ? "+" : ""}{fiveYearReturnPct.toFixed(1)}%)</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300">Nifty 50</span>
              {indexReturnPct !== undefined && (
                <span className="text-zinc-500">({indexReturnPct >= 0 ? "+" : ""}{indexReturnPct.toFixed(1)}%)</span>
              )}
            </div>
          </div>
        </div>

        {corporateActionNotices.length > 0 && (
          <div className="mb-4 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>
              Corporate Action Break: {corporateActionNotices.join("; ")}. Series is adjusted and split at effective date.
            </span>
          </div>
        )}

        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={allPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} tickFormatter={(d: string) => d.slice(0, 7)} minTickGap={30} />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} domain={["auto", "auto"]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg shadow-xl border border-zinc-800 text-xs font-mono space-y-1">
                      <div className="text-zinc-400 text-[10px]">Date: {String(label || "")}</div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>{ticker}:</span>
                        <span className="font-bold">{Number(payload[0]?.value).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-zinc-300">
                        <span>Nifty 50:</span>
                        <span className="font-bold">{Number(payload[1]?.value).toFixed(1)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="stockIndexed" name={`${ticker} (Indexed)`} stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#059669" }} />
              <Line type="monotone" dataKey="indexIndexed" name="Nifty 50 (Indexed)" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <details className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <summary className="font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200">
            View price data table (accessible screen-reader fallback)
          </summary>
          <div className="mt-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">{ticker} Indexed</th>
                  <th className="p-2">Nifty 50 Indexed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {allPoints.slice(-12).map((pt, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-2">{pt.date}</td>
                    <td className="p-2 tabular-nums text-emerald-600 font-semibold">{pt.stockIndexed.toFixed(1)}</td>
                    <td className="p-2 tabular-nums text-zinc-500">{pt.indexIndexed.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    );
  }

  const chartData = (data || []).map(d => {
    const matchedIndex = indexData?.find(i => i.date === d.date);
    return {
      date: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      price: d.close,
      ...(matchedIndex ? { index: matchedIndex.close } : {}),
    };
  });

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Price Chart (5Y)</span>
          <span className="text-sm text-muted-foreground">{currencySymbol}{formatPrice((data || [])[(data || []).length - 1]?.close || 0)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartWrapper height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${formatPrice(v)}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }}
                labelFormatter={(d) => (d ? String(d) : "")}
                formatter={(v) => [`${currencySymbol}${formatPrice(Number(Array.isArray(v) ? v[0] : v) || 0)}`, "Price"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name={`${ticker} Price`}
              />
              {indexData && (
                <Line
                  type="monotone"
                  dataKey="index"
                  stroke="#71717a"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Index"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}
