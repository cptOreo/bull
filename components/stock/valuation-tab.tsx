"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { DCFBuilder } from "./dcf-builder";
import { RatioGrid } from "./ratio-grid";
import { Calculator, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatRatio, formatPercent } from "@/lib/utils/formatters";

interface ValuationTabProps {
  stock: {
    ticker: string;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
  };
}

const VALUATION_TABS = [
  { id: "multiples", label: "Multiples", icon: Calculator },
  { id: "dcf", label: "DCF Model", icon: BarChart3 },
  { id: "history", label: "Historical", icon: TrendingUp },
] as const;

export function ValuationTab({ stock }: ValuationTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Current Valuation Multiples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RatioGrid stock={stock} />
        </CardContent>
      </Card>

      <Tabs defaultValue="multiples" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {VALUATION_TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              <t.icon className="h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="multiples" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Peer Comparison</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Peer comparison requires sector data. Coming soon.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Historical Range</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Historical P/E percentile chart. Coming soon.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dcf" className="pt-6">
          <DCFBuilder ticker={stock.ticker} />
        </TabsContent>

        <TabsContent value="history" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Valuation History</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Historical valuation chart. Coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}