"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { formatPrice, formatSignedPercent, formatCrore } from "@/lib/engine/format";
import { TrendingUp, TrendingDown, Building2, DollarSign, Percent, Target } from "lucide-react";

export interface StockHeaderProps {
  stock?: {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    dayHigh?: number | null;
    dayLow?: number | null;
    fiftyTwoWeekHigh?: number | null;
    fiftyTwoWeekLow?: number | null;
    marketCap?: number | null;
    marketCapFormatted?: string;
    peRatio?: number | null;
    pbRatio?: number | null;
    dividendYield?: number | null;
    sector?: string | null;
    industry?: string | null;
    asOf?: string;
    source?: string;
  };
  ticker?: string;
  name?: string;
  sector?: string;
  sectorId?: string;
  latestClose?: number;
  oneSessionMovePct?: number;
  marketCapCr?: number;
  asOf?: string;
  sourceLabel?: string;
  freshness?: string;
  isTailExpired?: boolean;
  isMonthlyExpired?: boolean;
  className?: string;
}

export function StockHeader(props: StockHeaderProps) {
  const isMonthlyExpired = props.isMonthlyExpired ?? false;
  const isTailExpired = props.isTailExpired ?? false;

  const stock = props.stock ?? {
    ticker: props.ticker || "",
    name: props.name || "",
    price: props.latestClose ?? 0,
    change: (props.latestClose ?? 0) * ((props.oneSessionMovePct ?? 0) / 100),
    changePercent: props.oneSessionMovePct ?? 0,
    currency: "INR",
    dayHigh: null,
    dayLow: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    marketCap: props.marketCapCr ? props.marketCapCr * 1e7 : null,
    marketCapFormatted: props.marketCapCr ? `₹${formatCrore(props.marketCapCr)} Cr` : "",
    peRatio: null,
    pbRatio: null,
    dividendYield: null,
    sector: props.sector ?? null,
    industry: null,
    asOf: props.asOf || new Date().toISOString(),
    source: props.sourceLabel || "BSE / NSE",
  };

  const isPositive = stock.changePercent >= 0;
  const currencySymbol = stock.currency === "INR" ? "₹" : "$";
  const rangePercent = stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh > stock.fiftyTwoWeekLow
    ? ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100
    : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-6", props.className)}
    >
      {/* Expired / Fallback Alerts */}
      {isMonthlyExpired && (
        <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Monthly series expired. Valuation metrics are disabled for fit and shown for historical study only.</span>
        </div>
      )}

      {isTailExpired && !isMonthlyExpired && (
        <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>Recent daily price tail expired. Price displayed reflects latest available monthly close.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">
            {stock.ticker.replace(".NS", "").replace(".BO", "")}
          </span>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-muted text-muted-foreground">
            {stock.ticker.endsWith(".NS") ? "NSE" : stock.ticker.endsWith(".BO") ? "BSE" : "NSE"}
          </span>
          {props.marketCapCr !== undefined && (
            <span className="text-xs font-mono text-muted-foreground">
              ₹{formatCrore(props.marketCapCr)} Cr
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-wrap">{stock.name}</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex items-baseline gap-4">
          <motion.span
            key={stock.price}
            className="text-4xl sm:text-5xl font-mono font-bold tabular-nums"
          >
            {currencySymbol}{formatPrice(stock.price)}
          </motion.span>
          <motion.div
            key={stock.changePercent}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono font-semibold",
              isPositive ? "bg-positive/10 text-positive border border-positive/20" : "bg-negative/10 text-negative border border-negative/20"
            )}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? "▲ +" : "▼ "}{formatSignedPercent(stock.changePercent).replace("+", "")}</span>
            {stock.change !== 0 && (
              <span className="text-muted-foreground">({isPositive ? "+" : ""}{stock.change.toFixed(2)})</span>
            )}
          </motion.div>
        </div>

        {(stock.dayLow != null || stock.fiftyTwoWeekLow != null) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {stock.dayLow != null && (
              <span className="font-mono">Day: {currencySymbol}{formatPrice(stock.dayLow)} – {currencySymbol}{formatPrice(stock.dayHigh || 0)}</span>
            )}
            {stock.fiftyTwoWeekLow != null && (
              <span className="font-mono">52W: {currencySymbol}{formatPrice(stock.fiftyTwoWeekLow)} – {currencySymbol}{formatPrice(stock.fiftyTwoWeekHigh || 0)}</span>
            )}
          </div>
        )}
      </div>

      {stock.fiftyTwoWeekHigh != null && stock.fiftyTwoWeekLow != null && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>52-Week Range</span>
            <span className="font-semibold text-foreground">Pin: {Math.round(rangePercent)}%</span>
          </div>
          <div className="relative h-3">
            <div className="absolute inset-0 h-full bg-gradient-to-r from-negative via-muted to-positive rounded-full" />
            <motion.div
              style={{ left: `${Math.max(0, Math.min(100, rangePercent))}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-foreground shadow-lg transition-all duration-500 ease-out"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Low: {currencySymbol}{formatPrice(stock.fiftyTwoWeekLow || 0)}</span>
            <span>High: {currencySymbol}{formatPrice(stock.fiftyTwoWeekHigh || 0)}</span>
          </div>
        </div>
      )}

      {props.stock && (stock.marketCapFormatted || stock.sector) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Market Cap"
            value={stock.marketCapFormatted || "N/A"}
            color="text-blue-500"
          />
          <StatCard
            icon={<Percent className="h-5 w-5" />}
            label="P/E Ratio"
            value={stock.peRatio ? `${stock.peRatio.toFixed(1)}x` : "N/A"}
            color="text-emerald-500"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Dividend Yield"
            value={stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "0.00%"}
            color="text-amber-500"
          />
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Sector"
            value={stock.sector || "N/A"}
            color="text-violet-500"
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Data as of {stock.asOf}</span>
        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{(stock.source || "BSE / NSE").toUpperCase()}</span>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-xl glass dark:glass-dark border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-lg", color)}>{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="font-mono font-semibold text-lg">{value}</p>
    </div>
  );
}
