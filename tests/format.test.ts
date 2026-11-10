import { describe, expect, it } from "vitest";
import {
  formatCrore,
  formatDate,
  formatDateLong,
  formatPercent,
  formatPrice,
  formatRatio,
  formatSignedPercent,
  formatTimes,
  indianGroup,
  istDate,
} from "@/lib/engine/format";
import { canonicalJson, fnv1a, shortHash } from "@/lib/engine/hash";

describe("indian grouping", () => {
  it("groups thousands the Indian way", () => {
    expect(indianGroup(123456)).toBe("1,23,456");
    expect(indianGroup(12345678)).toBe("1,23,45,678");
    expect(indianGroup(999)).toBe("999");
    expect(indianGroup(-1234567)).toBe("-12,34,567");
  });

  it("keeps decimals on prices", () => {
    expect(formatPrice(1480)).toBe("1,480.00");
    expect(formatPrice(98.5)).toBe("98.50");
  });
});

describe("display rounding", () => {
  it("uses one decimal for percentages and two for ratios", () => {
    expect(formatPercent(16.24)).toBe("16.2%");
    expect(formatPercent(26.75)).toBe("26.8%");
    expect(formatRatio(0.3)).toBe("0.30");
    expect(formatTimes(7.24)).toBe("7.2x");
    expect(formatSignedPercent(-1.04)).toBe("-1.0%");
    expect(formatSignedPercent(1.04)).toBe("+1.0%");
  });

  it("groups crore values with no decimals", () => {
    expect(formatCrore(610000)).toBe("6,10,000");
  });
});

describe("dates", () => {
  it("formats the snapshot's short and long forms", () => {
    expect(formatDate("2026-11-09")).toBe("09 Nov 2026");
    expect(formatDateLong("2026-10-31")).toBe("31 October 2026");
  });

  it("derives the IST calendar date regardless of the input offset", () => {
    expect(istDate("2026-11-10T18:30:00+05:30")).toBe("2026-11-10");
    expect(istDate("2026-11-10T23:59:00+05:30")).toBe("2026-11-10");
    expect(istDate("2026-11-11T00:01:00+05:30")).toBe("2026-11-11");
    expect(istDate("2026-11-10T20:00:00Z")).toBe("2026-11-11");
  });
});

describe("FNV-1a hash", () => {
  it("is stable and key-order independent", () => {
    expect(fnv1a("abc")).toBe(fnv1a("abc"));
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(shortHash({ a: 1, b: 2 })).toHaveLength(8);
    expect(shortHash({ a: 1 })).not.toBe(shortHash({ a: 2 }));
  });

  it("hashes nested structures deterministically", () => {
    const one = { p: { goal: "dividends", horizon: "5_10y" }, n: [1, 2, 3] };
    const two = { n: [1, 2, 3], p: { horizon: "5_10y", goal: "dividends" } };
    expect(shortHash(one)).toBe(shortHash(two));
  });
});
