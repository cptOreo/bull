import React from "react";
import type { MasteryState } from "@/lib/engine/types";

export type MasteryRailState = MasteryState | "unlocked" | "in_progress";

export interface MasteryRailProps {
  state: MasteryRailState;
  className?: string;
  showLabels?: boolean;
}

const STEP_DEFINITIONS = [
  { step: 1, label: "Seen", description: "Lesson reviewed" },
  { step: 2, label: "Practised", description: "First check completed" },
  { step: 3, label: "Deepened", description: "Concepts reinforced" },
  { step: 4, label: "Applied", description: "Stock mission completed" },
  { step: 5, label: "Mastered", description: "Second check passed" },
];

/**
 * Returns how many of the 5 mastery steps are filled based on §8.5 state.
 */
export function getFilledStepCount(state: MasteryRailState): number {
  switch (state) {
    case "locked":
      return 0;
    case "seen":
    case "unlocked":
      return 1;
    case "in_progress":
      return 2;
    case "practised":
      return 2;
    case "applied":
      return 4;
    case "mastered":
      return 5;
    default:
      return 0;
  }
}

export function getMasteryLabel(state: MasteryRailState): string {
  switch (state) {
    case "locked":
      return "Locked";
    case "seen":
    case "unlocked":
      return "Seen";
    case "in_progress":
      return "In Progress";
    case "practised":
      return "Practised";
    case "applied":
      return "Applied";
    case "mastered":
      return "Mastered";
    default:
      return "Locked";
  }
}

/**
 * MasteryRail renders a dignified 5-step horizontal progression rail
 * representing the learner's journey from locked to mastered.
 */
export function MasteryRail({
  state,
  className = "",
  showLabels = false,
}: MasteryRailProps) {
  const filledSteps = getFilledStepCount(state);
  const currentLabel = getMasteryLabel(state);
  const isMastered = state === "mastered";
  const isLocked = state === "locked";

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${className}`}
      role="progressbar"
      aria-label={`Mastery progress: ${currentLabel}`}
      aria-valuenow={filledSteps}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuetext={`${filledSteps} of 5 steps completed (${currentLabel})`}
    >
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-700 dark:text-zinc-300">
          Mastery Rail
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
            isMastered
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
              : isLocked
              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
          }`}
        >
          {currentLabel} ({filledSteps}/5)
        </span>
      </div>

      {/* 5 Segmented bars */}
      <div className="grid grid-cols-5 gap-1.5 h-2 w-full">
        {STEP_DEFINITIONS.map((def, idx) => {
          const isFilled = idx < filledSteps;
          return (
            <div
              key={def.step}
              title={`${def.step}. ${def.label} — ${def.description}`}
              className={`h-full rounded-sm transition-all duration-300 ${
                isFilled
                  ? isMastered
                    ? "bg-emerald-600 shadow-sm shadow-emerald-500/20"
                    : "bg-indigo-600 dark:bg-indigo-500 shadow-sm shadow-indigo-500/20"
                  : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          );
        })}
      </div>

      {showLabels && (
        <div className="grid grid-cols-5 gap-1 text-[10px] text-zinc-500 text-center font-mono">
          {STEP_DEFINITIONS.map((def, idx) => {
            const isFilled = idx < filledSteps;
            return (
              <span
                key={def.step}
                className={isFilled ? "text-zinc-800 dark:text-zinc-200 font-medium" : "text-zinc-400"}
              >
                {def.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MasteryRail;
