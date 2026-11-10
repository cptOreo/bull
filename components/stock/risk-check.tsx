"use client";

import React, { useState } from "react";
import type { RiskFlag } from "@/lib/engine/types";

export interface RiskCheckProps {
  ticker: string;
  flags: RiskFlag[];
  distractor?: string;
  onAnswer?: (isCorrect: boolean) => void;
  className?: string;
}

const COMMON_DISTRACTORS = [
  "Auditor Resignation within last 12 months",
  "Pledged Promoter Shares exceeding 50%",
  "Regulatory Ban by SEBI",
  "Working Capital Deficit",
  "Severe Customer Concentration (>60%)",
];

export function RiskCheck({
  ticker,
  flags,
  distractor = "Auditor Resignation within last 12 months",
  onAnswer,
  className = "",
}: RiskCheckProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // We ask: "Which of the following is an identified risk flag for {ticker}?"
  // If the stock has real flags, the correct option is one of the real flags, and the other 3 are distractors.
  // Or: "Which of the following is NOT a risk flag for {ticker}?"
  // Here: Identify the genuine risk present in this stock:
  const primaryFlag = flags[0];
  const realLabel = primaryFlag ? primaryFlag.label : "Low Volatility";

  // Build 4 options: 1 real flag and 3 distractors
  const distractorsList = COMMON_DISTRACTORS.filter((d) => d !== realLabel && !flags.some((f) => f.label === d));
  const candidateDistractors = distractorsList.slice(0, 3);
  if (candidateDistractors.length < 3) {
    candidateDistractors.push(distractor);
  }

  // Deterministic order based on ticker length
  const correctPosition = ticker.charCodeAt(0) % 4;
  const options = [...candidateDistractors.slice(0, 3)];
  options.splice(correctPosition, 0, realLabel);

  const isCorrect = selectedIdx === correctPosition;

  function handleSelect(index: number) {
    if (hasSubmitted) return;
    setSelectedIdx(index);
    setHasSubmitted(true);
    if (onAnswer) {
      onAnswer(index === correctPosition);
    }
  }

  function handleReset() {
    setSelectedIdx(null);
    setHasSubmitted(false);
  }

  return (
    <div
      role="region"
      aria-label="Name the Risk Interactive Check"
      className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Practice Check · Risk Namer
          </span>
          <h2 className="text-sm font-serif font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
            Identify the primary risk factor for {ticker}
          </h2>
        </div>
        <span className="text-xs text-zinc-400 font-mono">No XP impact</span>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
        Based on our snapshot audit, which of the following is a genuine risk flag flagged for {ticker}?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isThisCorrect = idx === correctPosition;

          let btnStyle = "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200";

          if (hasSubmitted) {
            if (isThisCorrect) {
              btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-medium";
            } else if (isSelected) {
              btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200";
            } else {
              btnStyle = "opacity-50 border-zinc-200 dark:border-zinc-800";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect(idx)}
              className={`text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
            >
              <span>{opt}</span>
              {hasSubmitted && isThisCorrect && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-2">✓</span>
              )}
              {hasSubmitted && isSelected && !isThisCorrect && (
                <span className="text-rose-600 dark:text-rose-400 font-bold ml-2">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {hasSubmitted && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p
            className={`text-xs ${
              isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {isCorrect
              ? `Correct! ${primaryFlag ? primaryFlag.sentence : `${realLabel} is verified in the audit.`}`
              : `Not quite. The genuine flag is "${realLabel}". ${primaryFlag ? primaryFlag.sentence : ""}`}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline ml-3 shrink-0"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
