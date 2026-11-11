"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { Target, Search, TrendingUp, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { useProgress } from "@/state/use-progress";

export interface PracticeScenario {
  id: string;
  title: string;
  desc: string;
  category: "flags" | "compare" | "dcf" | "screen";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
  stocks: string[];
  steps: number;
}

export const PRACTICE_SCENARIOS: PracticeScenario[] = [
  // 1. Red Flags
  {
    id: "find-red-flags",
    title: "Find Red Flags in Statements",
    desc: "Detect cash flow divergence, customer debtor spikes, and promoter pledging.",
    category: "flags",
    icon: ShieldAlert,
    color: "from-rose-500 to-pink-500",
    difficulty: "Medium",
    xp: 30,
    stocks: ["Zomato", "Paytm", "Nykaa"],
    steps: 3,
  },
  {
    id: "zomato-flags",
    title: "Zomato: Cash Burn vs EBITDA",
    desc: "Scrutinize delivery vs quick commerce unit economics and dark store capex.",
    category: "flags",
    icon: ShieldAlert,
    color: "from-rose-500 to-red-600",
    difficulty: "Medium",
    xp: 30,
    stocks: ["Zomato", "Swiggy"],
    steps: 3,
  },
  {
    id: "paytm-governance",
    title: "Paytm: Regulatory & Banking Flags",
    desc: "Trace regulatory dependence, related-party balances, and payments bank restrictions.",
    category: "flags",
    icon: ShieldAlert,
    color: "from-rose-600 to-amber-600",
    difficulty: "Hard",
    xp: 40,
    stocks: ["Paytm"],
    steps: 4,
  },

  // 2. Compare Valuation
  {
    id: "compare-valuation",
    title: "IT Services Valuation Face-Off",
    desc: "Compare P/E, EV/EBITDA, and ROE across TCS, Infosys, and Wipro.",
    category: "compare",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
    difficulty: "Medium",
    xp: 30,
    stocks: ["TCS", "Infosys", "Wipro", "HCL Tech"],
    steps: 3,
  },
  {
    id: "auto-giants-valuation",
    title: "Auto Giants: Tata Motors vs Maruti",
    desc: "Evaluate EV turnaround multiple vs traditional passenger vehicle cash flows.",
    category: "compare",
    icon: TrendingUp,
    color: "from-blue-600 to-indigo-600",
    difficulty: "Medium",
    xp: 30,
    stocks: ["Tata Motors", "Maruti Suzuki", "Mahindra"],
    steps: 3,
  },
  {
    id: "banking-titans-valuation",
    title: "Banking Titans: HDFC vs ICICI",
    desc: "Assess Net Interest Margins (NIM), credit provisions, and P/B multiples.",
    category: "compare",
    icon: TrendingUp,
    color: "from-indigo-500 to-blue-600",
    difficulty: "Hard",
    xp: 40,
    stocks: ["HDFC Bank", "ICICI Bank", "SBI"],
    steps: 4,
  },

  // 3. Build DCF
  {
    id: "build-dcf",
    title: "Build a DCF: Reliance Industries",
    desc: "Project 5-year free cash flows and discount with WACC hurdle rate.",
    category: "dcf",
    icon: Search,
    color: "from-violet-500 to-purple-500",
    difficulty: "Hard",
    xp: 50,
    stocks: ["Reliance", "Jio", "Retail"],
    steps: 5,
  },
  {
    id: "dcf-tcs",
    title: "DCF Modeling: TCS Compounding",
    desc: "Model steady-state 90%+ cash conversion and calculate intrinsic fair value.",
    category: "dcf",
    icon: Search,
    color: "from-violet-600 to-fuchsia-600",
    difficulty: "Hard",
    xp: 50,
    stocks: ["TCS"],
    steps: 5,
  },
  {
    id: "dcf-titan",
    title: "DCF Modeling: Titan Consumer Moat",
    desc: "Calibrate high reinvestment rates, jewellery market share, and terminal value.",
    category: "dcf",
    icon: Search,
    color: "from-purple-600 to-pink-600",
    difficulty: "Hard",
    xp: 50,
    stocks: ["Titan Company"],
    steps: 5,
  },

  // 4. Screen for Quality
  {
    id: "screen-quality",
    title: "Screen for High-Quality Compounders",
    desc: "Filter stocks with ROE > 15%, D/E < 0.8x, and sales growth > 10%.",
    category: "screen",
    icon: Target,
    color: "from-emerald-500 to-teal-500",
    difficulty: "Easy",
    xp: 20,
    stocks: ["Nifty 50", "Nifty 100"],
    steps: 2,
  },
  {
    id: "dividend-aristocrats-screen",
    title: "Dividend Aristocrat Screener",
    desc: "Find businesses with sustainable dividend yields and low payout ratios.",
    category: "screen",
    icon: Target,
    color: "from-teal-500 to-emerald-600",
    difficulty: "Easy",
    xp: 20,
    stocks: ["ITC", "HCL Tech", "Coal India"],
    steps: 2,
  },
  {
    id: "debt-free-screen",
    title: "Zero-Debt Growth Screener",
    desc: "Identify debt-free businesses generating positive free cash flows.",
    category: "screen",
    icon: Target,
    color: "from-emerald-600 to-green-600",
    difficulty: "Medium",
    xp: 30,
    stocks: ["Infosys", "TCS", "Asian Paints"],
    steps: 3,
  },
];

export interface PracticeArenaViewProps {
  showHeader?: boolean;
}

export function PracticeArenaView({ showHeader = false }: PracticeArenaViewProps) {
  const { xp, level, streak } = useProgress();
  const [activeTab, setActiveTab] = React.useState("all");

  const filteredScenarios = React.useMemo(() => {
    if (activeTab === "all") return PRACTICE_SCENARIOS;
    if (activeTab === "easy") return PRACTICE_SCENARIOS.filter((s) => s.difficulty === "Easy");
    if (activeTab === "medium") return PRACTICE_SCENARIOS.filter((s) => s.difficulty === "Medium");
    if (activeTab === "hard") return PRACTICE_SCENARIOS.filter((s) => s.difficulty === "Hard");
    return PRACTICE_SCENARIOS;
  }, [activeTab]);

  return (
    <div className="w-full space-y-6">
      {showHeader && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Interactive Simulator
                </span>
                <span className="text-xs text-muted-foreground">12 Practical Scenarios</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight mt-1 text-foreground">
                Practice Arena
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Apply your financial literacy to real Indian and global companies across 4 specialized modes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-background text-sm">
                <span className="font-medium text-foreground">XP:</span>
                <span className="font-mono font-bold text-primary">{xp.toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  Lvl {level}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  🔥 {streak}d
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/70 p-1 rounded-xl mb-6">
          <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm">
            All Scenarios (12)
          </TabsTrigger>
          <TabsTrigger value="easy" className="rounded-lg text-xs sm:text-sm">
            Easy (3)
          </TabsTrigger>
          <TabsTrigger value="medium" className="rounded-lg text-xs sm:text-sm">
            Medium (5)
          </TabsTrigger>
          <TabsTrigger value="hard" className="rounded-lg text-xs sm:text-sm">
            Hard (4)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 12 Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScenarios.map((scenario, i) => (
          <motion.article
            key={scenario.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i, duration: 0.3 }}
            className="group relative p-5 rounded-2xl glass dark:glass-dark border border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3.5 mb-3">
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs", `bg-gradient-to-br ${scenario.color}`)}>
                  <scenario.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm truncate text-foreground">{scenario.title}</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-semibold inline-block",
                    scenario.difficulty === "Easy" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    scenario.difficulty === "Medium" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    scenario.difficulty === "Hard" && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    {scenario.difficulty}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {scenario.desc}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {scenario.stocks.map((stk, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-muted/70 text-muted-foreground font-medium">
                    {stk}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pt-2 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {scenario.steps} steps
                </span>
                <span className="font-mono font-bold text-primary">
                  +{scenario.xp} XP
                </span>
              </div>

              <Button
                asChild
                variant="default"
                className="w-full justify-between group-hover:gap-2 text-xs h-8"
                size="sm"
              >
                <Link href={`/practice/${scenario.id}`} className="flex items-center justify-between w-full">
                  <span>Start Simulation</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
