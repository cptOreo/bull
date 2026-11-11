"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { ExternalLink, Newspaper, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

interface NewsFeedProps {
  stock: { ticker: string; name: string };
}

const MOCK_NEWS = [
  { id: "1", headline: "Company reports Q3 results", summary: "Revenue grew 15% YoY driven by strong domestic demand. Margins expanded 200bps.", publishedAt: "2026-11-05T10:30:00Z", source: "Exchange Filing", kind: "fact" as const },
  { id: "2", headline: "Analyst upgrades rating", summary: "Brokerage raises target citing market share gains in quick commerce. Maintains Buy.", publishedAt: "2026-11-03T14:15:00Z", source: "Brokerage Report", kind: "commentary" as const },
  { id: "3", headline: "New facility inauguration", summary: "Opened 50th dark store in Bangalore. Total network now covers 120 cities.", publishedAt: "2026-10-28T09:00:00Z", source: "Company Press Release", kind: "announcement" as const },
];

function NewsCard({ item }: { item: typeof MOCK_NEWS[0] }) {
  const kindStyles = {
    fact: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    commentary: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    announcement: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={kindStyles[item.kind]} size="sm">
              {item.kind.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(item.publishedAt.split("T")[0])}</span>
            <span className="text-xs text-muted-foreground">{item.source}</span>
          </div>
          <h4 className="font-medium line-clamp-1">{item.headline}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
        </div>
        <a href="#" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Read full article">
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
    </motion.article>
  );
}

export function NewsFeed({ stock }: { stock: { ticker: string; name: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5" /> Latest News
        </h3>
        <span className="text-sm text-muted-foreground">Showing latest 3 items</span>
      </div>
      <div className="space-y-3">
        {MOCK_NEWS.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
      <div className="text-center pt-4">
        <span className="text-sm text-muted-foreground">More news loading... (Yahoo Finance integration pending)</span>
      </div>
    </div>
  );
}