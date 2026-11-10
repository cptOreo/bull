# Batch 9 Implementation Report: Curriculum Bank, Missions & XP Gamification

**Date:** 2026-11-10  
**Tasks Completed:** Tasks 34, 35, 36 (Curriculum, XP Gamification, Combined Suite)  
**Branch:** `subagent-Batch-9-Implementer-self-1e2e6115`  

---

## 1. Commits

1. **`45b7905`**: `feat(engine): add 8-concept curriculum bank, mastery state machine and missions`
   - Added `lib/engine/curriculum.ts` and `tests/curriculum.test.ts`.
   - Updated `lib/engine/types.ts` with additive types (`ConceptState`, `comparison_viewed` event).
2. **`6e69d57`**: `feat(engine): implement closed XP calculation, levels and badge rules`
   - Added `lib/engine/xp.ts` and `tests/xp.test.ts`.
   - Exported `MASTERY_RANK` in `lib/engine/curriculum.ts`.

---

## 2. Scope & Implementation Details

### Task 34: `lib/engine/curriculum.ts` & `tests/curriculum.test.ts`
- **8 Fixed Concepts (C1–C8):**
  - **C1 (A share is part ownership):** Unlocks on first `stock_viewed`.
  - **C2 (Price, market cap and what moves a price):** Unlocks on first `chart_viewed`.
  - **C3 (P/E and why the sector matters):** Unlocks on first `shortlist_generated`.
  - **C4 (Debt: debt-to-equity and interest cover):** Unlocks on viewing a stock with D/E >= 0.3 or bank/financial.
  - **C5 (Margins, ROE and ROCE):** Unlocks on opening any stock page (`stock_viewed`) or viewing comparison (`comparison_viewed`).
  - **C6 (Dividends and payout):** Unlocks on viewing a stock with DPS > 0.
  - **C7 (Reading a five-year chart, including drawdown and corporate actions):** Unlocks on viewing stock with drawdown > 20%.
  - **C8 (Diversification and concentration):** Unlocks on `shortlist_generated` with at least three sectors (>= 3).
- **Mastery State Machine:**
  - Transitions: `locked` → `seen` → `practised` → `applied` → `mastered`.
  - Monotonicity enforced: state never decrements under any event sequence.
  - `applied` strictly requires mission passed on a shortlisted stock.
  - `mastered` requires applied + 2 distinct check items passed. Immediate promotion if 2 distinct check items were completed prior to passing the mission.
- **Check Bank (`CONCEPT_CHECKS`):**
  - Exactly 32 items (4 items per concept for C1 through C8).
  - Each item contains 3 options (`[string, string, string]`), a single `correctIndex` (0, 1, or 2), and an explanatory feedback string without forward-looking investment advice.
- **Applied Missions & Auto-Grading (`MISSIONS`, `gradeMission`):**
  - 8 auto-graded missions.
  - Numeric grading with stated tolerances:
    - C1: ±1% tolerance (`tolerancePct: 1.0`).
    - C3: ±0.1 tolerance (`toleranceAbsolute: 0.1`).
    - C4: ±0.02 tolerance (`toleranceAbsolute: 0.02`).
    - C5: ±0.5 percentage points (`toleranceAbsolute: 0.5`).
    - C6: ±0.1 percentage points (`toleranceAbsolute: 0.1`).
    - C7: ±3.0 percentage points (`toleranceAbsolute: 3.0`).
    - C8: ±2.0 percentage points (`toleranceAbsolute: 2.0`).
  - Categorical validation for C2: "rose" / "fell" / "cannot_tell" with case-insensitive and whitespace tolerance.

### Task 35: `lib/engine/xp.ts` & `tests/xp.test.ts`
- **Closed XP Whitelist (`XP_SOURCES`):**
  - `lesson_completed`: 20 XP
  - `check_answered_correct`: 10 XP
  - `mission_passed`: 30 XP
  - `quiz_passed`: 15 XP
  - All other event types (`stock_viewed`, `chart_viewed`, `shortlist_generated`, `risk_named`, etc.): strictly 0 XP.
- **XP Deduplication & Bounds:**
  - Deduplicated per concept for lesson, check, and mission: maximum from all 8 lessons, checks, and missions is exactly 8 × (20 + 10 + 30) = 480 XP.
  - Daily quiz is deduplicated per IST calendar day (15 XP per day).
  - Monotonic accumulation: XP sum never decreases.
- **Levels (`calculateLevel`, §8.7):**
  - Level 0: "Curious" (0 XP, nextThreshold: 50, "Just starting")
  - Level 1: "Observer" (50 XP, nextThreshold: 120, "Can read a stock page")
  - Level 2: "Reader" (120 XP, nextThreshold: 220, "Can explain a ratio")
  - Level 3: "Analyst" (220 XP, nextThreshold: 350, "Can compare two companies on the numbers")
  - Level 4: "Risk Spotter" (350 XP, nextThreshold: null, "Can name what could go wrong")
- **Badges (`evaluateBadges`, §8.8):**
  - Exactly 6 badges strictly conforming to §8.8:
    1. `risk_namer`: "Risk Namer" — Pass the "Name the risk" check on 3 distinct stocks.
    2. `ratio_reader`: "Ratio Reader" — At least one correct check for each of C3, C4 and C5.
    3. `diversifier`: "Diversifier" — Pass the C8 applied mission.
    4. `patient_capital`: "Patient Capital" — Pass the C7 mission and view five-year charts for 3 distinct stocks.
    5. `no_fomo`: "No-FOMO" — Answer the fixed "double your money" item in C8 correctly (`c8_check_3`).
    6. `hinglish_pro`: "Hinglish Pro" — Answer three concept checks correctly while the locale is `hi-en`.
- **IST Streak Calculation (`calculateStreak`, `toISTDate`):**
  - Computed in `Asia/Kolkata` (UTC+05:30) with exact calendar boundaries (e.g. 23:59 vs 00:01).
  - Rewards any concept check activity on an IST day.
  - Preserves previous day streak if today's check is pending ("Answer one check today to keep it"), and resets to 0 if 2+ days have elapsed without activity.

### Task 36: Combined Engine Purity & Verification
- **Invariant 1 Verified:** Zero imports of `react`, `next/`, `node:fs`, `node:fetch`, `process.env`, or `lib/llm` in any `lib/engine` module.

---

## 3. Verification Results

| Command | Status | Details |
|---|---|---|
| `npx vitest run tests/curriculum.test.ts tests/xp.test.ts` | **PASS** | 2 test files, 30 tests passed (0 failures) |
| `npm test` | **PASS** | 13 test files, 198 tests passed (0 failures) |
| `npm run typecheck` | **PASS** | `tsc --noEmit` exited 0 (clean) |
| `npm run lint` | **PASS** | `eslint .` exited 0 (0 warnings, 0 errors) |
