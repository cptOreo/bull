"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import type { TurnInput } from "@/lib/engine/types";
import { ChatContainer } from "@/components/chat/chat-container";
import { SectorTag } from "@/components/shortlist/sector-tag";
import { DataBadge } from "@/components/ui/data-badge";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { formatPrice, formatSignedPercent } from "@/lib/engine/format";
import { getStockMetrics } from "@/lib/engine/metrics";

export default function HomePage() {
  const { profile, locale, updateProfile, logEvent, chatMessages, addChatMessage, events } = useBull();
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = useCallback(
    (text: string) => {
      const now = new Date().toISOString();

      addChatMessage({
        sender: "user",
        text,
        timestamp: now,
      });
      setIsLoading(true);

      // Execute engine turn deterministically
      try {
        const turnInput: TurnInput = {
          message: text,
          profile,
          locale,
          now,
          events,
        };

        const answer = handleTurn(turnInput, { snapshot });

        // Update profile if turn adjusted profile dimensions
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
              ? "Is request ko process karte waqt technical issue aya. Kripya dobara try karein."
              : "An error occurred while evaluating that request against our safety engine. Please try again.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [profile, locale, events, updateProfile, logEvent, addChatMessage]
  );

  return (
    <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8">
      {/* Hero Introduction */}
      <section className="text-center sm:text-left space-y-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {copy.onboarding.welcomeTitle}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {copy.onboarding.welcomeSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataBadge asOf="2026-11-10" sourceLabel="Screener & NSE" freshness="current" />
            <Link
              href="/shortlist"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <span>{copy.nav.shortlist}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Grid: Interactive Discovery Chat + Seeded Universe Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Chat Container (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[650px] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden bg-white dark:bg-zinc-900/60">
          <ChatContainer
            messages={chatMessages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            className="flex-1"
          />
        </section>

        {/* Right Column: Seeded Stock Universe Explorer (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Seeded Universe ({snapshot.stocks.length} Companies)
            </h2>
            <Link
              href="/method"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
            >
              Why 12? →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {snapshot.stocks.map((stock) => {
              const m = getStockMetrics(stock, snapshot, "2026-11-10T00:00:00.000Z");
              const movePct = m.values.oneSessionMovePct ?? 0;
              const isPositive = movePct >= 0;
              const sectorName = snapshot.sectors.find((s) => s.id === stock.sectorId)?.name ?? stock.sectorId;
              return (
                <div
                  key={stock.ticker}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs group"
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
                        className={`font-mono text-[11px] font-semibold tabular-nums ${
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatSignedPercent(movePct)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(`Tell me about ${stock.ticker}`)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium cursor-pointer"
                    >
                      Ask Bull →
                    </button>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stock/${stock.ticker}`}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Deep Dive
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
        </section>
      </div>
    </main>
  );
}
