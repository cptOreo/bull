import type { LearningEvent } from "@/lib/engine/types";
import {
  calculateXP,
  calculateLevel,
  calculateStreak,
  evaluateBadges,
  toISTDate,
  type LevelTier,
  type StreakResult,
  type Badge,
} from "@/lib/engine/xp";
import { getItem, setItem, removeItem } from "./store";

export const EVENTS_STORAGE_KEY = "bull_events_v0";

/**
 * Loads the learning events list from storage.
 */
export function loadEvents(): LearningEvent[] {
  const events = getItem<LearningEvent[]>(EVENTS_STORAGE_KEY, []);
  return Array.isArray(events) ? events : [];
}

/**
 * Persists an array of learning events to storage.
 */
export function saveEvents(events: LearningEvent[]): void {
  setItem(EVENTS_STORAGE_KEY, events);
}

/**
 * Clears the event log from storage.
 */
export function clearEvents(): void {
  removeItem(EVENTS_STORAGE_KEY);
}

/**
 * Checks if an event is a duplicate based on event type and deduplication rules.
 */
export function isDuplicateEvent(existing: LearningEvent[], incoming: LearningEvent): boolean {
  switch (incoming.type) {
    case "lesson_completed":
      if (incoming.conceptId) {
        return existing.some(
          (e) => e.type === "lesson_completed" && e.conceptId === incoming.conceptId,
        );
      }
      return false;

    case "mission_passed":
      if (incoming.conceptId) {
        return existing.some(
          (e) => e.type === "mission_passed" && e.conceptId === incoming.conceptId,
        );
      }
      return false;

    case "check_answered_correct":
      if (incoming.conceptId && incoming.itemId) {
        return existing.some(
          (e) =>
            e.type === "check_answered_correct" &&
            e.conceptId === incoming.conceptId &&
            e.itemId === incoming.itemId,
        );
      }
      return false;

    case "quiz_passed": {
      const incomingDate = toISTDate(incoming.timestamp);
      return existing.some(
        (e) => e.type === "quiz_passed" && toISTDate(e.timestamp) === incomingDate,
      );
    }

    default:
      // Exact duplicate check for other events
      return existing.some(
        (e) =>
          e.type === incoming.type &&
          e.conceptId === incoming.conceptId &&
          e.ticker === incoming.ticker &&
          e.itemId === incoming.itemId &&
          e.timestamp === incoming.timestamp,
      );
  }
}

/**
 * Appends a learning event to the persistent event log.
 * Applies deduplication by default so duplicate lesson/check/mission/quiz credits are not repeated.
 */
export function appendEvent(
  event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string }),
  options: { force?: boolean } = {},
): { events: LearningEvent[]; appended: boolean } {
  const existing = loadEvents();
  const fullEvent: LearningEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  if (!options.force && isDuplicateEvent(existing, fullEvent)) {
    return { events: existing, appended: false };
  }

  const updated = [...existing, fullEvent];
  saveEvents(updated);
  return { events: updated, appended: true };
}

/**
 * Computes active IST streak from events.
 */
export function computeStreak(events?: LearningEvent[], now?: string): StreakResult {
  const list = events ?? loadEvents();
  const currentInstant = now ?? new Date().toISOString();
  return calculateStreak(list, currentInstant);
}

/**
 * Computes total XP monotonically from closed whitelist events.
 */
export function computeXP(events?: LearningEvent[]): number {
  const list = events ?? loadEvents();
  return calculateXP(list);
}

/**
 * Computes level tier and title from current XP.
 */
export function computeLevel(events?: LearningEvent[]): LevelTier {
  const xp = computeXP(events);
  return calculateLevel(xp);
}

/**
 * Evaluates all 6 badge statuses from events.
 */
export function computeBadges(events?: LearningEvent[]): Badge[] {
  const list = events ?? loadEvents();
  return evaluateBadges(list);
}
