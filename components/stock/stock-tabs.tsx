"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { FinancialsTab } from "./financials-tab";
import { ValuationTab } from "./valuation-tab";
import { RiskFlags } from "./risk-flags";
import { NewsFeed } from "./news-feed";
import { LearnChips } from "./learn-chips";
import { Building2, FileText, Calculator, AlertTriangle, Newspaper, BookOpen } from "lucide-react";

interface StockTabsProps {
  stock: {
    ticker: string;
    name: string;
    strengths: string[];
    watchouts: string[];
    summary: string | null;
    sector: string | null;
    industry: string | null;
    financials?: Record<string, unknown>;
    priceHistory?: unknown;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    currency: string;
  };
}

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "financials", label: "Financials", icon: FileText },
  { id: "valuation", label: "Valuation", icon: Calculator },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "news", label: "News", icon: Newspaper },
  { id: "learn", label: "Learn", icon: BookOpen },
] as const;

export function StockTabs({ stock }: StockTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6 bg-muted">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 py-2 text-sm">
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="pt-6">
        <OverviewTab stock={stock} />
      </TabsContent>
      <TabsContent value="financials" className="pt-6">
        <FinancialsTab stock={stock} />
      </TabsContent>
      <TabsContent value="valuation" className="pt-6">
        <ValuationTab stock={stock} />
      </TabsContent>
      <TabsContent value="risks" className="pt-6">
        <RiskFlags stock={stock} />
      </TabsContent>
      <TabsContent value="news" className="pt-6">
        <NewsFeed stock={stock} />
      </TabsContent>
      <TabsContent value="learn" className="pt-6">
        <LearnChips stock={stock} />
      </TabsContent>
    </Tabs>
  );
}