import { describe, expect, it } from "vitest";
import {
  BASE_WEIGHTS,
  HORIZON_MULTIPLIERS,
  NORMALIZATION_ANCHORS,
  PRICE_LAG_DAYS,
  RISK_MULTIPLIERS,
  RISK_THRESHOLDS,
  SHORTLIST_CONFIG,
} from "@/lib/engine/config";

describe("scoring configuration", () => {
  it("base weights sum to 1.0 for every goal", () => {
    for (const [goal, weights] of Object.entries(BASE_WEIGHTS)) {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(Math.round(sum * 1000) / 1000, `goal ${goal}`).toBe(1.0);
    }
  });

  it("medium risk and 3-5y horizon multipliers are all 1.0", () => {
    expect(Object.values(RISK_MULTIPLIERS.medium).every((v) => v === 1.0)).toBe(true);
    expect(Object.values(HORIZON_MULTIPLIERS["3_5y"]).every((v) => v === 1.0)).toBe(true);
  });

  it("anchors define 0, 50, and 100 points for all factors", () => {
    expect(NORMALIZATION_ANCHORS.quality.roe).toEqual({ x0: 5, x50: 15, x100: 25 });
    expect(NORMALIZATION_ANCHORS.growth.revenueCagr).toEqual({ x0: 0, x50: 10, x100: 20 });
    expect(NORMALIZATION_ANCHORS.stability.volatility).toEqual({ x0: 45, x50: 25, x100: 15 });
  });

  it("shortlist thresholds and caps match spec §7.6", () => {
    expect(SHORTLIST_CONFIG.qualifyThreshold).toBe(50.0);
    expect(SHORTLIST_CONFIG.coverageFloor).toBe(0.80);
    expect(SHORTLIST_CONFIG.minCoverageToScore).toBe(0.60);
    expect(SHORTLIST_CONFIG.maxPerSector).toBe(2);
    expect(SHORTLIST_CONFIG.relaxedMaxPerSector).toBe(3);
    expect(SHORTLIST_CONFIG.maxPicks).toBe(5);
    expect(SHORTLIST_CONFIG.minPicksForNormalFit).toBe(3);
  });

  it("price lag is 0 in v0", () => {
    expect(PRICE_LAG_DAYS).toBe(0);
  });

  it("risk thresholds include C4 D/E and C7 drawdown", () => {
    expect(RISK_THRESHOLDS.highDebtDe).toBe(0.3);
    expect(RISK_THRESHOLDS.deepDrawdownPct).toBe(-20.0);
  });
});
