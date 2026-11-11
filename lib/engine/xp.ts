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
  { level: 0, name: "Curious", title: "Curious", minXp: 0, nextThreshold: 50, description: "Just starting" },
  { level: 1, name: "Observer", title: "Observer", minXp: 50, nextThreshold: 120, description: "Can read a stock page" },
  { level: 2, name: "Reader", title: "Reader", minXp: 120, nextThreshold: 220, description: "Can explain a ratio" },
  { level: 3, name: "Analyst", title: "Analyst", minXp: 220, nextThreshold: 350, description: "Can compare two companies on the numbers" },
  { level: 4, name: "Risk Spotter", title: "Risk Spotter", minXp: 350, nextThreshold: null, description: "Can name what could go wrong" },
] as const;

export function calculateLevel(xp: number): LevelTier {
  const safeXp = Math.max(0, xp);

  let tier: (typeof LEVEL_TIERS)[number] = LEVEL_TIERS[0];
  if (safeXp >= 350) {
    tier = LEVEL_TIERS[4];
  } else if (safeXp >= 220) {
    tier = LEVEL_TIERS[3];
  } else if (safeXp >= 120) {
    tier = LEVEL_TIERS[2];
  } else if (safeXp >= 50) {
    tier = LEVEL_TIERS[1];
  }

  return {
    level: tier.level,
    name: tier.name,
    title: tier.title,
    minXp: tier.minXp,
    nextThreshold: tier.nextThreshold,
    description: tier.description,
    valueOf() {
      return this.level;
    },
    toString() {
      return this.name;
    },
  };
}

export type BadgeId =
  | "risk_namer"
  | "ratio_reader"
  | "diversifier"
  | "patient_capital"
  | "no_fomo"
  | "hinglish_pro";

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
    id: "risk_namer",
    name: "Risk Namer",
    description: "Pass the 'Name the risk' check on three distinct stocks.",
    evaluate: (events) => {
      const distinctRiskTickers = new Set<string>();
      let unlockedAt: string | undefined;
      for (const e of events) {
        if (
          (e.type === "risk_named" && e.ticker) ||
          (e.type === "check_answered_correct" && e.ticker)
        ) {
          distinctRiskTickers.add(e.ticker);
          if (distinctRiskTickers.size >= 3 && !unlockedAt) {
            unlockedAt = e.timestamp;
          }
        }
      }
      return { unlocked: distinctRiskTickers.size >= 3, unlockedAt };
    },
  },
  {
    id: "ratio_reader",
    name: "Ratio Reader",
    description: "At least one correct check for each of C3, C4 and C5.",
    evaluate: (events) => {
      const c3 = events.find(
        (e) => e.type === "check_answered_correct" && e.conceptId === "C3",
      );
      const c4 = events.find(
        (e) => e.type === "check_answered_correct" && e.conceptId === "C4",
      );
      const c5 = events.find(
        (e) => e.type === "check_answered_correct" && e.conceptId === "C5",
      );
      const unlocked = Boolean(c3 && c4 && c5);
      const unlockedAt = unlocked
        ? [c3, c4, c5].sort((a, b) => (a!.timestamp > b!.timestamp ? 1 : -1))[2]?.timestamp
        : undefined;
      return { unlocked, unlockedAt };
    },
  },
  {
    id: "diversifier",
    name: "Diversifier",
    description: "Pass the C8 applied mission.",
    evaluate: (events) => {
      const match = events.find(
        (e) => e.type === "mission_passed" && e.conceptId === "C8",
      );
      return { unlocked: Boolean(match), unlockedAt: match?.timestamp };
    },
  },
  {
    id: "patient_capital",
    name: "Patient Capital",
    description: "Pass the C7 mission and view five-year charts for three distinct stocks.",
    evaluate: (events) => {
      const c7Mission = events.find(
        (e) => e.type === "mission_passed" && e.conceptId === "C7",
      );
      const distinctChartTickers = new Set(
        events
          .filter((e) => e.type === "chart_viewed" && e.ticker)
          .map((e) => e.ticker!),
      );
      const unlocked = Boolean(c7Mission && distinctChartTickers.size >= 3);
      const unlockedAt = unlocked ? c7Mission?.timestamp : undefined;
      return { unlocked, unlockedAt };
    },
  },
  {
    id: "no_fomo",
    name: "No-FOMO",
    description: "Answer the fixed 'double your money' item in C8 correctly.",
    evaluate: (events) => {
      const match = events.find(
        (e) =>
          e.type === "check_answered_correct" &&
          (e.itemId === "c8_check_3" || (e.conceptId === "C8" && Boolean(e.data?.isNoFomo))),
      );
      return { unlocked: Boolean(match), unlockedAt: match?.timestamp };
    },
  },
  {
    id: "hinglish_pro",
    name: "Hinglish Pro",
    description: "Answer three concept checks correctly while the locale is hi-en.",
    evaluate: (events) => {
      const hiEnChecks = events.filter(
        (e) =>
          e.type === "check_answered_correct" &&
          (e.locale === "hi-en" || e.data?.locale === "hi-en"),
      );
      const unlocked = hiEnChecks.length >= 3;
      const unlockedAt = unlocked ? hiEnChecks[2]?.timestamp : undefined;
      return { unlocked, unlockedAt };
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

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
}

export const BADGES: BadgeItem[] = [
  { id: "first-lesson", name: "First Steps", description: "Complete your first lesson", icon: "BookOpen", xp: 100 },
  { id: "analyst", name: "Analyst", description: "Complete 'Analyze Any Stock' track", icon: "Search", xp: 500 },
  { id: "dividend-investor", name: "Dividend Investor", description: "Complete 'Build Dividend Portfolio' track", icon: "DollarSign", xp: 500 },
  { id: "statement-reader", name: "Statement Reader", description: "Complete 'Read Financial Statements' track", icon: "FileText", xp: 500 },
  { id: "moat-master", name: "Moat Master", description: "Complete 'Understand Moats' track", icon: "Shield", xp: 500 },
  { id: "streak-7", name: "Week Warrior", description: "7-day learning streak", icon: "Flame", xp: 100 },
  { id: "streak-30", name: "Monthly Master", description: "30-day learning streak", icon: "Calendar", xp: 200 },
  { id: "streak-100", name: "Centurion", description: "100-day learning streak", icon: "Award", xp: 500 },
  { id: "risk-namer", name: "Risk Namer", description: "Correctly identify risks for 10 stocks", icon: "AlertTriangle", xp: 200 },
  { id: "dcf-builder", name: "DCF Builder", description: "Build 5 DCF models", icon: "Calculator", xp: 300 },
  { id: "screener", name: "Screener", description: "Run 10 stock screens", icon: "Filter", xp: 200 },
  { id: "professor", name: "Professor", description: "Reach Level 10", icon: "GraduationCap", xp: 1000 },
];
