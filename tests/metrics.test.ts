import { describe, expect, it } from "vitest";
import { deriveMetrics } from "@/lib/engine/metrics";
import type { IndexSeries, Sector, Stock } from "@/lib/data/schema";

const mockSector: Sector = {
  id: "it",
  name: "Information Technology",
  description: { value: "Tech services.", asOf: "2026-11-10", source: "s1" },
  medianPe: { value: 25.0, asOf: "2026-11-10", source: "s1" },
  medianPb: { value: 6.0, asOf: "2026-11-10", source: "s1" },
};

const monthlyDates = Array.from({ length: 60 }, (_, i) => {
  const year = 2021 + Math.floor((10 + i) / 12);
  const month = ((10 + i) % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-28`;
});

const mockIndex: IndexSeries = {
  id: "NIFTY50",
  name: "Nifty 50",
  prices: {
    value: {
      granularity: "monthly_close",
      points: Array.from({ length: 60 }, (_, i) => ({
        date: monthlyDates[i],
        close: 15000 + i * 100,
      })),
    },
    asOf: "2026-10-31",
    source: "s1",
  },
};

const mockStock: Stock = {
  ticker: "TEST",
  name: "Test Corp",
  isin: "INE000A01000",
  sectorId: "it",
  sectorModel: "non_financial",
  nifty50Member: { value: true, asOf: "2026-11-10", source: "s1" },
  businessSummary: { value: "Software test.", asOf: "2026-11-10", source: "s1" },
  segments: { value: ["Software", "Consulting"], asOf: "2026-11-10", source: "s1" },
  prices: {
    value: {
      currency: "INR",
      granularity: "monthly_close",
      points: Array.from({ length: 60 }, (_, i) => ({
        date: monthlyDates[i],
        close: 1000 + (i === 30 ? 500 : i * 10),
      })),
    },
    asOf: "2026-10-31",
    source: "s1",
  },
  recentPrices: {
    value: {
      currency: "INR",
      granularity: "daily_close",
      points: [
        { date: "2026-11-06", close: 1580 },
        { date: "2026-11-09", close: 1600 },
      ],
    },
    asOf: "2026-11-09",
    source: "s1",
  },
  financials: {
    currency: "INR",
    units: "crore",
    basis: "consolidated",
    annual: {
      value: [
        {
          fy: "FY2022",
          periodEnd: "2022-03-31",
          sourceId: "s1",
          revenueCr: 10000,
          ebitdaCr: 2500,
          ebitCr: 2000,
          patCr: 1500,
          epsInr: 15,
          dpsInr: 5,
          netWorthCr: 5000,
          totalDebtCr: 500,
          interestExpenseCr: 100,
          operatingCashFlowCr: 1800,
          sharesOutstandingCr: 100,
        },
        {
          fy: "FY2023",
          periodEnd: "2023-03-31",
          sourceId: "s1",
          revenueCr: 12000,
          ebitdaCr: 3000,
          ebitCr: 2400,
          patCr: 1800,
          epsInr: 18,
          dpsInr: 6,
          netWorthCr: 6000,
          totalDebtCr: 400,
          interestExpenseCr: 100,
          operatingCashFlowCr: 2100,
          sharesOutstandingCr: 100,
        },
        {
          fy: "FY2024",
          periodEnd: "2024-03-31",
          sourceId: "s1",
          revenueCr: 14000,
          ebitdaCr: 3500,
          ebitCr: 2800,
          patCr: 2100,
          epsInr: 21,
          dpsInr: 7,
          netWorthCr: 7200,
          totalDebtCr: 300,
          interestExpenseCr: 100,
          operatingCashFlowCr: 2500,
          sharesOutstandingCr: 100,
        },
        {
          fy: "FY2025",
          periodEnd: "2025-03-31",
          sourceId: "s1",
          revenueCr: 17000,
          ebitdaCr: 4200,
          ebitCr: 3400,
          patCr: 2600,
          epsInr: 26,
          dpsInr: 8,
          netWorthCr: 8800,
          totalDebtCr: 200,
          interestExpenseCr: 100,
          operatingCashFlowCr: 3000,
          sharesOutstandingCr: 100,
        },
        {
          fy: "FY2026",
          periodEnd: "2026-03-31",
          sourceId: "s1",
          revenueCr: 20000,
          ebitdaCr: 5000,
          ebitCr: 4000,
          patCr: 3000,
          epsInr: 30,
          dpsInr: 10,
          netWorthCr: 10500,
          totalDebtCr: 100,
          interestExpenseCr: 100,
          operatingCashFlowCr: 3500,
          sharesOutstandingCr: 100,
        },
      ],
      asOf: "2026-03-31",
      source: "s1",
    },
  },
  corporateActions: [],
};

describe("deriveMetrics", () => {
  it("derives accurate ratios and CAGR from 5 annual points", () => {
    const metrics = deriveMetrics(mockStock, mockSector, mockIndex, "2026-11-10T18:30:00+05:30");
    expect(metrics.values.latestClose).toBe(1600);
    expect(metrics.values.oneSessionMovePct).toBe(1.3); // (1600 - 1580)/1580
    expect(metrics.values.pe).toBe(53.33); // 1600 / 30
    expect(metrics.values.pb).toBe(15.24); // (1600 * 100) / 10500
    expect(metrics.values.dividendYieldPct).toBe(0.63); // (10 / 1600) * 100
    expect(metrics.values.roePct).toBe(28.6); // (3000 / 10500) * 100
    expect(metrics.values.rocePct).toBe(37.7); // (4000 / (10500 + 100)) * 100
    expect(metrics.values.operatingMarginPct).toBe(25.0); // (5000 / 20000) * 100
    expect(metrics.values.debtToEquity).toBe(0.01); // 100 / 10500
    expect(metrics.values.interestCoverTimes).toBe(40.0); // 4000 / 100
    expect(metrics.values.revenueCagrPct).toBe(18.9); // (20000/10000)^(1/4) - 1
    expect(metrics.values.patCagrPct).toBe(18.9); // (3000/1500)^(1/4) - 1
    expect(metrics.values.yearsWithDividend).toBe(5);
    expect(metrics.values.peSectorRatio).toBe(2.13); // 53.33 / 25.0
    expect(metrics.values.pbSectorRatio).toBe(2.54); // 15.24 / 6.0
    expect(metrics.values.fiveYearReturnPct).toBe(59.0); // (1590 - 1000) / 1000
    expect(metrics.values.indexReturnPct).toBe(39.3); // (20900 - 15000) / 15000
    expect(metrics.values.maxDrawdownPct).toBe(-12.7);
    expect(metrics.values.volatilityPct).toBeGreaterThan(0);
    expect(metrics.values.pePercentile).toBeGreaterThanOrEqual(0);
    expect(metrics.values.pePercentile).toBeLessThanOrEqual(100);
    expect(metrics.values.pbPercentile).toBeGreaterThanOrEqual(0);
    expect(metrics.values.pbPercentile).toBeLessThanOrEqual(100);
    expect(metrics.isTailExpired).toBe(false);
    expect(metrics.isMonthlyExpired).toBe(false);
  });

  it("handles bank sector by omitting interestCover, debtToEquity and roce", () => {
    const bankStock: Stock = { ...mockStock, sectorModel: "financial" };
    const metrics = deriveMetrics(bankStock, mockSector, mockIndex, "2026-11-10T18:30:00+05:30");
    expect(metrics.values.interestCoverTimes).toBeNull();
    expect(metrics.values.debtToEquity).toBeNull();
    expect(metrics.values.rocePct).toBeNull();
  });

  it("falls back to monthly close when daily tail is expired past 30 days", () => {
    // 40 days past recentPrices.asOf (2026-11-09 -> 2026-12-19)
    const metrics = deriveMetrics(mockStock, mockSector, mockIndex, "2026-12-20T18:30:00+05:30");
    expect(metrics.isTailExpired).toBe(true);
    // Last point of monthly prices is close = 1000 + 59 * 10 = 1590
    expect(metrics.values.latestClose).toBe(1590);
    expect(metrics.values.pe).toBe(53.0); // 1590 / 30
  });

  it("detects monthly series expiry when past 75 days", () => {
    // 80 days past prices.asOf (2026-10-31 -> 2027-01-20)
    const metrics = deriveMetrics(mockStock, mockSector, mockIndex, "2027-01-20T18:30:00+05:30");
    expect(metrics.isMonthlyExpired).toBe(true);
  });

  it("indexes chart points to 100 at window start and handles corporate actions split", () => {
    const stockWithCa: Stock = {
      ...mockStock,
      corporateActions: [
        {
          id: "ca-1",
          type: "split",
          effectiveDate: "2023-01-01",
          listingDate: "2023-01-02",
          description: "Sub-division 1:2",
          successorTickers: ["TEST"],
          sourceId: "s1",
        },
      ],
    };
    const metrics = deriveMetrics(stockWithCa, mockSector, mockIndex, "2026-11-10T18:30:00+05:30");
    expect(metrics.chartSegments.length).toBeGreaterThanOrEqual(2);
    expect(metrics.chartSegments[0].points[0].stockIndexed).toBe(100);
    expect(metrics.chartSegments[0].points[0].indexIndexed).toBe(100);
    expect(metrics.chartSegments[1].corporateActionLabel).toBe("Sub-division 1:2");
  });

  it("generates Ref dictionary for all primary and derived values", () => {
    const metrics = deriveMetrics(mockStock, mockSector, mockIndex, "2026-11-10T18:30:00+05:30");
    expect(metrics.refs["TEST:close"]).toBeDefined();
    expect(metrics.refs["TEST:close"].kind).toBe("data");
    expect(metrics.refs["TEST:close"].value).toBe(1600);

    expect(metrics.refs["TEST:pe"]).toBeDefined();
    expect(metrics.refs["TEST:pe"].kind).toBe("derived");
    expect(metrics.refs["TEST:pe"].value).toBe(53.33);

    expect(metrics.refs["TEST:revenueCagr"]).toBeDefined();
    expect(metrics.refs["TEST:revenueCagr"].kind).toBe("derived");
    expect(metrics.refs["TEST:revenueCagr"].value).toBe(18.9);
  });

  it("returns null for patCagrPct if base PAT or end PAT is <= 0", () => {
    const lossStock: Stock = {
      ...mockStock,
      financials: {
        ...mockStock.financials,
        annual: {
          ...mockStock.financials.annual,
          value: mockStock.financials.annual.value!.map((y, idx) =>
            idx === 0 ? { ...y, patCr: -100 } : y,
          ),
        },
      },
    };
    const metrics = deriveMetrics(lossStock, mockSector, mockIndex, "2026-11-10T18:30:00+05:30");
    expect(metrics.values.patCagrPct).toBeNull();
  });
});
