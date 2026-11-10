import { describe, expect, it } from "vitest";
import {
  corporateActionSchema,
  exclusionSchema,
  financialsSchema,
  financialYearSchema,
  indexSeriesSchema,
  newsItemSchema,
  priceSeriesSchema,
  sectorSchema,
  snapshotSchema,
  sourceSchema,
  stockSchema,
} from "@/lib/data/schema";

const monthly = {
  currency: "INR" as const,
  granularity: "monthly_close" as const,
  points: [
    { date: "2026-09-30", close: 1410.5 },
    { date: "2026-10-31", close: 1480 },
  ],
};

describe("price series", () => {
  it("accepts a monthly close series", () => {
    expect(priceSeriesSchema.safeParse(monthly).success).toBe(true);
  });

  it("rejects an unknown key because every object is strict", () => {
    const bad = { ...monthly, extra: 1 };
    expect(priceSeriesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a non-positive close", () => {
    const bad = { ...monthly, points: [{ date: "2026-10-31", close: 0 }] };
    expect(priceSeriesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a non-ISO date", () => {
    const bad = { ...monthly, points: [{ date: "31/10/2026", close: 1480 }] };
    expect(priceSeriesSchema.safeParse(bad).success).toBe(false);
  });
});

describe("source", () => {
  const source = {
    id: "manual:screener.in:2026-11-10",
    label: "Screener.in — manually transcribed 10 Nov 2026",
    publisher: "Screener.in",
    url: "https://www.screener.in/company/ITC/consolidated/",
    retrievedAt: "2026-11-10T18:30:00+05:30",
    method: "manual_transcription" as const,
    licence: "personal_research" as const,
    note: null,
  };

  it("accepts a manual transcription source", () => {
    expect(sourceSchema.safeParse(source).success).toBe(true);
  });

  it("accepts an api method with a null url", () => {
    expect(sourceSchema.safeParse({ ...source, method: "api", url: null }).success).toBe(true);
  });

  it("rejects an unknown licence", () => {
    expect(sourceSchema.safeParse({ ...source, licence: "open" }).success).toBe(false);
  });
});

describe("sector and index", () => {
  it("accepts a dated sector median", () => {
    const sector = {
      id: "it",
      name: "Information Technology",
      description: { value: "Software and IT services.", asOf: "2026-11-10", source: "manual:screener.in:2026-11-10" },
      medianPe: { value: 24.8, asOf: "2026-11-10", source: "manual:google-finance:2026-11-10" },
      medianPb: { value: 6.1, asOf: "2026-11-10", source: "manual:google-finance:2026-11-10" },
    };
    expect(sectorSchema.safeParse(sector).success).toBe(true);
  });

  it("accepts a null median only when a note explains it", () => {
    const sector = {
      id: "it",
      name: "Information Technology",
      description: { value: "Software.", asOf: "2026-11-10", source: "manual:screener.in:2026-11-10" },
      medianPe: { value: null, asOf: "2026-11-10", source: "manual:google-finance:2026-11-10", note: "Sector median unavailable." },
      medianPb: { value: 6.1, asOf: "2026-11-10", source: "manual:google-finance:2026-11-10" },
    };
    expect(sectorSchema.safeParse(sector).success).toBe(true);
  });

  it("accepts a dated index series", () => {
    const index = {
      id: "NIFTY50",
      name: "Nifty 50",
      prices: {
        value: {
          granularity: "monthly_close",
          points: Array.from({ length: 12 }, (_, i) => ({
            date: `2026-${String(i + 1).padStart(2, "0")}-28`,
            close: 22000 + i,
          })),
        },
        asOf: "2026-12-28",
        source: "manual:google-finance:2026-11-10",
      },
    };
    expect(indexSeriesSchema.safeParse(index).success).toBe(true);
  });
});

describe("news", () => {
  const item = {
    id: "news-itc-1",
    ticker: "ITC",
    headline: "ITC reports September quarter results",
    summary: "ITC reported revenue growth in its September quarter filing to the exchanges.",
    publishedAt: "2026-11-05T17:45:00+05:30",
    sourceName: "Exchange filing",
    sourceUrl: "https://www.nseindia.com/",
    kind: "announcement" as const,
    sourceId: "manual:nse-announcement:2026-11-10",
  };

  it("accepts a well-formed news item", () => {
    expect(newsItemSchema.safeParse(item).success).toBe(true);
  });

  it("rejects a summary shorter than 20 characters", () => {
    expect(newsItemSchema.safeParse({ ...item, summary: "Too short." }).success).toBe(false);
  });

  it("rejects a summary longer than 280 characters", () => {
    expect(newsItemSchema.safeParse({ ...item, summary: "x".repeat(281) }).success).toBe(false);
  });

  it("rejects an http source URL", () => {
    expect(newsItemSchema.safeParse({ ...item, sourceUrl: "http://example.com" }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(newsItemSchema.safeParse({ ...item, kind: "opinion" }).success).toBe(false);
  });
});

describe("exclusion and corporate action", () => {
  it("accepts a dated exclusion", () => {
    const exclusion = {
      id: "rolta",
      name: "Rolta India",
      aliases: ["Rolta"],
      reason: "Rolta India was delisted from NSE and BSE in January 2026.",
      asOf: "2026-01-19",
      sourceId: "manual:nse-announcement:2026-11-10",
    };
    expect(exclusionSchema.safeParse(exclusion).success).toBe(true);
  });

  it("accepts the HDFC Bank merger", () => {
    const action = {
      id: "ca-hdfcbank-merger",
      type: "merger" as const,
      effectiveDate: "2023-07-01",
      listingDate: null,
      description: "HDFC Ltd merged into HDFC Bank with effect from 1 July 2023.",
      successorTickers: [],
      sourceId: "manual:nse-announcement:2026-11-10",
    };
    expect(corporateActionSchema.safeParse(action).success).toBe(true);
  });

  it("requires a listing date field for a demerger, which may be null", () => {
    const action = {
      id: "ca-tatamotors-demerger",
      type: "demerger" as const,
      effectiveDate: "2025-10-01",
      listingDate: "2025-11-12",
      description: "The commercial vehicle business was demerged and listed separately.",
      successorTickers: ["TATAMOTORS"],
      sourceId: "manual:nse-announcement:2026-11-10",
    };
    expect(corporateActionSchema.safeParse(action).success).toBe(true);
    expect(corporateActionSchema.safeParse({ ...action, listingDate: "12 Nov 2025" }).success).toBe(false);
  });
});

describe("financials", () => {
  const year = {
    fy: "FY2026",
    periodEnd: "2026-03-31",
    sourceId: "manual:annual-report:2026-11-10",
    revenueCr: 72000,
    ebitdaCr: 26000,
    ebitCr: 25400,
    patCr: 20500,
    epsInr: 16.4,
    dpsInr: 13.75,
    netWorthCr: 48000,
    totalDebtCr: 1200,
    interestExpenseCr: 120,
    operatingCashFlowCr: 19000,
    sharesOutstandingCr: 1250,
  };

  it("accepts a financial year", () => {
    expect(financialYearSchema.safeParse(year).success).toBe(true);
  });

  it("rejects a negative share count", () => {
    expect(financialYearSchema.safeParse({ ...year, sharesOutstandingCr: -1 }).success).toBe(false);
  });

  it("rejects a zero revenue", () => {
    expect(financialYearSchema.safeParse({ ...year, revenueCr: 0 }).success).toBe(false);
  });

  it("accepts a financials block", () => {
    const block = {
      currency: "INR",
      units: "crore",
      basis: "consolidated",
      annual: {
        value: [year],
        asOf: "2026-03-31",
        source: "manual:annual-report:2026-11-10",
      },
    };
    expect(financialsSchema.safeParse(block).success).toBe(true);
  });
});

const stockFixture = {
  ticker: "ITC",
  name: "ITC Limited",
  isin: "INE154A01025",
  sectorId: "fmcg",
  sectorModel: "non_financial" as const,
  nifty50Member: { value: true, asOf: "2026-11-10", source: "manual:nse-announcement:2026-11-10" },
  businessSummary: {
    value: "Cigarettes, packaged foods, hotels and paperboards.",
    asOf: "2026-03-31",
    source: "manual:annual-report:2026-11-10",
  },
  segments: {
    value: ["Cigarettes", "Foods", "Hotels", "Paperboards"],
    asOf: "2026-03-31",
    source: "manual:annual-report:2026-11-10",
  },
  prices: {
    value: {
      currency: "INR" as const,
      granularity: "monthly_close" as const,
      points: Array.from({ length: 12 }, (_, i) => ({
        date: `2026-${String(i + 1).padStart(2, "0")}-28`,
        close: 1400 + i * 5,
      })),
    },
    asOf: "2026-12-28",
    source: "manual:google-finance:2026-11-10",
  },
  recentPrices: {
    value: {
      currency: "INR" as const,
      granularity: "daily_close" as const,
      points: Array.from({ length: 10 }, (_, i) => ({
        date: `2026-12-${String(i + 10).padStart(2, "0")}`,
        close: 1480 + i,
      })),
    },
    asOf: "2026-12-19",
    source: "manual:google-finance:2026-11-10",
  },
  financials: {
    currency: "INR" as const,
    units: "crore" as const,
    basis: "consolidated" as const,
    annual: {
      value: [
        {
          fy: "FY2026",
          periodEnd: "2026-03-31",
          sourceId: "manual:annual-report:2026-11-10",
          revenueCr: 72000,
          ebitdaCr: 26000,
          ebitCr: 25400,
          patCr: 20500,
          epsInr: 16.4,
          dpsInr: 13.75,
          netWorthCr: 48000,
          totalDebtCr: 1200,
          interestExpenseCr: 120,
          operatingCashFlowCr: 19000,
          sharesOutstandingCr: 1250,
        },
      ],
      asOf: "2026-03-31",
      source: "manual:annual-report:2026-11-10",
    },
  },
  corporateActions: [],
};

describe("stock", () => {
  it("accepts a stock", () => {
    expect(stockSchema.safeParse(stockFixture).success).toBe(true);
  });

  it("rejects a lowercase ticker", () => {
    expect(stockSchema.safeParse({ ...stockFixture, ticker: "itc" }).success).toBe(false);
  });

  it("rejects a malformed ISIN", () => {
    expect(stockSchema.safeParse({ ...stockFixture, isin: "INE154A" }).success).toBe(false);
  });

  it("rejects a business summary longer than 240 characters", () => {
    expect(
      stockSchema.safeParse({
        ...stockFixture,
        businessSummary: { ...stockFixture.businessSummary, value: "x".repeat(241) },
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown sector model", () => {
    expect(stockSchema.safeParse({ ...stockFixture, sectorModel: "bank" }).success).toBe(false);
  });
});

describe("snapshot", () => {
  const base = {
    schemaVersion: "1.0.0",
    snapshotId: "2026-11-10.1",
    generatedAt: "2026-11-10T18:30:00+05:30",
    generatedBy: "manual_transcription" as const,
    note: "Course prototype seed.",
    sources: [],
    index: {
      id: "NIFTY50" as const,
      name: "Nifty 50",
      prices: {
        value: {
          granularity: "monthly_close" as const,
          points: Array.from({ length: 12 }, (_, i) => ({
            date: `2026-${String(i + 1).padStart(2, "0")}-28`,
            close: 22000 + i,
          })),
        },
        asOf: "2026-12-28",
        source: "manual:google-finance:2026-11-10",
      },
    },
    sectors: [],
    stocks: [],
    news: [],
    exclusions: [],
  };

  it("accepts a structurally valid shell", () => {
    expect(snapshotSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a snapshot id without a revision suffix", () => {
    expect(snapshotSchema.safeParse({ ...base, snapshotId: "2026-11-10" }).success).toBe(false);
  });

  it("rejects an unknown schema version", () => {
    expect(snapshotSchema.safeParse({ ...base, schemaVersion: "1.1.0" }).success).toBe(false);
  });

  it("rejects a top-level unknown key", () => {
    expect(snapshotSchema.safeParse({ ...base, extra: true }).success).toBe(false);
  });
});

