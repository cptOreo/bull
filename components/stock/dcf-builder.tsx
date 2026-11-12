"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Calculator, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice, formatPercent } from "@/lib/utils/formatters";
import { useStock } from "@/hooks/use-stock";

interface DCFBuilderProps {
  ticker: string;
  currentPrice?: number;
}

export function DCFBuilder({ ticker, currentPrice: initialPrice }: DCFBuilderProps) {
  const { data: stockData } = useStock(ticker);

  const baseRevenue = React.useMemo(() => {
    if (stockData?.financials?.annual?.value?.[0]?.revenueCr) {
      return stockData.financials.annual.value[0].revenueCr * 10000000;
    }
    return 100000;
  }, [stockData]);

  const shares = React.useMemo(() => {
    if (stockData?.financials?.annual?.value?.[0]?.sharesOutstandingCr) {
      return stockData.financials.annual.value[0].sharesOutstandingCr * 10000000;
    }
    return 100;
  }, [stockData]);

  const netDebt = React.useMemo(() => {
    if (stockData?.financials?.annual?.value?.[0]?.totalDebtCr && stockData?.financials?.annual?.value?.[0]?.cashAndEquivalentsCr) {
      return (stockData.financials.annual.value[0].totalDebtCr - stockData.financials.annual.value[0].cashAndEquivalentsCr) * 10000000;
    }
    return 10000;
  }, [stockData]);

  const [assumptions, setAssumptions] = React.useState({
    revenueGrowth: 0.12,
    operatingMargin: 0.22,
    taxRate: 0.25,
    wacc: 0.11,
    terminalGrowth: 0.04,
    projectionYears: 5,
  });
  const [dcfResult, setDcfResult] = React.useState<{
    intrinsicValue: number;
    currentPrice: number;
    upside: number;
    sensitivity: Array<{ wacc: number; growth: number; value: number }>;
  } | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      
      const { revenueGrowth, operatingMargin, taxRate, wacc, terminalGrowth, projectionYears } = assumptions;
      const baseRev = baseRevenue;
      const baseEBIT = baseRev * operatingMargin;
      const baseNOPAT = baseEBIT * (1 - taxRate);
      
      let pvSum = 0;
      for (let year = 1; year <= projectionYears; year++) {
        const revenue = baseRev * Math.pow(1 + revenueGrowth, year);
        const ebit = revenue * operatingMargin;
        const nopat = ebit * (1 - taxRate);
        const pv = nopat / Math.pow(1 + wacc, year);
        pvSum += pv;
      }
      
      const terminalValue = (baseNOPAT * Math.pow(1 + revenueGrowth, projectionYears) * (1 + terminalGrowth)) / (wacc - terminalGrowth);
      const terminalPV = terminalValue / Math.pow(1 + wacc, projectionYears);
      
      const enterpriseValue = pvSum + terminalPV;
      const equityValue = enterpriseValue - netDebt;
      const sharesOut = shares;
      const intrinsicValue = equityValue / sharesOut;
      const currentPrice = initialPrice || stockData?.price || 100;
      const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;

      const sensitivity = [];
      for (const w of [wacc - 0.01, wacc, wacc + 0.01]) {
        for (const g of [terminalGrowth - 0.01, terminalGrowth, terminalGrowth + 0.01]) {
          if (w <= g) continue;
          const tv = (baseNOPAT * Math.pow(1 + revenueGrowth, projectionYears) * (1 + g)) / (w - g);
          const tpv = tv / Math.pow(1 + w, projectionYears);
          const ev = pvSum * (wacc / w) + tpv;
          const eq = ev - netDebt;
          sensitivity.push({ wacc: w, growth: g, value: eq / shares });
        }
      }

      setDcfResult({
        intrinsicValue,
        currentPrice,
        upside,
        sensitivity,
      });
    } catch (error) {
      console.error("DCF calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          DCF Valuation Model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Assumptions
            </h4>
            
            <AssumptionSlider
              label="Revenue Growth (YoY)"
              value={assumptions.revenueGrowth}
              onChange={v => setAssumptions(prev => ({ ...prev, revenueGrowth: v }))}
              min={0.02} max={0.30} step={0.01}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Operating Margin"
              value={assumptions.operatingMargin}
              onChange={v => setAssumptions(prev => ({ ...prev, operatingMargin: v }))}
              min={0.05} max={0.40} step={0.01}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="WACC (Discount Rate)"
              value={assumptions.wacc}
              onChange={v => setAssumptions(prev => ({ ...prev, wacc: v }))}
              min={0.07} max={0.18} step={0.005}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Terminal Growth"
              value={assumptions.terminalGrowth}
              onChange={v => setAssumptions(prev => ({ ...prev, terminalGrowth: v }))}
              min={0.02} max={0.06} step={0.005}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Tax Rate"
              value={assumptions.taxRate}
              onChange={v => setAssumptions(prev => ({ ...prev, taxRate: v }))}
              min={0.15} max={0.35} step={0.01}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Projection Years"
              value={assumptions.projectionYears}
              onChange={v => setAssumptions(prev => ({ ...prev, projectionYears: v }))}
              min={3} max={10} step={1}
              format={v => `${v}y`}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" /> Results
            </h4>
            
            <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
              {isCalculating ? "Calculating..." : "Calculate DCF"}
            </Button>

            {dcfResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Intrinsic Value</p>
                    <p className="font-mono text-2xl font-bold text-primary">₹{formatPrice(dcfResult.intrinsicValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="font-mono text-2xl font-bold">₹{formatPrice(dcfResult.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upside/Downside</p>
                    <p className={cn("font-mono text-2xl font-bold", dcfResult.upside >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {dcfResult.upside >= 0 ? "+" : ""}{formatPercent(dcfResult.upside)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2">WACC \ Growth</th>
                        {[-0.01, 0, 0.01].map(g => (
                          <th key={g} className="pb-2 text-center">{formatPercent((assumptions.terminalGrowth + g) * 100)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[-0.01, 0, 0.01].map(w => (
                        <tr key={w}>
                          <td className="py-2 font-medium font-mono">{formatPercent((assumptions.wacc + w) * 100)}</td>
                          {[-0.01, 0, 0.01].map(g => (
                            <td key={g} className="py-2 text-center font-mono">
                              {dcfResult.sensitivity.find(s => Math.abs(s.wacc - (assumptions.wacc + w)) < 0.001 && Math.abs(s.growth - (assumptions.terminalGrowth + g)) < 0.001)?.value 
                                ? `₹${formatPrice(dcfResult.sensitivity.find(s => Math.abs(s.wacc - (assumptions.wacc + w)) < 0.001 && Math.abs(s.growth - (assumptions.terminalGrowth + g)) < 0.001)!.value)}`
                                : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssumptionSlider({ label, value, onChange, min, max, step, format }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}