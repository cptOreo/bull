"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Target, Search, Sparkles } from "lucide-react";
import { Button } from "@/ui/button";

const FEATURES = [
  { icon: TrendingUp, title: "Live Market Data", desc: "2000+ Indian stocks with real-time quotes & fundamentals" },
  { icon: BookOpen, title: "Interactive Lessons", desc: "Skill tree with 25+ concepts, mastery levels & applied practice" },
  { icon: Target, title: "AI Tutor & Analyst", desc: "Dual-mode chat: learn concepts or run deep research workflows" },
  { icon: Search, title: "Universal Search", desc: "Cmd+K anywhere — find stocks, concepts, pages instantly" },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32" aria-labelledby="hero-title">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="mx-auto max-w-7xl px-4 lg:px-6 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Sparkles className="h-4 w-4" />
          <span>Bull v2 — Now with live data, AI analyst & skill tree</span>
        </div>
        <h1 id="hero-title" className="mb-6 text-4xl lg:text-6xl font-display font-bold tracking-tight text-balance">
          Master Investing with <span className="gradient-text">AI Guidance</span>
        </h1>
        <p className="mx-auto max-w-2xl mb-10 text-lg lg:text-xl text-muted-foreground leading-relaxed">
          Learn by doing. Analyze real stocks with live data. Build mastery through interactive lessons.
          Your personal financial analyst — always available.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="xl" asChild>
            <a href="/learn">Start Learning Free</a>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <a href="/research">Try AI Analyst</a>
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="p-6 rounded-xl glass dark:glass-dark"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}