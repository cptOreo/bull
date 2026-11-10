"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface TrackData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  analogyTitle: string;
  analogyBody: string;
  formula: string;
  formulaNote?: string;
  takeaway: string;
  check: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  tutorPrompt: string;
}

export const CURRICULUM_TRACKS: TrackData[] = [
  {
    id: "owners-mindset",
    title: "The Owner's Mindset",
    subtitle: "Stocks as fractional deeds of real businesses, not ticker lottery",
    description:
      "When you purchase a share, you become a proportional owner of an enterprise's physical property, equipment, intellectual assets, and long-term operating cash flows. Daily quotes fluctuate on sentiment, but your real wealth tracks the earnings power of the business.",
    analogyTitle: "The 100-Flat Apartment Complex",
    analogyBody:
      "If you purchase one flat in a 100-flat residential building, you do not check the street market price every morning. You evaluate your asset by the monthly rental checks arriving in your bank account and whether the neighborhood is developing. In the stock market, liquid prices create the illusion of a casino ticket, distracting investors from the rent (dividends and retained profits) that real businesses produce.",
    formula: "1 Share = 1 Fractional Deed of All Assets, Working Capital & Future Cash Flows",
    formulaNote: "Price is what you pay today; business earning power is what you own over time.",
    takeaway: "Separate the fluctuating price tag from the operating value of the productive asset.",
    check: {
      question:
        "You buy 10 shares of a profitable company. Over the next month, the share price drops 8% during a broad market panic, but the company expands customer count by 25% and posts record profits. What should an owner conclude?",
      options: [
        "The investment failed because the market quote is lower than what you paid.",
        "The underlying business became more valuable while the market temporarily marked down the price tag.",
        "You must sell immediately to stop further price markdowns.",
      ],
      correctIndex: 1,
      explanation:
        "An owner separates business performance from market quotation. Record profits and growing customer adoption increase intrinsic business value, regardless of short-term sentiment.",
    },
    tutorPrompt:
      "Explain how the owner's mindset differs from short-term trading with practical Indian market examples.",
  },
  {
    id: "kirana-valuation",
    title: "The Kirana Valuation Model",
    subtitle: "P/E ratio and earnings yield explained via neighbourhood kirana stores",
    description:
      "Valuation is not abstract financial mathematics. It answers one straightforward commercial question: how many years of clean business profit are you paying to acquire this enterprise?",
    analogyTitle: "The Corner Kirana Counter",
    analogyBody:
      "Your neighborhood grocery store generates ₹5,00,000 in net cash profit each year after clearing rent, electricity, and distributor bills. If the owner offers to sell you the entire business for ₹50,00,000, you are paying 10 times annual earnings (a P/E of 10x). That represents a 10% earnings yield on your capital. If another merchant asks ₹5 Crore (100x P/E) for that same ₹5,00,000 annual profit, it would take a century of flat earnings just to recover your purchase price.",
    formula: "P/E Ratio = Purchase Price ÷ Annual Profit  |  Earnings Yield = (Annual Profit ÷ Purchase Price) × 100%",
    formulaNote: "At 10x P/E, earnings yield is 10.0%. At 50x P/E, earnings yield drops to 2.0%.",
    takeaway: "The lower the P/E you pay for stable earnings, the higher your annual cash earnings yield.",
    check: {
      question:
        "A neighbourhood store earns ₹4 Lakh in net annual profit. The owner offers to sell you the entire business for ₹40 Lakh. What is the implied P/E ratio and earnings yield?",
      options: [
        "4x P/E and 40% earnings yield",
        "10x P/E and 10% earnings yield",
        "16x P/E and 25% earnings yield",
      ],
      correctIndex: 1,
      explanation:
        "Correct: ₹40 Lakh purchase price ÷ ₹4 Lakh annual profit = 10x P/E. Inverting that ratio (₹4L ÷ ₹40L) gives a 10% annual earnings yield on your invested capital.",
    },
    tutorPrompt:
      "How do I use the kirana valuation model to compare high P/E consumer tech platforms with mature FMCG stocks in India?",
  },
  {
    id: "balance-sheet-xray",
    title: "Balance Sheet X-Ray",
    subtitle: "Debt-to-equity, debt traps, cash flow vs reported accounting profit",
    description:
      "Profit is an accounting opinion, but cash is a financial reality. When an economic downturn strikes, companies do not go bust because accounting profits fall; they go bust when cash dries up and loan EMIs come due.",
    analogyTitle: "The Luxury Car on Heavy EMIs",
    analogyBody:
      "A neighbor earning ₹1,20,000 per month might drive a brand-new luxury car and appear wealthy, but paying ₹95,000 in monthly vehicle and credit card EMIs leaves them living on a knife edge. One emergency or job disruption leads to immediate asset seizure. Businesses face the exact same risk. Reported Net Profit (PAT) includes invoices not yet paid by customers, while debt service must be settled in cleared bank cash every single quarter.",
    formula: "Debt-to-Equity = Total Debt ÷ Net Worth  |  Free Cash Flow = Cash from Operations − Capital Expenditures",
    formulaNote: "High debt combined with negative cash flow creates acute refinancing risk in economic slowdowns.",
    takeaway: "Solvency always trumps accounting paper profit. A conservative balance sheet guarantees survival.",
    check: {
      question:
        "Company A reports ₹100 Crore in accounting net profit, but its operating cash flow is negative ₹20 Crore and debt-to-equity is 2.5x. What does this signal?",
      options: [
        "The company is in pristine health because accounting profit is strong.",
        "Profits may be stuck in unpaid customer receivables while fixed debt interest continues to drain bank reserves.",
        "A 2.5x debt-to-equity ratio ensures banks will forgive principal repayment.",
      ],
      correctIndex: 1,
      explanation:
        "Accurate! Accounting profit records sales when invoiced, not when cash arrives. When cash flow is negative and leverage exceeds 2.0x, servicing debt interest puts the enterprise at risk of a liquidity squeeze.",
    },
    tutorPrompt:
      "Explain how to spot a debt trap in Indian corporate balance sheets before it impacts stock price.",
  },
  {
    id: "economic-moats",
    title: "Economic Moats & Pricing Power",
    subtitle: "Buffett's pricing power, brand equity, switching costs",
    description:
      "In a free market, high profits attract aggressive competitors who undercut prices until profits vanish. An economic moat is a durable structural advantage that protects a company's profits from competitive erosion.",
    analogyTitle: "The School Canteen vs Street Cart",
    analogyBody:
      "If the sole canteen inside an educational campus raises cold coffee prices by 20%, students continue to buy because leaving campus between classes is impractical. However, if a sidewalk tea stall raises chai by ₹3, customers simply walk ten steps to the next cart. That difference is pricing power. Warren Buffett defines an unassailable moat as the ability to raise prices comfortably without losing customer volume.",
    formula: "Pricing Power = Ability to raise prices comfortably without losing market share",
    formulaNote: "Moat Pillars = Brand Trust + High Switching Costs + Network Scale + Low-Cost Moat",
    takeaway: "Pricing power is the single most important metric in evaluating business quality and moat strength.",
    check: {
      question:
        "Which enterprise demonstrates the strongest pricing power and durable economic moat?",
      options: [
        "A commodity chemical manufacturer selling identical generic products with zero customer brand loyalty.",
        "A mission-critical enterprise software provider whose replacement requires 18 months of system downtime and employee retraining.",
        "A budget apparel reseller competing strictly by matching lowest marketplace prices.",
      ],
      correctIndex: 1,
      explanation:
        "High switching costs protect customers from defecting. When replacing a vendor involves massive friction, risk, and expense, the company retains pricing power even through inflationary cycles.",
    },
    tutorPrompt:
      "What are the strongest examples of economic moats in Indian listed companies like Titan, Asian Paints, or HDFC Bank?",
  },
];

export interface CurriculumTracksProps {
  onAskTutor?: (prompt: string) => void;
  initialTrackId?: string;
  className?: string;
}

export function CurriculumTracks({
  onAskTutor,
  initialTrackId = "owners-mindset",
  className,
}: CurriculumTracksProps) {
  const [activeTrackId, setActiveTrackId] = useState(initialTrackId);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});

  const activeTrack =
    CURRICULUM_TRACKS.find((t) => t.id === activeTrackId) || CURRICULUM_TRACKS[0];

  const currentSelection = selectedAnswers[activeTrack.id] ?? null;
  const isSubmitted = submittedAnswers[activeTrack.id] ?? false;
  const isCorrect = isSubmitted && currentSelection === activeTrack.check.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (isSubmitted && isCorrect) return; // Locked once answered correctly
    setSelectedAnswers((prev) => ({ ...prev, [activeTrack.id]: idx }));
    setSubmittedAnswers((prev) => ({ ...prev, [activeTrack.id]: false }));
  };

  const handleSubmitCheck = () => {
    if (currentSelection === null) return;
    setSubmittedAnswers((prev) => ({ ...prev, [activeTrack.id]: true }));
  };

  const handleResetCheck = () => {
    setSelectedAnswers((prev) => ({ ...prev, [activeTrack.id]: null }));
    setSubmittedAnswers((prev) => ({ ...prev, [activeTrack.id]: false }));
  };

  return (
    <div
      data-testid="curriculum-tracks"
      className={cn(
        "w-full rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-8 text-zinc-900 dark:text-zinc-100",
        className,
      )}
    >
      {/* Track Selector Navigation */}
      <div
        role="tablist"
        aria-label="Curriculum Tracks"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4"
      >
        {CURRICULUM_TRACKS.map((track) => {
          const isActive = track.id === activeTrack.id;
          const trackCompleted =
            submittedAnswers[track.id] &&
            selectedAnswers[track.id] === track.check.correctIndex;

          return (
            <button
              key={track.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`track-panel-${track.id}`}
              id={`track-tab-${track.id}`}
              onClick={() => setActiveTrackId(track.id)}
              className={cn(
                "group relative flex flex-col items-start text-left p-3.5 rounded-xl transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono font-medium opacity-70">
                  {track.id === "owners-mindset" && "Track 1"}
                  {track.id === "kirana-valuation" && "Track 2"}
                  {track.id === "balance-sheet-xray" && "Track 3"}
                  {track.id === "economic-moats" && "Track 4"}
                </span>
                {trackCompleted && (
                  <span
                    aria-label="Track Completed"
                    className={cn(
                      "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]",
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold",
                    )}
                  >
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              <span className="mt-1 text-sm font-semibold tracking-tight line-clamp-1">
                {track.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Track Content Panel */}
      <div
        role="tabpanel"
        id={`track-panel-${activeTrack.id}`}
        aria-labelledby={`track-tab-${activeTrack.id}`}
        className="space-y-6 animate-in fade-in-50 duration-200"
      >
        {/* Track Header */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {activeTrack.title}
          </h2>
          <p className="text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {activeTrack.subtitle}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
            {activeTrack.description}
          </p>
        </div>

        {/* Real-World Analogy */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
            <svg
              className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>Real-World Analogy: {activeTrack.analogyTitle}</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {activeTrack.analogyBody}
          </p>
        </div>

        {/* Plain-English Formula / Takeaway Strip */}
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-2">
          <div className="text-xs uppercase tracking-wider font-mono font-medium text-zinc-500 dark:text-zinc-400">
            Core Commercial Formula & Takeaway
          </div>
          <div className="text-xs sm:text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {activeTrack.formula}
          </div>
          {activeTrack.formulaNote && (
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
              {activeTrack.formulaNote}
            </p>
          )}
          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            Takeaway: {activeTrack.takeaway}
          </div>
        </div>

        {/* Check Your Understanding Interactive Box */}
        <div
          data-testid="track-check-section"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4"
        >
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Check Your Understanding
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {activeTrack.check.question}
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Quiz Options"
            className="space-y-2.5 pt-1"
          >
            {activeTrack.check.options.map((option, idx) => {
              const isSelected = currentSelection === idx;
              let optionStyle =
                "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60";

              if (isSelected && !isSubmitted) {
                optionStyle =
                  "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50 ring-1 ring-zinc-900 dark:ring-zinc-100";
              } else if (isSubmitted) {
                if (idx === activeTrack.check.correctIndex) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500";
                } else if (isSelected && !isCorrect) {
                  optionStyle =
                    "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(idx)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3.5 rounded-lg border text-left text-xs sm:text-sm leading-relaxed transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500",
                    optionStyle,
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-mono shrink-0 transition-colors",
                      isSelected
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold"
                        : "border-zinc-400 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Check Controls & Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {!isSubmitted ? (
              <button
                type="button"
                disabled={currentSelection === null}
                onClick={handleSubmitCheck}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all",
                  currentSelection !== null
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed",
                )}
              >
                Check Answer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!isCorrect && (
                  <button
                    type="button"
                    onClick={handleResetCheck}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}

            {/* Action to Ask AI Tutor */}
            {onAskTutor && (
              <button
                type="button"
                onClick={() => onAskTutor(activeTrack.tutorPrompt)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>Ask AI Tutor about this track</span>
              </button>
            )}
          </div>

          {/* Feedback Card */}
          {isSubmitted && (
            <div
              data-testid="track-check-feedback"
              className={cn(
                "p-4 rounded-xl text-xs sm:text-sm leading-relaxed space-y-1.5 animate-in fade-in-50 duration-150",
                isCorrect
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-950 dark:text-rose-100",
              )}
            >
              <div className="font-bold flex items-center gap-1.5">
                {isCorrect ? (
                  <>
                    <svg
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Correct Analysis</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-rose-600 dark:text-rose-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Not Quite Right</span>
                  </>
                )}
              </div>
              <p className="opacity-90">{activeTrack.check.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CurriculumTracks;
