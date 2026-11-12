"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface FollowUpChipsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  mode?: "tutor" | "analyst";
  maxChips?: number;
}

export function FollowUpChips({ suggestions, onSelect, maxChips = 4 }: FollowUpChipsProps) {
  if (!suggestions.length) return null;

  const displaySuggestions = suggestions.slice(0, maxChips);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-wrap gap-2"
      role="list"
      aria-label="Suggested follow-up questions"
    >
      {displaySuggestions.map((suggestion, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
          onClick={() => onSelect(suggestion)}
          className={cn(
            "relative flex items-center gap-2 px-3 py-1.5 rounded-xl",
            "bg-muted/50 border border-border/50",
            "text-xs font-medium text-foreground hover:bg-accent/50",
            "transition-all duration-200",
            "cursor-pointer whitespace-nowrap"
          )}
          role="listitem"
          aria-label={`Follow up: ${suggestion}`}
        >
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary">
            <span className="h-3.5 w-3.5">✨</span>
          </span>
          <span className="truncate max-w-[200px] pr-2">{suggestion}</span>
          <span className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0">→</span>
        </motion.button>
      ))}
    </motion.div>
  );
}