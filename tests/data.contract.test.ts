import { describe, expect, it } from "vitest";
import { deepFreeze, snapshot, snapshotId } from "@/lib/data/snapshot";

describe("snapshot loader", () => {
  it("exposes a snapshot id matching the file", () => {
    expect(snapshotId).toBe("2026-11-10.1");
    expect(snapshot.snapshotId).toBe(snapshotId);
  });

  it("is deep-frozen at every level", () => {
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.stocks)).toBe(true);
    expect(Object.isFrozen(snapshot.stocks[0])).toBe(true);
    expect(Object.isFrozen(snapshot.stocks[0].financials.annual.value)).toBe(true);
    expect(Object.isFrozen(snapshot.stocks[0].prices.value?.points[0])).toBe(true);
  });

  it("throws when a nested value is written in strict mode", () => {
    expect(() => {
      "use strict";
      (snapshot.stocks[0] as { ticker: string }).ticker = "XXXX";
    }).toThrow();
  });

  it("deepFreeze freezes a fresh object graph", () => {
    const value = { a: { b: [1, 2, { c: 3 }] } };
    deepFreeze(value);
    expect(Object.isFrozen(value.a)).toBe(true);
    expect(Object.isFrozen(value.a.b[2])).toBe(true);
  });
});
