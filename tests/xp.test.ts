import { describe, expect, it } from "vitest";
import {
  XP_SOURCES,
  calculateXP,
  calculateLevel,
  evaluateBadges,
  calculateStreak,
  toISTDate,
} from "@/lib/engine/xp";
import type { LearningEvent } from "@/lib/engine/types";

describe("xp - closed whitelist calculation", () => {
  it("defines exactly the four permitted XP sources with exact amounts", () => {
    expect(XP_SOURCES).toEqual({
      lesson_completed: 20,
      check_answered_correct: 10,
      mission_passed: 30,
      quiz_passed: 15,
    });
  });

  it("calculates XP from whitelist events and gives 0 XP for non-whitelist events", () => {
    const events: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
      { type: "chart_viewed", ticker: "INFY", timestamp: "2026-11-10T10:01:00Z" },
      { type: "shortlist_generated", timestamp: "2026-11-10T10:02:00Z" },
      { type: "risk_named", ticker: "INFY", timestamp: "2026-11-10T10:03:00Z" },
      { type: "quiz_completed", timestamp: "2026-11-10T10:04:00Z" },
      { type: "comparison_viewed", timestamp: "2026-11-10T10:05:00Z" },
    ];
    // None of these award XP
    expect(calculateXP(events)).toBe(0);

    // Whitelist events award XP
    const learningEvents: LearningEvent[] = [
      { type: "lesson_completed", conceptId: "C1", timestamp: "2026-11-10T10:10:00Z" }, // 20
      { type: "check_answered_correct", conceptId: "C1", timestamp: "2026-11-10T10:11:00Z" }, // 10
      { type: "mission_passed", conceptId: "C1", timestamp: "2026-11-10T10:12:00Z" }, // 30
      { type: "quiz_passed", timestamp: "2026-11-10T10:13:00Z" }, // 15
    ];
    expect(calculateXP(learningEvents)).toBe(75);
  });

  it("deduplicates XP per concept and achieves exactly 480 XP maximum from all 8 lessons, checks, and missions", () => {
    const concepts = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"] as const;
    const events: LearningEvent[] = [];

    for (const c of concepts) {
      events.push({ type: "lesson_completed", conceptId: c, timestamp: "2026-11-10T10:00:00Z" });
      events.push({ type: "check_answered_correct", conceptId: c, timestamp: "2026-11-10T10:01:00Z" });
      events.push({ type: "mission_passed", conceptId: c, timestamp: "2026-11-10T10:02:00Z" });
    }

    // 8 concepts * (20 + 10 + 30) = 8 * 60 = 480 XP
    expect(calculateXP(events)).toBe(480);

    // Duplicate events for the same concept do not add more XP
    events.push({ type: "lesson_completed", conceptId: "C1", timestamp: "2026-11-10T11:00:00Z" });
    events.push({ type: "check_answered_correct", conceptId: "C1", timestamp: "2026-11-10T11:01:00Z" });
    events.push({ type: "mission_passed", conceptId: "C1", timestamp: "2026-11-10T11:02:00Z" });

    expect(calculateXP(events)).toBe(480);
  });

  it("calculates XP monotonically (never decreases)", () => {
    const events: LearningEvent[] = [];
    let prevXP = calculateXP(events);

    const additions: LearningEvent[] = [
      { type: "lesson_completed", conceptId: "C1", timestamp: "2026-11-10T10:00:00Z" },
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:01:00Z" },
      { type: "check_answered_correct", conceptId: "C1", timestamp: "2026-11-10T10:02:00Z" },
      { type: "risk_named", ticker: "TCS", timestamp: "2026-11-10T10:03:00Z" },
      { type: "mission_passed", conceptId: "C1", timestamp: "2026-11-10T10:04:00Z" },
      { type: "quiz_passed", timestamp: "2026-11-10T10:05:00Z" },
    ];

    for (const event of additions) {
      events.push(event);
      const currentXP = calculateXP(events);
      expect(currentXP).toBeGreaterThanOrEqual(prevXP);
      prevXP = currentXP;
    }
  });
});

describe("xp - levels", () => {
  it("computes levels 0 through 4 based on XP thresholds (§8.7)", () => {
    // Level 0: Curious (0-49 XP, next: 50)
    expect(calculateLevel(0).level).toBe(0);
    expect(calculateLevel(0).name).toBe("Curious");
    expect(calculateLevel(0).nextThreshold).toBe(50);
    expect(calculateLevel(49).level).toBe(0);

    // Level 1: Observer (50-119 XP, next: 120)
    expect(calculateLevel(50).level).toBe(1);
    expect(calculateLevel(50).name).toBe("Observer");
    expect(calculateLevel(50).nextThreshold).toBe(120);
    expect(calculateLevel(119).level).toBe(1);

    // Level 2: Reader (120-219 XP, next: 220)
    expect(calculateLevel(120).level).toBe(2);
    expect(calculateLevel(120).name).toBe("Reader");
    expect(calculateLevel(120).nextThreshold).toBe(220);
    expect(calculateLevel(219).level).toBe(2);

    // Level 3: Analyst (220-349 XP, next: 350)
    expect(calculateLevel(220).level).toBe(3);
    expect(calculateLevel(220).name).toBe("Analyst");
    expect(calculateLevel(220).nextThreshold).toBe(350);
    expect(calculateLevel(349).level).toBe(3);

    // Level 4: Risk Spotter (350+ XP, next: null)
    expect(calculateLevel(350).level).toBe(4);
    expect(calculateLevel(350).name).toBe("Risk Spotter");
    expect(calculateLevel(350).nextThreshold).toBeNull();
    expect(calculateLevel(480).level).toBe(4);
    expect(calculateLevel(1000).level).toBe(4);
  });
});

describe("xp - badges", () => {
  it("evaluates the 6 badges with clear unlocking criteria (§8.8)", () => {
    // 1. Initial state: all locked
    const emptyBadges = evaluateBadges([]);
    expect(emptyBadges).toHaveLength(6);
    expect(emptyBadges.every((b) => b.unlocked === false)).toBe(true);

    const badgeIds = emptyBadges.map((b) => b.id);
    expect(badgeIds).toEqual([
      "risk_namer",
      "ratio_reader",
      "diversifier",
      "patient_capital",
      "no_fomo",
      "hinglish_pro",
    ]);

    // 2. Unlock risk_namer: pass name the risk check on 3 distinct stocks
    const riskEvents: LearningEvent[] = [
      { type: "risk_named", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
      { type: "risk_named", ticker: "TCS", timestamp: "2026-11-10T10:01:00Z" },
      { type: "risk_named", ticker: "LT", timestamp: "2026-11-10T10:02:00Z" },
    ];
    const b1 = evaluateBadges(riskEvents);
    expect(b1.find((b) => b.id === "risk_namer")?.unlocked).toBe(true);

    // 3. Unlock ratio_reader: at least one correct check for C3, C4 and C5
    const ratioEvents: LearningEvent[] = [
      { type: "check_answered_correct", conceptId: "C3", timestamp: "2026-11-10T10:00:00Z" },
      { type: "check_answered_correct", conceptId: "C4", timestamp: "2026-11-10T10:01:00Z" },
      { type: "check_answered_correct", conceptId: "C5", timestamp: "2026-11-10T10:02:00Z" },
    ];
    const b2 = evaluateBadges(ratioEvents);
    expect(b2.find((b) => b.id === "ratio_reader")?.unlocked).toBe(true);

    // 4. Unlock diversifier: pass C8 applied mission
    const divEvents: LearningEvent[] = [
      { type: "mission_passed", conceptId: "C8", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const b3 = evaluateBadges(divEvents);
    expect(b3.find((b) => b.id === "diversifier")?.unlocked).toBe(true);

    // 5. Unlock patient_capital: pass C7 mission and view five-year charts on 3 distinct stocks
    const patientEvents: LearningEvent[] = [
      { type: "mission_passed", conceptId: "C7", timestamp: "2026-11-10T10:00:00Z" },
      { type: "chart_viewed", ticker: "INFY", timestamp: "2026-11-10T10:01:00Z" },
      { type: "chart_viewed", ticker: "TCS", timestamp: "2026-11-10T10:02:00Z" },
      { type: "chart_viewed", ticker: "LT", timestamp: "2026-11-10T10:03:00Z" },
    ];
    const b4 = evaluateBadges(patientEvents);
    expect(b4.find((b) => b.id === "patient_capital")?.unlocked).toBe(true);

    // 6. Unlock no_fomo: answer the fixed "double your money" item in C8 correctly
    const fomoEvents: LearningEvent[] = [
      {
        type: "check_answered_correct",
        conceptId: "C8",
        itemId: "c8_check_3",
        timestamp: "2026-11-10T10:00:00Z",
      },
    ];
    const b5 = evaluateBadges(fomoEvents);
    expect(b5.find((b) => b.id === "no_fomo")?.unlocked).toBe(true);

    // 7. Unlock hinglish_pro: answer 3 checks correctly while locale is hi-en
    const hinglishEvents: LearningEvent[] = [
      { type: "check_answered_correct", conceptId: "C1", locale: "hi-en", timestamp: "2026-11-10T10:00:00Z" },
      { type: "check_answered_correct", conceptId: "C2", locale: "hi-en", timestamp: "2026-11-10T10:01:00Z" },
      { type: "check_answered_correct", conceptId: "C3", locale: "hi-en", timestamp: "2026-11-10T10:02:00Z" },
    ];
    const b6 = evaluateBadges(hinglishEvents);
    expect(b6.find((b) => b.id === "hinglish_pro")?.unlocked).toBe(true);
  });
});

describe("xp - IST streak calculation", () => {
  it("converts timestamps accurately to Asia/Kolkata (IST = UTC+05:30) date boundaries", () => {
    // 2026-11-10 18:29 UTC -> 23:59 IST on 2026-11-10
    expect(toISTDate("2026-11-10T18:29:00Z")).toBe("2026-11-10");

    // 2026-11-10 18:31 UTC -> 00:01 IST on 2026-11-11
    expect(toISTDate("2026-11-10T18:31:00Z")).toBe("2026-11-11");
  });

  it("calculates active streaks across IST calendar boundaries", () => {
    const now = "2026-11-11T10:00:00+05:30"; // 2026-11-11 in IST

    // Check answered yesterday (2026-11-10) and today (2026-11-11)
    const events: LearningEvent[] = [
      {
        type: "check_answered_correct",
        conceptId: "C1",
        timestamp: "2026-11-10T18:29:00Z", // 23:59 IST Nov 10
      },
      {
        type: "check_answered_correct",
        conceptId: "C1",
        timestamp: "2026-11-10T18:31:00Z", // 00:01 IST Nov 11
      },
    ];

    const streak = calculateStreak(events, now);
    expect(streak.current).toBe(2);
    expect(streak.best).toBe(2);
    expect(streak.todayActive).toBe(true);
  });

  it("retains streak from yesterday if today has no check yet", () => {
    const now = "2026-11-12T10:00:00+05:30"; // 2026-11-12 in IST
    const events: LearningEvent[] = [
      {
        type: "check_answered_correct",
        conceptId: "C1",
        timestamp: "2026-11-11T12:00:00+05:30", // Nov 11
      },
    ];

    const streak = calculateStreak(events, now);
    expect(streak.current).toBe(1);
    expect(streak.todayActive).toBe(false);
  });

  it("resets current streak to 0 if last check was two or more days ago", () => {
    const now = "2026-11-13T10:00:00+05:30"; // 2026-11-13 in IST
    const events: LearningEvent[] = [
      {
        type: "check_answered_correct",
        conceptId: "C1",
        timestamp: "2026-11-10T12:00:00+05:30", // Nov 10 (3 days ago)
      },
    ];

    const streak = calculateStreak(events, now);
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(1);
  });
});
