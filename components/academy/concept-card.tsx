import React from "react";
import type { ConceptId, Locale, MasteryState } from "@/lib/engine/types";
import { CONCEPTS, type ConceptDefinition } from "@/lib/engine/curriculum";
import { MasteryRail, type MasteryRailState } from "./mastery-rail";

export const HINGLISH_TITLES: Record<ConceptId, string> = {
  C1: "Share ka matlab hissedari",
  C2: "Price, market cap aur price movements",
  C3: "P/E ratio aur sector ka asar",
  C4: "Debt: debt-to-equity aur interest cover",
  C5: "Margins, ROE aur ROCE",
  C6: "Dividends aur payout ratio",
  C7: "Drawdown aur 5-year price chart",
  C8: "Diversification aur concentration risk",
};

export const CONCEPT_TOPICS: Record<ConceptId, string> = {
  C1: "P/B & Share Ownership",
  C2: "Market Cap & Supply",
  C3: "P/E & Sector Valuation",
  C4: "D/E & Leverage",
  C5: "ROE, ROCE & Margins",
  C6: "Dividend Yield & Payout",
  C7: "Volatility & Drawdown",
  C8: "Diversification",
};

export const CONCEPT_DIFFICULTY: Record<ConceptId, "Beginner" | "Core" | "Advanced"> = {
  C1: "Beginner",
  C2: "Beginner",
  C3: "Core",
  C4: "Core",
  C5: "Core",
  C6: "Core",
  C7: "Advanced",
  C8: "Advanced",
};

export type ConceptCardMasteryStatus =
  | MasteryState
  | "unlocked"
  | "in_progress";

export interface ConceptCardProps {
  conceptId?: ConceptId;
  concept?: ConceptDefinition;
  masteryStatus?: ConceptCardMasteryStatus;
  status?: ConceptCardMasteryStatus; // alias
  locale?: Locale;
  readingTimeMinutes?: number;
  xpReward?: number;
  checksCompleted?: number; // 0 to 3
  totalChecks?: number; // default 3
  onClick?: () => void;
  onSelect?: (conceptId: ConceptId) => void;
  onOpenCheck?: (conceptId: ConceptId) => void;
  className?: string;
}

export function ConceptCard({
  conceptId,
  concept: propConcept,
  masteryStatus,
  status: propStatus,
  locale = "en",
  readingTimeMinutes = 2,
  xpReward = 20,
  checksCompleted = 0,
  totalChecks = 3,
  onClick,
  onSelect,
  onOpenCheck,
  className = "",
}: ConceptCardProps) {
  // Resolve concept details
  const targetId = conceptId ?? propConcept?.id ?? "C1";
  const def = propConcept ?? CONCEPTS.find((c) => c.id === targetId) ?? CONCEPTS[0];
  const effectiveStatus = masteryStatus ?? propStatus ?? "unlocked";

  const isLocked = effectiveStatus === "locked";
  const isMastered = effectiveStatus === "mastered";
  const difficulty = CONCEPT_DIFFICULTY[def.id] ?? "Core";
  const topic = CONCEPT_TOPICS[def.id];
  const hinglishTitle = HINGLISH_TITLES[def.id];

  const handleClick = () => {
    if (isLocked) return;
    if (onClick) onClick();
    if (onSelect) onSelect(def.id);
    if (onOpenCheck) onOpenCheck(def.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLocked) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const difficultyColors = {
    Beginner: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Core: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Advanced: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  return (
    <div
      role={isLocked ? "article" : "button"}
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      aria-label={`${def.id}: ${def.title}. Status: ${effectiveStatus}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative rounded-xl border p-5 transition-all duration-200 text-left outline-none ${
        isLocked
          ? "bg-zinc-50/70 border-zinc-200 text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-800 cursor-not-allowed"
          : isMastered
          ? "bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-700/80 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
      } ${className}`}
    >
      {/* Header bar: ID, Difficulty badge, Time, XP */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {def.id}
          </span>
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColors[difficulty]}`}
          >
            {difficulty}
          </span>
          {topic && (
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              · {topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1" title="Estimated reading time">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
            {readingTimeMinutes} min
          </span>
          <span
            className="flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400"
            title="XP reward"
          >
            +{xpReward} XP
          </span>
        </div>
      </div>

      {/* Title block with bilingual support */}
      <div className="mb-3">
        <h3
          className={`text-base font-semibold tracking-tight transition-colors ${
            isLocked
              ? "text-zinc-500 dark:text-zinc-400"
              : isMastered
              ? "text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
              : "text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
          }`}
        >
          {locale === "hi-en" ? hinglishTitle : def.title}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 italic font-sans">
          {locale === "hi-en" ? def.title : hinglishTitle}
        </p>
      </div>

      {/* Summary / description */}
      <p
        className={`text-xs leading-relaxed mb-4 line-clamp-2 ${
          isLocked ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {def.summary}
      </p>

      {/* Locked condition hint vs Mastery / Progress view */}
      {isLocked ? (
        <div className="rounded-lg bg-zinc-100/90 dark:bg-zinc-800/80 p-2.5 border border-zinc-200 dark:border-zinc-700/60 flex items-start gap-2 text-xs">
          <svg
            className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
          </svg>
          <div className="space-y-0.5">
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">
              Unlocks when: {def.unlockCondition}
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {def.unlockHint}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* 3 Checks Progress within the concept */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Knowledge Checks</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {checksCompleted}/{totalChecks} completed
            </span>
          </div>

          <div
            className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex"
            role="progressbar"
            aria-label="Knowledge checks progress"
            aria-valuenow={checksCompleted}
            aria-valuemin={0}
            aria-valuemax={totalChecks}
          >
            <div
              className={`h-full transition-all duration-300 ${
                isMastered ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${Math.min(100, (checksCompleted / totalChecks) * 100)}%` }}
            />
          </div>

          {/* 5-step Mastery Rail */}
          <MasteryRail state={effectiveStatus as MasteryRailState} className="mt-2" />
        </div>
      )}
    </div>
  );
}

export default ConceptCard;
