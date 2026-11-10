import { describe, expect, it } from "vitest";
import { badgeFor, freshness, daysBetween } from "@/lib/data/provenance";

const NOW = "2026-11-10T18:30:00+05:30";

describe("freshness boundaries", () => {
  it("treats the daily tail as current for four calendar days and stale at five", () => {
    expect(freshness("2026-11-06", "price", NOW)).toBe("current");
    expect(freshness("2026-11-05", "price", NOW)).toBe("stale");
    expect(freshness("2026-10-11", "price", NOW)).toBe("stale");
    expect(freshness("2026-10-10", "price", NOW)).toBe("expired");
  });

  it("treats the monthly series as current for 45 days, stale to 75 and expired beyond", () => {
    expect(freshness("2026-09-26", "monthly_price", NOW)).toBe("current");
    expect(freshness("2026-09-25", "monthly_price", NOW)).toBe("stale");
    expect(freshness("2026-08-27", "monthly_price", NOW)).toBe("stale");
    expect(freshness("2026-08-26", "monthly_price", NOW)).toBe("expired");
  });

  it("treats financials as current for 400 days, stale to 550 and expired beyond", () => {
    expect(freshness("2025-10-06", "financials", NOW)).toBe("current");
    expect(freshness("2025-10-05", "financials", NOW)).toBe("stale");
    expect(freshness("2025-05-09", "financials", NOW)).toBe("stale");
    expect(freshness("2025-05-08", "financials", NOW)).toBe("expired");
  });

  it("treats news as current for 30 days, stale to 90 and expired beyond", () => {
    expect(freshness("2026-10-11", "news", NOW)).toBe("current");
    expect(freshness("2026-10-10", "news", NOW)).toBe("stale");
    expect(freshness("2026-08-12", "news", NOW)).toBe("stale");
    expect(freshness("2026-08-11", "news", NOW)).toBe("expired");
  });

  it("treats static facts as always current", () => {
    expect(freshness("1999-01-01", "static", NOW)).toBe("current");
  });
});

describe("daysBetween", () => {
  it("counts IST calendar days, not elapsed hours", () => {
    expect(daysBetween("2026-11-09", "2026-11-10T00:01:00+05:30")).toBe(1);
    expect(daysBetween("2026-11-10", "2026-11-10T23:59:00+05:30")).toBe(0);
  });
});

describe("badgeFor", () => {
  it("always shows the date and the source label", () => {
    const badge = badgeFor("2026-11-09", "price", NOW, "Screener.in — manually transcribed 10 Nov 2026");
    expect(badge.asOf).toBe("2026-11-09");
    expect(badge.text).toBe("As of 09 Nov 2026 · Screener.in — manually transcribed 10 Nov 2026");
    expect(badge.freshness).toBe("current");
    expect(badge.detail).toBeNull();
  });

  it("adds the amber sentence when stale", () => {
    const badge = badgeFor("2026-10-11", "price", NOW, "Screener.in");
    expect(badge.freshness).toBe("stale");
    expect(badge.detail).toBe("This figure is 30 days old. Prices may have moved since.");
  });

  it("adds the class-specific red sentence when expired", () => {
    const tail = badgeFor("2026-09-01", "price", NOW, "Screener.in");
    expect(tail.detail).toBe("This session is old; the figures shown use the latest monthly close.");
    const monthly = badgeFor("2026-01-31", "monthly_price", NOW, "Screener.in");
    expect(monthly.detail).toBe("This figure is too old to use for fit. It is shown for learning only.");
    const financials = badgeFor("2024-01-31", "financials", NOW, "Annual report");
    expect(financials.detail).toBe("This figure is too old to use for fit. It is shown for learning only.");
  });
});
