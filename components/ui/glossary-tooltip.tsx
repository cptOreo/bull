"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface TermDefinition {
  id: string;
  name: string;
  shortLabel: string;
  category: "Valuation" | "Profitability" | "Solvency" | "Dividends" | "Risk";
  definition: string;
  analogy: string;
  formula?: string;
  ruleOfThumb?: string;
}

export const FINANCIAL_TERMS: Record<string, TermDefinition> = {
  pe: {
    id: "pe",
    name: "Price-to-Earnings Ratio",
    shortLabel: "P/E Ratio",
    category: "Valuation",
    definition: "Compares current stock price to annual profit per share.",
    analogy:
      "If an apartment costs ₹20L and brings ₹1L annual rent, P/E is 20x. You pay ₹20 for every ₹1 of profit.",
    formula: "Share Price / Earnings Per Share (EPS)",
    ruleOfThumb: "Lower P/E may indicate fair pricing, while higher P/E reflects growth expectations.",
  },
  marketCap: {
    id: "marketCap",
    name: "Market Capitalisation",
    shortLabel: "Market Cap",
    category: "Valuation",
    definition: "Total market value of all outstanding shares issued by the company.",
    analogy:
      "Think of a pizza sliced into 10 pieces at ₹50 each. The whole pizza is worth ₹500. Market cap is the price tag of the entire company.",
    formula: "Current Share Price × Total Number of Shares",
    ruleOfThumb: "Large caps (>₹20,000 Cr) are usually stable; mid and small caps carry more swing.",
  },
  debtToEquity: {
    id: "debtToEquity",
    name: "Debt-to-Equity Ratio",
    shortLabel: "Debt / Equity",
    category: "Solvency",
    definition: "Compares what the business owes creditors against what owners invested.",
    analogy:
      "If you buy a house with an ₹80L home loan and ₹20L own cash, your debt-to-equity is 4:1. High debt adds interest pressure when revenues dip.",
    formula: "Total Debt / Total Shareholder Net Worth",
    ruleOfThumb: "A ratio below 1.0x is generally conservative for non-financial companies.",
  },
  roce: {
    id: "roce",
    name: "Return on Capital Employed",
    shortLabel: "ROCE",
    category: "Profitability",
    definition: "Measures operating profit generated from total capital invested across equity and loans.",
    analogy:
      "If you set up a cafe with ₹10L total capital and generate ₹2L operating profit, ROCE is 20%. It reveals how hard money works.",
    formula: "Operating Profit (EBIT) / Capital Employed × 100",
    ruleOfThumb: "Consistently above 15% indicates strong operational efficiency.",
  },
  dividendYield: {
    id: "dividendYield",
    name: "Dividend Yield",
    shortLabel: "Dividend Yield",
    category: "Dividends",
    definition: "Annual cash dividends paid out per share divided by current share price.",
    analogy:
      "Like fixed deposit interest. If you buy a ₹1,000 share and it deposits ₹40 cash each year into your bank account, your dividend yield is 4%.",
    formula: "Annual Dividend Per Share / Share Price × 100",
    ruleOfThumb: "Provides direct cash returns to shareholders without selling the shares.",
  },
  drawdown: {
    id: "drawdown",
    name: "Maximum Drawdown",
    shortLabel: "Max Drawdown",
    category: "Risk",
    definition: "The largest peak-to-trough price percentage decline before reaching a new high.",
    analogy:
      "The roller-coaster test. If a stock slides from ₹1,000 to ₹700 during a market crash before recovering, you endured a 30% drawdown.",
    formula: "(Trough Price - Peak Price) / Peak Price × 100",
    ruleOfThumb: "Helps you gauge historical risk and worst-case price swings.",
  },
  roe: {
    id: "roe",
    name: "Return on Equity",
    shortLabel: "ROE",
    category: "Profitability",
    definition: "Net profit generated relative to total shareholder funds.",
    analogy:
      "If you start a venture with ₹5L of your own money and book ₹1L net profit in year one, your ROE is 20% on your own stake.",
    formula: "Profit After Tax / Total Net Worth × 100",
    ruleOfThumb: "Sustained ROE above 15% demonstrates disciplined compounding.",
  },
  pb: {
    id: "pb",
    name: "Price-to-Book Ratio",
    shortLabel: "P/B Ratio",
    category: "Valuation",
    definition: "Compares market price to the net asset value recorded on the balance sheet.",
    analogy:
      "If a grocery shop owns ₹10L of physical shelves and stock, but sells for ₹15L, you pay 1.5x book value for its customer footfall and brand.",
    formula: "Share Price / Book Value Per Share",
    ruleOfThumb: "Valuable for capital-intensive companies like manufacturing and private lenders.",
  },
  volatility: {
    id: "volatility",
    name: "Historical Volatility",
    shortLabel: "Volatility",
    category: "Risk",
    definition: "The speed and magnitude of price swings up and down over a given period.",
    analogy:
      "Airplane turbulence. A steady widebody flight has low volatility; a small glider in storm winds has high volatility.",
    formula: "Standard Deviation of Annualized Price Returns",
    ruleOfThumb: "Lower volatility implies smoother day-to-day share price changes.",
  },
  cagr: {
    id: "cagr",
    name: "Compound Annual Growth Rate",
    shortLabel: "CAGR",
    category: "Profitability",
    definition: "The smoothed annual rate at which an investment grows from start to finish.",
    analogy:
      "A car trip average speedometer. You stopped for tea and sped on the highway, but your steady average pace was 60 km/h.",
    formula: "(Ending Value / Beginning Value)^(1 / Years) - 1",
    ruleOfThumb: "Smooths out erratic market ups and downs into one annualized number.",
  },
};

// Aliases for flexible term matching
const TERM_ALIASES: Record<string, string> = {
  pe: "pe",
  "p/e": "pe",
  "p/e ratio": "pe",
  "price to earnings": "pe",
  "price-to-earnings": "pe",
  marketcap: "marketCap",
  "market cap": "marketCap",
  "market capitalisation": "marketCap",
  "market capitalization": "marketCap",
  debt: "debtToEquity",
  debttoequity: "debtToEquity",
  "debt to equity": "debtToEquity",
  "debt/equity": "debtToEquity",
  roce: "roce",
  dividend: "dividendYield",
  dividendyield: "dividendYield",
  "dividend yield": "dividendYield",
  drawdown: "drawdown",
  "max drawdown": "drawdown",
  "maximum drawdown": "drawdown",
  roe: "roe",
  pb: "pb",
  "p/b": "pb",
  "p/b ratio": "pb",
  "price to book": "pb",
  volatility: "volatility",
  cagr: "cagr",
};

export function lookupTerm(query: string): TermDefinition | undefined {
  const normalized = query.toLowerCase().trim();
  const canonicalId = TERM_ALIASES[normalized] || normalized;
  return FINANCIAL_TERMS[canonicalId];
}

const CATEGORY_COLORS: Record<TermDefinition["category"], { bg: string; text: string; border: string }> = {
  Valuation: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  Profitability: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  Solvency: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  Dividends: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
  },
  Risk: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
  },
};

export interface GlossaryTooltipProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  showIcon?: boolean;
}

export function GlossaryTooltip({
  term,
  children,
  className,
  side = "top",
  showIcon = false,
}: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const data = lookupTerm(term);

  const openTooltip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  }, []);

  const closeTooltip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  const toggleTooltip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen((prev) => !prev);
  }, []);

  // Dismiss on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!data) {
    return <span className={className}>{children || term}</span>;
  }

  const catStyle = CATEGORY_COLORS[data.category];

  const sidePositionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  }[side];

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={isOpen ? id : undefined}
        aria-expanded={isOpen}
        onClick={toggleTooltip}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={cn(
          "inline-flex items-center gap-1 font-medium text-inherit decoration-dotted underline decoration-zinc-400 dark:decoration-zinc-500 underline-offset-4 hover:decoration-emerald-500 dark:hover:decoration-emerald-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-sm cursor-help transition-all",
          isOpen && "decoration-emerald-500 text-emerald-600 dark:text-emerald-400"
        )}
      >
        <span>{children || data.shortLabel}</span>
        {showIcon && (
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono font-bold"
          >
            ?
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-50 w-72 sm:w-80 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-3.5 text-left text-zinc-900 dark:text-zinc-100 transition-all duration-150 animate-in fade-in-0 zoom-in-95 pointer-events-auto",
            sidePositionClasses
          )}
          onMouseEnter={openTooltip}
          onMouseLeave={closeTooltip}
        >
          {/* Header with Term and Category */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <h4 className="text-xs font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
                {data.name}
              </h4>
              <p className="text-[11px] text-zinc-500 font-mono font-medium">{data.shortLabel}</p>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold border font-mono tracking-wide",
                catStyle.bg,
                catStyle.text,
                catStyle.border
              )}
            >
              {data.category}
            </span>
          </div>

          {/* Definition */}
          <div className="mt-2.5">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {data.definition}
            </p>
          </div>

          {/* Real-World Analogy */}
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200/90 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-[11px] text-amber-800 dark:text-amber-300 uppercase tracking-wider font-mono">
              <span>💡</span>
              <span>Real-World Analogy</span>
            </div>
            <p className="text-[11px] leading-relaxed italic text-amber-950 dark:text-amber-100">
              &ldquo;{data.analogy}&rdquo;
            </p>
          </div>

          {/* Optional Formula / Takeaway */}
          {data.formula && (
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span className="text-zinc-400">Formula:</span>
              <span className="text-zinc-700 dark:text-zinc-300 truncate font-semibold ml-1">
                {data.formula}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlossaryTooltip;
