"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GlossaryTooltip } from "@/components/ui/glossary-tooltip";
import {
  type LiveStockSnapshot,
  type StockSearchResult,
  getLiveStockQuote,
  searchStocks,
} from "@/lib/data/live";

export interface StockDissectorProps {
  onAskTutor?: (prompt: string) => void;
  initialTicker?: string;
  fetchQuote?: (ticker: string) => Promise<LiveStockSnapshot | null>;
  searchFn?: (query: string) => Promise<StockSearchResult[]>;
  className?: string;
}

export const POPULAR_DISSECTION_PILLS = [
  { label: "Zomato", symbol: "ZOMATO" },
  { label: "Tata Motors", symbol: "TATAMOTORS" },
  { label: "Reliance", symbol: "RELIANCE" },
  { label: "TCS", symbol: "TCS" },
  { label: "Apple", symbol: "AAPL" },
  { label: "HDFC Bank", symbol: "HDFCBANK" },
  { label: "ITC", symbol: "ITC" },
  { label: "Nvidia", symbol: "NVDA" },
];

export function StockDissector({
  onAskTutor,
  initialTicker = "TCS",
  fetchQuote,
  searchFn,
  className,
}: StockDissectorProps) {
  const [selectedTicker, setSelectedTicker] = useState(initialTicker);
  const [quote, setQuote] = useState<LiveStockSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch quote implementation
  const loadQuote = useCallback(
    async (ticker: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (fetchQuote) {
          const res = await fetchQuote(ticker);
          if (res) {
            setQuote(res);
            setIsLoading(false);
            return;
          }
        }

        // Try API endpoint first
        try {
          const apiRes = await fetch(`/api/stocks/${encodeURIComponent(ticker)}`);
          if (apiRes.ok) {
            const data: LiveStockSnapshot = await apiRes.json();
            setQuote(data);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall through to direct getLiveStockQuote fallback
        }

        // Direct call fallback (works in tests, SSR, and offline)
        const fallbackQuote = await getLiveStockQuote(ticker);
        if (fallbackQuote) {
          setQuote(fallbackQuote);
        } else {
          setErrorMessage(
            `Could not resolve fundamentals or quote for "${ticker}". Try searching for another symbol or company name.`,
          );
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading stock fundamentals.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchQuote],
  );

  // Load quote on ticker change
  useEffect(() => {
    if (selectedTicker) {
      loadQuote(selectedTicker);
    }
  }, [selectedTicker, loadQuote]);

  // Handle Search Input with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        if (searchFn) {
          const results = await searchFn(value.trim());
          setSearchResults(results);
          setIsDropdownOpen(results.length > 0);
          setIsSearching(false);
          return;
        }

        // Try API endpoint
        try {
          const res = await fetch(
            `/api/stocks/search?q=${encodeURIComponent(value.trim())}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { results?: StockSearchResult[] };
            setSearchResults(data.results || []);
            setIsDropdownOpen((data.results || []).length > 0);
            setIsSearching(false);
            return;
          }
        } catch {
          // Fallback to direct searchStocks
        }

        const fallbackResults = await searchStocks(value.trim());
        setSearchResults(fallbackResults);
        setIsDropdownOpen(fallbackResults.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSelectResult = (result: StockSearchResult) => {
    setSelectedTicker(result.symbol);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedTicker(searchQuery.trim());
      setIsDropdownOpen(false);
    }
  };

  // Calculations for 52-week position
  const currPrice = quote?.price ?? 0;
  const fiftyTwoLow = quote?.fiftyTwoWeekLow ?? currPrice * 0.85;
  const fiftyTwoHigh = quote?.fiftyTwoWeekHigh ?? currPrice * 1.15;
  const rangeSpan = fiftyTwoHigh - fiftyTwoLow;
  const rangePercent =
    rangeSpan > 0
      ? Math.min(100, Math.max(0, ((currPrice - fiftyTwoLow) / rangeSpan) * 100))
      : 50;

  const isINR = quote?.currency === "INR" || quote?.ticker.endsWith(".NS");
  const currencySymbol = isINR ? "₹" : "$";
  const isPositiveMove = (quote?.change ?? 0) >= 0;

  return (
    <div
      data-testid="stock-dissector"
      className={cn(
        "w-full rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-8 text-zinc-900 dark:text-zinc-100",
        className,
      )}
    >
      {/* Header & Title */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Live Stock Dissector
        </h2>
        <p className="text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Dissect any listed business to inspect its real-world cash engine, valuation multiple, balance sheet durability, and core risks.
        </p>
      </div>

      {/* Search Input & Quick Select Pills */}
      <div className="space-y-4">
        <div ref={searchContainerRef} className="relative w-full max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-controls="stock-search-results"
              aria-label="Search company or stock symbol"
              placeholder="Search any Indian or global company (e.g. Infy, L&T, Apple)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              className="w-full h-11 pl-10 pr-24 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
            />
            {/* Search Icon */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 dark:text-zinc-400">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Submit / Dissect Button */}
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Dissect
            </button>
          </form>

          {/* Search Dropdown Results */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div
              id="stock-search-results"
              role="listbox"
              className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1"
            >
              {searchResults.map((res) => (
                <button
                  key={res.symbol}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelectResult(res)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
                >
                  <div className="truncate pr-2">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {res.symbol}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                      {res.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                    {res.exchange}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="absolute right-24 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              Searching...
            </div>
          )}
        </div>

        {/* Popular Quick-Select Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 mr-1">
            Quick Select:
          </span>
          {POPULAR_DISSECTION_PILLS.map((pill) => {
            const isCurrent =
              selectedTicker.toUpperCase() === pill.symbol.toUpperCase() ||
              selectedTicker.toUpperCase().startsWith(pill.symbol.toUpperCase());
            return (
              <button
                key={pill.symbol}
                type="button"
                onClick={() => setSelectedTicker(pill.symbol)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500",
                  isCurrent
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 font-semibold"
                    : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div
          data-testid="stock-dissector-loading"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
            <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
          <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
            <div className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
            <div className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
            <div className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div
          data-testid="stock-dissector-error"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-950 dark:text-rose-200 space-y-3"
        >
          <div className="font-bold flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Stock Dissection Notice</span>
          </div>
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => loadQuote(selectedTicker)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
          >
            Retry Dissection
          </button>
        </div>
      )}

      {/* Quote Dissection View */}
      {!isLoading && !errorMessage && quote && (
        <div
          data-testid="dissection-content"
          className="space-y-8 animate-in fade-in-50 duration-200"
        >
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-50">
                  {quote.ticker}
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-semibold">
                  {quote.ticker.endsWith(".NS")
                    ? "NSE"
                    : quote.ticker.endsWith(".BO")
                    ? "BSE"
                    : "GLOBAL"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                {quote.name}
              </h3>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                As of {quote.asOf} • Currency: {quote.currency}
              </p>
            </div>

            {/* Price & Day Move */}
            <div className="text-left sm:text-right space-y-1">
              <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-50 tracking-tight">
                {currencySymbol}
                {quote.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <span
                  data-testid="price-change-badge"
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-tight",
                    isPositiveMove
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
                  )}
                >
                  <svg
                    className={cn(
                      "w-3 h-3 shrink-0",
                      isPositiveMove ? "" : "rotate-180",
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  <span>
                    {isPositiveMove ? "+" : ""}
                    {quote.change >= 0 ? "+" : ""}
                    {quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}
                    {quote.changePercent.toFixed(2)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 52-Week Range Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <span>52-Week Range</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                Pin: {rangePercent.toFixed(0)}% of range
              </span>
            </div>
            <div className="relative pt-3 pb-1">
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden" />
              {/* Position Pin */}
              <div
                data-testid="fifty-two-week-pin"
                style={{ left: `${rangePercent}%` }}
                className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center transition-all duration-150"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-400 border-2 border-white dark:border-zinc-950 shadow-sm" />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400 pt-1.5">
                <span>
                  52W Low: {currencySymbol}
                  {fiftyTwoLow.toLocaleString("en-IN", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span>
                  52W High: {currencySymbol}
                  {fiftyTwoHigh.toLocaleString("en-IN", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip with Glossary Tooltips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Market Cap */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <GlossaryTooltip term="marketCap">Market Cap</GlossaryTooltip>
              </div>
              <div
                data-testid="metric-market-cap"
                className="font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                {quote.marketCapFormatted}
              </div>
            </div>

            {/* P/E Ratio */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <GlossaryTooltip term="pe">P/E Ratio</GlossaryTooltip>
              </div>
              <div
                data-testid="metric-pe"
                className="font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                {quote.peRatio != null ? `${quote.peRatio.toFixed(1)}x` : "N/A"}
              </div>
            </div>

            {/* Dividend Yield */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <GlossaryTooltip term="dividendYield">Dividend Yield</GlossaryTooltip>
              </div>
              <div
                data-testid="metric-yield"
                className="font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                {quote.dividendYield != null
                  ? `${quote.dividendYield.toFixed(2)}%`
                  : "0.00%"}
              </div>
            </div>

            {/* Sector / Industry */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Sector & Industry
              </div>
              <div
                data-testid="metric-sector"
                className="font-medium text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1"
                title={`${quote.sector || "General"} • ${quote.industry || ""}`}
              >
                {quote.sector || quote.industry || "Diversified"}
              </div>
            </div>
          </div>

          {/* How This Business Makes Money */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5 sm:p-6 space-y-2">
            <h4 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>How This Business Makes Money</span>
            </h4>
            <p
              data-testid="business-summary"
              className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
            >
              {quote.summary ||
                `${quote.name} operates in the ${quote.sector || "broader"} market, generating revenue by fulfilling ongoing corporate and consumer demand.`}
            </p>
          </div>

          {/* 2 Key Strengths & 2 Watchouts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2 Key Strengths */}
            <div
              data-testid="strengths-box"
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-5 space-y-3"
            >
              <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>2 Key Strengths Every Owner Should Know</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                {quote.strengths.slice(0, 2).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      ✓
                    </span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2 Watchouts & Risks */}
            <div
              data-testid="watchouts-box"
              className="rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 p-5 space-y-3"
            >
              <h4 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>2 Watchouts & Risks To Never Ignore</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                {quote.watchouts.slice(0, 2).map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold shrink-0">
                      !
                    </span>
                    <span className="leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Tutor Action Button */}
          {onAskTutor && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const prompt = `Explain the business model, valuation multiple (${quote.peRatio ? `${quote.peRatio.toFixed(1)}x P/E` : "P/E unavailable"}), and primary risks for ${quote.name} (${quote.ticker}) from the perspective of a patient business owner.`;
                  onAskTutor(prompt);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
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
                <span>Ask AI Tutor About {quote.name}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockDissector;
