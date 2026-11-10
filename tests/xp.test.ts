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
  it("computes levels 1 through 4 based on XP thresholds (0-99, 100-199, 200-299, 300+)", () => {
    // Level 1: 0-99
    expect(calculateLevel(0).level).toBe(1);
    expect(calculateLevel(50).level).toBe(1);
    expect(calculateLevel(99).level).toBe(1);

    // Level 2: 100-199
    expect(calculateLevel(100).level).toBe(2);
    expect(calculateLevel(150).level).toBe(2);
    expect(calculateLevel(199).level).toBe(2);

    // Level 3: 200-299
    expect(calculateLevel(200).level).toBe(3);
    expect(calculateLevel(250).level).toBe(3);
    expect(calculateLevel(299).level).toBe(3);

    // Level 4: 300+
    expect(calculateLevel(300).level).toBe(4);
    expect(calculateLevel(480).level).toBe(4);
    expect(calculateLevel(1000).level).toBe(4);
  });

  it("supports level names and spec titles (Curious, Observer, Reader, Analyst, Risk Spotter)", () => {
    const lvl0 = calculateLevel(0);
    expect(lvl0.name).toBe("Level 1");
    expect(lvl0.title).toBe("Curious");

    const lvl50 = calculateLevel(50);
    expect(lvl50.title).toBe("Observer");

    const lvl120 = calculateLevel(120);
    expect(lvl120.title).toBe("Reader");

    const lvl220 = calculateLevel(220);
    expect(lvl220.title).toBe("Analyst");

    const lvl350 = calculateLevel(350);
    expect(lvl350.title).toBe("Risk Spotter");
  });
});

describe("xp - badges", () => {
  it("evaluates the 6 badges with clear unlocking criteria", () => {
    // 1. Initial state: all locked
    const emptyBadges = evaluateBadges([]);
    expect(emptyBadges).toHaveLength(6);
    expect(emptyBadges.every((b) => b.unlocked === false)).toBe(true);

    const badgeIds = emptyBadges.map((b) => b.id);
    expect(badgeIds).toEqual([
      "first_steps",
      "diversified",
      "debt_sleuth",
      "dividend_hunter",
      "risk_aware",
      "master_scout",
    ]);

    // 2. Unlock first_steps
    const stepEvents: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const b1 = evaluateBadges(stepEvents);
    expect(b1.find((b) => b.id === "first_steps")?.unlocked).toBe(true);

    // 3. Unlock debt_sleuth
    const debtEvents: LearningEvent[] = [
      { type: "check_answered_correct", conceptId: "C4", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const b2 = evaluateBadges(debtEvents);
    expect(b2.find((b) => b.id === "debt_sleuth")?.unlocked).toBe(true);

    // 4. Unlock dividend_hunter
    const divEvents: LearningEvent[] = [
      { type: "mission_passed", conceptId: "C6", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const b3 = evaluateBadges(divEvents);
    expect(b3.find((b) => b.id === "dividend_hunter")?.unlocked).toBe(true);

    // 5. Unlock diversified
    const divMissionEvents: LearningEvent[] = [
      { type: "mission_passed", conceptId: "C8", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const b4 = evaluateBadges(divMissionEvents);
    expect(b4.find((b) => b.id === "diversified")?.unlocked).toBe(true);

    // 6. Unlock risk_aware (3 distinct stocks with risk named)
    const riskEvents: LearningEvent[] = [
      { type: "risk_named", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
      { type: "risk_named", ticker: "TCS", timestamp: "2026-11-10T10:01:00Z" },
      { type: "risk_named", ticker: "LT", timestamp: "2026-11-10T10:02:00Z" },
    ];
    const b5 = evaluateBadges(riskEvents);
    expect(b5.find((b) => b.id === "risk_aware")?.unlocked).toBe(true);

    // 7. Unlock master_scout (quiz_passed or 3 missions)
    const scoutEvents: LearningEvent[] = [
      { type: "quiz_passed", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const b6 = evaluateBadges(scoutEvents);
    expect(b6.find((b) => b.id === "master_scout")?.unlocked).toBe(true);
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
