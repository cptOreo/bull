"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBull } from "@/lib/state/use-bull";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import type { TurnInput } from "@/lib/engine/types";
import { ChatContainer } from "@/components/chat/chat-container";
import { SectorTag } from "@/components/shortlist/sector-tag";
import { DataBadge } from "@/components/ui/data-badge";
import { GlossaryTooltip, FINANCIAL_TERMS, lookupTerm } from "@/components/ui/glossary-tooltip";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { formatPrice, formatSignedPercent } from "@/lib/engine/format";
import { getStockMetrics } from "@/lib/engine/metrics";
import { cn } from "@/lib/utils";

// Curated Beginner Tracks configuration
const BEGINNER_TRACKS = [
  {
    id: "bluechip",
    title: "The Bluechip Anchors",
    badge: "Stability First",
    icon: "🏛️",
    accentColor: "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
    description: "Established Indian market anchors with multi-decade track records of steady earnings.",
    tickers: ["TCS", "HDFCBANK", "RELIANCE"],
    chatPrompt: "Compare the stability and track record of TCS, HDFCBANK, and RELIANCE.",
  },
  {
    id: "everyday",
    title: "Brands You Use Everyday",
    badge: "Consumer Moats",
    icon: "🛵",
    accentColor: "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    description: "Consumer leaders whose products, stores, and vehicles you interact with across daily life.",
    tickers: ["TITAN", "TATAMOTORS", "HINDUNILVR"],
    chatPrompt: "Explain how consumer loyalty drives the business models of TITAN, TATAMOTORS, and HINDUNILVR.",
  },
  {
    id: "dividends",
    title: "Profit Sharers",
    badge: "Cash Dividends",
    icon: "💰",
    accentColor: "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
    description: "Cash-generative businesses that distribute earnings directly back to shareholders via dividends.",
    tickers: ["ITC", "INFY", "TCS"],
    chatPrompt: "Which covered stocks have the strongest dividend yields and conservative debt levels?",
  },
  {
    id: "concepts",
    title: "Stock Market 101",
    badge: "Core Yardsticks",
    icon: "🎓",
    accentColor: "border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300",
    description: "Zero-jargon fundamentals. Master how market participants measure value before investing.",
    terms: ["pe", "debtToEquity", "roce", "drawdown"],
    actionUrl: "/academy",
  },
];

// Natural curiosity prompt chips
const STARTER_PROMPTS = [
  {
    label: "Zero-Debt Companies",
    icon: "🛡️",
    prompt: "Which covered companies have virtually zero debt on their balance sheets?",
  },
  {
    label: "TCS vs Infosys",
    icon: "⚖️",
    prompt: "Compare TCS and Infosys on valuation, profit margins, and dividends.",
  },
  {
    label: "P/E Explained Simply",
    icon: "💡",
    prompt: "Explain P/E ratio like I'm fifteen with real company numbers.",
  },
  {
    label: "Bank Debt Rule",
    icon: "🏦",
    prompt: "Why do financial analysts exclude customer deposits from bank debt calculations?",
  },
  {
    label: "Smallest Drawdown",
    icon: "📉",
    prompt: "Which covered stock survived recent market pullbacks with the smallest drawdown?",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { profile, locale, updateProfile, logEvent, chatMessages, addChatMessage, events } = useBull();
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("all");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const chatScrollTargetRef = useRef<HTMLDivElement>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "Escape") {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Dismiss search dropdown on outside click
  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  // Search Results Filtering: matches both stocks and glossary terms
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { stocks: [], terms: [] };

    const matchingStocks = snapshot.stocks.filter((s) => {
      const sector = snapshot.sectors.find((sec) => sec.id === s.sectorId);
      return (
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (sector && sector.name.toLowerCase().includes(q))
      );
    });

    const matchingTerms = Object.values(FINANCIAL_TERMS).filter((t) => {
      return (
        t.name.toLowerCase().includes(q) ||
        t.shortLabel.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });

    return { stocks: matchingStocks, terms: matchingTerms };
  }, [searchQuery]);

  const totalResultsCount = searchResults.stocks.length + searchResults.terms.length;

  const handleSendMessage = useCallback(
    async (text: string) => {
      const now = new Date().toISOString();

      addChatMessage({
        sender: "user",
        text,
        timestamp: now,
      });
      setIsLoading(true);

      // Scroll to chat on mobile/desktop
      chatScrollTargetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      try {
        const turnInput: TurnInput = {
          message: text,
          profile,
          locale,
          now,
          events,
        };

        let answer;
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(turnInput),
          });
          if (res.ok) {
            answer = await res.json();
          } else {
            answer = handleTurn(turnInput, { snapshot });
          }
        } catch {
          answer = handleTurn(turnInput, { snapshot });
        }

        if (answer.profileState?.profile) {
          updateProfile(answer.profileState.profile);
        }

        addChatMessage({
          sender: "assistant",
          blocks: answer.blocks,
          timestamp: new Date().toISOString(),
        });
        logEvent({ type: "stock_viewed", timestamp: now, data: { query: text } });
      } catch (err) {
        console.error("Engine turn failed:", err);
        addChatMessage({
          sender: "assistant",
          text:
            locale === "hi-en"
              ? "Is sawal ka jawab taiyar karne mein takneeki dikkat aayi. Kripya dobara koshish karein."
              : "An error occurred while evaluating that request against our safety engine. Please try again.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [profile, locale, events, updateProfile, logEvent, addChatMessage]
  );

  // Distinct sectors present in snapshot for filtering
  const sectorFilters = useMemo(() => {
    const list = [{ id: "all", label: "All Sectors" }];
    snapshot.sectors.forEach((sec) => {
      const hasStocks = snapshot.stocks.some((s) => s.sectorId === sec.id);
      if (hasStocks) {
        list.push({ id: sec.id, label: sec.name });
      }
    });
    return list;
  }, []);

  // Filtered stock list for the sidebar
  const filteredStocks = useMemo(() => {
    if (selectedSectorFilter === "all") return snapshot.stocks;
    return snapshot.stocks.filter((s) => s.sectorId === selectedSectorFilter);
  }, [selectedSectorFilter]);

  return (
    <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8">
      {/* ── TOP HERO & SEARCH HEADER ── */}
      <section className="space-y-5 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Beginner-First Stock Education</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {copy.onboarding.welcomeTitle}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Explore India's leading companies through audited numbers, zero financial sales pitches, and intuitive real-world analogies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <DataBadge asOf="2026-11-10" sourceLabel="Audited Reports & NSE" freshness="current" />
            <Link
              href="/shortlist"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
            >
              <span>{copy.nav.shortlist}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ── UNIVERSAL STOCK SEARCH BAR (Cmd + K) ── */}
        <div ref={searchContainerRef} className="relative w-full max-w-3xl mx-auto pt-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              aria-expanded={isSearchFocused && totalResultsCount > 0}
              aria-controls="stock-search-autocomplete"
              aria-autocomplete="list"
              placeholder="Search stocks by ticker, company, or concept (e.g. TCS, Tata Motors, P/E, Debt)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
                setSelectedResultIndex(0);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedResultIndex((prev) => Math.min(prev + 1, Math.max(0, totalResultsCount - 1)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedResultIndex((prev) => Math.max(0, prev - 1));
                } else if (e.key === "Enter" && searchQuery.trim()) {
                  e.preventDefault();
                  if (searchResults.stocks.length > 0) {
                    const targetStock = searchResults.stocks[Math.min(selectedResultIndex, searchResults.stocks.length - 1)];
                    handleSendMessage(`Tell me about ${targetStock.ticker}`);
                    setIsSearchFocused(false);
                    setSearchQuery("");
                  } else if (searchResults.terms.length > 0) {
                    const targetTerm = searchResults.terms[0];
                    handleSendMessage(`Explain ${targetTerm.name} with real-world examples.`);
                    setIsSearchFocused(false);
                    setSearchQuery("");
                  } else {
                    handleSendMessage(searchQuery.trim());
                    setIsSearchFocused(false);
                    setSearchQuery("");
                  }
                } else if (e.key === "Escape") {
                  setIsSearchFocused(false);
                }
              }}
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
            />

            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 pointer-events-none">
              {searchQuery && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="pointer-events-auto p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Live Autocomplete Popover */}
          {isSearchFocused && totalResultsCount > 0 && (
            <div
              id="stock-search-autocomplete"
              role="listbox"
              className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 animate-in fade-in-0 zoom-in-98 duration-100"
            >
              {/* Stock Matches */}
              {searchResults.stocks.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                    Covered Stocks ({searchResults.stocks.length})
                  </div>
                  {searchResults.stocks.map((stock, idx) => {
                    const isSelected = idx === selectedResultIndex;
                    const metrics = getStockMetrics(stock, snapshot, "2026-11-10T00:00:00.000Z");
                    const movePct = metrics.values.oneSessionMovePct ?? 0;
                    const sector = snapshot.sectors.find((s) => s.id === stock.sectorId);

                    return (
                      <div
                        key={stock.ticker}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer",
                          isSelected
                            ? "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200"
                        )}
                        onClick={() => {
                          handleSendMessage(`Tell me about ${stock.ticker}`);
                          setIsSearchFocused(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
                            {stock.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{stock.ticker}</span>
                              <span className="text-xs text-zinc-400">·</span>
                              <span className="text-xs text-zinc-500 line-clamp-1">{stock.name}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {sector?.name || stock.sectorId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold tabular-nums">
                              {formatPrice(metrics.values.latestClose)}
                            </div>
                            <div
                              className={cn(
                                "text-[11px] font-semibold tabular-nums",
                                movePct >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              )}
                            >
                              {formatSignedPercent(movePct)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/stock/${stock.ticker}`}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-500 hover:text-white transition-colors"
                            >
                              Inspect
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Glossary Concept Matches */}
              {searchResults.terms.length > 0 && (
                <div className="p-2 space-y-1 bg-zinc-50/60 dark:bg-zinc-900/40">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                    Financial Concepts ({searchResults.terms.length})
                  </div>
                  {searchResults.terms.map((termItem) => (
                    <div
                      key={termItem.id}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                      onClick={() => {
                        handleSendMessage(`Explain ${termItem.name} and provide a real-world example.`);
                        setIsSearchFocused(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {termItem.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              {termItem.category}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {termItem.definition}
                          </p>
                        </div>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold shrink-0">
                          Ask in Chat →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── BEGINNER EXPLORATION TRACKS (DUOLINGO / BRILLIANT INSPIRED) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">
              Curated Starter Tracks
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select a guided theme to begin exploring without needing prior stock market expertise.
            </p>
          </div>
          <Link
            href="/academy"
            className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            All Lessons →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BEGINNER_TRACKS.map((track) => {
            return (
              <div
                key={track.id}
                className={cn(
                  "flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 group relative shadow-2xs hover:shadow-md",
                  track.accentColor,
                  "hover:-translate-y-0.5"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-2xl" role="img" aria-label={track.title}>
                      {track.icon}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/80 dark:bg-zinc-900/80 border border-current">
                      {track.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2.5">
                  {/* Stock Pills or Term Tooltips */}
                  {track.tickers && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {track.tickers.map((ticker) => (
                        <Link
                          key={ticker}
                          href={`/stock/${ticker}`}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors shadow-2xs"
                        >
                          {ticker}
                        </Link>
                      ))}
                    </div>
                  )}

                  {track.terms && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {track.terms.map((termId) => (
                        <GlossaryTooltip key={termId} term={termId} className="text-xs font-mono font-medium" />
                      ))}
                    </div>
                  )}

                  {/* Action Link or Trigger */}
                  {track.chatPrompt ? (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(track.chatPrompt)}
                      className="w-full text-left inline-flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors pt-1 cursor-pointer"
                    >
                      <span>Explore in Chat</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : track.actionUrl ? (
                    <Link
                      href={track.actionUrl}
                      className="w-full inline-flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors pt-1"
                    >
                      <span>Open Academy</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CURIOSITY-DRIVEN STARTER PROMPT CHIPS ── */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <span>⚡</span>
          <span>Curiosity Prompts (Tap to ask)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── MAIN WORKSPACE: INTERACTIVE CHAT + SEEDED UNIVERSE SIDEBAR ── */}
      <div ref={chatScrollTargetRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Chat Console (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[680px] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden bg-white dark:bg-zinc-900/60">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold font-mono tracking-tight text-zinc-800 dark:text-zinc-200">
                Bull Conversational Engine
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Deterministic · No Sales Fluff</span>
          </div>
          <ChatContainer
            messages={chatMessages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            className="flex-1"
          />
        </section>

        {/* Right Column: Live Stock Universe Explorer & Metric Pills (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Seeded Universe ({snapshot.stocks.length} Stocks)
              </h2>
              <p className="text-xs text-zinc-400">Audited Nifty 50 Sample</p>
            </div>
            <Link
              href="/method"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
            >
              Methodology →
            </Link>
          </div>

          {/* Quick Sector Filters */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {sectorFilters.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSectorFilter(sec.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer",
                  selectedSectorFilter === sec.id
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Live Stock Pills List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredStocks.map((stock) => {
              const m = getStockMetrics(stock, snapshot, "2026-11-10T00:00:00.000Z");
              const movePct = m.values.oneSessionMovePct ?? 0;
              const isPositive = movePct >= 0;
              const sectorName = snapshot.sectors.find((s) => s.id === stock.sectorId)?.name ?? stock.sectorId;

              return (
                <div
                  key={stock.ticker}
                  className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stock/${stock.ticker}`}
                          className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        >
                          {stock.ticker}
                        </Link>
                        <SectorTag sector={sectorName} id={stock.sectorId} size="sm" />
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1">{stock.name}</p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatPrice(m.values.latestClose)}
                      </div>
                      <div
                        className={cn(
                          "font-mono text-[11px] font-semibold tabular-nums",
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {formatSignedPercent(movePct)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(`Tell me about ${stock.ticker}`)}
                      className="text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer transition-colors"
                    >
                      Ask Bull →
                    </button>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stock/${stock.ticker}`}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Inspect
                      </Link>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <Link
                        href={`/compare?stockA=${stock.ticker}&stockB=${stock.ticker === "TCS" ? "INFY" : "TCS"}`}
                        className="text-zinc-500 hover:underline"
                      >
                        Compare
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Glossary Definitions Footer Pill */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-[11px] uppercase tracking-wider text-zinc-500">
                Key Ratio Guide
              </span>
              <span className="text-[10px] text-zinc-400">Hover any ratio</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <GlossaryTooltip term="pe">P/E Ratio</GlossaryTooltip>
              <span>·</span>
              <GlossaryTooltip term="marketCap">Market Cap</GlossaryTooltip>
              <span>·</span>
              <GlossaryTooltip term="debtToEquity">Debt/Equity</GlossaryTooltip>
              <span>·</span>
              <GlossaryTooltip term="roce">ROCE</GlossaryTooltip>
              <span>·</span>
              <GlossaryTooltip term="dividendYield">Dividend Yield</GlossaryTooltip>
              <span>·</span>
              <GlossaryTooltip term="drawdown">Drawdown</GlossaryTooltip>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
