"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import Link from "next/link";
import { Play, BookOpen, Target, ArrowRight, CheckCircle } from "lucide-react";

interface ContinueItem {
  type: string;
  label: string;
  desc: string;
  progress: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CONTINUE_ITEMS: ContinueItem[] = [
  { type: "lesson", label: "DCF Modeling", desc: "Step 3: Guided Practice", progress: 60, href: "/learn/dcf", icon: BookOpen, color: "from-violet-500 to-purple-500" },
  { type: "practice", label: "Find Red Flags — Zomato", desc: "Scenario 2 of 4", progress: 0, href: "/practice/find-red-flags", icon: Target, color: "from-rose-500 to-pink-500" },
  { type: "quiz", label: "Daily Quiz", desc: "5 questions • 15 XP", progress: 0, href: "/learn/quiz", icon: Play, color: "from-blue-500 to-cyan-500" },
  { type: "lesson", label: "Dividend Safety", desc: "Step 1: Concept", progress: 0, href: "/learn/dividend-safety", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
];

export function ContinueLearning() {
  return (
    <section className="py-16 lg:py-24" aria-labelledby="continue-title">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
        >
          <div>
            <h2 id="continue-title" className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
              Continue Learning
            </h2>
            <p className="mt-2 text-muted-foreground">Pick up where you left off</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONTINUE_ITEMS.map((item, i) => (
            <motion.article
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="group relative p-5 rounded-xl glass dark:glass-dark border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", `bg-gradient-to-br ${item.color}`)}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              {item.progress > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      className="h-full bg-primary rounded-full"
                      transition={{ delay: 0.2, duration: 0.6 }}
                    />
                  </div>
                </div>
              )}
              <Button
                asChild
                variant={item.progress > 0 ? "default" : "outline"}
                className="w-full justify-between group-hover:gap-2"
                size="sm"
              >
                <Link href={item.href}>
                  {item.progress === 100 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" /> Completed
                    </>
                  ) : item.progress > 0 ? (
                    "Continue"
                  ) : (
                    "Start"
                  )}
                </Link>
                <ArrowRight className="h-4 w-4 transition-transform" />
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}