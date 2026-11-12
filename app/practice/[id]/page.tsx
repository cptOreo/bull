"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { useBullStore } from "@/state/use-bull";
import { useProgress } from "@/state/use-progress";
import {
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  ShieldAlert,
} from "lucide-react";

export default function PracticeDetailPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "find-red-flags";

  const { addXP, addBadge, updateMastery } = useBullStore();
  const { xp, level } = useProgress();

  // Determine scenario type
  const scenarioType: "flags" | "compare" | "dcf" | "screen" = React.useMemo(() => {
    if (rawId.includes("flag") || rawId.includes("zomato") || rawId.includes("paytm") || rawId.includes("nykaa")) {
      return "flags";
    }
    if (rawId.includes("compare") || rawId.includes("peer") || rawId.includes("giant") || rawId.includes("titan")) {
      return "compare";
    }
    if (rawId.includes("dcf") || rawId.includes("build")) {
      return "dcf";
    }
    return "screen";
  }, [rawId]);

  // Completion state
  const [completed, setCompleted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Mode A: Flags state
  const [selectedFlags, setSelectedFlags] = React.useState<Record<string, boolean>>({});

  // Mode B: Compare state
  const [selectedStockChoice, setSelectedStockChoice] = React.useState<string | null>(null);

  // Mode C: DCF state
  const [growth, setGrowth] = React.useState(12);
  const [margin, setMargin] = React.useState(22);
  const [wacc, setWacc] = React.useState(11);
  const [terminal, setTerminal] = React.useState(4);

  // Mode D: Screener state
  const [minRoe, setMinRoe] = React.useState(15);
  const [maxDebt, setMaxDebt] = React.useState(0.8);
  const [minGrowth, setMinGrowth] = React.useState(10);

  // Compute DCF values
  const dcfOutput = React.useMemo(() => {
    const baseRevenue = 10000; // ₹10,000 Cr
    const fcfYear1 = baseRevenue * (margin / 100) * 0.75;
    const fcf5Years: number[] = [];
    let currentFcf = fcfYear1;
    let sumPv = 0;

    for (let yr = 1; yr <= 5; yr++) {
      currentFcf *= 1 + growth / 100;
      const discountFactor = Math.pow(1 + wacc / 100, yr);
      const pv = currentFcf / discountFactor;
      sumPv += pv;
      fcf5Years.push(Math.round(currentFcf));
    }

    const terminalSpread = Math.max(0.01, (wacc - terminal) / 100);
    const terminalValue = (currentFcf * (1 + terminal / 100)) / terminalSpread;
    const pvTerminal = terminalValue / Math.pow(1 + wacc / 100, 5);
    const enterpriseValue = sumPv + pvTerminal;
    const netDebt = 1200;
    const equityValue = enterpriseValue - netDebt;
    const sharesCr = 400; // 400 Cr shares
    const fairValuePerShare = Math.round((equityValue / sharesCr) * 10);
    const marketPrice = 2850;
    const mosPct = Math.round(((fairValuePerShare - marketPrice) / fairValuePerShare) * 100);

    return {
      fcf5Years,
      enterpriseValue: Math.round(enterpriseValue),
      equityValue: Math.round(equityValue),
      fairValuePerShare,
      marketPrice,
      mosPct,
    };
  }, [growth, margin, wacc, terminal]);

  // Handle Mode A completion
  const handleFlagSubmit = () => {
    const isCorrect = selectedFlags["ocf"] && selectedFlags["pledge"];
    setCompleted(true);
    if (isCorrect) {
      addXP(30, "practice:red-flags");
      addBadge("risk_namer");
      setFeedback("Spot-on forensic analysis! You identified the OCF vs Net Profit divergence and promoter share pledging.");
    } else {
      addXP(15, "practice:red-flags-partial");
      setFeedback("Good attempt. Key forensic discrepancies included negative operating cash flow despite positive accounting net income.");
    }
  };

  // Handle Mode B completion
  const handleCompareSubmit = () => {
    if (!selectedStockChoice) return;
    setCompleted(true);
    addXP(30, "practice:compare-valuation");
    updateMastery("pe-ratio", 3, 100);
    setFeedback(`Analysis logged for ${selectedStockChoice}. Your valuation choice reflects return on equity and multiple discipline.`);
  };

  // Handle Mode C completion
  const handleDCFSubmit = () => {
    setCompleted(true);
    addXP(50, "practice:build-dcf");
    addBadge("dcf_builder");
    updateMastery("dcf-modeling", 4, 100);
    setFeedback(`DCF model locked at ₹${dcfOutput.fairValuePerShare} fair value per share (${dcfOutput.mosPct}% Margin of Safety). DCF Builder badge unlocked!`);
  };

  // Handle Mode D completion
  const handleScreenSubmit = () => {
    setCompleted(true);
    addXP(20, "practice:screen-quality");
    addBadge("screener");
    setFeedback(`Screen saved with ${passingStocks.length} qualifying businesses. Screener badge unlocked!`);
  };

  // Sample stocks for screener
  const screenerUniverse = [
    { ticker: "TCS.NS", name: "TCS", roe: 42, de: 0.0, cagr: 11, sector: "Technology" },
    { ticker: "INFY.NS", name: "Infosys", roe: 31, de: 0.0, cagr: 12, sector: "Technology" },
    { ticker: "TITAN.NS", name: "Titan", roe: 28, de: 0.4, cagr: 18, sector: "Consumer" },
    { ticker: "ASIANPAINT.NS", name: "Asian Paints", roe: 26, de: 0.1, cagr: 12, sector: "Materials" },
    { ticker: "ITC.NS", name: "ITC", roe: 29, de: 0.0, cagr: 9, sector: "FMCG" },
    { ticker: "TATAMOTORS.NS", name: "Tata Motors", roe: 18, de: 1.1, cagr: 14, sector: "Automotive" },
    { ticker: "RELIANCE.NS", name: "Reliance", roe: 10, de: 0.6, cagr: 14, sector: "Conglomerate" },
    { ticker: "ZOMATO.NS", name: "Zomato", roe: 4, de: 0.0, cagr: 45, sector: "Internet" },
  ];

  const passingStocks = screenerUniverse.filter(
    (s) => s.roe >= minRoe && s.de <= maxDebt && s.cagr >= minGrowth
  );

  return (
    <div className="min-h-screen pb-16">
      {/* Top sticky header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <Link href="/practice">
                <ArrowLeft className="h-4 w-4" />
                <span>Practice Arena</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-border/80" />
            <div>
              <h1 className="text-sm font-semibold truncate text-foreground capitalize">
                {rawId.replace(/-/g, " ")}
              </h1>
              <span className="text-xs text-muted-foreground">Interactive Simulation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              XP: {xp.toLocaleString()} (Lvl {level})
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 pt-8">
        {/* MODE A: FIND RED FLAGS */}
        {scenarioType === "flags" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Forensic Statement Audit
              </span>
              <h2 className="text-2xl font-bold mt-2 text-foreground">Scrutinize Financial Statements</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Inspect the 3-year statement lines below. Tap the rows that display severe forensic red flags.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/60 bg-background/60 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Company Financial Summary (₹ in Crores)</h3>

              <div className="space-y-2">
                {[
                  { id: "rev", label: "Revenue from Operations", y1: "₹2,500", y2: "₹3,400", y3: "₹4,800", isFlag: false },
                  { id: "pat", label: "Reported Net Profit (PAT)", y1: "₹180", y2: "₹320", y3: "₹490", isFlag: false },
                  { id: "ocf", label: "Cash Flow from Operations (OCF)", y1: "₹40", y2: "-₹60", y3: "-₹180", isFlag: true, reason: "Severe red flag: Net profit grew to ₹490 Cr, but cash flow collapsed to negative ₹180 Cr." },
                  { id: "debtors", label: "Trade Receivables (>180 days)", y1: "₹120", y2: "₹380", y3: "₹890", isFlag: true, reason: "Receivables grew 7x while revenue only doubled, indicating uncollected paper sales." },
                  { id: "capex", label: "Routine Maintenance Capex", y1: "₹80", y2: "₹95", y3: "₹110", isFlag: false },
                  { id: "pledge", label: "Promoter Share Pledging", y1: "5%", y2: "22%", y3: "48%", isFlag: true, reason: "Nearly half of founder shares are pledged for personal loans, risking margin-call liquidation." },
                ].map((row) => {
                  const isChecked = Boolean(selectedFlags[row.id]);
                  return (
                    <div
                      key={row.id}
                      onClick={() => !completed && setSelectedFlags((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                      className={cn(
                        "p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer",
                        isChecked ? "border-rose-500 bg-rose-500/10" : "border-border/60 hover:bg-muted/40",
                        completed && row.isFlag && "border-rose-500 bg-rose-500/20 font-bold"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{row.label}</span>
                          {completed && row.isFlag && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-semibold">
                              Red Flag!
                            </span>
                          )}
                        </div>
                        {completed && row.isFlag && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{row.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                        <span>{row.y1}</span>
                        <span>{row.y2}</span>
                        <span className="font-bold text-foreground">{row.y3}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="h-4 w-4 accent-rose-500 rounded"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {!completed ? (
                <Button onClick={handleFlagSubmit} className="w-full gap-2 mt-4 bg-rose-600 hover:bg-rose-700 text-white">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Submit Audit Findings (+30 XP)</span>
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">{feedback}</p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/practice">Back to Scenarios</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE B: COMPARE VALUATION */}
        {scenarioType === "compare" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Peer Comparison Matrix
              </span>
              <h2 className="text-2xl font-bold mt-2 text-foreground">Compare IT Services Leaders</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Evaluate multiples, return on equity, and debt across top technology service providers.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/60 bg-background/60 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-mono">
                      <th className="py-2.5">Company</th>
                      <th>P/E Multiple</th>
                      <th>EV/EBITDA</th>
                      <th>ROE %</th>
                      <th>Operating Margin</th>
                      <th>Debt / Equity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {[
                      { ticker: "TCS.NS", name: "TCS", pe: "28.4x", ev: "19.2x", roe: "44.2%", margin: "25.1%", de: "0.0x" },
                      { ticker: "INFY.NS", name: "Infosys", pe: "24.1x", ev: "15.8x", roe: "31.8%", margin: "21.2%", de: "0.0x" },
                      { ticker: "WIPRO.NS", name: "Wipro", pe: "21.3x", ev: "13.4x", roe: "16.4%", margin: "16.1%", de: "0.2x" },
                      { ticker: "HCLTECH.NS", name: "HCL Tech", pe: "25.2x", ev: "16.1x", roe: "28.5%", margin: "18.6%", de: "0.1x" },
                    ].map((row) => (
                      <tr
                        key={row.ticker}
                        onClick={() => !completed && setSelectedStockChoice(row.name)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedStockChoice === row.name ? "bg-primary/10 font-bold" : "hover:bg-muted/40"
                        )}
                      >
                        <td className="py-3 font-sans font-bold text-foreground">{row.name} ({row.ticker.split(".")[0]})</td>
                        <td>{row.pe}</td>
                        <td>{row.ev}</td>
                        <td className="text-emerald-500">{row.roe}</td>
                        <td>{row.margin}</td>
                        <td>{row.de}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                <span className="text-xs font-semibold text-foreground">Select Your Pick for Long-Term Quality & Margin of Safety</span>
                <div className="flex flex-wrap gap-2">
                  {["TCS", "Infosys", "Wipro", "HCL Tech"].map((name) => (
                    <button
                      key={name}
                      onClick={() => !completed && setSelectedStockChoice(name)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        selectedStockChoice === name
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {!completed ? (
                <Button
                  onClick={handleCompareSubmit}
                  disabled={!selectedStockChoice}
                  className="w-full gap-2 mt-4"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Log Valuation Decision (+30 XP)</span>
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">{feedback}</p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/practice">Back to Scenarios</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE C: BUILD DCF */}
        {scenarioType === "dcf" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                Discounted Cash Flow Laboratory
              </span>
              <h2 className="text-2xl font-bold mt-2 text-foreground">Build a DCF Model</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Calibrate 5-year growth, operating margins, discount hurdle rate (WACC), and terminal growth.
              </p>
            </div>

            {/* Assumptions Sliders */}
            <div className="p-6 rounded-2xl border border-primary/20 glass dark:glass-dark space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Key Valuation Levers</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">5-Yr Cash Flow Growth</span>
                    <span className="font-mono font-bold text-primary">{growth}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={1}
                    value={growth}
                    onChange={(e) => setGrowth(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Operating Margin</span>
                    <span className="font-mono font-bold text-primary">{margin}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={35}
                    step={1}
                    value={margin}
                    onChange={(e) => setMargin(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Hurdle Rate (WACC)</span>
                    <span className="font-mono font-bold text-primary">{wacc}%</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={16}
                    step={0.5}
                    value={wacc}
                    onChange={(e) => setWacc(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Terminal Growth Rate</span>
                    <span className="font-mono font-bold text-primary">{terminal}%</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    step={0.5}
                    value={terminal}
                    onChange={(e) => setTerminal(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* 5-Year Cash Flow Projection Schedule */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Projected 5-Year Free Cash Flows (₹ Crores)
                </span>
                <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
                  {dcfOutput.fcf5Years.map((val, idx) => (
                    <div key={idx} className="p-2 rounded bg-background border border-border/40">
                      <span className="text-muted-foreground block text-[10px]">Year {idx + 1}</span>
                      <span className="font-bold text-foreground">₹{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valuation Result Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <span className="text-xs text-muted-foreground block">Intrinsic Fair Value</span>
                  <div className="text-2xl font-bold font-mono text-primary">₹{dcfOutput.fairValuePerShare}</div>
                  <span className="text-[10px] text-muted-foreground">Per share calculated</span>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/60 text-center">
                  <span className="text-xs text-muted-foreground block">Current Market Price</span>
                  <div className="text-2xl font-bold font-mono text-foreground">₹{dcfOutput.marketPrice}</div>
                  <span className="text-[10px] text-muted-foreground">Live quotation</span>
                </div>
                <div className={cn(
                  "p-4 rounded-xl border text-center",
                  dcfOutput.mosPct >= 15 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
                  dcfOutput.mosPct >= 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400" :
                  "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                )}>
                  <span className="text-xs opacity-80 block">Margin of Safety</span>
                  <div className="text-2xl font-bold font-mono">
                    {dcfOutput.mosPct >= 0 ? "+" : ""}{dcfOutput.mosPct}%
                  </div>
                  <span className="text-[10px] opacity-80">
                    {dcfOutput.mosPct >= 15 ? "Substantial Cushion" : dcfOutput.mosPct >= 0 ? "Fair Value" : "Overvalued"}
                  </span>
                </div>
              </div>

              {!completed ? (
                <Button onClick={handleDCFSubmit} className="w-full gap-2 mt-4 bg-violet-600 hover:bg-violet-700 text-white">
                  <Award className="h-4 w-4" />
                  <span>Lock in DCF & Unlock Badge (+50 XP)</span>
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">{feedback}</p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/practice">Back to Scenarios</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE D: SCREEN FOR QUALITY */}
        {scenarioType === "screen" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Multi-Factor Screener
              </span>
              <h2 className="text-2xl font-bold mt-2 text-foreground">Screen for High-Quality Businesses</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Filter across return on equity, balance sheet leverage, and historical sales growth.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-primary/20 glass dark:glass-dark space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Minimum ROE</span>
                    <span className="font-mono font-bold text-primary">{minRoe}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={minRoe}
                    onChange={(e) => setMinRoe(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Max Debt-to-Equity</span>
                    <span className="font-mono font-bold text-primary">{maxDebt}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={2.0}
                    step={0.1}
                    value={maxDebt}
                    onChange={(e) => setMaxDebt(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Min 5Y Growth</span>
                    <span className="font-mono font-bold text-primary">{minGrowth}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={minGrowth}
                    onChange={(e) => setMinGrowth(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Passing Stocks Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">Matching Companies ({passingStocks.length})</span>
                  <span className="text-muted-foreground">Universe: 8 core companies</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {passingStocks.map((stock) => (
                    <div key={stock.ticker} className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{stock.name}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{stock.ticker.split(".")[0]}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{stock.sector}</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="block text-emerald-600 dark:text-emerald-400 font-semibold">{stock.roe}% ROE</span>
                        <span className="text-muted-foreground">{stock.de}x D/E</span>
                      </div>
                    </div>
                  ))}
                  {passingStocks.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl">
                      No companies match these stringent filter criteria. Try relaxing ROE or Debt thresholds.
                    </div>
                  )}
                </div>
              </div>

              {!completed ? (
                <Button onClick={handleScreenSubmit} className="w-full gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Target className="h-4 w-4" />
                  <span>Save Screen & Award XP (+20 XP)</span>
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">{feedback}</p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/practice">Back to Scenarios</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
