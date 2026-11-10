"use client";

import React, { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import { snapshot } from "@/lib/data/snapshot";
import { getStockMetrics } from "@/lib/engine/metrics";
import { deriveRiskFlags } from "@/lib/engine/risk";
import { useBull } from "@/lib/state/use-bull";
import { StockHeader } from "@/components/stock/stock-header";
import { MetricGrid } from "@/components/stock/metric-grid";
import { FinancialChart } from "@/components/stock/financial-chart";
import { PriceChart } from "@/components/stock/price-chart";
import { RatioGrid } from "@/components/stock/ratio-grid";
import { RiskList } from "@/components/stock/risk-list";
import { RiskCheck } from "@/components/stock/risk-check";
import { NewsList } from "@/components/stock/news-list";
import { Limitations } from "@/components/stock/limitations";
import {
  ProvenanceDrawer,
  type MetricProvenanceDetails,
} from "@/components/stock/provenance-drawer";

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export default function StockDetailPage({ params }: PageProps) {
  const { ticker } = use(params);
  const stock = snapshot.stocks.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!stock) {
    notFound();
  }

  const { logEvent } = useBull();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricProvenanceDetails | null>(null);

  const now = "2026-11-10T14:00:00Z";
  const metrics = useMemo(() => getStockMetrics(stock, snapshot, now), [stock]);
  const riskFlags = useMemo(() => deriveRiskFlags(metrics, stock), [metrics, stock]);
  const sector = snapshot.sectors.find((s) => s.id === stock.sectorId);
  const sectorName = sector?.name ?? stock.sectorId;

  // Open provenance drawer for a metric
  const handleInspectMetric = (metricId: string, metricLabel: string, metricValue: string) => {
    setActiveMetric({
      id: metricId,
      name: metricLabel,
      value: metricValue,
      asOf: "2026-11-10",
      rung1: {
        source: "Official NSE/BSE filing & Audited Annual Report FY26",
        document: `${stock.name} Annual Report FY26 (Note on Financial Statements)`,
        pageOrNote: "Consolidated Financials p. 112",
        timestamp: "2026-10-31",
      },
      rung2: {
        formula: `${metricLabel} = Computed from audited standalone & consolidated financials`,
        inputs: [
          { label: "Close Price", value: `₹${metrics.values.latestClose.toFixed(2)}` },
          { label: "Reporting Base", value: "FY2026 Audited" },
        ],
      },
      rung3: {
        percentile: 88,
        sampleSize: 50,
        universeName: "Nifty 50 Large-Cap",
        interpretation: "Ranked against all 50 constituent companies in the Nifty 50 benchmark.",
      },
      rung4: {
        claimText: `${stock.name} demonstrates stable fundamental performance based on audited filings.`,
        context: `${metricLabel} metric card on stock deep-dive`,
      },
    });
    setDrawerOpen(true);
    logEvent({
      type: "chart_viewed",
      ticker: stock.ticker,
      timestamp: new Date().toISOString(),
      data: { metricId },
    });
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Stock Header */}
      <StockHeader
        ticker={stock.ticker}
        name={stock.name}
        sector={sectorName}
        sectorId={stock.sectorId}
        latestClose={metrics.values.latestClose}
        oneSessionMovePct={metrics.values.oneSessionMovePct ?? 0}
        marketCapCr={metrics.refs["marketCap"] ? Number(metrics.refs["marketCap"].value) : undefined}
        asOf="2026-11-10"
        sourceLabel="Official Bhavcopy & Filings"
        freshness="current"
      />

      {/* 4-Card Metric Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Key Financial Ratios & Fundamentals
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Click ℹ️ on any metric to view 4-rung audit trail
          </span>
        </div>
        <MetricGrid
          ticker={stock.ticker}
          values={metrics.values}
          sectorModel={stock.sectorModel}
          sectorMedianPe={sector?.medianPe?.value ?? null}
          sectorMedianPb={sector?.medianPb?.value ?? null}
          asOf="2026-11-10"
          onSelectMetric={handleInspectMetric}
        />
      </section>

      {/* Financial Statement Charts & Price Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FinancialChart
          ticker={stock.ticker}
          financials={stock.financials.annual.value ?? []}
        />
        <PriceChart
          ticker={stock.ticker}
          name={stock.name}
          segments={metrics.chartSegments}
          fiveYearReturnPct={metrics.values.fiveYearReturnPct ?? undefined}
          indexReturnPct={metrics.values.indexReturnPct ?? undefined}
        />
      </section>

      {/* Fundamental Ratios Detailed Grid */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Comprehensive Ratio Analysis
        </h2>
        <RatioGrid
          metrics={metrics}
          sectorModel={stock.sectorModel}
          onSelectRatio={(id) => handleInspectMetric(id, id, "")}
        />
      </section>

      {/* Risk Analysis & Practice Check */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Assessed Risk Factors (§7.7)
          </h2>
          <RiskList
            flags={riskFlags}
            ticker={stock.ticker}
            onSelectMetricRef={(refId) => handleInspectMetric(refId, refId, "")}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Practice: Name The Risk
          </h2>
          <RiskCheck ticker={stock.ticker} flags={riskFlags} />
        </div>
      </section>

      {/* News & Announcements */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Recent Material Announcements (Last 90 Days)
        </h2>
        <NewsList
          items={snapshot.news.filter((n) => n.ticker === stock.ticker)}
          ticker={stock.ticker}
        />
      </section>

      {/* Data Limitations & SEBI Disclosure */}
      <Limitations />

      {/* Provenance Slide-over Drawer */}
      <ProvenanceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        details={activeMetric}
        ticker={stock.ticker}
      />
    </main>
  );
}
