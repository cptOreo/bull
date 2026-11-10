"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { CONCEPT_CHECKS } from "@/lib/engine/curriculum";
import { EducationNote } from "@/components/ui/education-note";

export default function DailyQuizPage() {
  const { logEvent, streak } = useBull();

  // Select 3 fixed questions for today's quiz
  const quizItems = [
    CONCEPT_CHECKS[0],
    CONCEPT_CHECKS[3] ?? CONCEPT_CHECKS[1],
    CONCEPT_CHECKS[6] ?? CONCEPT_CHECKS[2],
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = quizItems[currentIndex];
  const isCorrect = selectedOption === currentQ?.correctIndex;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < quizItems.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setQuizFinished(true);
      logEvent({
        type: "quiz_passed",
        score: score + (isCorrect ? 1 : 0),
        data: { total: quizItems.length },
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500">
        <Link href="/academy" className="hover:underline">
          Academy
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">Daily Quiz</span>
      </nav>

      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Daily Practice
              </span>
              <span className="font-mono text-xs text-zinc-500">
                Streak: {streak.current}d 🔥
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Daily Investor Check
            </h1>
          </div>

          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            +15 XP Reward
          </span>
        </div>
      </section>

      {!quizFinished ? (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span>
              Question {currentIndex + 1} of {quizItems.length}
            </span>
            <span>Concept: {currentQ?.conceptId}</span>
          </div>

          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {currentQ?.question}
          </h2>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ?.options.map((opt, idx) => {
              const optText = opt;
              const isSelected = selectedOption === idx;
              let optionStyle =
                "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900";

              if (submitted) {
                if (idx === currentQ.correctIndex) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold";
                } else if (isSelected) {
                  optionStyle =
                    "border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200";
                } else {
                  optionStyle = "opacity-50 border-zinc-200 dark:border-zinc-800";
                }
              } else if (isSelected) {
                optionStyle = "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80 font-medium";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                >
                  <span>{optText}</span>
                  <span className="font-mono text-xs opacity-40 ml-2">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {submitted && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <span>{isCorrect ? "✓ Correct!" : "ℹ️ Not quite:"}</span>
              </div>
              <p>{currentQ?.explanation}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            {!submitted ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
              >
                {currentIndex + 1 < quizItems.length ? "Next Question →" : "Finish Quiz →"}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Finished View */
        <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto">
            🎉
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Daily Quiz Complete!
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You scored {score} of {quizItems.length} correct. +15 XP added to your balance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 max-w-xs mx-auto border border-zinc-200 dark:border-zinc-700/60 text-xs font-mono">
            <div className="flex justify-between">
              <span>Daily Streak:</span>
              <span className="font-bold text-amber-600">{streak.current} Days 🔥</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/academy"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
            >
              Back to Academy
            </Link>
            <Link
              href="/progress"
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              View Progress →
            </Link>
          </div>
        </div>
      )}

      <EducationNote />
    </main>
  );
}
