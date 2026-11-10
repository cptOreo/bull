import React from "react";
import type { LevelTier, StreakResult } from "@/lib/engine/xp";
import { calculateLevel } from "@/lib/engine/xp";

export interface XpHeaderProps {
  xp?: number;
  level?: LevelTier;
  streak?: StreakResult | number;
  onDailyQuizClick?: () => void;
  className?: string;
}

export function XpHeader({
  xp = 0,
  level: propLevel,
  streak,
  onDailyQuizClick,
  className = "",
}: XpHeaderProps) {
  const level = propLevel ?? calculateLevel(xp);
  const streakCount = typeof streak === "number" ? streak : streak?.current ?? 0;

  // Next level progress
  const currentThreshold = level.minXp;
  const nextThreshold = level.nextThreshold;
  const isMaxLevel = nextThreshold === null;

  const progressPercent = isMaxLevel
    ? 100
    : Math.min(
        100,
        Math.max(
          0,
          ((xp - currentThreshold) / ((nextThreshold ?? currentThreshold + 100) - currentThreshold)) * 100
        )
      );

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm ${className}`}
      data-testid="xp-header"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Level and Tier Title */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
              Level
            </span>
            <span className="text-xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
              {level.level}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {level.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium font-mono">
                {xp} XP
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-sans">
              &ldquo;{level.description}&rdquo;
            </p>

            {/* Level progress bar */}
            <div className="w-48 sm:w-64 mt-2.5">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                <span>Progress to {isMaxLevel ? "Max" : `Level ${level.level + 1}`}</span>
                <span>{isMaxLevel ? "Max Level" : `${Math.round(progressPercent)}%`}</span>
              </div>
              <div
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Streak & Daily Quiz Button */}
        <div className="flex items-center gap-4 sm:gap-6 self-start lg:self-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
            <svg
              className="w-5 h-5 text-amber-500"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C9.5 5 7 8.5 7 12.5a5 5 0 0010 0C17 8.5 14.5 5 12 2z" />
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold font-mono text-amber-900 dark:text-amber-200">
                {streakCount} {streakCount === 1 ? "Day" : "Days"}
              </span>
              <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-300/80">
                IST Streak
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onDailyQuizClick}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Daily Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default XpHeader;
