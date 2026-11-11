"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { MasteryRing } from "@/ui/mastery-ring";
import { Button } from "@/ui/button";
import Link from "next/link";
import { BookOpen, TrendingUp, Target, ArrowRight } from "lucide-react";
import { useProgress } from "@/state/use-progress";

const PREVIEW_CONCEPTS = [
  { id: "pe-ratio", label: "P/E Ratio", track: "Analyze Any Stock", mastery: 80, level: 3 },
  { id: "dcf", label: "DCF Modeling", track: "Analyze Any Stock", mastery: 45, level: 2 },
  { id: "dividend-safety", label: "Dividend Safety", track: "Build Dividend Portfolio", mastery: 60, level: 2 },
  { id: "cash-flow", label: "Cash Flow Analysis", track: "Read Financial Statements", mastery: 30, level: 1 },
  { id: "pricing-power", label: "Pricing Power", track: "Understand Moats", mastery: 10, level: 1 },
  { id: "roe", label: "ROE & DuPont", track: "Analyze Any Stock", mastery: 0, level: 0 },
] as const;

export function SkillTreePreview() {
  const { xp, level, streak } = useProgress();
  const totalMastery = PREVIEW_CONCEPTS.reduce((sum, c) => sum + c.mastery, 0) / PREVIEW_CONCEPTS.length;

  return (
    <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="progress-title">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-12">
          <div>
            <h2 id="progress-title" className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
              Your Learning Progress
            </h2>
            <p className="mt-2 text-muted-foreground">Track mastery across all concepts</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">XP: <span className="font-display text-primary">{xp.toLocaleString()}</span></span>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Level {level}</span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber/10 text-amber text-xs font-medium">
                <span className="relative top-[1px]">🔥</span> {streak} day streak
              </span>
            </div>
            <Button asChild size="lg">
              <Link href="/learn">View Full Skill Tree <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 flex flex-col items-center justify-center p-8 rounded-2xl glass dark:glass-dark"
          >
            <MasteryRing progress={Math.round(totalMastery)} size={160} strokeWidth={8} showLabel={true} level={Math.ceil(totalMastery / 20)} />
            <p className="mt-4 text-center text-muted-foreground">Average Mastery</p>
            <p className="mt-1 text-2xl font-display font-bold">{Math.round(totalMastery)}%</p>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            {[
              { label: "Concepts Started", value: PREVIEW_CONCEPTS.filter(c => c.mastery > 0).length, icon: BookOpen, color: "text-blue-500" },
              { label: "Mastered (80%+)", value: PREVIEW_CONCEPTS.filter(c => c.mastery >= 80).length, icon: TrendingUp, color: "text-emerald-500" },
              { label: "In Practice", value: PREVIEW_CONCEPTS.filter(c => c.mastery > 0 && c.mastery < 80).length, icon: Target, color: "text-amber-500" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-6 rounded-xl glass dark:glass-dark text-center"
              >
                <stat.icon className={cn("h-8 w-8 mx-auto mb-2", stat.color)} />
                <p className="text-3xl font-display font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREVIEW_CONCEPTS.map((concept, i) => (
            <motion.article
              key={concept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                "p-4 rounded-xl glass dark:glass-dark border transition-all",
                concept.mastery >= 80 ? "border-emerald-500/30" : "border-border/50"
              )}
            >
              <div className="flex items-center gap-3">
                <MasteryRing progress={concept.mastery} size={36} strokeWidth={3} showLabel={false} level={concept.level} />
                <div className="flex-1 min-w-0">
                  <Link href={`/learn/${concept.id}`} className="font-medium hover:text-primary transition-colors">
                    {concept.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">{concept.track}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/learn">Explore Full Skill Tree <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}