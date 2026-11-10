import { describe, expect, it, vi } from "vitest";
import {
  searchStocks,
  getLiveStockQuote,
  resolveTickerSymbol,
  generateHeuristics,
  formatMarketCap,
  getSnapshotFallback,
} from "@/lib/data/live";
import { GET as searchRoute } from "@/app/api/stocks/search/route";

describe("live stock data layer", () => {
  describe("formatMarketCap", () => {
    it("formats Indian rupee market caps in crores and lakh crores", () => {
      // 50,000 Cr = 500,000,000,000
      expect(formatMarketCap(500000000000, "INR")).toBe("₹50,000 Cr");
      // 15 Lakh Cr = 15,000,000,000,000
      expect(formatMarketCap(15000000000000, "INR")).toBe("₹15.00L Cr");
    });

    it("formats USD market caps in T, B, M", () => {
      expect(formatMarketCap(3500000000000, "USD")).toBe("$3.50T");
      expect(formatMarketCap(450000000000, "USD")).toBe("$450.00B");
      expect(formatMarketCap(250000000, "USD")).toBe("$250.00M");
    });

    it("handles null and non-positive numbers gracefully", () => {
      expect(formatMarketCap(null)).toBe("N/A");
      expect(formatMarketCap(0)).toBe("N/A");
      expect(formatMarketCap(-100)).toBe("N/A");
      expect(formatMarketCap(NaN)).toBe("N/A");
    });
  });

  describe("generateHeuristics", () => {
    it("generates at least 2 clear strengths and 1-2 watchouts for solid companies", () => {
      const res = generateHeuristics({
        peRatio: 22.5,
        operatingMargins: 0.22,
        profitMargins: 0.16,
        revenueGrowth: 0.12,
        earningsGrowth: 0.15,
        debtToEquity: 0.1,
        dividendYield: 2.1,
        operatingCashflow: 5000,
      });

      expect(res.strengths.length).toBeGreaterThanOrEqual(2);
      expect(res.watchouts.length).toBeGreaterThanOrEqual(1);
      expect(res.watchouts.length).toBeLessThanOrEqual(2);

      // Verify specific strength reasons
      expect(res.strengths.some((s) => s.includes("operating margin"))).toBe(true);
      expect(res.strengths.some((s) => s.includes("valuation multiple"))).toBe(true);
    });

    it("flags high P/E (> 50), earnings contraction, and high leverage in watchouts", () => {
      const res = generateHeuristics({
        peRatio: 65.0,
        earningsGrowth: -0.18,
        debtToEquity: 2.4,
        profitMargins: 0.03,
      });

      expect(res.watchouts.length).toBeGreaterThanOrEqual(1);
      expect(res.watchouts.some((w) => w.includes("> 50x"))).toBe(true);
      expect(res.watchouts.some((w) => w.includes("contraction"))).toBe(true);
      // Ensures 2 strengths are provided even for stressed companies via fallback
      expect(res.strengths.length).toBe(2);
    });

    it("provides defaults when metrics are scarce", () => {
      const res = generateHeuristics({});
      expect(res.strengths).toHaveLength(2);
      expect(res.watchouts.length).toBeGreaterThanOrEqual(1);
      expect(res.watchouts.length).toBeLessThanOrEqual(2);
    });
  });

  describe("searchStocks", () => {
    it("returns empty array for empty or whitespace query", async () => {
      expect(await searchStocks("")).toEqual([]);
      expect(await searchStocks("   ")).toEqual([]);
    });

    it("supports Indian tickers and seeded fallback stocks (e.g. TATAMOTORS, RELIANCE, ZOMATO)", async () => {
      const results = await searchStocks("TATAMOTORS");
      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r) => r.symbol === "TATAMOTORS.NS");
      expect(match).toBeDefined();
      expect(match?.name).toContain("Tata Motors");
      expect(match?.type).toBe("EQUITY");
      expect(match?.exchange).toBe("NSE");

      const zomatoResults = await searchStocks("ZOMATO");
      expect(zomatoResults.length).toBeGreaterThan(0);
      expect(zomatoResults.some((r) => r.symbol === "ZOMATO.NS")).toBe(true);
    });

    it("supports global tickers (e.g. AAPL)", async () => {
      const results = await searchStocks("AAPL");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.symbol === "AAPL")).toBe(true);
    });

    it("correctly parses and filters Yahoo Finance search response when API succeeds", async () => {
      const fakeQuotes = {
        quotes: [
          {
            symbol: "INFY.NS",
            shortname: "INFOSYS LTD",
            longname: "Infosys Limited",
            quoteType: "EQUITY",
            typeDisp: "Equity",
            exchDisp: "NSE",
          },
          {
            symbol: "INFY2500CE.NS",
            shortname: "INFY CALL OPTION",
            quoteType: "OPTION",
            typeDisp: "Option",
            exchDisp: "NFO",
          },
        ],
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => fakeQuotes,
      } as unknown as Response);

      try {
        const results = await searchStocks("INFY");
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          symbol: "INFY.NS",
          name: "Infosys Limited",
          exchange: "NSE",
          type: "Equity",
        });
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("resolveTickerSymbol", () => {
    it("preserves tickers that already specify an exchange suffix", async () => {
      expect(await resolveTickerSymbol("TATAMOTORS.NS")).toBe("TATAMOTORS.NS");
      expect(await resolveTickerSymbol("RELIANCE.BO")).toBe("RELIANCE.BO");
    });

    it("appends .NS for known Indian stocks in snapshot", async () => {
      expect(await resolveTickerSymbol("INFY")).toBe("INFY.NS");
      expect(await resolveTickerSymbol("TCS")).toBe("TCS.NS");
      expect(await resolveTickerSymbol("RELIANCE")).toBe("RELIANCE.NS");
    });

    it("resolves global or extra tickers", async () => {
      expect(await resolveTickerSymbol("AAPL")).toBe("AAPL");
      expect(await resolveTickerSymbol("ZOMATO")).toBe("ZOMATO.NS");
    });
  });

  describe("getSnapshotFallback", () => {
    it("produces a complete LiveStockSnapshot from snapshot.json", () => {
      const snapshot = getSnapshotFallback("INFY");
      expect(snapshot).not.toBeNull();
      if (!snapshot) return;

      expect(snapshot.ticker).toBe("INFY.NS");
      expect(snapshot.name).toBe("Infosys Limited");
      expect(snapshot.price).toBeGreaterThan(0);
      expect(snapshot.currency).toBe("INR");
      expect(typeof snapshot.change).toBe("number");
      expect(typeof snapshot.changePercent).toBe("number");
      expect(snapshot.marketCap).toBeGreaterThan(0);
      expect(snapshot.marketCapFormatted).toMatch(/₹.*(Cr|L Cr)/);
      expect(snapshot.peRatio).toBeGreaterThan(0);
      expect(snapshot.dividendYield).toBeGreaterThan(0);
      expect(snapshot.sector).toBe("Information Technology");
      expect(snapshot.strengths.length).toBe(2);
      expect(snapshot.watchouts.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.watchouts.length).toBeLessThanOrEqual(2);
      expect(snapshot.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns null for non-existent stock", () => {
      expect(getSnapshotFallback("UNKNOWN_TICKER_XYZ_123")).toBeNull();
    });
  });

  describe("getLiveStockQuote", () => {
    it("returns typed LiveStockSnapshot for seeded stocks with fallback", async () => {
      const quote = await getLiveStockQuote("TATAMOTORS");
      expect(quote).not.toBeNull();
      if (!quote) return;

      expect(quote.ticker).toBe("TATAMOTORS.NS");
      expect(quote.name).toBe("Tata Motors Limited");
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.currency).toBe("INR");
      expect(quote.marketCapFormatted).toContain("Cr");
      expect(quote.strengths).toHaveLength(2);
      expect(quote.watchouts.length).toBeGreaterThanOrEqual(1);
    });

    it("returns null when symbol cannot be found", async () => {
      const quote = await getLiveStockQuote("NON_EXISTENT_CO_12345");
      expect(quote).toBeNull();
    });

    it("correctly parses live Yahoo chart and quoteSummary responses", async () => {
      const fakeChart = {
        chart: {
          result: [
            {
              meta: {
                symbol: "MOCK.NS",
                regularMarketPrice: 500.0,
                previousClose: 490.0,
                currency: "INR",
                fiftyTwoWeekHigh: 600.0,
                fiftyTwoWeekLow: 350.0,
                regularMarketTime: 1731234567,
              },
            },
          ],
        },
      };

      const fakeSummary = {
        quoteSummary: {
          result: [
            {
              price: {
                symbol: "MOCK.NS",
                longName: "Mock Technology Ltd",
                regularMarketPrice: { raw: 500.0 },
                regularMarketChange: { raw: 10.0 },
                regularMarketChangePercent: { raw: 0.0204 },
                regularMarketDayHigh: { raw: 505.0 },
                regularMarketDayLow: { raw: 488.0 },
                marketCap: { raw: 100000000000 },
                currency: "INR",
              },
              summaryDetail: {
                fiftyTwoWeekHigh: { raw: 600.0 },
                fiftyTwoWeekLow: { raw: 350.0 },
                trailingPE: { raw: 21.5 },
                dividendYield: { raw: 0.018 },
                marketCap: { raw: 100000000000 },
              },
              financialData: {
                currentPrice: { raw: 500.0 },
                operatingMargins: { raw: 0.18 },
                profitMargins: { raw: 0.14 },
                returnOnEquity: { raw: 0.19 },
                debtToEquity: { raw: 15.0 },
                revenueGrowth: { raw: 0.11 },
                earningsGrowth: { raw: 0.14 },
                operatingCashflow: { raw: 15000000000 },
              },
              assetProfile: {
                sector: "Technology",
                industry: "Software Services",
                longBusinessSummary: "Mock Technology provides cloud consulting and software.",
              },
            },
          ],
        },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/chart/")) {
          return Promise.resolve({
            ok: true,
            json: async () => fakeChart,
          } as Response);
        }
        if (url.includes("/quoteSummary/")) {
          return Promise.resolve({
            ok: true,
            json: async () => fakeSummary,
          } as Response);
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      try {
        const quote = await getLiveStockQuote("MOCK.NS");
        expect(quote).not.toBeNull();
        if (!quote) return;

        expect(quote.ticker).toBe("MOCK.NS");
        expect(quote.name).toBe("Mock Technology Ltd");
        expect(quote.price).toBe(500.0);
        expect(quote.currency).toBe("INR");
        expect(quote.change).toBe(10.0);
        expect(quote.changePercent).toBe(2.04);
        expect(quote.dayHigh).toBe(505.0);
        expect(quote.dayLow).toBe(488.0);
        expect(quote.fiftyTwoWeekHigh).toBe(600.0);
        expect(quote.fiftyTwoWeekLow).toBe(350.0);
        expect(quote.peRatio).toBe(21.5);
        expect(quote.dividendYield).toBe(1.8);
        expect(quote.sector).toBe("Technology");
        expect(quote.industry).toBe("Software Services");
        expect(quote.summary).toContain("Mock Technology");
        expect(quote.strengths.length).toBe(2);
        expect(quote.watchouts.length).toBeGreaterThanOrEqual(1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("search route handler GET /api/stocks/search", () => {
    it("returns results for valid query", async () => {
      const req = new Request("http://localhost:3000/api/stocks/search?q=TATAMOTORS");
      const res = await searchRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("results");
      expect(Array.isArray(json.results)).toBe(true);
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results.some((r: { symbol: string }) => r.symbol === "TATAMOTORS.NS")).toBe(true);
    });

    it("returns empty results array when q parameter is missing or empty", async () => {
      const reqEmpty = new Request("http://localhost:3000/api/stocks/search?q=");
      const resEmpty = await searchRoute(reqEmpty);
      expect(resEmpty.status).toBe(200);
      const jsonEmpty = await resEmpty.json();
      expect(jsonEmpty).toEqual({ results: [] });

      const reqNone = new Request("http://localhost:3000/api/stocks/search");
      const resNone = await searchRoute(reqNone);
      expect(resNone.status).toBe(200);
      const jsonNone = await resNone.json();
      expect(jsonNone).toEqual({ results: [] });
    });
  });
});
