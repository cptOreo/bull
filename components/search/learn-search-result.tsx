"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { MasteryRing } from "@/ui/mastery-ring";

const LEARN_CONCEPTS = [
  { id: "pe-ratio", label: "P/E Ratio", track: "Analyze Any Stock" },
  { id: "dcf-modeling", label: "DCF Modeling", track: "Analyze Any Stock" },
  { id: "dividend-safety", label: "Dividend Safety", track: "Build Dividend Portfolio" },
  { id: "cash-flow", label: "Cash Flow Analysis", track: "Read Financial Statements" },
  { id: "pricing-power", label: "Pricing Power", track: "Understand Moats" },
  { id: "roe", label: "ROE & DuPont", track: "Analyze Any Stock" },
] as const;

export function LearnSearchResult({ query }: { query: string }) {
  const filtered = LEARN_CONCEPTS.filter(
    (c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.track.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No concepts found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {filtered.map((concept) => (
        <div key={concept.id} className="p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <MasteryRing progress={0} size={40} strokeWidth={3} showLabel={false} level={0} />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{concept.label}</h4>
              <p className="text-xs text-muted-foreground">{concept.track}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </div>
      ))}
    </div>
  );
}