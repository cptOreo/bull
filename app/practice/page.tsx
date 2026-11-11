"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { Target, BookOpen, Search, TrendingUp, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useProgress } from "@/state/use-progress";

const PRACTICE_SCENARIOS = [
  {
    id: "find-red-flags",
    title: "Find Red Flags",
    desc: "Identify warning signs in financial statements",
    icon: Target,
    color: "from-rose-500 to-pink-500",
    difficulty: "Medium",
    xp: 30,
    stocks: ["Zomato", "Paytm", "Nykaa", "Zomato"],
    steps: 4,
  },
  {
    id: "compare-valuation",
    title: "Compare Valuation",
    desc: "Compare P/E, EV/EBITDA across peers",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
    difficulty: "Medium",
    xp: 30,
    stocks: ["TCS", "Infosys", "Wipro", "HCL Tech"],
    steps: 3,
  },
  {
    id: "build-dcf",
    title: "Build a DCF",
    desc: "Create a discounted cash flow model",
    icon: Search,
    color: "from-violet-500 to-purple-500",
    difficulty: "Hard",
    xp: 50,
    stocks: ["Reliance", "HDFC Bank", "TCS", "ITC"],
    steps: 5,
  },
  {
    id: "screen-quality",
    title: "Screen for Quality",
    desc: "Filter stocks by ROE, debt, growth",
    icon: Target,
    color: "from-emerald-500 to-teal-500",
    difficulty: "Easy",
    xp: 20,
    stocks: ["Nifty 50", "Nifty 100", "Custom universe"],
    steps: 2,
  },
] as const;

export default function PracticePage() {
  const { xp, level, streak } = useProgress();
  const [activeTab, setActiveTab] = React.useState("all");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
                Practice Arena
              </h1>
              <p className="mt-2 text-muted-foreground">Apply your knowledge to real stock scenarios</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">XP: <span className="font-display text-primary">{xp.toLocaleString()}</span></span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Level {level}</span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber/10 text-amber text-xs font-medium">
                  <span className="relative top-[1px]">🔥</span> {streak} day streak
                </span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger value="all">All Scenarios</TabsTrigger>
              <TabsTrigger value="easy">Easy</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="hard">Hard</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRACTICE_SCENARIOS.map((scenario, i) => (
            <motion.article
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="group relative p-5 rounded-2xl glass dark:glass-dark border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", `bg-gradient-to-br ${scenario.color}`)}>
                  <scenario.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{scenario.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{scenario.difficulty}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {scenario.steps} steps
                </span>
                <span className="flex items-center gap-1 text-primary">
                  +{scenario.xp} XP
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {scenario.stocks.slice(0, 3).map((stock, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {stock}
                  </span>
                ))}
                {scenario.stocks.length > 3 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    +{scenario.stocks.length - 3} more
                  </span>
                )}
              </div>

              <Button
                asChild
                variant="default"
                className="w-full justify-between group-hover:gap-2"
                size="sm"
              >
                <Link href={`/practice/${scenario.id}`} className="flex items-center justify-between w-full">
                  <span>Start Practice</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}