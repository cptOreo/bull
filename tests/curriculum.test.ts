import { describe, expect, it } from "vitest";
import {
  CONCEPTS,
  CONCEPT_CHECKS,
  MISSIONS,
  evaluateUnlocks,
  isConceptUnlocked,
  getConceptState,
  gradeMission,
  getChecksForConcept,
  getMissionForConcept,
} from "@/lib/engine/curriculum";
import { snapshot } from "@/lib/data/snapshot";
import type { ConceptId, LearningEvent } from "@/lib/engine/types";

describe("curriculum - 8 concepts and check bank", () => {
  it("contains exactly 8 concepts (C1 through C8)", () => {
    expect(CONCEPTS).toHaveLength(8);
    const conceptIds = CONCEPTS.map((c) => c.id);
    const expectedIds: ConceptId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"];
    expect(conceptIds).toEqual(expectedIds);
  });

  it("contains exactly 32 questions (4 items per concept) with valid 3-option structure", () => {
    expect(CONCEPT_CHECKS).toHaveLength(32);
    const expectedIds: ConceptId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"];

    for (const cid of expectedIds) {
      const items = getChecksForConcept(cid);
      expect(items).toHaveLength(4);
      for (const item of items) {
        expect(item.conceptId).toBe(cid);
        expect(item.id).toBeTruthy();
        expect(item.question.length).toBeGreaterThan(10);
        expect(item.options).toHaveLength(3);
        expect(item.correctIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctIndex).toBeLessThanOrEqual(2);
        expect(item.explanation.length).toBeGreaterThan(10);
      }
    }

    // All 32 IDs must be unique
    const uniqueIds = new Set(CONCEPT_CHECKS.map((i) => i.id));
    expect(uniqueIds.size).toBe(32);
  });

  it("contains 8 applied missions, one for each concept", () => {
    expect(MISSIONS).toHaveLength(8);
    const expectedIds: ConceptId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"];
    for (const cid of expectedIds) {
      const mission = getMissionForConcept(cid);
      expect(mission).toBeDefined();
      expect(mission.conceptId).toBe(cid);
      expect(mission.prompt.length).toBeGreaterThan(10);
      expect(mission.unit).toBeTruthy();
      expect(mission.formulaNote).toBeTruthy();
    }
  });
});

describe("curriculum - concept unlock conditions", () => {
  it("locks all concepts when event history is empty", () => {
    const unlocks = evaluateUnlocks([]);
    expect(Object.values(unlocks).every((unlocked) => unlocked === false)).toBe(true);
    expect(isConceptUnlocked("C1", [])).toBe(false);
  });

  it("unlocks C1 on first stock_viewed", () => {
    const events: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const unlocks = evaluateUnlocks(events, snapshot);
    expect(unlocks.C1).toBe(true);
    expect(isConceptUnlocked("C1", events, snapshot)).toBe(true);
  });

  it("unlocks C2 on first chart_viewed", () => {
    const events: LearningEvent[] = [
      { type: "chart_viewed", ticker: "ITC", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const unlocks = evaluateUnlocks(events, snapshot);
    expect(unlocks.C2).toBe(true);
  });

  it("unlocks C3 on first shortlist_generated", () => {
    const events: LearningEvent[] = [
      { type: "shortlist_generated", timestamp: "2026-11-10T10:00:00Z" },
    ];
    const unlocks = evaluateUnlocks(events, snapshot);
    expect(unlocks.C3).toBe(true);
  });

  it("unlocks C4 on viewing stock with D/E >= 0.3 or bank", () => {
    // INFY is non-financial with no debt -> C4 locked
    const infyEvents: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
    ];
    expect(evaluateUnlocks(infyEvents, snapshot).C4).toBe(false);

    // HDFCBANK is financial (bank) -> C4 unlocked
    const bankEvents: LearningEvent[] = [
      { type: "stock_viewed", ticker: "HDFCBANK", timestamp: "2026-11-10T10:00:00Z" },
    ];
    expect(evaluateUnlocks(bankEvents, snapshot).C4).toBe(true);

    // LT has D/E = 1.01 >= 0.3 -> C4 unlocked
    const ltEvents: LearningEvent[] = [
      { type: "stock_viewed", ticker: "LT", timestamp: "2026-11-10T10:00:00Z" },
    ];
    expect(evaluateUnlocks(ltEvents, snapshot).C4).toBe(true);
  });

  it("unlocks C5 on comparison_viewed", () => {
    const events: LearningEvent[] = [
      { type: "comparison_viewed", timestamp: "2026-11-10T10:00:00Z" },
    ];
    expect(evaluateUnlocks(events, snapshot).C5).toBe(true);
  });

  it("unlocks C6 on viewing stock with DPS > 0", () => {
    const events: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
    ];
    // INFY pays DPS 52 -> C6 unlocked
    expect(evaluateUnlocks(events, snapshot).C6).toBe(true);
  });

  it("unlocks C7 on viewing stock with max drawdown > 20%", () => {
    // INFY max drawdown is 34.6% (> 20%) -> C7 unlocked
    const infyEvents: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
    ];
    expect(evaluateUnlocks(infyEvents, snapshot).C7).toBe(true);

    // ICICIBANK max drawdown is 5.3% (<= 20%)
    const iciciEvents: LearningEvent[] = [
      { type: "chart_viewed", ticker: "ICICIBANK", timestamp: "2026-11-10T10:00:00Z" },
    ];
    expect(evaluateUnlocks(iciciEvents, snapshot).C7).toBe(false);
  });

  it("unlocks C8 on shortlist generated with multiple sectors", () => {
    const events: LearningEvent[] = [
      {
        type: "shortlist_generated",
        timestamp: "2026-11-10T10:00:00Z",
        data: { sectorCount: 3 },
      },
    ];
    expect(evaluateUnlocks(events, snapshot).C8).toBe(true);
  });
});

describe("curriculum - mastery state machine monotonicity", () => {
  it("transitions monotonically: locked -> seen -> practised -> applied -> mastered", () => {
    const events: LearningEvent[] = [];

    // 0. Initial: locked
    expect(getConceptState("C1", events, { snapshot })).toBe("locked");

    // 1. Seen: stock viewed unlocks C1
    events.push({ type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" });
    expect(getConceptState("C1", events, { snapshot })).toBe("seen");

    // 2. Practised: 1 check item answered correctly
    events.push({
      type: "check_answered_correct",
      conceptId: "C1",
      itemId: "c1_check_1",
      timestamp: "2026-11-10T10:05:00Z",
    });
    expect(getConceptState("C1", events, { snapshot })).toBe("practised");

    // 3. Applied: mission passed on a shortlisted stock
    const shortlist = ["INFY", "TCS", "ITC"];
    events.push({
      type: "mission_passed",
      conceptId: "C1",
      ticker: "INFY",
      timestamp: "2026-11-10T10:10:00Z",
    });
    expect(getConceptState("C1", events, { snapshot, shortlistedTickers: shortlist })).toBe("applied");

    // 4. Mastered: second distinct check item answered correctly
    events.push({
      type: "check_answered_correct",
      conceptId: "C1",
      itemId: "c1_check_2",
      timestamp: "2026-11-10T10:15:00Z",
    });
    expect(getConceptState("C1", events, { snapshot, shortlistedTickers: shortlist })).toBe("mastered");
  });

  it("requires a shortlisted stock to enter applied state", () => {
    const events: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "c1_check_1", timestamp: "2026-11-10T10:05:00Z" },
      // Mission passed on WIPRO, but WIPRO is NOT on the user's shortlist
      { type: "mission_passed", conceptId: "C1", ticker: "WIPRO", timestamp: "2026-11-10T10:10:00Z" },
    ];

    const shortlist = ["INFY", "TCS"];
    // Stays practised because WIPRO is not on the shortlist
    expect(getConceptState("C1", events, { shortlistedTickers: shortlist })).toBe("practised");

    // Once passed on INFY (which is on the shortlist), becomes applied
    events.push({
      type: "mission_passed",
      conceptId: "C1",
      ticker: "INFY",
      timestamp: "2026-11-10T10:12:00Z",
    });
    expect(getConceptState("C1", events, { shortlistedTickers: shortlist })).toBe("applied");
  });

  it("advances immediately to mastered if 2 distinct checks were answered before mission passed", () => {
    const events: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "c1_check_1", timestamp: "2026-11-10T10:01:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "c1_check_2", timestamp: "2026-11-10T10:02:00Z" },
    ];
    // 2 checks answered, but mission not passed -> practised
    expect(getConceptState("C1", events, { shortlistedTickers: ["INFY"] })).toBe("practised");

    // Mission passed -> immediately promotes to mastered
    events.push({
      type: "mission_passed",
      conceptId: "C1",
      ticker: "INFY",
      timestamp: "2026-11-10T10:05:00Z",
    });
    expect(getConceptState("C1", events, { shortlistedTickers: ["INFY"] })).toBe("mastered");
  });

  it("never decrements state on subsequent failing or unrelated events (monotonicity)", () => {
    const events: LearningEvent[] = [
      { type: "stock_viewed", ticker: "INFY", timestamp: "2026-11-10T10:00:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "c1_check_1", timestamp: "2026-11-10T10:01:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "c1_check_2", timestamp: "2026-11-10T10:02:00Z" },
      { type: "mission_passed", conceptId: "C1", ticker: "INFY", timestamp: "2026-11-10T10:05:00Z" },
    ];
    expect(getConceptState("C1", events, { shortlistedTickers: ["INFY"] })).toBe("mastered");

    // Adding quiz_completed or other events does not decrement state
    events.push({ type: "quiz_completed", timestamp: "2026-11-10T10:06:00Z" });
    expect(getConceptState("C1", events, { shortlistedTickers: ["INFY"] })).toBe("mastered");
  });
});

describe("curriculum - applied mission auto-grading", () => {
  it("grades C1 numeric mission within ±1% tolerance", () => {
    // Expected: 1480
    // +0.8%: 1491.84 -> pass
    // +2.0%: 1509.6 -> fail
    const mission = getMissionForConcept("C1");
    const resultPass = gradeMission(mission, 1490, { expectedValue: 1480 });
    expect(resultPass.passed).toBe(true);

    const resultFail = gradeMission(mission, 1520, { expectedValue: 1480 });
    expect(resultFail.passed).toBe(false);
  });

  it("grades C2 categorical validation (rose / fell / cannot_tell)", () => {
    const mission = getMissionForConcept("C2");
    const resultPass = gradeMission(mission, "rose", { expectedValue: "rose" });
    expect(resultPass.passed).toBe(true);

    const resultPassCaps = gradeMission(mission, "  ROSE  ", { expectedValue: "rose" });
    expect(resultPassCaps.passed).toBe(true);

    const resultFail = gradeMission(mission, "fell", { expectedValue: "rose" });
    expect(resultFail.passed).toBe(false);
  });

  it("grades C4 D/E ratio within ±0.02 absolute tolerance", () => {
    const mission = getMissionForConcept("C4");
    // Expected: 0.30
    // 0.31 -> diff 0.01 <= 0.02 -> pass
    const passResult = gradeMission(mission, 0.31, { expectedValue: 0.30 });
    expect(passResult.passed).toBe(true);

    // 0.35 -> diff 0.05 > 0.02 -> fail
    const failResult = gradeMission(mission, 0.35, { expectedValue: 0.30 });
    expect(failResult.passed).toBe(false);
  });

  it("grades C8 diversification percentage within ±2 percentage points", () => {
    const mission = getMissionForConcept("C8");
    // Expected: 40%
    const passResult = gradeMission(mission, 41.5, { expectedValue: 40 });
    expect(passResult.passed).toBe(true);

    const failResult = gradeMission(mission, 45, { expectedValue: 40 });
    expect(failResult.passed).toBe(false);
  });
});
