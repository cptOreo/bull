"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { DCFBuilder } from "./dcf-builder";
import { RatioGrid } from "./ratio-grid";
import { PriceChart } from "./price-chart";
import { Calculator, TrendingUp, TrendingDown, BarChart3, Building2, ArrowRight } from "lucide-react";
import { formatPrice, formatCrore } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { useStockHistory } from "@/hooks/use-stock";

function formatRatio(val: number | null): string {
  return val !== null ? `${val.toFixed(1)}x` : "N/A";
}

function formatPercent(val: number | null): string {
  return val !== null ? `${val.toFixed(2)}%` : "N/A";
}

interface ValuationTabProps {
  stock: {
    ticker: string;
    name: string;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    currency: string;
    price?: number;
    priceHistory?: unknown;
  };
}

const VALUATION_TABS = [
  { id: "multiples", label: "Multiples", icon: Calculator },
  { id: "dcf", label: "DCF Model", icon: BarChart3 },
  { id: "peers", label: "Peers", icon: Building2 },
  { id: "history", label: "History", icon: TrendingUp },
] as const;

const PEER_COMPANIES = {
  "RELIANCE": ["TCS", "HDFCBANK", "INFY", "ITC"],
  "TCS": ["INFY", "WIPRO", "HCLTECH", "TECHM"],
  "HDFCBANK": ["ICICIBANK", "KOTAKBANK", "AXISBANK", "SBIN"],
  "INFY": ["TCS", "WIPRO", "HCLTECH", "TECHM"],
  "ZOMATO": ["SWIGGY", "DMART", "NYKAA", "PAYTM"],
  "TATAMOTORS": ["MARUTI", "M&M", "BAJAJ-AUTO", "HEROMOTOCO"],
  "ITC": ["HINDUNILVR", "NESTLEIND", "BRITANNIA", "DABUR"],
} as const;

function getPeerTickers(ticker: string): string[] {
  const base = ticker.replace(".NS", "").replace(".BO", "");
  const peers = PEER_COMPANIES[base as keyof typeof PEER_COMPANIES];
  return peers ? [...peers] : [];
}

function calculatePePercentile(peRatio: number | null): string {
  if (peRatio === null) return "N/A";
  const value = Math.min(100, Math.max(0, Math.round(100 - (peRatio || 20) * 2)));
  return `${value}%`;
}

function calculatePbPercentile(pbRatio: number | null): string {
  if (pbRatio === null) return "N/A";
  const value = Math.min(100, Math.max(0, Math.round(100 - (pbRatio || 2) * 10)));
  return `${value}%`;
}

function calculateRoePercentile(roe: number | null): string {
  if (roe === null) return "N/A";
  const value = Math.min(100, Math.max(0, Math.round((roe || 10) * 3)));
  return `${value}%`;
}

function calculateDebtPercentile(debtToEquity: number | null): string {
  if (debtToEquity === null) return "N/A";
  const value = Math.min(100, Math.max(0, Math.round(100 - (debtToEquity || 0.5) * 20)));
  return `${value}%`;
}

export function ValuationTab({ stock }: ValuationTabProps) {
  const [activeTab, setActiveTab] = React.useState("multiples");
  const { data: peersData } = useStockHistory(stock.ticker, "1y", "1d");

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

      <Tabs defaultValue="multiples" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          {VALUATION_TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 py-2 text-sm">
              <t.icon className="h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="multiples" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Peer Comparison</CardTitle></CardHeader>
              <CardContent>
                <PeerComparisonTable stock={stock} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Sector Positioning</CardTitle></CardHeader>
              <CardContent>
                <SectorPositioningChart stock={stock} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dcf" className="pt-6">
          <DCFBuilder ticker={stock.ticker} currentPrice={stock.price} />
        </TabsContent>

        <TabsContent value="peers" className="pt-6">
          <PeerAnalysis stock={stock} />
        </TabsContent>

        <TabsContent value="history" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Valuation History</CardTitle></CardHeader>
            <CardContent>
              <ValuationHistoryChart stock={stock} priceHistory={stock.priceHistory} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PeerComparisonTable({ stock }: { stock: ValuationTabProps["stock"] }) {
  const peers = getPeerTickers(stock.ticker);
  
  if (peers.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No peer data available for this stock.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 w-32">Company</th>
            <th className="pb-2 text-right">P/E</th>
            <th className="pb-2 text-right">P/B</th>
            <th className="pb-2 text-right">ROE</th>
            <th className="pb-2 text-right">D/E</th>
            <th className="pb-2 text-right">Div Yield</th>
            <th className="pb-2 text-right">Mkt Cap</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b font-semibold bg-muted/50">
            <td className="py-2 font-medium">{stock.name} ({stock.ticker.replace(".NS", "").replace(".BO", "")})</td>
            <td className="py-2 text-right font-mono tabular-nums">{formatRatio(stock.peRatio)}</td>
            <td className="py-2 text-right font-mono tabular-nums">{formatRatio(stock.pbRatio)}</td>
            <td className="py-2 text-right font-mono tabular-nums">{formatPercent(stock.roe)}</td>
            <td className="py-2 text-right font-mono tabular-nums">{formatRatio(stock.debtToEquity)}</td>
            <td className="py-2 text-right font-mono tabular-nums">{formatPercent(stock.dividendYield)}</td>
            <td className="py-2 text-right font-mono tabular-nums">—</td>
          </tr>
          {Array.from({ length: 3 }, (_, i) => (
            <tr key={i} className="border-b hover:bg-accent/50">
              <td className="py-2 font-mono text-sm">{Array.from({ length: 3 }, (_, i) => i + 1)[i] ? ["TCS", "INFY", "WIPRO"][i] : `Peer ${i + 1}`}</td>
              <td className="py-2 text-right font-mono tabular-nums">—</td>
              <td className="py-2 text-right font-mono tabular-nums">—</td>
              <td className="py-2 text-right font-mono tabular-nums">—</td>
              <td className="py-2 text-right font-mono tabular-nums">—</td>
              <td className="py-2 text-right font-mono tabular-nums">—</td>
              <td className="py-2 text-right font-mono tabular-nums">—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectorPositioningChart({ stock }: { stock: ValuationTabProps["stock"] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Sector positioning data requires sector-wide data. Placeholder for sector percentile visualization.</p>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="P/E Percentile" value={stock.peRatio ? calculatePePercentile(stock.peRatio) : "N/A"} />
        <MetricCard label="P/B Percentile" value={stock.pbRatio ? calculatePbPercentile(stock.pbRatio) : "N/A"} />
        <MetricCard label="ROE Percentile" value={stock.roe ? calculateRoePercentile(stock.roe) : "N/A"} />
        <MetricCard label="Debt/E Percentile" value={stock.debtToEquity ? calculateDebtPercentile(stock.debtToEquity) : "N/A"} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-display font-bold text-primary mt-1">{value}</p>
    </div>
  );
}

function PeerAnalysis({ stock }: { stock: ValuationTabProps["stock"] }) {
  return (
    <div className="space-y-6">
      <PeerComparisonTable stock={stock} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Key Valuation Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <MetricRow label="P/E Ratio" value={formatRatio(stock.peRatio)} benchmark="Sector: 18x" />
              <MetricRow label="P/B Ratio" value={formatRatio(stock.pbRatio)} benchmark="Sector: 2.5x" />
              <MetricRow label="EV/EBITDA" value="—" benchmark="Sector: 12x" />
              <MetricRow label="Dividend Yield" value={formatPercent(stock.dividendYield)} benchmark="Sector: 1.2%" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quality & Risk</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <MetricRow label="ROE" value={formatPercent(stock.roe)} benchmark=">15% Good" />
              <MetricRow label="ROCE" value={formatPercent(stock.roe)} benchmark=">18% Good" />
              <MetricRow label="Debt/Equity" value={formatRatio(stock.debtToEquity)} benchmark="<0.5 Conservative" />
              <MetricRow label="Interest Coverage" value="—" benchmark=">5x Safe" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({ label, value, benchmark }: { label: string; value: string; benchmark: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{benchmark}</span>
      </div>
      <span className="font-mono text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}

function ValuationHistoryChart({ stock, priceHistory }: { stock: ValuationTabProps["stock"]; priceHistory?: unknown }) {
  return (
    <Card>
      <CardHeader><CardTitle>P/E History (5 Years)</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Historical P/E chart requires price history and earnings data. Integration pending.</p>
        </div>
      </CardContent>
    </Card>
  );
}