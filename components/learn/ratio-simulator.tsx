"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface SimulatorPreset {
  id: string;
  name: string;
  description: string;
  price: number;
  eps: number;
  debtToEquity: number;
  netMargin: number;
}

export const SIMULATOR_PRESETS: SimulatorPreset[] = [
  {
    id: "fmcg-giant",
    name: "Steady FMCG Giant",
    description: "High margins, negligible debt, premium valuation multiple",
    price: 2500,
    eps: 65,
    debtToEquity: 0.05,
    netMargin: 22,
  },
  {
    id: "tech-platform",
    name: "High-Growth Tech Platform",
    description: "High revenue growth, early earnings, demanding valuation multiple",
    price: 280,
    eps: 4,
    debtToEquity: 0.1,
    netMargin: 8,
  },
  {
    id: "heavy-manufacturer",
    name: "Asset-Heavy Manufacturer",
    description: "Substantial plant capital expenditure, moderate leverage, cyclical earnings",
    price: 950,
    eps: 80,
    debtToEquity: 1.4,
    netMargin: 9,
  },
  {
    id: "debt-cyclical",
    name: "Debt-Strained Cyclical",
    description: "High leverage, depressed profit margins, refinancing sensitivity",
    price: 320,
    eps: 12,
    debtToEquity: 2.8,
    netMargin: 4,
  },
];

export interface RatioSimulatorProps {
  onAskTutor?: (prompt: string) => void;
  className?: string;
  initialValues?: {
    price?: number;
    eps?: number;
    debtToEquity?: number;
    netMargin?: number;
  };
}

export function RatioSimulator({
  onAskTutor,
  className,
  initialValues,
}: RatioSimulatorProps) {
  const [price, setPrice] = useState(initialValues?.price ?? 1200);
  const [eps, setEps] = useState(initialValues?.eps ?? 45);
  const [debtToEquity, setDebtToEquity] = useState(
    initialValues?.debtToEquity ?? 0.35,
  );
  const [netMargin, setNetMargin] = useState(initialValues?.netMargin ?? 16);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Core calculations
  const peRatio = eps > 0 ? Number((price / eps).toFixed(1)) : 0;
  const earningsYield = price > 0 ? Number(((eps / price) * 100).toFixed(2)) : 0;
  const paybackYears = peRatio > 0 ? Math.round(peRatio) : 0;

  // Valuation Zone classification
  let zoneLabel = "Reasonable";
  let zoneBadgeStyle = "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";

  if (peRatio < 15) {
    zoneLabel = "Deep Value (<15x)";
    zoneBadgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  } else if (peRatio <= 30) {
    zoneLabel = "Reasonable (15-30x)";
    zoneBadgeStyle = "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
  } else if (peRatio <= 50) {
    zoneLabel = "Growth / Priced for Perfection (30-50x)";
    zoneBadgeStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
  } else {
    zoneLabel = "Extreme Speculation (>50x)";
    zoneBadgeStyle = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
  }

  // Solvency classification based on Debt-to-Equity
  type SolvencyGrade = "conservative" | "moderate" | "leveraged";
  let solvencyGrade: SolvencyGrade = "conservative";
  let solvencyLabel = "Conservative (<0.5x)";
  let solvencyBadgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";

  if (debtToEquity < 0.5) {
    solvencyGrade = "conservative";
    solvencyLabel = "Conservative Balance Sheet (<0.5x)";
    solvencyBadgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  } else if (debtToEquity <= 1.5) {
    solvencyGrade = "moderate";
    solvencyLabel = "Moderate Leverage (0.5x-1.5x)";
    solvencyBadgeStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
  } else {
    solvencyGrade = "leveraged";
    solvencyLabel = "Highly Leveraged (>1.5x)";
    solvencyBadgeStyle = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
  }

  // Apply Preset
  const handleApplyPreset = (preset: SimulatorPreset) => {
    setPrice(preset.price);
    setEps(preset.eps);
    setDebtToEquity(preset.debtToEquity);
    setNetMargin(preset.netMargin);
    setActivePresetId(preset.id);
  };

  // Slider change clears preset selection
  const handleSliderChange = () => {
    setActivePresetId(null);
  };

  // Gauge pin position: normalized 0 to 70 range clamped to [0, 100]%
  const gaugePercent = Math.min(100, Math.max(0, (peRatio / 70) * 100));

  // Dynamic plain English explanation
  const getExplanation = () => {
    const lines: string[] = [];

    // Valuation analysis
    lines.push(
      `At a P/E of ${peRatio.toFixed(1)}x, you are paying ₹${peRatio.toFixed(1)} for every ₹1 of annual profit. It would take approximately ${paybackYears} years for current profits to pay back your purchase price without future earnings growth.`,
    );

    // Yield analysis
    lines.push(
      `This corresponds to an annual earnings yield of ${earningsYield.toFixed(1)}%. By comparison, a risk-free 10-year Indian Government Bond yields roughly 6.8%. ${
        earningsYield >= 6.8
          ? "The earnings yield offers an attractive initial premium over risk-free fixed income."
          : "The earnings yield sits below risk-free fixed deposits, meaning your investment thesis relies heavily on substantial future business growth."
      }`,
    );

    // Debt analysis
    if (solvencyGrade === "conservative") {
      lines.push(
        `Debt-to-equity is minimal at ${debtToEquity.toFixed(2)}x. The enterprise generates sufficient cash flow to operate without significant interest burden, providing strong defense during industry downturns.`,
      );
    } else if (solvencyGrade === "moderate") {
      lines.push(
        `Debt-to-equity is manageable at ${debtToEquity.toFixed(2)}x. Cash flow covers debt servicing during ordinary demand, though sharp interest rate hikes or cyclical margin drops should be monitored.`,
      );
    } else {
      lines.push(
        `High leverage at ${debtToEquity.toFixed(2)}x elevates financial risk. A significant chunk of operating income is committed to bank interest payments, narrowing the margin of error if revenue slows.`,
      );
    }

    // Margin analysis
    if (netMargin >= 20) {
      lines.push(
        `A high net profit margin of ${netMargin}% signals durable pricing power and competitive differentiation against competitors.`,
      );
    } else if (netMargin >= 10) {
      lines.push(
        `A net profit margin of ${netMargin}% reflects healthy operating control and sufficient cushion against input raw material inflation.`,
      );
    } else {
      lines.push(
        `A slim net margin of ${netMargin}% leaves narrow room for cost errors; small cost increases can swing the bottom line into losses.`,
      );
    }

    return lines;
  };

  const dynamicExplanations = getExplanation();

  return (
    <div
      data-testid="ratio-simulator"
      className={cn(
        "w-full rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-8 text-zinc-900 dark:text-zinc-100",
        className,
      )}
    >
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Valuation & Solvency Simulator
        </h2>
        <p className="text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Manipulate fundamental business levers to see how price, earnings, leverage, and margins interact in real time.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider font-mono font-medium text-zinc-500 dark:text-zinc-400">
          Load Market Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SIMULATOR_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={cn(
                  "p-3 rounded-xl text-left border transition-all text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500",
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                <div className="font-semibold line-clamp-1">{preset.name}</div>
                <div className="text-[11px] font-mono mt-1 opacity-70">
                  ₹{preset.price} / EPS ₹{preset.eps}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Controls & Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sliders Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Share Price Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="slider-price"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Share Price (₹)
              </label>
              <span
                data-testid="value-price"
                className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                ₹{price.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              id="slider-price"
              type="range"
              min={10}
              max={5000}
              step={10}
              value={price}
              aria-label="Share Price"
              aria-valuenow={price}
              aria-valuemin={10}
              aria-valuemax={5000}
              onChange={(e) => {
                setPrice(Number(e.target.value));
                handleSliderChange();
              }}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span>₹10</span>
              <span>₹2,500</span>
              <span>₹5,000</span>
            </div>
          </div>

          {/* EPS Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="slider-eps"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Earnings Per Share (EPS in ₹)
              </label>
              <span
                data-testid="value-eps"
                className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                ₹{eps}
              </span>
            </div>
            <input
              id="slider-eps"
              type="range"
              min={1}
              max={250}
              step={1}
              value={eps}
              aria-label="Earnings Per Share"
              aria-valuenow={eps}
              aria-valuemin={1}
              aria-valuemax={250}
              onChange={(e) => {
                setEps(Number(e.target.value));
                handleSliderChange();
              }}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span>₹1</span>
              <span>₹125</span>
              <span>₹250</span>
            </div>
          </div>

          {/* Debt-to-Equity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="slider-debt"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Debt-to-Equity Multiple
              </label>
              <span
                data-testid="value-debt"
                className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                {debtToEquity.toFixed(2)}x
              </span>
            </div>
            <input
              id="slider-debt"
              type="range"
              min={0}
              max={4.0}
              step={0.05}
              value={debtToEquity}
              aria-label="Debt to Equity Multiple"
              aria-valuenow={debtToEquity}
              aria-valuemin={0}
              aria-valuemax={4.0}
              onChange={(e) => {
                setDebtToEquity(Number(e.target.value));
                handleSliderChange();
              }}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span>0.0x (Zero Debt)</span>
              <span>1.5x (Prudent Ceiling)</span>
              <span>4.0x (Heavy Debt)</span>
            </div>
          </div>

          {/* Net Profit Margin Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="slider-margin"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Net Profit Margin (%)
              </label>
              <span
                data-testid="value-margin"
                className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                {netMargin}%
              </span>
            </div>
            <input
              id="slider-margin"
              type="range"
              min={2}
              max={40}
              step={1}
              value={netMargin}
              aria-label="Net Profit Margin"
              aria-valuenow={netMargin}
              aria-valuemin={2}
              aria-valuemax={40}
              onChange={(e) => {
                setNetMargin(Number(e.target.value));
                handleSliderChange();
              }}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span>2% (Thin Commodity)</span>
              <span>20% (Strong Moat)</span>
              <span>40% (Monopolistic)</span>
            </div>
          </div>
        </div>

        {/* Live Output & Zone Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Output Card */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-5 space-y-5">
            {/* Primary P/E Metric */}
            <div className="flex items-baseline justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  Calculated Valuation Multiple
                </div>
                <div
                  data-testid="calculated-pe"
                  className="text-3xl sm:text-4xl font-mono font-bold text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight mt-1"
                >
                  {peRatio.toFixed(1)}x
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  Earnings Yield
                </div>
                <div
                  data-testid="calculated-yield"
                  className="text-lg sm:text-xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1"
                >
                  {earningsYield.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Valuation Zone Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-600 dark:text-zinc-400">Valuation Zone</span>
                <span
                  data-testid="valuation-zone-badge"
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono tracking-tight",
                    zoneBadgeStyle,
                  )}
                >
                  {zoneLabel}
                </span>
              </div>

              {/* Visual Zone Bar with Pin */}
              <div className="relative pt-3 pb-1">
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                  <div
                    style={{ width: "21.4%" }}
                    className="h-full bg-emerald-500/70"
                    title="Deep Value (<15x)"
                  />
                  <div
                    style={{ width: "21.4%" }}
                    className="h-full bg-blue-500/70"
                    title="Reasonable (15-30x)"
                  />
                  <div
                    style={{ width: "28.6%" }}
                    className="h-full bg-amber-500/70"
                    title="Growth (30-50x)"
                  />
                  <div
                    style={{ width: "28.6%" }}
                    className="h-full bg-rose-500/70"
                    title="Extreme Speculation (>50x)"
                  />
                </div>

                {/* Marker Pin */}
                <div
                  data-testid="gauge-pin"
                  style={{ left: `${gaugePercent}%` }}
                  className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center transition-all duration-150"
                >
                  <div className="w-3 h-3 rounded-full bg-zinc-900 dark:bg-white border-2 border-white dark:border-zinc-950 shadow-sm" />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-zinc-600 dark:text-zinc-400 pt-1.5">
                  <span>0x</span>
                  <span>15x</span>
                  <span>30x</span>
                  <span>50x</span>
                  <span>70x+</span>
                </div>
              </div>
            </div>

            {/* Solvency Indicator */}
            <div className="flex items-center justify-between text-xs font-mono border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <span className="text-zinc-600 dark:text-zinc-400">Financial Health</span>
              <span
                data-testid="solvency-badge"
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono tracking-tight",
                  solvencyBadgeStyle,
                )}
              >
                {solvencyLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Plain-English Explanation Card */}
      <div
        data-testid="explanation-card"
        className="rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider font-mono font-medium text-zinc-500 dark:text-zinc-400">
            Real-World Economic Meaning
          </div>
          {onAskTutor && (
            <button
              type="button"
              onClick={() => {
                const prompt = `Analyze a stock scenario with Share Price ₹${price}, EPS ₹${eps} (P/E ${peRatio.toFixed(1)}x, Earnings Yield ${earningsYield.toFixed(1)}%), Debt-to-Equity ${debtToEquity.toFixed(2)}x, and Net Margin ${netMargin}%. Is this pricing reasonable and what specific risks should an investor consider?`;
                onAskTutor(prompt);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <span>Ask AI Tutor about this scenario</span>
            </button>
          )}
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {dynamicExplanations.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RatioSimulator;
