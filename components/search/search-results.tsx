"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Building2, BookOpen, Bot, Target } from "lucide-react";
import { StockSearchResult } from "./stock-search-result";
import { PageSearchResult } from "./page-search-result";
import { AISearchResult } from "./ai-search-result";
import { LearnSearchResult } from "./learn-search-result";
import { useStockSearch } from "@/hooks/use-stock";

interface SearchResultsProps {
  tab: "stocks" | "pages" | "ai" | "learn";
  query: string;
}

export function SearchResults({ tab, query }: SearchResultsProps) {
  const { data: stocks, isLoading, error } = useStockSearch(query);

  if (tab === "stocks") {
    if (query.length < 2) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Type at least 2 characters to search stocks</p>
          <p className="text-sm mt-1">Try: "Reliance", "TCS", "Zomato", "Apple"</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      );
    }

    if (error || !stocks?.length) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No stocks found for "{query}"</p>
        </div>
      );
    }

    return (
      <div className="max-h-[50vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="divide-y divide-border/50"
        >
          {stocks!.map((stock, i) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <StockSearchResult stock={stock} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (tab === "pages") {
    const pages = [
      { href: "/", label: "Home", desc: "Adaptive dashboard", icon: Building2 },
      { href: "/learn", label: "Learn", desc: "Skill tree & lessons", icon: BookOpen },
      { href: "/research", label: "Research", desc: "AI Analyst workspace", icon: Bot },
      { href: "/practice", label: "Practice", desc: "Scenarios & quizzes", icon: Target },
      { href: "/profile", label: "Progress", desc: "XP, badges, streak", icon: Target },
    ].filter((p) => p.label.toLowerCase().includes(query.toLowerCase()) || p.desc.toLowerCase().includes(query.toLowerCase()));

    return (
      <div className="divide-y divide-border/50">
        {pages.map((page, i) => (
          <motion.div key={page.href} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
            <PageSearchResult page={page} />
          </motion.div>
        ))}
      </div>
    );
  }

  if (tab === "ai") {
    return (
      <div className="p-8">
        <AISearchResult query={query} />
      </div>
    );
  }

  if (tab === "learn") {
    return (
      <div className="p-8">
        <LearnSearchResult query={query} />
      </div>
    );
  }

  return null;
}