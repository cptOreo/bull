"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import type { TurnInput } from "@/lib/engine/types";
import { ChatContainer } from "@/components/chat/chat-container";
import { CurriculumTracks } from "@/components/learn/curriculum-tracks";
import { RatioSimulator } from "@/components/learn/ratio-simulator";
import { StockDissector } from "@/components/learn/stock-dissector";
import { DataBadge } from "@/components/ui/data-badge";
import { FINANCIAL_TERMS } from "@/components/ui/glossary-tooltip";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { cn } from "@/lib/utils";

export type StudioTab = "masterclass" | "sandbox" | "dissector" | "tutor";

interface LiveSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

const CURIOSITY_PILLS = [
  {
    label: "Kirana Store P/E Ratio",
    prompt: "Explain P/E ratio using the neighbourhood kirana store analogy.",
  },
  {
    label: "Zomato vs Swiggy",
    prompt: "Compare Zomato and Swiggy on food delivery margins and quick commerce dark store capex.",
  },
  {
    label: "Zero-Debt Balance Sheets",
    prompt: "Which Indian companies operate with zero debt and high return on equity?",
  },
  {
    label: "Tata Motors Business Model",
    prompt: "Explain how Tata Motors makes money across passenger, EV, and commercial vehicle divisions.",
  },
  {
    label: "Bank Debt Rule",
    prompt: "Why do financial analysts treat customer deposits differently from corporate debt for banks?",
  },
];

export default function HomePage() {
  const { profile, locale, updateProfile, logEvent, chatMessages, addChatMessage, events } = useBull();
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const [activeTab, setActiveTab] = useState<StudioTab>("masterclass");
  const [dissectorTicker, setDissectorTicker] = useState<string>("ZOMATO");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [liveResults, setLiveResults] = useState<LiveSearchResult[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Cmd+K or Ctrl+K or /
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

  // Dismiss search popover on outside click
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

  // Debounced live stock search across all global equities
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setLiveResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { results?: LiveSearchResult[] };
          setLiveResults(data.results || []);
        }
      } catch {
        // Fallback silently to local matches
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Local snapshot matches and financial terms
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

  const handleSendMessage = useCallback(
    async (text: string) => {
      const now = new Date().toISOString();

      addChatMessage({
        sender: "user",
        text,
        timestamp: now,
      });
      setIsLoading(true);

      try {
        const history = chatMessages.map((m) => ({
          role: m.sender,
          content: m.text ?? "",
        }));

        const turnInput: TurnInput = {
          message: text,
          profile,
          locale,
          now,
          events,
        };

        const payload = {
          ...turnInput,
          messages: [...history, { role: "user" as const, content: text }],
        };

        let answer;
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
          followUps: answer.followUps,
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
    [profile, locale, events, updateProfile, logEvent, addChatMessage, chatMessages]
  );

  const handleAskAiFromLearning = useCallback(
    (question: string) => {
      setActiveTab("tutor");
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  const handleDissectStock = useCallback((ticker: string) => {
    setDissectorTicker(ticker);
    setActiveTab("dissector");
    setIsSearchFocused(false);
    setSearchQuery("");
  }, []);

  return (
    <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
      {/* ── TOP HERO & SEARCH ── */}
      <section className="space-y-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>NSE · BSE · Global Equities · Audited Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Bull Educational Studio
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Understand businesses from the owner&apos;s perspective. Master valuation multiples, balance sheets, and economic moats through grounded real-world analogies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <DataBadge asOf="2026-11-10" sourceLabel="Audited Reports & Live Feed" freshness="current" />
            <Link
              href="/learn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-xs"
            >
              <span>Explore Skill Tree</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ── QUICK PORTAL CARDS TO PHASE 2 PLATFORM ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/learn"
            className="p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all flex items-start gap-3 group"
          >
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold shadow-xs">
              🌳
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  Financial Skill Tree
                </span>
                <span className="text-xs text-primary font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                33 concepts across 4 tracks with 5-step applied lessons &amp; real stocks.
              </p>
            </div>
          </Link>

          <Link
            href="/practice"
            className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all flex items-start gap-3 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              🎯
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Practice Arena
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                12 hands-on scenarios: DCF Builder, Red Flag Audits &amp; Peer Valuation.
              </p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all flex items-start gap-3 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              🏆
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Progress &amp; Heatmap
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                33-node curriculum heatmap, 12 achievement badges &amp; streak calendar.
              </p>
            </div>
          </Link>
        </div>

        {/* ── UNIVERSAL LIVE SEARCH BAR (Cmd + K) ── */}
        <div ref={searchContainerRef} className="relative w-full max-w-3xl mx-auto pt-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              aria-expanded={isSearchFocused && (searchResults.stocks.length > 0 || searchResults.terms.length > 0 || liveResults.length > 0)}
              aria-controls="stock-search-autocomplete"
              aria-autocomplete="list"
              placeholder="Search any Indian or global stock (e.g. Zomato, Tata Motors, Reliance, Apple, TCS)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  e.preventDefault();
                  if (liveResults.length > 0) {
                    handleDissectStock(liveResults[0].symbol);
                  } else if (searchResults.stocks.length > 0) {
                    handleDissectStock(searchResults.stocks[0].ticker);
                  } else {
                    handleDissectStock(searchQuery.trim().toUpperCase());
                  }
                } else if (e.key === "Escape") {
                  setIsSearchFocused(false);
                }
              }}
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-500 transition-all font-medium"
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

          {/* Autocomplete Popover */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div
              id="stock-search-autocomplete"
              role="listbox"
              className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 max-h-96 overflow-y-auto"
            >
              {/* Direct Quick Actions */}
              <div className="p-2 bg-zinc-50/70 dark:bg-zinc-850/60 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDissectStock(searchQuery.trim().toUpperCase())}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔍 Dissect &ldquo;{searchQuery.trim().toUpperCase()}&rdquo; in Live Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    handleAskAiFromLearning(`Tell me about ${searchQuery.trim()}`);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💬 Ask AI Tutor about &ldquo;{searchQuery.trim()}&rdquo;</span>
                </button>
              </div>

              {/* Live Yahoo Finance Search Matches */}
              {liveResults.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                    Live Global &amp; Indian Equities ({liveResults.length})
                  </div>
                  {liveResults.map((item) => (
                    <div
                      key={item.symbol}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleDissectStock(item.symbol)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {item.symbol}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono">
                            {item.exchange || "Equity"} · {item.type || "Stock"}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                        Dissect →
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Local Seed Matches */}
              {searchResults.stocks.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                    Covered Stocks ({searchResults.stocks.length})
                  </div>
                  {searchResults.stocks.map((stock) => (
                    <div
                      key={stock.ticker}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleDissectStock(stock.ticker)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {stock.ticker}
                        </span>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {stock.name}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Dissect →
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial Concept Terms */}
              {searchResults.terms.length > 0 && (
                <div className="p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="px-3 py-1 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                    Financial Yardsticks ({searchResults.terms.length})
                  </div>
                  {searchResults.terms.map((term) => (
                    <div
                      key={term.id}
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setIsSearchFocused(false);
                        handleAskAiFromLearning(`Explain ${term.name} and provide a real-world example.`);
                      }}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{term.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">Ask Tutor →</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{term.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Curiosity Chips Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Curiosity:</span>
          {CURIOSITY_PILLS.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskAiFromLearning(pill.prompt)}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 shadow-2xs hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── STUDIO SEGMENTED TABS (AWWWARDS / IMPECCABLE CRAFT FLOOR) ── */}
      <section className="space-y-4">
        <div
          role="tablist"
          aria-label="Educational Studio Sections"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "masterclass"}
            onClick={() => setActiveTab("masterclass")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer",
              activeTab === "masterclass"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-bold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
            )}
          >
            <span className="text-sm">🎓 Masterclass</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">4 Mental Models</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sandbox"}
            onClick={() => setActiveTab("sandbox")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer",
              activeTab === "sandbox"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-bold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
            )}
          >
            <span className="text-sm">🎛️ Valuation Sandbox</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">Ratio Simulator</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "dissector"}
            onClick={() => setActiveTab("dissector")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer",
              activeTab === "dissector"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-bold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
            )}
          >
            <span className="text-sm">🔍 Live Stock Dissector</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">Uncapped Global Search</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tutor"}
            onClick={() => setActiveTab("tutor")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer",
              activeTab === "tutor"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-bold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
            )}
          >
            <span className="text-sm">💬 AI Financial Tutor</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">Plain-English Tutor</span>
          </button>
        </div>

        {/* ── ACTIVE TAB CONTENT ── */}
        <div className="pt-2">
          {activeTab === "masterclass" && (
            <CurriculumTracks onAskTutor={handleAskAiFromLearning} />
          )}

          {activeTab === "sandbox" && (
            <RatioSimulator onAskTutor={handleAskAiFromLearning} />
          )}

          {activeTab === "dissector" && (
            <StockDissector initialTicker={dissectorTicker} onAskTutor={handleAskAiFromLearning} />
          )}

          {activeTab === "tutor" && (
            <div className="h-[680px]">
              <ChatContainer
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                locale={locale}
                onLocaleChange={(newLocale) => updateProfile({ locale: newLocale })}
                onSelectIntakeOption={(field, val) => handleSendMessage(`My ${field} is ${val}`)}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
