"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Search, TrendingUp, DollarSign, BookOpen, Shield, ArrowRight } from "lucide-react";
import { useProfile } from "@/state/use-profile";

const GOALS = [
  {
    id: "analyze",
    label: "Analyze Any Stock",
    desc: "Learn valuation, financial statements, ratios & risk assessment",
    icon: Search,
    track: "analyze",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "dividend",
    label: "Build Dividend Portfolio",
    desc: "Yield analysis, payout safety, sector diversification, rebalancing",
    icon: DollarSign,
    track: "dividend",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "statements",
    label: "Read Financial Statements",
    desc: "Income statement, balance sheet, cash flow, quality checks, red flags",
    icon: BookOpen,
    track: "statements",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "moats",
    label: "Understand Business Moats",
    desc: "Pricing power, switching costs, network effects, scale, brand",
    icon: Shield,
    track: "moats",
    color: "from-amber-500 to-orange-500",
  },
] as const;

export function GoalSelector() {
  const { setProfile } = useProfile();

  const handleSelect = (goal: typeof GOALS[number]) => {
    setProfile({
      goal: goal.id,
      experience: "none",
      horizon: "5_10y",
      riskComfort: "medium",
      locale: "en",
    });
    window.location.href = `/learn?track=${goal.track}`;
  };

  return (
    <section className="py-16 lg:py-24" aria-labelledby="goals-title">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 id="goals-title" className="text-3xl lg:text-4xl font-display font-bold tracking-tight mb-4">
            What&apos;s your goal?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Choose a track and we&apos;ll personalize your learning path with the right concepts in the right order.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GOALS.map((goal, i) => (
            <motion.article
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              className="group relative p-6 rounded-2xl glass dark:glass-dark border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              whileHover={{ y: -4 }}
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br" style={{ background: goal.color }}>
                <goal.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{goal.label}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{goal.desc}</p>
              <Button
                className="w-full justify-between"
                size="lg"
                onClick={() => handleSelect(goal)}
                style={{ background: `linear-gradient(to right, ${goal.color.replace("from-", "").replace("to-", "")})` }}
              >
                <span>Start Track</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}