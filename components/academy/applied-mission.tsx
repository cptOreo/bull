import React, { useState } from "react";
import type { ConceptId, LearningEvent, Mission } from "@/lib/engine/types";
import { getMissionForConcept, gradeMission } from "@/lib/engine/curriculum";

export interface AppliedMissionProps {
  conceptId?: ConceptId;
  mission?: Mission;
  ticker?: string;
  onSuccess?: () => void;
  logEvent?: (event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string })) => boolean | void;
  className?: string;
}

/**
 * AppliedMission renders the auto-graded numeric mission for a concept.
 */
export function AppliedMission({
  conceptId = "C1",
  mission: propMission,
  ticker = "INFY",
  onSuccess,
  logEvent,
  className = "",
}: AppliedMissionProps) {
  const mission = propMission ?? getMissionForConcept(conceptId);
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [explanation, setExplanation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || submitted) return;

    const numericVal = parseFloat(inputValue);
    const result = gradeMission(
      mission,
      isNaN(numericVal) ? inputValue : numericVal
    );

    setSubmitted(true);
    setPassed(result.passed);
    setExplanation(result.explanation);

    if (result.passed) {
      if (logEvent) {
        logEvent({
          type: "mission_passed",
          conceptId: mission.conceptId,
          ticker,
          timestamp: new Date().toISOString(),
        });
      }
      if (onSuccess) onSuccess();
    }
  };

  const handleRetry = () => {
    setInputValue("");
    setSubmitted(false);
    setPassed(false);
    setExplanation("");
  };

  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm ${className}`}
      data-testid="applied-mission"
    >
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-3">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          Applied Mission · {mission.conceptId}
        </span>
        <span className="font-semibold text-emerald-600">+30 XP</span>
      </div>

      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        {mission.prompt}
      </p>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mb-4">
        Formula: {mission.formulaNote}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={submitted && passed}
            placeholder={`Enter value (${mission.unit})`}
            className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          />
          <span className="text-xs font-mono text-zinc-500">{mission.unit}</span>
        </div>

        {submitted && (
          <div
            className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
              passed
                ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-900 dark:text-rose-200"
            }`}
          >
            <div className="font-bold mb-1">
              {passed ? "Mission Completed! +30 XP" : "Calculation Check:"}
            </div>
            <p>{explanation}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {!submitted ? (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              Verify Calculation
            </button>
          ) : !passed ? (
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
            >
              Recalculate
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-2">
              ✓ Verified with stock numbers
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default AppliedMission;
