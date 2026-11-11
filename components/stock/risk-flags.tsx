"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { AlertTriangle, AlertCircle, Info, Shield, TrendingDown, DollarSign } from "lucide-react";

interface RiskFlagsProps {
  stock: {
    watchouts: string[];
    peRatio: number | null;
    debtToEquity: number | null;
    netMargin: number | null;
    roe: number | null;
  };
}

const RISK_CATEGORIES = [
  { key: "valuation", label: "Valuation Risk", icon: DollarSign, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", severity: "medium" },
  { key: "leverage", label: "Leverage Risk", icon: Shield, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", severity: "high" },
  { key: "profitability", label: "Profitability Risk", icon: TrendingDown, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", severity: "high" },
  { key: "market", label: "Market Risk", icon: AlertCircle, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", severity: "medium" },
  { key: "concentration", label: "Concentration Risk", icon: AlertTriangle, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", severity: "medium" },
];

function getRiskFlags(stock: RiskFlagsProps["stock"]) {
  const flags: Array<{ category: typeof RISK_CATEGORIES[0]; message: string }> = [];

  if (stock.peRatio != null && stock.peRatio > 50) {
    flags.push({ category: RISK_CATEGORIES[0], message: `High P/E (${stock.peRatio.toFixed(1)}x) — minimal margin of safety` });
  } else if (stock.peRatio != null && stock.peRatio > 35) {
    flags.push({ category: RISK_CATEGORIES[0], message: `Elevated P/E (${stock.peRatio.toFixed(1)}x) — requires strong execution` });
  }

  if (stock.debtToEquity != null && stock.debtToEquity > 1.5) {
    flags.push({ category: RISK_CATEGORIES[1], message: `High D/E (${stock.debtToEquity.toFixed(2)}x) — sensitive to rate hikes` });
  }

  if (stock.netMargin != null && stock.netMargin > 0 && stock.netMargin < 5) {
    flags.push({ category: RISK_CATEGORIES[2], message: `Thin margins (${stock.netMargin.toFixed(1)}%) — vulnerable to cost shocks` });
  } else if (stock.netMargin != null && stock.netMargin <= 0) {
    flags.push({ category: RISK_CATEGORIES[2], message: `Negative margins — turnaround required` });
  }

  if (stock.roe != null && stock.roe < 8) {
    flags.push({ category: RISK_CATEGORIES[2], message: `Low ROE (${stock.roe.toFixed(1)}%) — poor capital efficiency` });
  }

  flags.push({ category: RISK_CATEGORIES[3], message: "Exposed to macro cycles, inflation, rate volatility" });
  flags.push({ category: RISK_CATEGORIES[4], message: "Sector concentration risk — diversify across sectors" });

  return flags;
}

export function RiskFlags({ stock }: RiskFlagsProps) {
  const flags = getRiskFlags(stock);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Risk Flags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.map((flag, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border",
              flag.category.severity === "high" ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"
            )}
          >
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", flag.category.color)}>
              <flag.category.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{flag.category.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{flag.message}</p>
            </div>
            <Badge variant={flag.category.severity === "high" ? "destructive" : "warning"} size="sm">
              {flag.category.severity.toUpperCase()}
            </Badge>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}