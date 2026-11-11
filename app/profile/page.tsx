"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { MasteryRing } from "@/ui/mastery-ring";
import {
  TrendingUp,
  Award,
  Flame,
  Calendar,
  BookOpen,
  Target,
  Shield,
  DollarSign,
  Search,
  CheckCircle,
  Settings,
  LogOut,
  ExternalLink,
  FlameKindling,
  Sparkles,
} from "lucide-react";
import { useProfile } from "@/state/use-profile";
import { useProgress } from "@/state/use-progress";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { BADGES } from "@/lib/engine/xp";
import { useUI } from "@/lib/state/use-ui";
import { formatDate } from "@/lib/engine/format";

export default function ProfilePage() {
  const { profile, clearProfile } = useProfile();
  const { xp, level, streak, badges, completedLessons, quizHistory } = useProgress();
  const { nodes } = useSkillTree();
  const { addToast } = useUI();

  const totalMastery = nodes.reduce((sum, n) => sum + n.mastery.progress, 0) / (nodes.length || 1);
  const masteredCount = nodes.filter((n) => n.mastery.level >= 5).length;
  const learningCount = nodes.filter((n) => n.mastery.level >= 1 && n.mastery.level < 5).length;

  const xpForNextLevel = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][level + 1] || 999999;
  const currentLevelFloor = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][level] || 0;
  const xpProgress = level > 0 ? ((xp - currentLevelFloor) / (xpForNextLevel - currentLevelFloor)) * 100 : (xp / 100) * 100;

  // Group nodes by track for the heatmap
  const tracks = [
    { id: "analyze", label: "Analyze Any Stock" },
    { id: "dividend", label: "Build Dividend Portfolio" },
    { id: "statements", label: "Read Financial Statements" },
    { id: "moats", label: "Understand Moats" },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Investor Profile
                </span>
                <span className="text-xs text-muted-foreground">Portfolio Mastery & Gamification</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight mt-1 text-foreground">
                Progress Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your financial literacy milestones, skill tree heatmap, and unlocked achievements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/practice">
                  <Target className="h-4 w-4 mr-1.5" />
                  Practice Arena
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/learn">
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  Skill Tree
                </Link>
              </Button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="mb-8 p-6 rounded-2xl glass dark:glass-dark border border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white shadow-md">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "B"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {profile?.name || "Independent Investor"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email || "Personal Learning Account · IST Timezone"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      Tier: Level {level}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      🔥 {streak} Day Streak
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Total Experience</span>
                  <span className="text-2xl font-bold font-mono text-primary">{xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Overall Mastery */}
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 flex flex-col items-center justify-center text-center">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Curriculum Mastery
              </h3>
              <MasteryRing
                progress={Math.round(totalMastery)}
                size={110}
                strokeWidth={7}
                showLabel={true}
                level={Math.min(5, Math.max(1, Math.ceil(totalMastery / 20)))}
              />
              <p className="text-xs text-muted-foreground mt-3">Average across 33 financial concepts</p>
            </div>

            {/* Level Progress */}
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Next Level Milestone
                  </h3>
                  <span className="text-xs font-mono font-bold text-primary">Level {level + 1}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {Math.max(0, xpForNextLevel - xp).toLocaleString()} XP needed to level up
                </p>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-foreground">{Math.min(100, Math.round(xpProgress))}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
                      className="h-full bg-primary rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/40 text-center">
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-lg font-bold font-mono text-primary">{completedLessons.length}</span>
                  <span className="block text-[10px] text-muted-foreground">Lessons</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-lg font-bold font-mono text-emerald-500">{masteredCount}</span>
                  <span className="block text-[10px] text-muted-foreground">Mastered</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-lg font-bold font-mono text-amber-500">{learningCount}</span>
                  <span className="block text-[10px] text-muted-foreground">Learning</span>
                </div>
              </div>
            </div>

            {/* Streak Calendar */}
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Flame className="h-4 w-4 text-amber-500" />
                    Daily Streak (IST)
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {streak} Days Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  GitHub-style activity record across recent sessions.
                </p>

                {/* 28-day activity grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                    <div key={idx} className="font-medium text-muted-foreground pb-0.5">{d}</div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => {
                    const isToday = i === 27;
                    const isActive = isToday || (i >= 20 && i % 2 === 0);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "h-6 w-full rounded flex items-center justify-center font-mono transition-colors",
                          isActive
                            ? "bg-amber-500 text-white font-bold shadow-xs"
                            : "bg-muted/60 text-muted-foreground/40"
                        )}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between">
                <span>Next Bonus: 7-day streak (+50 XP)</span>
                <span className="font-mono text-foreground font-semibold">IST +05:30</span>
              </div>
            </div>
          </div>

          {/* SKILL TREE HEATMAP (Phase 2 Task 2.31 / 2.38) */}
          <div className="mb-8 p-6 rounded-2xl glass dark:glass-dark border border-border/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Skill Tree Heatmap</h3>
                <p className="text-xs text-muted-foreground">
                  Visual mastery status across all 33 financial curriculum nodes.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-muted border border-border/60" />
                  <span className="text-muted-foreground">Locked (0)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primary/30" />
                  <span className="text-muted-foreground">Novice (1-2)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-muted-foreground">Proficient (3-4)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-muted-foreground">Mastered (5)</span>
                </div>
              </div>
            </div>

            {/* Heatmap Grid by Track */}
            <div className="space-y-4 pt-1">
              {tracks.map((t) => {
                const trackNodes = nodes.filter((n) => n.track === t.id);
                return (
                  <div key={t.id} className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground/80 block">{t.label}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {trackNodes.map((n) => {
                        const lvl = n.mastery.level;
                        return (
                          <Link
                            key={n.id}
                            href={`/learn/${n.id}`}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between group",
                              lvl >= 5 && "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                              lvl >= 3 && lvl < 5 && "border-primary/40 bg-primary/20 text-primary",
                              lvl >= 1 && lvl < 3 && "border-primary/20 bg-primary/10 text-foreground",
                              lvl === 0 && "border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <span className="font-semibold truncate block group-hover:text-primary transition-colors">
                              {n.label}
                            </span>
                            <span className="font-mono text-[10px] opacity-80 mt-1">
                              {lvl === 5 ? "✓ Mastered" : lvl > 0 ? `Lvl ${lvl}` : "Available"}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 12 BADGES SHELF (Phase 2 Task 2.29 / 2.32 / 2.41) */}
          <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Achievement Badges</h3>
                <p className="text-xs text-muted-foreground">
                  Earn badges by passing applied missions, building models, and maintaining streaks.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
                Unlocked: {badges.length} / {BADGES.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {BADGES.map((badge) => {
                const isUnlocked = badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all flex items-start gap-3",
                      isUnlocked
                        ? "border-emerald-500/40 bg-emerald-500/10 shadow-xs"
                        : "border-border/50 bg-muted/20 opacity-70"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold",
                        isUnlocked
                          ? "bg-emerald-500 text-white shadow-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border/80"
                      )}
                    >
                      {isUnlocked ? "✓" : <Award className="h-5 w-5 opacity-60" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{badge.name}</h4>
                        <span className="font-mono text-[10px] text-primary shrink-0">+{badge.xp} XP</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {badge.description}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider block mt-2",
                          isUnlocked ? "text-emerald-500" : "text-muted-foreground/60"
                        )}
                      >
                        {isUnlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
