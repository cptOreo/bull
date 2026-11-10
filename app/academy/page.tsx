"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { CONCEPTS } from "@/lib/engine/curriculum";
import type { ConceptId } from "@/lib/engine/types";
import { XpHeader } from "@/components/academy/xp-header";
import { StreakTracker } from "@/components/academy/streak-tracker";
import { ConceptCard } from "@/components/academy/concept-card";
import { BadgeShelf } from "@/components/academy/badge-shelf";
import { CheckModal } from "@/components/academy/check-modal";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { DataBadge } from "@/components/ui/data-badge";

export default function AcademyPage() {
  const { xp, level, streak, badges, events, locale, logEvent } = useBull();
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const [activeCheckConcept, setActiveCheckConcept] = useState<ConceptId | null>(null);

  // Derive mastery status for each concept from events
  const getConceptMastery = (conceptId: ConceptId) => {
    const hasMission = events.some(
      (e) => e.type === "mission_passed" && e.conceptId === conceptId
    );
    if (hasMission) return "mastered" as const;

    const hasCheck = events.some(
      (e) => e.type === "check_answered_correct" && e.conceptId === conceptId
    );
    if (hasCheck) return "practised" as const;

    const hasLesson = events.some(
      (e) => e.type === "lesson_completed" && e.conceptId === conceptId
    );
    if (hasLesson) return "seen" as const;

    // First concept (P/E) is unlocked by default; others unlocked when prior completed or basic XP
    return "unlocked" as const;
  };

  const handleOpenCheck = (conceptId: ConceptId) => {
    setActiveCheckConcept(conceptId);
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Academy Header & XP Progress */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                §8 Applied Literacy
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {copy.academy.title}
              </h1>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {copy.academy.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DataBadge asOf="2026-11-10" sourceLabel="Academy v0" freshness="current" />
            <Link
              href="/academy/quiz"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <span>{copy.academy.dailyQuizButton}</span>
              <span>(+15 XP) →</span>
            </Link>
          </div>
        </div>

        {/* Level & XP Overview */}
        <XpHeader
          xp={xp}
          level={level}
          streak={streak}
        />
      </section>

      {/* Streak Tracker Visualizer */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Learning Consistency (IST Accurate §8.6)
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Resets at midnight IST
          </span>
        </div>
        <StreakTracker
          currentStreak={streak.current}
          bestStreak={streak.best}
          todayActive={streak.todayActive}
          events={events}
        />
      </section>

      {/* 8 Core Curriculum Concepts Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Fundamental Valuation & Risk Concepts
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Each concept includes real company examples from our Nifty 50 snapshot and 3 auto-graded checks.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            8 Concepts · +20 XP each
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONCEPTS.map((concept) => {
            const mastery = getConceptMastery(concept.id);
            return (
              <ConceptCard
                key={concept.id}
                concept={concept}
                masteryStatus={mastery}
                locale={locale}
                onOpenCheck={handleOpenCheck}
              />
            );
          })}
        </div>
      </section>

      {/* Spec §8.8 Badge Shelf */}
      <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <BadgeShelf badges={badges} />
      </section>

      {/* Interactive Check Modal */}
      {activeCheckConcept && (
        <CheckModal
          isOpen={true}
          onClose={() => setActiveCheckConcept(null)}
          conceptId={activeCheckConcept}
          logEvent={logEvent}
        />
      )}
    </main>
  );
}
