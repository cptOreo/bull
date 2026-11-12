"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { MasteryRing } from "@/ui/mastery-ring";
import { useLesson } from "@/lib/hooks/use-lesson";
import { useProgress } from "@/state/use-progress";
import { useStock } from "@/lib/hooks/use-stock";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BookOpen,
  TrendingUp,
  Sliders,
  Award,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function LessonPlayerPage() {
  const params = useParams();
  const conceptId = (params?.id as string) || "pe-ratio";

  const {
    lesson,
    node,
    steps,
    currentStep,
    currentStepId,
    completedSteps,
    missionSubmitted,
    missionFeedback,
    masteryScore,
    hasPassedCheck,
    setCurrentStep,
    nextStep,
    prevStep,
    submitMission,
    submitMasteryCheck,
  } = useLesson(conceptId);

  const { xp, level } = useProgress();

  // Step 1: Formula Explorer state
  const [formulaInputs, setFormulaInputs] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    lesson.formula.variables.forEach((v) => {
      initial[v.symbol] = v.defaultValue;
    });
    return initial;
  });

  // Step 2: Selected Stock state
  const [selectedTicker, setSelectedTicker] = React.useState<string>(lesson.defaultStock.ticker);
  const { data: liveStock } = useStock(selectedTicker);

  // Step 3: Practice Question state
  const [practiceSelected, setPracticeSelected] = React.useState<number | null>(null);
  const [showHint, setShowHint] = React.useState(false);
  const [practiceAnswered, setPracticeAnswered] = React.useState(false);

  // Step 3: Slider Simulator state
  const [sliderVals, setSliderVals] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    lesson.sliderSimulator.inputs.forEach((inp) => {
      initial[inp.key] = inp.defaultValue;
    });
    return initial;
  });

  // Step 4: Mission response state
  const [missionText, setMissionText] = React.useState("");

  // Step 5: Mastery Check answers state
  const [checkAnswers, setCheckAnswers] = React.useState<Record<number, number>>({});
  const [checkEvaluated, setCheckEvaluated] = React.useState(false);

  // Computed formula output
  const formulaResult = React.useMemo(() => {
    return lesson.formula.compute(formulaInputs);
  }, [lesson, formulaInputs]);

  // Computed slider output
  const sliderResult = React.useMemo(() => {
    return lesson.sliderSimulator.evaluate(sliderVals);
  }, [lesson, sliderVals]);

  const handleFormulaChange = (symbol: string, val: number) => {
    setFormulaInputs((prev) => ({ ...prev, [symbol]: val }));
  };

  const handleSliderChange = (key: string, val: number) => {
    setSliderVals((prev) => ({ ...prev, [key]: val }));
  };

  const handlePracticeSelect = (idx: number) => {
    setPracticeSelected(idx);
    setPracticeAnswered(true);
  };

  const handleCheckAnswer = (qIdx: number, optIdx: number) => {
    if (checkEvaluated) return;
    setCheckAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckSubmit = () => {
    let correct = 0;
    lesson.masteryCheck.forEach((q, idx) => {
      if (checkAnswers[idx] === q.correct) {
        correct++;
      }
    });
    setCheckEvaluated(true);
    submitMasteryCheck(correct, lesson.masteryCheck.length);
  };

  const resetCheck = () => {
    setCheckAnswers({});
    setCheckEvaluated(false);
  };

  const popularTickers = [
    { ticker: "TATAMOTORS.NS", label: "Tata Motors" },
    { ticker: "ZOMATO.NS", label: "Zomato" },
    { ticker: "RELIANCE.NS", label: "Reliance" },
    { ticker: "TCS.NS", label: "TCS" },
    { ticker: "INFY.NS", label: "Infosys" },
    { ticker: "HDFCBANK.NS", label: "HDFC Bank" },
    { ticker: "ITC.NS", label: "ITC" },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* Top sticky navigation header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <Link href="/learn">
                <ArrowLeft className="h-4 w-4" />
                <span>Skill Tree</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-border/80" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate leading-none text-foreground">{lesson.title}</h1>
              <span className="text-xs text-muted-foreground capitalize">{lesson.track} Track</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              XP: {xp.toLocaleString()} (Lvl {level})
            </span>
            <MasteryRing progress={node?.mastery.progress || 20} size={32} strokeWidth={3} showLabel={false} level={node?.mastery.level || 1} />
          </div>
        </div>

        {/* 5-Step Visual Progress Stepper */}
        <div className="mx-auto max-w-5xl px-4 py-2 border-t border-border/40">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((st, idx) => {
              const isCurrent = idx === currentStep;
              const isDone = completedSteps[st.id];
              return (
                <button
                  key={st.id}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "text-left py-1.5 px-2 rounded-lg text-xs transition-all flex items-center gap-1.5 font-medium border",
                    isCurrent && "border-primary bg-primary/10 text-primary shadow-xs",
                    !isCurrent && isDone && "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                    !isCurrent && !isDone && "border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className={cn(
                    "h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCurrent && isDone && "bg-emerald-500 text-white",
                    !isCurrent && !isDone && "bg-muted text-muted-foreground"
                  )}>
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <span className="truncate hidden sm:inline">{st.title.split(". ")[1]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 pt-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: CONCEPT & MENTAL MODEL */}
          {currentStepId === "concept" && (
            <motion.div
              key="step-concept"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Header Box */}
              <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                  Core Concept
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2 text-foreground">{lesson.title}</h2>
                <p className="text-base text-muted-foreground mt-1 italic">{lesson.tagline}</p>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-foreground/90">{lesson.plainEnglish}</p>
              </div>

              {/* Mental Model Analogy Card */}
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>Mental Model: {lesson.mentalModel.title}</span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                  {lesson.mentalModel.description}
                </p>
              </div>

              {/* Why It Matters */}
              <div className="p-5 rounded-2xl border border-border/60 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground mb-1">Why This Matters For Your Portfolio</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{lesson.whyItMatters}</p>
              </div>

              {/* Interactive Formula Explorer */}
              <div className="p-6 rounded-2xl glass dark:glass-dark border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-foreground">Interactive Formula Explorer</h3>
                    <p className="text-xs text-muted-foreground">{lesson.formula.expression}</p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                    Live Calculator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {lesson.formula.variables.map((variable) => (
                    <div key={variable.symbol} className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{variable.name} ({variable.symbol})</span>
                        <span className="font-mono font-semibold text-primary">
                          {variable.unit === "₹" ? "₹" : ""}{formulaInputs[variable.symbol]} {variable.unit !== "₹" ? variable.unit : ""}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        value={formulaInputs[variable.symbol] ?? variable.defaultValue}
                        onChange={(e) => handleFormulaChange(variable.symbol, parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">{variable.description}</p>
                    </div>
                  ))}
                </div>

                {/* Formula Result Banner */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Calculated Metric</span>
                    <div className="text-2xl font-bold font-mono text-primary">
                      {formulaResult.value} {formulaResult.unit}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 sm:max-w-md">
                    {formulaResult.interpretation}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={nextStep} className="gap-2">
                  <span>Continue to Real Stock Application</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: REAL STOCK APPLICATION */}
          {currentStepId === "your-stock" && (
            <motion.div
              key="step-stock"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                      Step 2: Real Market Data
                    </span>
                    <h2 className="text-2xl font-bold mt-1 text-foreground">See How It Applies in the Market</h2>
                  </div>
                </div>

                {/* Stock Selector Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {popularTickers.map((item) => (
                    <button
                      key={item.ticker}
                      onClick={() => setSelectedTicker(item.ticker)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        selectedTicker === item.ticker
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Stock Snapshot Card */}
                <div className="p-5 rounded-xl border border-border/80 bg-background/60 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{liveStock?.name || selectedTicker}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {selectedTicker}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{liveStock?.sector || "Public Equities"}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-foreground">
                        {liveStock ? `₹${liveStock.price.toLocaleString("en-IN")}` : "Loading..."}
                      </div>
                      {liveStock && (
                        <span className={cn("text-xs font-mono font-medium", liveStock.change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {liveStock.change >= 0 ? "+" : ""}{liveStock.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/40">
                      <span className="text-muted-foreground block mb-0.5">P/E Ratio</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {liveStock?.peRatio ? `${liveStock.peRatio.toFixed(1)}x` : "N/A"}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40">
                      <span className="text-muted-foreground block mb-0.5">Market Cap</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {liveStock?.marketCapFormatted || "N/A"}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40">
                      <span className="text-muted-foreground block mb-0.5">52W Range</span>
                      <span className="font-mono font-medium text-foreground text-xs">
                        ₹{liveStock?.fiftyTwoWeekLow?.toFixed(0) || "—"} - ₹{liveStock?.fiftyTwoWeekHigh?.toFixed(0) || "—"}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40">
                      <span className="text-muted-foreground block mb-0.5">Dividend Yield</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {liveStock?.dividendYield ? `${(liveStock.dividendYield * 100).toFixed(2)}%` : "0.0%"}
                      </span>
                    </div>
                  </div>

                  {/* Educational Takeaway for this stock */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/15 space-y-1">
                    <span className="text-xs font-semibold text-primary uppercase">Investor Insight</span>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {lesson.defaultStock.takeaway}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                      <Link href={`/stock/${selectedTicker}`} target="_blank">
                        <span>Inspect Full Financials for {selectedTicker.split(".")[0]}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button onClick={nextStep} className="gap-2">
                  <span>Continue to Guided Practice</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: GUIDED PRACTICE & SIMULATOR */}
          {currentStepId === "practice" && (
            <motion.div
              key="step-practice"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Question 1 from Practice */}
              {lesson.practiceQuestions.length > 0 && (
                <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                      Practice Check
                    </span>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>{showHint ? "Hide hint" : "Need a hint?"}</span>
                    </button>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {lesson.practiceQuestions[0].question}
                  </h3>

                  {showHint && lesson.practiceQuestions[0].hint && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                      💡 Hint: {lesson.practiceQuestions[0].hint}
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 pt-2">
                    {lesson.practiceQuestions[0].options.map((opt, idx) => {
                      const isSelected = practiceSelected === idx;
                      const isCorrect = idx === lesson.practiceQuestions[0].correct;
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePracticeSelect(idx)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between",
                            !practiceAnswered && "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                            practiceAnswered && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
                            practiceAnswered && isSelected && !isCorrect && "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold",
                            practiceAnswered && !isSelected && !isCorrect && "border-border/40 opacity-50"
                          )}
                        >
                          <span>{opt}</span>
                          {practiceAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>

                  {practiceAnswered && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-foreground/90 space-y-1">
                      <span className="font-semibold block text-primary">Explanation</span>
                      <p>{lesson.practiceQuestions[0].explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Embedded Interactive Slider Simulator */}
              <div className="p-6 rounded-2xl glass dark:glass-dark border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-foreground">{lesson.sliderSimulator.title}</h3>
                    <p className="text-xs text-muted-foreground">{lesson.sliderSimulator.description}</p>
                  </div>
                  <Sliders className="h-5 w-5 text-primary opacity-80" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {lesson.sliderSimulator.inputs.map((inp) => (
                    <div key={inp.key} className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{inp.label}</span>
                        <span className="font-mono font-bold text-primary">
                          {inp.unit === "₹" ? "₹" : ""}{sliderVals[inp.key]} {inp.unit !== "₹" ? inp.unit : ""}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={inp.min}
                        max={inp.max}
                        step={inp.step}
                        value={sliderVals[inp.key] ?? inp.defaultValue}
                        onChange={(e) => handleSliderChange(inp.key, parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Simulator Verdict Card */}
                <div className={cn(
                  "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                  sliderResult.zone === "bargain" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  sliderResult.zone === "fair" && "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                  sliderResult.zone === "growth" && "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  sliderResult.zone === "speculative" && "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                  sliderResult.zone === "warning" && "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                  sliderResult.zone === "healthy" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                )}>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider opacity-80">{sliderResult.resultValue}</span>
                    <div className="text-xl font-bold font-mono">{sliderResult.resultLabel}</div>
                  </div>
                  <p className="text-xs sm:text-sm sm:max-w-md font-medium opacity-90">{sliderResult.verdict}</p>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button onClick={nextStep} className="gap-2">
                  <span>Continue to Applied Mission</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: APPLIED MISSION */}
          {currentStepId === "mission" && (
            <motion.div
              key="step-mission"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                    Step 4: Applied Mission (+30 XP)
                  </span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Real Market Challenge
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Your Stock Mission
                </h2>

                <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                  {lesson.mission.prompt}
                </p>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                  💡 <strong>Starter Hint:</strong> {lesson.mission.starterHint}
                </div>

                {/* Mission Response Area */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-foreground">Your Analysis & Reasoning</label>
                  <textarea
                    rows={4}
                    value={missionText}
                    onChange={(e) => setMissionText(e.target.value)}
                    placeholder="Type your evaluation here (e.g., calculation, margin durability assessment, and whether the multiple is justified)..."
                    className="w-full p-3.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {!missionSubmitted ? (
                  <Button
                    onClick={() => submitMission(missionText || lesson.mission.sampleAnswer)}
                    className="w-full gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Submit Mission for AI Review (+30 XP)</span>
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Mission Passed! +30 XP Awarded</span>
                    </div>
                    <p className="text-xs text-foreground/90">{missionFeedback}</p>
                    <div className="pt-2 text-xs border-t border-emerald-500/20 text-muted-foreground">
                      <strong>Benchmark Model Answer:</strong> {lesson.mission.sampleAnswer}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button onClick={nextStep} className="gap-2">
                  <span>Take Final Mastery Check</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: MASTERY CHECK */}
          {currentStepId === "check" && (
            <motion.div
              key="step-check"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl glass dark:glass-dark border border-border/60 space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                      Step 5: Mastery Check
                    </span>
                    <h2 className="text-2xl font-bold mt-1 text-foreground">Concept Mastery Assessment</h2>
                    <p className="text-xs text-muted-foreground">
                      Score at least 2 out of {lesson.masteryCheck.length} to unlock mastery and earn +50 XP.
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-primary opacity-80" />
                </div>

                {/* 3 Questions */}
                <div className="space-y-6">
                  {lesson.masteryCheck.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-3">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">
                        {qIdx + 1}. {q.question}
                      </h3>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = checkAnswers[qIdx] === optIdx;
                          const isCorrect = optIdx === q.correct;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleCheckAnswer(qIdx, optIdx)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center justify-between",
                                !checkEvaluated && isSelected && "border-primary bg-primary/10 text-primary font-semibold",
                                !checkEvaluated && !isSelected && "border-border/60 hover:bg-muted/40",
                                checkEvaluated && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
                                checkEvaluated && isSelected && !isCorrect && "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                                checkEvaluated && !isSelected && !isCorrect && "border-border/40 opacity-50"
                              )}
                            >
                              <span>{opt}</span>
                              {checkEvaluated && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            </button>
                          );
                        })}
                      </div>

                      {checkEvaluated && (
                        <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit / Results Card */}
                {!checkEvaluated ? (
                  <Button
                    onClick={handleCheckSubmit}
                    disabled={Object.keys(checkAnswers).length < lesson.masteryCheck.length}
                    className="w-full gap-2"
                  >
                    <span>Submit Mastery Check</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className={cn(
                    "p-6 rounded-2xl border text-center space-y-4",
                    hasPassedCheck
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-amber-500/40 bg-amber-500/10"
                  )}>
                    <div className="flex justify-center">
                      <MasteryRing
                        progress={hasPassedCheck ? 100 : 40}
                        size={64}
                        strokeWidth={6}
                        level={hasPassedCheck ? (node?.mastery.level || 1) + 1 : (node?.mastery.level || 1)}
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {hasPassedCheck ? "Mastery Unlocked! 🎉" : "Keep Practicing"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You scored {masteryScore} out of {lesson.masteryCheck.length} correct.
                        {hasPassedCheck ? " +50 XP awarded and subsequent concepts unlocked!" : " Review the explanations above and try again."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      {!hasPassedCheck ? (
                        <Button variant="outline" onClick={resetCheck} className="gap-2">
                          <RotateCcw className="h-4 w-4" />
                          <span>Retry Check</span>
                        </Button>
                      ) : (
                        <>
                          <Button asChild variant="default" className="gap-2">
                            <Link href="/learn">
                              <span>Back to Skill Tree</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="gap-2">
                            <Link href="/practice">
                              <span>Test in Practice Arena</span>
                              <TrendingUp className="h-4 w-4" />
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/learn">Exit to Skill Tree</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
