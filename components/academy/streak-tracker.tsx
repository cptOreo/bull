import React from "react";
import type { LearningEvent } from "@/lib/engine/types";
import { type StreakResult, calculateStreak, toISTDate } from "@/lib/engine/xp";

export interface DayTrackItem {
  date: string;
  dayLabel: string;
  active: boolean;
  isToday: boolean;
}

export interface StreakTrackerProps {
  streak?: StreakResult | number;
  currentStreak?: number;
  bestStreak?: number;
  todayActive?: boolean;
  events?: LearningEvent[];
  now?: string; // ISO string
  className?: string;
}

/**
 * Calculates 7 consecutive IST days ending on now (or current week).
 */
export function getPast7DaysIST(events: LearningEvent[] = [], nowStr: string = new Date().toISOString()): DayTrackItem[] {
  const nowIST = toISTDate(nowStr);
  const activeDates = new Set<string>();

  for (const e of events) {
    if (e.type === "check_answered_correct" || Boolean(e.itemId)) {
      if (e.timestamp) {
        activeDates.add(toISTDate(e.timestamp));
      }
    }
  }

  // Parse nowIST
  const parts = nowIST.split("-").map(Number);
  const targetDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

  const days: DayTrackItem[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(targetDate);
    d.setUTCDate(d.getUTCDate() - i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    days.push({
      date: dateStr,
      dayLabel: dayNames[d.getUTCDay()],
      active: activeDates.has(dateStr),
      isToday: dateStr === nowIST,
    });
  }

  return days;
}

/**
 * Clean, warm solar / flame emblem (dignified SVG, no arcade cartoon flames).
 */
function SolarFlameIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-9 h-9 transition-colors duration-300 ${
        active
          ? "text-amber-500 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
          : "text-zinc-300 dark:text-zinc-600"
      }`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Outer flame silhouette */}
      <path d="M12 2C9.5 5 7 8.5 7 12.5a5 5 0 0010 0C17 8.5 14.5 5 12 2z" opacity="0.35" />
      {/* Inner solar core */}
      <path d="M12 6.5c-1.5 2-3 4.2-3 6.5a3 3 0 006 0c0-2.3-1.5-4.5-3-6.5z" />
      {/* Base glow ember */}
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  );
}

export function StreakTracker({
  streak: propStreak,
  currentStreak: propCurrent,
  bestStreak: propBest,
  todayActive: propTodayActive,
  events = [],
  now = new Date().toISOString(),
  className = "",
}: StreakTrackerProps) {
  // Resolve streak data
  let current = 0;
  let best = 0;
  let todayActive = false;
  let keepAliveMsg: string | undefined;

  if (typeof propStreak === "number") {
    current = propStreak;
    best = propBest ?? propStreak;
    todayActive = propTodayActive ?? current > 0;
  } else if (propStreak && typeof propStreak === "object") {
    current = propStreak.current;
    best = propStreak.best;
    todayActive = propStreak.todayActive;
    keepAliveMsg = propStreak.keepAliveMessage;
  } else if (events.length > 0) {
    const calculated = calculateStreak(events, now);
    current = calculated.current;
    best = calculated.best;
    todayActive = calculated.todayActive;
    keepAliveMsg = calculated.keepAliveMessage;
  } else {
    current = propCurrent ?? 0;
    best = propBest ?? current;
    todayActive = propTodayActive ?? false;
  }

  // Generate 7-day track
  const daysTrack = getPast7DaysIST(events, now);
  // Ensure today's status matches todayActive
  if (daysTrack.length > 0) {
    daysTrack[daysTrack.length - 1].active = todayActive || daysTrack[daysTrack.length - 1].active;
  }

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm ${className}`}
      data-testid="streak-tracker"
      aria-label={`Learning streak: ${current} days. Best streak: ${best} days.`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        {/* Main Flame + Numbers */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
              todayActive
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 shadow-sm"
                : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60"
            }`}
          >
            <SolarFlameIcon active={todayActive || current > 0} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                {current}
              </span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {current === 1 ? "day streak" : "days streak"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Best streak: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{best} days</span>
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5 border ${
              todayActive
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : current > 0
                ? "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                todayActive ? "bg-emerald-500 animate-pulse" : current > 0 ? "bg-amber-500" : "bg-zinc-400"
              }`}
            />
            {todayActive
              ? "Active today"
              : keepAliveMsg || (current > 0 ? "Answer one check today to keep it" : "Practice today")}
          </span>
        </div>
      </div>

      {/* 7-Day IST Calendar Week Track */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2.5">
          <span>7-Day IST Track</span>
          <span className="text-[11px] text-zinc-400">Asia/Kolkata Calendar</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysTrack.map((d) => (
            <div
              key={d.date}
              className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                d.isToday
                  ? "border-amber-400/80 bg-amber-50/40 dark:bg-amber-950/20 font-bold"
                  : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
              }`}
            >
              <span className="text-[10px] font-mono text-zinc-400 uppercase mb-1">
                {d.dayLabel}
              </span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  d.active
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                }`}
                title={`${d.date}: ${d.active ? "Practice completed" : "No practice"}`}
              >
                {d.active ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400/50" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StreakTracker;
