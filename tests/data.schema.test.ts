import { describe, expect, it } from "vitest";
import {
  baseSnapshotSchema,
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
  type CorporateAction,
  type Dated,
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
    expect(baseSnapshotSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a snapshot id without a revision suffix", () => {
    expect(baseSnapshotSchema.safeParse({ ...base, snapshotId: "2026-11-10" }).success).toBe(false);
  });

  it("rejects an unknown schema version", () => {
    expect(baseSnapshotSchema.safeParse({ ...base, schemaVersion: "1.1.0" }).success).toBe(false);
  });

  it("rejects a top-level unknown key", () => {
    expect(baseSnapshotSchema.safeParse({ ...base, extra: true }).success).toBe(false);
  });
});


function makeSnapshot() {
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

  const year = (n: number) => ({
    fy: `FY${2022 + n}`,
    periodEnd: `${2022 + n}-03-31`,
    sourceId: source.id,
    revenueCr: 60000 + n * 3000,
    ebitdaCr: 24000 + n * 500,
    ebitCr: 23000 + n * 500,
    patCr: 18000 + n * 600,
    epsInr: 14.4 + n * 0.5,
    dpsInr: 12 + n,
    netWorthCr: 44000 + n * 1000,
    totalDebtCr: 1500 - n * 50,
    interestExpenseCr: 140,
    operatingCashFlowCr: 17500 + n * 400,
    sharesOutstandingCr: 1250,
  });

  const monthlyPoints = Array.from({ length: 13 }, (_, i) => {
    const year = 2025 + Math.floor((10 + i) / 12);
    const month = ((10 + i) % 12) + 1;
    return { date: `${year}-${String(month).padStart(2, "0")}-01`, close: 1400 + i * 6 };
  });

  const dailyDates = [
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
  ];

  const dailyPoints = dailyDates.map((date, i) => ({
    date,
    close: 1470 + i,
  }));

  const stock = {
    ticker: "ITC",
    name: "ITC Limited",
    isin: "INE154A01025",
    sectorId: "fmcg",
    sectorModel: "non_financial" as const,
    nifty50Member: { value: true, asOf: "2026-11-10", source: source.id } as Dated<boolean>,
    businessSummary: { value: "Cigarettes, packaged foods and paperboards.", asOf: "2026-03-31", source: source.id },
    segments: { value: ["Cigarettes", "Foods", "Paperboards"], asOf: "2026-03-31", source: source.id },
    prices: {
      value: { currency: "INR" as const, granularity: "monthly_close" as const, points: monthlyPoints },
      asOf: "2026-11-01",
      source: source.id,
    },
    recentPrices: {
      value: { currency: "INR" as const, granularity: "daily_close" as const, points: dailyPoints },
      asOf: "2026-11-05",
      source: source.id,
    },
    financials: {
      currency: "INR" as const,
      units: "crore" as const,
      basis: "consolidated" as const,
      annual: { value: [0, 1, 2, 3, 4].map(year), asOf: "2026-03-31", source: source.id },
    },
    corporateActions: [] as CorporateAction[],
  };

  const indexPoints = monthlyPoints.map((p) => ({ date: p.date, close: 22000 + (p.close - 1400) * 3 }));

  return {
    schemaVersion: "1.0.0" as const,
    snapshotId: "2026-11-10.1",
    generatedAt: "2026-11-10T18:30:00+05:30",
    generatedBy: "manual_transcription" as const,
    note: "Course prototype seed.",
    sources: [source],
    index: {
      id: "NIFTY50" as const,
      name: "Nifty 50",
      prices: {
        value: { granularity: "monthly_close" as const, points: indexPoints },
        asOf: "2026-11-01",
        source: source.id,
      },
    },
    sectors: [
      {
        id: "fmcg",
        name: "Fast Moving Consumer Goods",
        description: { value: "Packaged consumer goods.", asOf: "2026-11-10", source: source.id },
        medianPe: { value: 28.4, asOf: "2026-11-10", source: source.id } as Dated<number>,
        medianPb: { value: 8.2, asOf: "2026-11-10", source: source.id } as Dated<number>,
      },
    ],
    stocks: [stock],
    news: [
      {
        id: "news-itc-1",
        ticker: "ITC",
        headline: "ITC reports September quarter results",
        summary: "ITC reported revenue growth in its September quarter filing to the exchanges.",
        publishedAt: "2026-11-05T17:45:00+05:30",
        sourceName: "Exchange filing",
        sourceUrl: "https://www.nseindia.com/",
        kind: "announcement" as const,
        sourceId: source.id,
      },
    ],
    exclusions: [],
  };
}

function expectFailure(mutate: (snap: ReturnType<typeof makeSnapshot>) => void, messagePart: string) {
  const snap = makeSnapshot();
  mutate(snap);
  const result = snapshotSchema.safeParse(snap);
  expect(result.success).toBe(false);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(" | ");
    expect(messages).toContain(messagePart);
  }
}

describe("snapshot refinements", () => {
  it("accepts the base fixture", () => {
    const result = snapshotSchema.safeParse(makeSnapshot());
    expect(result.success).toBe(true);
  });

  it("rejects duplicate stock identity", () => {
    expectFailure((s) => {
      s.stocks.push({ ...s.stocks[0], ticker: "ITC" });
    }, "Duplicate stock identity");
  });

  it("rejects an unknown source reference", () => {
    expectFailure((s) => {
      s.stocks[0].financials.annual.value[0].sourceId = "manual:missing:2026-11-10";
    }, "Unknown source");
  });

  it("rejects a null Dated value with no note", () => {
    expectFailure((s) => {
      s.stocks[0].nifty50Member = { value: null, asOf: "2026-11-10", source: s.sources[0].id };
    }, "Missing null explanation");
  });

  it("rejects a future-dated value", () => {
    expectFailure((s) => {
      s.stocks[0].nifty50Member.asOf = "2026-12-01";
    }, "Future-dated or mislabelled value");
  });

  it("rejects a mislabelled financials block asOf", () => {
    expectFailure((s) => {
      s.stocks[0].financials.annual.asOf = "2026-02-28";
    }, "Future-dated or mislabelled value");
  });

  it("rejects four financial years", () => {
    expectFailure((s) => {
      s.stocks[0].financials.annual.value = s.stocks[0].financials.annual.value.slice(0, 4);
    }, "Financial history incomplete");
  });

  it("rejects a non-contiguous financial year", () => {
    expectFailure((s) => {
      s.stocks[0].financials.annual.value[2].fy = "FY2021";
    }, "Financial history incomplete");
  });

  it("rejects a monthly series labelled daily", () => {
    expectFailure((s) => {
      s.stocks[0].prices.value.granularity = "daily_close" as never;
    }, "Price series granularity invalid");
  });

  it("rejects a monthly series whose last date is not the block asOf", () => {
    expectFailure((s) => {
      s.stocks[0].prices.asOf = "2026-10-01";
    }, "Price series invalid");
  });

  it("rejects a duplicate month in the monthly series", () => {
    expectFailure((s) => {
      s.stocks[0].prices.value.points[3].date = s.stocks[0].prices.value.points[2].date;
      s.stocks[0].prices.asOf = s.stocks[0].prices.value.points[s.stocks[0].prices.value.points.length - 1].date;
    }, "Price series invalid");
  });

  it("rejects nine daily points", () => {
    expectFailure((s) => {
      s.stocks[0].recentPrices.value.points = s.stocks[0].recentPrices.value.points.slice(0, 9);
      s.stocks[0].recentPrices.asOf = s.stocks[0].recentPrices.value.points[8].date;
    }, "Recent price series invalid");
  });

  it("rejects a recent tail that predates the monthly series", () => {
    expectFailure((s) => {
      s.stocks[0].recentPrices.asOf = "2026-01-01";
      s.stocks[0].recentPrices.value.points = s.stocks[0].recentPrices.value.points.map((p, i) => ({
        date: `2025-12-${String(20 + i).padStart(2, "0")}`,
        close: p.close,
      }));
      s.stocks[0].prices.asOf = "2026-11-01";
    }, "Recent series predates the monthly series");
  });

  it("rejects a missing sector valuation", () => {
    expectFailure((s) => {
      s.sectors[0].medianPe = { value: null, asOf: "2026-11-10", source: s.sources[0].id, note: "No data." };
    }, "Sector valuation missing");
  });

  it("rejects price windows more than 31 days apart", () => {
    expectFailure((s) => {
      s.index.prices.value.points = s.index.prices.value.points.slice(2);
      s.index.prices.asOf = s.index.prices.value.points[s.index.prices.value.points.length - 1].date;
    }, "Series not comparable");
  });

  it("rejects two corporate actions of one type in one year", () => {
    expectFailure((s) => {
      const action = {
        id: "ca-1",
        type: "bonus" as const,
        effectiveDate: "2025-06-01",
        listingDate: null,
        description: "A bonus issue.",
        successorTickers: [],
        sourceId: s.sources[0].id,
      };
      s.stocks[0].corporateActions = [action, { ...action, id: "ca-2", effectiveDate: "2025-09-01" }];
    }, "Duplicate corporate action");
  });
});
