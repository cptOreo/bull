"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { MasteryRing } from "@/ui/mastery-ring";
import { Button } from "@/ui/button";
import Link from "next/link";
import { BookOpen, CheckCircle } from "lucide-react";
import { useProgress } from "@/state/use-progress";

const STOCK_CONCEPTS = [
  { id: "pe-ratio", label: "P/E Ratio", track: "Analyze Any Stock" },
  { id: "dcf-modeling", label: "DCF Modeling", track: "Analyze Any Stock" },
  { id: "dividend-safety", label: "Dividend Safety", track: "Build Dividend Portfolio" },
  { id: "cash-flow", label: "Cash Flow Analysis", track: "Read Financial Statements" },
  { id: "pricing-power", label: "Pricing Power", track: "Understand Moats" },
  { id: "roe", label: "ROE & DuPont", track: "Analyze Any Stock" },
] as const;

export function LearnChips({ stock }: { stock: { ticker: string; name: string } }) {
  const { mastery } = useProgress();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Learn with {stock.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Practice these concepts using {stock.name}&apos;s real financial data
        </p>
        <div className="flex flex-wrap gap-3">
          {STOCK_CONCEPTS.map((concept, i) => {
            const nodeMastery = mastery[concept.id] || { level: 0, progress: 0 };
            return (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl glass dark:glass-dark border border-border/50 group"
              >
                <MasteryRing progress={nodeMastery.progress * 20} size={36} strokeWidth={3} showLabel={false} level={nodeMastery.level} />
                <div className="flex-1 min-w-0">
                  <Link href={`/learn/${concept.id}`} className="font-medium hover:text-primary transition-colors">
                    {concept.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">{concept.track}</p>
                </div>
                <div className="flex items-center gap-2">
                  {nodeMastery.level >= 5 && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/learn/${concept.id}`}>Practice</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}