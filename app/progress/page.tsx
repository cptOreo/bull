"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { BadgeShelf } from "@/components/academy/badge-shelf";
import { StreakTracker } from "@/components/academy/streak-tracker";
import { EducationNote } from "@/components/ui/education-note";
import type { Horizon, RiskComfort, Goal, Experience } from "@/lib/engine/types";

export default function ProgressPage() {
  const { profile, assumed, xp, level, streak, badges, events, updateProfile, reset } =
    useBull();

  const [resetConfirm, setResetConfirm] = useState(false);

  const horizons: { id: Horizon; label: string }[] = [
    { id: "1_3y", label: "1 to 3 Years (Medium)" },
    { id: "3_5y", label: "3 to 5 Years (Core)" },
    { id: "5_10y", label: "5 to 10 Years (Long Term)" },
    { id: "10y_plus", label: "10+ Years (Multi-Decade)" },
  ];

  const risks: { id: RiskComfort; label: string }[] = [
    { id: "low", label: "Low (Capital preservation focused)" },
    { id: "medium", label: "Medium (Comfortable with standard volatility)" },
    { id: "high", label: "High (Long horizon, drawdown tolerant)" },
    { id: "unsure", label: "Unsure (First-time investor default)" },
  ];

  const goals: { id: Goal; label: string }[] = [
    { id: "grow_wealth", label: "Grow Wealth Over Time" },
    { id: "dividends", label: "Dividends & Regular Cashflow" },
    { id: "learn", label: "Learn Financial Fundamentals" },
    { id: "preserve", label: "Capital Preservation" },
  ];

  const experiences: { id: Experience; label: string }[] = [
    { id: "none", label: "Absolute Beginner" },
    { id: "few", label: "Bought 1 or 2 Stocks Before" },
    { id: "sip", label: "Mutual Fund / Index SIP" },
  ];

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                §8.7 Gamification
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Investor Profile & Progress
              </h1>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
              Track your financial literacy milestones, view unlocked badges, and customize your investor profile dimensions.
            </p>
          </div>

          <Link
            href="/academy"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
          >
            Go to Academy →
          </Link>
        </div>
      </section>

      {/* Gamification Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Level Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase">
            <span>Investor Tier</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Level {level.level}
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {level.title}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {level.description}
          </p>
          <div className="pt-2 text-xs font-mono text-zinc-400">
            {xp} Total XP · {level.nextThreshold ? `${level.nextThreshold - xp} XP to next level` : "Max Tier reached"}
          </div>
        </div>

        {/* Streak Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase">
            <span>Daily Streak</span>
            <span className="text-amber-600 font-bold">IST Clock</span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>{streak.current} Days</span>
            <span>🔥</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {streak.todayActive
              ? "You completed learning today. Keep the streak alive tomorrow!"
              : "Complete a check or quiz today to maintain your streak."}
          </p>
          <div className="pt-2 text-xs font-mono text-zinc-400">
            Resets at midnight IST
          </div>
        </div>

        {/* Badges Count Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase">
            <span>Achievements</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {badges.filter((b) => b.unlocked).length} / {badges.length}
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {badges.filter((b) => b.unlocked).length} Badges Unlocked
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Earn badges by inspecting risk factors, completing diversified shortlists, and learning in Hinglish.
          </p>
        </div>
      </section>

      {/* Streak Visualizer */}
      <section className="space-y-4">
        <StreakTracker
          currentStreak={streak.current}
          bestStreak={streak.best}
          todayActive={streak.todayActive}
          events={events}
        />
      </section>

      {/* Badges Showcase */}
      <section className="space-y-4">
        <BadgeShelf badges={badges} />
      </section>

      {/* Investor Profile Configuration */}
      <section className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Investor Profile Settings (§6.3)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            These dimensions determine multi-factor weights for stock shortlists.
            {assumed.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                ({assumed.length} fields currently using safe defaults).
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goal */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-zinc-500 flex justify-between">
              <span>Primary Goal</span>
              {assumed.includes("goal") && (
                <span className="text-amber-600 text-[10px] font-normal lowercase">(assumed)</span>
              )}
            </label>
            <div className="space-y-1.5">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => updateProfile({ goal: g.id })}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    profile.goal === g.id
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{g.label}</span>
                  {profile.goal === g.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-zinc-500 flex justify-between">
              <span>Investing Experience</span>
              {assumed.includes("experience") && (
                <span className="text-amber-600 text-[10px] font-normal lowercase">(assumed)</span>
              )}
            </label>
            <div className="space-y-1.5">
              {experiences.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => updateProfile({ experience: exp.id })}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    profile.experience === exp.id
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{exp.label}</span>
                  {profile.experience === exp.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-zinc-500 flex justify-between">
              <span>Investment Horizon</span>
              {assumed.includes("horizon") && (
                <span className="text-amber-600 text-[10px] font-normal lowercase">(assumed)</span>
              )}
            </label>
            <div className="space-y-1.5">
              {horizons.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => updateProfile({ horizon: h.id })}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    profile.horizon === h.id
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{h.label}</span>
                  {profile.horizon === h.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Comfort */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-zinc-500 flex justify-between">
              <span>Risk Comfort</span>
              {assumed.includes("riskComfort") && (
                <span className="text-amber-600 text-[10px] font-normal lowercase">(assumed)</span>
              )}
            </label>
            <div className="space-y-1.5">
              {risks.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => updateProfile({ riskComfort: r.id })}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    profile.riskComfort === r.id
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{r.label}</span>
                  {profile.riskComfort === r.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reset State Option */}
      <section className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Reset Stored Data
          </div>
          <p className="text-[11px] text-zinc-500">
            Clears all locally saved profile choices, event history, streak, and badges.
          </p>
        </div>

        {!resetConfirm ? (
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="px-3 py-1.5 rounded-md text-xs font-medium border border-rose-300 text-rose-700 dark:border-rose-900 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
          >
            Reset All
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setResetConfirm(false);
              }}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="px-2 py-1 text-xs text-zinc-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      <EducationNote />
    </main>
  );
}
