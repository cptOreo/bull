"use client";

import { useBullState, BullProvider } from "./store";
import type { BullContextType } from "./store";

export { BullProvider, useBullState };
export type { BullContextType };

export type UseBullResult = BullContextType & {
  reset: () => void;
};

/**
 * Primary React hook exposing Bull client state, profile updater,
 * locale switcher, learning event logger, and XP/level/streak/badge progress.
 */
export function useBull(): UseBullResult {
  const state = useBullState();
  return {
    ...state,
    reset: state.resetAll,
  };
}

export default useBull;
