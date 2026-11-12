"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { RatioGrid } from "./ratio-grid";
import { Button } from "@/ui/button";
import Link from "next/link";
import { Building2, BookOpen, Calculator, Target, CheckCircle, AlertTriangle } from "lucide-react";

interface OverviewTabProps {
  stock: {
    summary: string | null;
    strengths: string[];
    watchouts: string[];
    sector: string | null;
    industry: string | null;
    peRatio: number | null;
    pbRatio: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    dividendYield: number | null;
  };
}

export function OverviewTab({ stock }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            How This Business Makes Money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {stock.summary || "Business summary not available."}
          </p>
          {stock.sector && (
            <p className="mt-3 text-sm text-muted-foreground">
              Sector: <span className="font-medium text-foreground">{stock.sector}</span>
              {stock.industry && (
                <>
                  <span className="mx-1">•</span> Industry: <span className="font-medium text-foreground">{stock.industry}</span>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span>Key Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stock.strengths.length > 0 ? (
              stock.strengths.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{s}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No strengths data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Watchouts & Risks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stock.watchouts.length > 0 ? (
              stock.watchouts.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/5 dark:bg-rose-500/10">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{w}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No watchouts data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <RatioGrid stock={stock} />

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground self-center">Learn concepts:</span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/pe-ratio"><BookOpen className="h-3.5 w-3.5 mr-1.5" />P/E Ratio</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/dcf-modeling"><Calculator className="h-3.5 w-3.5 mr-1.5" />DCF Modeling</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/pricing-power"><Target className="h-3.5 w-3.5 mr-1.5" />Pricing Power</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/cash-flow"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Cash Flow</Link>
        </Button>
      </div>
    </div>
  );
}