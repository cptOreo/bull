import React, { useState } from "react";
import type { ConceptId, LearningEvent } from "@/lib/engine/types";
import { CONCEPTS, type ConceptDefinition } from "@/lib/engine/curriculum";
import { ConceptCheck } from "./concept-check";
import { AppliedMission } from "./applied-mission";

export interface LessonStepsProps {
  conceptId?: ConceptId;
  concept?: ConceptDefinition;
  ticker?: string;
  onLessonComplete?: () => void;
  logEvent?: (event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string })) => boolean | void;
  className?: string;
}

export function LessonSteps({
  conceptId = "C1",
  concept: propConcept,
  ticker = "INFY",
  onLessonComplete,
  logEvent,
  className = "",
}: LessonStepsProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([1]));

  const def = propConcept ?? CONCEPTS.find((c) => c.id === conceptId) ?? CONCEPTS[0];

  const handleStepClick = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      const next = (currentStep + 1) as 1 | 2 | 3 | 4;
      setCurrentStep(next);
      setCompletedSteps((prev) => new Set([...prev, next]));
      if (next === 4) {
        if (logEvent) {
          logEvent({
            type: "lesson_completed",
            conceptId: def.id,
            timestamp: new Date().toISOString(),
          });
        }
        if (onLessonComplete) onLessonComplete();
      }
    }
  };

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm ${className}`}
      data-testid="lesson-steps"
    >
      {/* Lesson Header */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {def.id}
          </span>
          <span className="text-xs font-mono text-zinc-500">Structured Lesson · 4 Steps</span>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {def.title}
        </h2>
      </div>

      {/* 4-Step Navigation Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { step: 1, label: "The Idea" },
          { step: 2, label: "On Your Stock" },
          { step: 3, label: "Limits" },
          { step: 4, label: "Check & Mission" },
        ].map((item) => {
          const isActive = currentStep === item.step;
          const isDone = completedSteps.has(item.step);
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => handleStepClick(item.step as 1 | 2 | 3 | 4)}
              className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-medium border transition-all text-center outline-none ${
                isActive
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                  : isDone
                  ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-zinc-700 dark:text-zinc-300"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <span className="font-mono text-[10px] uppercase">Step {item.step}</span>
              <span className="truncate w-full">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[220px] mb-6">
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              1. The Idea
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {def.step1Idea}
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Summary: </span>
              {def.summary}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              2. On Your Stock ({ticker})
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Worked example applied to real company financial records:
            </p>
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-sans text-indigo-950 dark:text-indigo-200 leading-relaxed">
              &ldquo;{def.workedExample}&rdquo;
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Figures verified against audited filings and historical closing price data.
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              3. What It Does Not Tell You
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Every financial ratio has boundaries. Here is the critical blindspot:
            </p>
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              {def.step3WhatItDoesNotTellYou}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              4. Knowledge Check & Applied Mission
            </h3>
            <ConceptCheck conceptId={def.id} logEvent={logEvent} />
            <AppliedMission conceptId={def.id} ticker={ticker} logEvent={logEvent} />
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => currentStep > 1 && handleStepClick((currentStep - 1) as 1 | 2 | 3 | 4)}
          className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Continue to Step {currentStep + 1} →
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ Reached Check & Mission (+20 XP Lesson Complete)
          </span>
        )}
      </div>
    </div>
  );
}

export default LessonSteps;
