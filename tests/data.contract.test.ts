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

const GOLDEN_TICKERS = ["INFY", "HDFCBANK", "ITC", "TCS", "TATAMOTORS"];

describe("§10.9 seed coverage", () => {
  it("covers 12 stocks across at least 8 sectors with no sector above 2", () => {
    expect(snapshot.stocks).toHaveLength(12);
    const sectors = new Map<string, number>();
    for (const stock of snapshot.stocks) {
      sectors.set(stock.sectorId, (sectors.get(stock.sectorId) ?? 0) + 1);
    }
    expect(sectors.size).toBeGreaterThanOrEqual(8);
    for (const [id, count] of sectors) {
      expect(count, `sector ${id}`).toBeLessThanOrEqual(2);
    }
  });

  it("covers every golden-set company", () => {
    const tickers = snapshot.stocks.map((s) => s.ticker);
    for (const ticker of GOLDEN_TICKERS) {
      expect(tickers, `missing ${ticker}`).toContain(ticker);
    }
  });

  it("has five contiguous financial years per stock", () => {
    for (const stock of snapshot.stocks) {
      const years = stock.financials.annual.value ?? [];
      expect(years, stock.ticker).toHaveLength(5);
      expect(years.map((y) => y.fy)).toEqual(["FY2022", "FY2023", "FY2024", "FY2025", "FY2026"]);
    }
  });

  it("has 60 monthly closes and a 10-day tail per stock", () => {
    for (const stock of snapshot.stocks) {
      expect(stock.prices.value?.points.length, stock.ticker).toBe(60);
      expect(stock.recentPrices.value?.points.length, stock.ticker).toBe(10);
      expect(stock.recentPrices.asOf, stock.ticker).toBe("2026-11-09");
    }
    expect(snapshot.index.prices.value?.points.length).toBe(60);
  });

  it("has at least 2 recent news items per stock and 24 overall", () => {
    expect(snapshot.news.length).toBeGreaterThanOrEqual(24);
    for (const stock of snapshot.stocks) {
      const mine = snapshot.news.filter((n) => n.ticker === stock.ticker);
      expect(mine.length, stock.ticker).toBeGreaterThanOrEqual(2);
      for (const item of mine) {
        expect(Date.parse(item.publishedAt)).toBeGreaterThanOrEqual(Date.parse("2026-08-12T00:00:00+05:30"));
        expect(item.summary.length).toBeGreaterThanOrEqual(20);
        expect(item.summary.length).toBeLessThanOrEqual(280);
      }
    }
  });

  it("includes the two required corporate actions", () => {
    const actions = snapshot.stocks.flatMap((s) => s.corporateActions);
    const merger = actions.find((a) => a.type === "merger" && a.effectiveDate === "2023-07-01");
    const demerger = actions.find((a) => a.type === "demerger" && a.effectiveDate === "2025-10-01");
    expect(merger, "HDFC Bank merger").toBeDefined();
    expect(demerger, "Tata Motors demerger").toBeDefined();
    expect(demerger?.listingDate).toBe("2025-11-12");
  });

  it("has 1 to 5 sourced exclusions", () => {
    expect(snapshot.exclusions.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.exclusions.length).toBeLessThanOrEqual(5);
    for (const exclusion of snapshot.exclusions) {
      expect(exclusion.reason.length).toBeGreaterThan(10);
      expect(exclusion.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("can unlock C4, C6 and C7 from the seed", () => {
    const hasDebtOrBank = snapshot.stocks.some((stock) => {
      if (stock.sectorModel === "financial") return true;
      const year = stock.financials.annual.value?.[4];
      if (!year || year.netWorthCr <= 0) return false;
      return year.totalDebtCr / year.netWorthCr >= 0.3;
    });
    const hasDividend = snapshot.stocks.some((stock) => (stock.financials.annual.value?.[4]?.dpsInr ?? 0) > 0);
    const hasDeepFall = snapshot.stocks.some((stock) => {
      const points = stock.prices.value?.points ?? [];
      let peak = points[0]?.close ?? 0;
      let worst = 0;
      for (const point of points) {
        if (point.close > peak) peak = point.close;
        if (peak > 0) worst = Math.min(worst, point.close / peak - 1);
      }
      return worst < -0.2;
    });
    expect({ hasDebtOrBank, hasDividend, hasDeepFall }).toEqual({
      hasDebtOrBank: true,
      hasDividend: true,
      hasDeepFall: true,
    });
  });
});

describe("provenance", () => {
  it("labels every manual source with the phrase and the date", () => {
    for (const source of snapshot.sources) {
      if (source.method !== "manual_transcription") continue;
      expect(source.label.toLowerCase()).toContain("manually transcribed");
      expect(source.label).toContain("2026");
    }
  });

  it("states the exact provenance note", () => {
    expect(snapshot.note).toBe(
      "Course prototype seed. All values manually transcribed on 2026-11-10 from Screener.in and Google Finance. Not produced by an API. Verify before any use outside this demo.",
    );
  });

  it("dates every source with an offset", () => {
    for (const source of snapshot.sources) {
      expect(source.retrievedAt).toMatch(/(?:Z|[+-]\d{2}:\d{2})$/);
    }
  });
});

