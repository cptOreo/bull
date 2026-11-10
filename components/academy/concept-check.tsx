import React, { useState } from "react";
import type { CheckItem, ConceptId, LearningEvent } from "@/lib/engine/types";
import { getChecksForConcept, CONCEPT_CHECKS } from "@/lib/engine/curriculum";

export interface ConceptCheckProps {
  conceptId?: ConceptId;
  checkItem?: CheckItem;
  onSuccess?: (item: CheckItem) => void;
  logEvent?: (event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string })) => boolean | void;
  className?: string;
}

/**
 * ConceptCheck renders an inline MCQ check with immediate explanatory feedback.
 */
export function ConceptCheck({
  conceptId = "C1",
  checkItem: propCheckItem,
  onSuccess,
  logEvent,
  className = "",
}: ConceptCheckProps) {
  const availableItems = propCheckItem
    ? [propCheckItem]
    : getChecksForConcept(conceptId).length > 0
    ? getChecksForConcept(conceptId)
    : CONCEPT_CHECKS.filter((c) => c.conceptId === conceptId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const item = propCheckItem ?? availableItems[currentIndex] ?? availableItems[0];
  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex === null || submitted) return;

    setSubmitted(true);
    const isCorrect = selectedIndex === item.correctIndex;
    if (isCorrect) {
      if (logEvent) {
        logEvent({
          type: "check_answered_correct",
          conceptId: item.conceptId,
          itemId: item.id,
          timestamp: new Date().toISOString(),
        });
      }
      if (onSuccess) onSuccess(item);
    }
  };

  const handleRetry = () => {
    setSelectedIndex(null);
    setSubmitted(false);
  };

  const isCorrect = submitted && selectedIndex === item.correctIndex;

  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm ${className}`}
      data-testid="concept-check"
    >
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-3">
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          Knowledge Check · {item.conceptId}
        </span>
        <span>+10 XP</span>
      </div>

      <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        {item.question}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div role="radiogroup" aria-label="Question choices" className="space-y-2">
          {item.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={submitted}
                onClick={() => !submitted && setSelectedIndex(idx)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left text-xs sm:text-sm transition-all outline-none ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                } ${
                  submitted && idx === item.correctIndex
                    ? "!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950/40"
                    : ""
                }`}
              >
                <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
              isCorrect
                ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-900 dark:text-rose-200"
            }`}
          >
            <div className="font-bold mb-1">
              {isCorrect ? "Correct! +10 XP" : "Review the principle:"}
            </div>
            <p>{item.explanation}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {!submitted ? (
            <button
              type="submit"
              disabled={selectedIndex === null}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Check Answer
            </button>
          ) : !isCorrect ? (
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
            >
              Try Again
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentIndex < availableItems.length - 1) {
                  setCurrentIndex((c) => c + 1);
                  setSelectedIndex(null);
                  setSubmitted(false);
                }
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              Next Check
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ConceptCheck;
