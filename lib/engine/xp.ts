import type { LearningEvent } from "./types";

export const XP_SOURCES = {
  lesson_completed: 20,
  check_answered_correct: 10,
  mission_passed: 30,
  quiz_passed: 15,
} as const;

export type XPSourceKey = keyof typeof XP_SOURCES;

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30 in milliseconds

/** Converts an ISO timestamp to an IST (Asia/Kolkata) YYYY-MM-DD date string. */
export function toISTDate(isoTimestamp: string): string {
  const ms = Date.parse(isoTimestamp);
  if (isNaN(ms)) {
    return isoTimestamp.slice(0, 10);
  }
  const istDate = new Date(ms + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousDay(istDateStr: string): string {
  const parts = istDateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() - 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function calculateXP(events: LearningEvent[]): number {
  const seenLessons = new Set<string>();
  const seenChecks = new Set<string>();
  const seenMissions = new Set<string>();
  const seenQuizzes = new Set<string>();

  let totalXP = 0;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    switch (e.type) {
      case "lesson_completed": {
        const key = e.conceptId ?? `lesson_${i}`;
        if (!seenLessons.has(key)) {
          seenLessons.add(key);
          totalXP += XP_SOURCES.lesson_completed;
        }
        break;
      }
      case "check_answered_correct": {
        const key = e.conceptId ?? `check_${i}`;
        if (!seenChecks.has(key)) {
          seenChecks.add(key);
          totalXP += XP_SOURCES.check_answered_correct;
        }
        break;
      }
      case "mission_passed": {
        const key = e.conceptId ?? `mission_${i}`;
        if (!seenMissions.has(key)) {
          seenMissions.add(key);
          totalXP += XP_SOURCES.mission_passed;
        }
        break;
      }
      case "quiz_passed": {
        const istDate = e.timestamp ? toISTDate(e.timestamp) : `quiz_${i}`;
        if (!seenQuizzes.has(istDate)) {
          seenQuizzes.add(istDate);
          totalXP += XP_SOURCES.quiz_passed;
        }
        break;
      }
      default:
        // Closed whitelist: zero XP for any other event type
        break;
    }
  }

  return totalXP;
}

export type LevelTier = {
  level: number;
  name: string;
  title: string;
  minXp: number;
  nextThreshold: number | null;
  description: string;
  valueOf(): number;
  toString(): string;
};

export const LEVEL_TIERS = [
  { level: 1, name: "Level 1", minXp: 0, nextThreshold: 100 },
  { level: 2, name: "Level 2", minXp: 100, nextThreshold: 200 },
  { level: 3, name: "Level 3", minXp: 200, nextThreshold: 300 },
  { level: 4, name: "Level 4", minXp: 300, nextThreshold: null },
] as const;

export const SPEC_TITLES = [
  { minXp: 350, title: "Risk Spotter", description: "Can name what could go wrong" },
  { minXp: 220, title: "Analyst", description: "Can compare two companies on the numbers" },
  { minXp: 120, title: "Reader", description: "Can explain a ratio" },
  { minXp: 50, title: "Observer", description: "Can read a stock page" },
  { minXp: 0, title: "Curious", description: "Just starting" },
] as const;

export function calculateLevel(xp: number): LevelTier {
  const safeXp = Math.max(0, xp);

  let tier: (typeof LEVEL_TIERS)[number] = LEVEL_TIERS[0];
  if (safeXp >= 300) {
    tier = LEVEL_TIERS[3];
  } else if (safeXp >= 200) {
    tier = LEVEL_TIERS[2];
  } else if (safeXp >= 100) {
    tier = LEVEL_TIERS[1];
  }

  let spec: (typeof SPEC_TITLES)[number] = SPEC_TITLES[SPEC_TITLES.length - 1];
  for (const s of SPEC_TITLES) {
    if (safeXp >= s.minXp) {
      spec = s;
      break;
    }
  }

  return {
    level: tier.level,
    name: tier.name,
    title: spec.title,
    minXp: tier.minXp,
    nextThreshold: tier.nextThreshold,
    description: spec.description,
    valueOf() {
      return this.level;
    },
    toString() {
      return this.name;
    },
  };
}

export type BadgeId =
  | "first_steps"
  | "diversified"
  | "debt_sleuth"
  | "dividend_hunter"
  | "risk_aware"
  | "master_scout";

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export const BADGE_DEFINITIONS: Array<{
  id: BadgeId;
  name: string;
  description: string;
  evaluate: (events: LearningEvent[]) => { unlocked: boolean; unlockedAt?: string };
}> = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Start your journey by viewing your first stock or completing a lesson.",
    evaluate: (events) => {
      const match = events.find(
        (e) =>
          e.type === "stock_viewed" ||
          e.type === "lesson_completed" ||
          e.type === "check_answered_correct",
      );
      return { unlocked: Boolean(match), unlockedAt: match?.timestamp };
    },
  },
  {
    id: "diversified",
    name: "Diversified",
    description: "Generate a multi-sector shortlist or pass the diversification mission.",
    evaluate: (events) => {
      const match = events.find(
        (e) =>
          (e.type === "mission_passed" && e.conceptId === "C8") ||
          (e.type === "shortlist_generated" &&
            (typeof e.data?.sectorCount === "number" ? e.data.sectorCount >= 2 : true)),
      );
      return { unlocked: Boolean(match), unlockedAt: match?.timestamp };
    },
  },
  {
    id: "debt_sleuth",
    name: "Debt Sleuth",
    description: "Solve a debt ratio check or pass the leverage mission.",
    evaluate: (events) => {
      const match = events.find(
        (e) =>
          e.conceptId === "C4" &&
          (e.type === "check_answered_correct" || e.type === "mission_passed"),
      );
      return { unlocked: Boolean(match), unlockedAt: match?.timestamp };
    },
  },
  {
    id: "dividend_hunter",
    name: "Dividend Hunter",
    description: "Answer a dividend check or calculate cash yield accurately.",
    evaluate: (events) => {
      const match = events.find(
        (e) =>
          e.conceptId === "C6" &&
          (e.type === "check_answered_correct" || e.type === "mission_passed"),
      );
      return { unlocked: Boolean(match), unlockedAt: match?.timestamp };
    },
  },
  {
    id: "risk_aware",
    name: "Risk Aware",
    description: "Identify risks on three distinct stocks or complete the drawdown mission.",
    evaluate: (events) => {
      const distinctRiskTickers = new Set(
        events
          .filter((e) => e.type === "risk_named" && e.ticker)
          .map((e) => e.ticker!),
      );
      if (distinctRiskTickers.size >= 3) {
        const lastRisk = events.filter((e) => e.type === "risk_named")[2];
        return { unlocked: true, unlockedAt: lastRisk?.timestamp };
      }
      const c7Match = events.find(
        (e) =>
          e.conceptId === "C7" &&
          (e.type === "check_answered_correct" || e.type === "mission_passed"),
      );
      return { unlocked: Boolean(c7Match), unlockedAt: c7Match?.timestamp };
    },
  },
  {
    id: "master_scout",
    name: "Master Scout",
    description: "Pass a daily quiz or conquer applied missions across multiple concepts.",
    evaluate: (events) => {
      const quizMatch = events.find((e) => e.type === "quiz_passed");
      if (quizMatch) {
        return { unlocked: true, unlockedAt: quizMatch.timestamp };
      }
      const distinctMissionConcepts = new Set(
        events
          .filter((e) => e.type === "mission_passed" && e.conceptId)
          .map((e) => e.conceptId!),
      );
      if (distinctMissionConcepts.size >= 3) {
        const lastMission = events.filter((e) => e.type === "mission_passed")[2];
        return { unlocked: true, unlockedAt: lastMission?.timestamp };
      }
      return { unlocked: false };
    },
  },
];

export function evaluateBadges(events: LearningEvent[]): Badge[] {
  return BADGE_DEFINITIONS.map((def) => {
    const res = def.evaluate(events);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      unlocked: res.unlocked,
      unlockedAt: res.unlockedAt,
    };
  });
}

export type StreakResult = {
  current: number;
  best: number;
  todayActive: boolean;
  keepAliveMessage?: string;
  valueOf(): number;
};

export function calculateStreak(events: LearningEvent[], now: string): StreakResult {
  const nowIST = toISTDate(now);
  const yesterdayIST = getPreviousDay(nowIST);

  // Collect all unique IST dates where the user engaged with concept checks
  const activeDatesSet = new Set<string>();
  for (const e of events) {
    if (
      e.type === "check_answered_correct" ||
      Boolean(e.itemId)
    ) {
      if (e.timestamp) {
        activeDatesSet.add(toISTDate(e.timestamp));
      }
    }
  }

  const todayActive = activeDatesSet.has(nowIST);

  // Compute current streak
  let current = 0;
  let anchorDate: string | null = null;
  if (todayActive) {
    anchorDate = nowIST;
  } else if (activeDatesSet.has(yesterdayIST)) {
    anchorDate = yesterdayIST;
  }

  if (anchorDate) {
    let checkDay = anchorDate;
    while (activeDatesSet.has(checkDay)) {
      current++;
      checkDay = getPreviousDay(checkDay);
    }
  }

  // Compute best streak across all historical dates
  const sortedDates = Array.from(activeDatesSet).sort();
  let best = 0;
  if (sortedDates.length > 0) {
    let running = 1;
    best = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = sortedDates[i - 1];
      const curr = sortedDates[i];
      if (getPreviousDay(curr) === prev) {
        running++;
      } else {
        running = 1;
      }
      if (running > best) {
        best = running;
      }
    }
  }
  best = Math.max(best, current);

  const keepAliveMessage =
    !todayActive && current > 0 ? "Answer one check today to keep it" : undefined;

  return {
    current,
    best,
    todayActive,
    keepAliveMessage,
    valueOf() {
      return this.current;
    },
  };
}
