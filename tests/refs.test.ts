import { describe, expect, it } from "vitest";
import {
  createConfigRef,
  createDataRef,
  createDerivedRef,
  createProfileRef,
  formatRefValue,
} from "@/lib/engine/refs";

describe("reference builders", () => {
  it("builds a data ref with source and asOf", () => {
    const ref = createDataRef("ITC:close", 1480.0, "price", "2026-11-09", "manual:screener.in:2026-11-10");
    expect(ref.kind).toBe("data");
    expect(ref.value).toBe(1480.0);
    expect(ref.asOf).toBe("2026-11-09");
    expect(formatRefValue(ref)).toBe("1,480.00");
  });

  it("builds a derived ref with formula and inputs", () => {
    const ref = createDerivedRef("ITC:pe", 25.34, "ratio", "price / eps", ["ITC:close", "ITC:eps"]);
    expect(ref.kind).toBe("derived");
    expect(ref.formulaId).toBe("price / eps");
    expect(ref.inputRefIds).toHaveLength(2);
    expect(formatRefValue(ref)).toBe("25.34");
  });

  it("builds config and profile refs", () => {
    const cfg = createConfigRef("config:threshold", 50.0, "score");
    const prof = createProfileRef("profile:horizon", "5_10y", "5 to 10 years");
    expect(cfg.kind).toBe("config");
    expect(prof.kind).toBe("profile");
    expect(prof.displayValue).toBe("5 to 10 years");
  });
});
