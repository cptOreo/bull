import React, { useState, useEffect, useRef } from "react";
import type { CheckItem, ConceptId, LearningEvent } from "@/lib/engine/types";
import { getChecksForConcept, CONCEPT_CHECKS } from "@/lib/engine/curriculum";

export interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptId?: ConceptId;
  checkItem?: CheckItem;
  checkItems?: CheckItem[];
  logEvent?: (event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string })) => boolean | void;
  onSuccess?: (item: CheckItem) => void;
  className?: string;
}

export function CheckModal({
  isOpen,
  onClose,
  conceptId = "C1",
  checkItem: propCheckItem,
  checkItems: propCheckItems,
  logEvent,
  onSuccess,
  className = "",
}: CheckModalProps) {
  // Determine available questions
  const availableItems: CheckItem[] =
    propCheckItems && propCheckItems.length > 0
      ? propCheckItems
      : propCheckItem
      ? [propCheckItem]
      : getChecksForConcept(conceptId).length > 0
      ? getChecksForConcept(conceptId)
      : CONCEPT_CHECKS.filter((c) => c.conceptId === conceptId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const currentItem: CheckItem | undefined =
    propCheckItem ?? availableItems[currentIndex] ?? availableItems[0];

  const modalRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset state when question changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(null);
      setSubmitted(false);
      setAwarded(false);
    }
  }, [isOpen, currentIndex, propCheckItem]);

  // Trap focus and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Arrow key navigation in radiogroup
  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!currentItem || submitted) return;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % currentItem.options.length;
      setSelectedIndex(nextIndex);
      optionsRef.current[nextIndex]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex =
        (index - 1 + currentItem.options.length) % currentItem.options.length;
      setSelectedIndex(prevIndex);
      optionsRef.current[prevIndex]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedIndex(index);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex === null || !currentItem || submitted) return;

    setSubmitted(true);
    const isCorrect = selectedIndex === currentItem.correctIndex;

    if (isCorrect && !awarded) {
      setAwarded(true);
      if (logEvent) {
        logEvent({
          type: "check_answered_correct",
          conceptId: currentItem.conceptId,
          itemId: currentItem.id,
          timestamp: new Date().toISOString(),
          data: {
            isNoFomo: currentItem.id === "c8_check_3",
          },
        });
      }
      if (onSuccess) {
        onSuccess(currentItem);
      }
    }
  };

  const handleRetry = () => {
    setSelectedIndex(null);
    setSubmitted(false);
  };

  const handleNext = () => {
    if (currentIndex < availableItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  if (!isOpen || !currentItem) return null;

  const isCorrect = submitted && selectedIndex === currentItem.correctIndex;
  const isWrong = submitted && selectedIndex !== currentItem.correctIndex;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-modal-title"
      ref={modalRef}
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 text-left ${className}`}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {currentItem.conceptId}
            </span>
            <h2
              id="check-modal-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight"
            >
              Concept Knowledge Check
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 outline-none"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question Statement */}
        <div className="mb-6">
          <p className="text-sm sm:text-base font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {currentItem.question}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-zinc-500">
            <span>Multiple Choice</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              +10 XP on correct answer
            </span>
          </div>
        </div>

        {/* Options Radio Group */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <div
            role="radiogroup"
            aria-label="Answer options"
            className="space-y-2.5"
          >
            {currentItem.options.map((option, idx) => {
              const isSelected = selectedIndex === idx;
              let optionStyle =
                "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900";

              if (isSelected && !submitted) {
                optionStyle =
                  "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600";
              } else if (submitted) {
                if (idx === currentItem.correctIndex) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500 text-emerald-900 dark:text-emerald-100";
                } else if (isSelected && idx !== currentItem.correctIndex) {
                  optionStyle =
                    "border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
                } else {
                  optionStyle =
                    "opacity-50 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={submitted}
                  ref={(el) => {
                    optionsRef.current[idx] = el;
                  }}
                  tabIndex={isSelected || (selectedIndex === null && idx === 0) ? 0 : -1}
                  onClick={() => !submitted && setSelectedIndex(idx)}
                  onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:cursor-default ${optionStyle}`}
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-mono transition-colors ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                        : "border-zinc-300 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug text-zinc-800 dark:text-zinc-200">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanatory Feedback Banner */}
          {submitted && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm animate-in fade-in duration-200 ${
                isCorrect
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isCorrect ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Correct! +10 XP awarded</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Not quite right</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed font-sans">{currentItem.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {!submitted ? (
              <button
                type="submit"
                disabled={selectedIndex === null}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                Submit Answer
              </button>
            ) : isWrong ? (
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all outline-none"
              >
                Try Again
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
              >
                {currentIndex < availableItems.length - 1 ? "Next Question" : "Complete"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckModal;
