import rawSnapshot from "../../data/snapshot.json";
import { indianGroup } from "@/lib/engine/format";

export interface LiveStockSnapshot {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketCap: number | null;
  marketCapFormatted: string;
  peRatio: number | null;
  dividendYield: number | null;
  sector: string | null;
  industry: string | null;
  summary: string | null;
  strengths: string[];
  watchouts: string[];
  asOf: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface HeuristicInputs {
  peRatio?: number | null;
  profitMargins?: number | null;
  operatingMargins?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth?: number | null;
  debtToEquity?: number | null;
  dividendYield?: number | null;
  price?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  roe?: number | null;
  operatingCashflow?: number | null;
}

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Format market cap with currency-aware abbreviation (Cr/L Cr for INR, T/B/M for USD). */
export function formatMarketCap(marketCap: number | null, currency = "INR"): string {
  if (marketCap == null || isNaN(marketCap) || marketCap <= 0) return "N/A";

  if (currency === "INR") {
    const crore = marketCap / 10000000;
    if (crore >= 100000) {
      return `₹${(crore / 100000).toFixed(2)}L Cr`;
    }
    return `₹${indianGroup(Math.round(crore))} Cr`;
  }

  const prefix = currency === "USD" ? "$" : `${currency} `;
  if (marketCap >= 1e12) return `${prefix}${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `${prefix}${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `${prefix}${(marketCap / 1e6).toFixed(2)}M`;
  return `${prefix}${marketCap.toLocaleString()}`;
}

/**
 * Generate 2 clear strengths and 1-2 watchouts based on valuation,
 * margins, balance sheet leverage, and growth metrics.
 */
export function generateHeuristics(inputs: HeuristicInputs): {
  strengths: string[];
  watchouts: string[];
} {
  const strengths: string[] = [];
  const watchouts: string[] = [];

  const {
    peRatio,
    profitMargins,
    operatingMargins,
    revenueGrowth,
    earningsGrowth,
    debtToEquity,
    dividendYield,
    operatingCashflow,
  } = inputs;

  // Strengths
  if (operatingMargins != null && operatingMargins >= 0.15) {
    strengths.push(
      `Strong operating margin (${(operatingMargins * 100).toFixed(1)}%) reflecting solid pricing power`,
    );
  } else if (profitMargins != null && profitMargins >= 0.12) {
    strengths.push(
      `Healthy net profit margin (${(profitMargins * 100).toFixed(1)}%) demonstrating bottom-line discipline`,
    );
  }

  if (peRatio != null && peRatio > 0 && peRatio <= 25) {
    strengths.push(
      `Reasonable valuation multiple (P/E of ${peRatio.toFixed(1)}x) offering favorable risk-reward`,
    );
  }

  if (debtToEquity != null && debtToEquity <= 0.3) {
    const ratioFmt = (debtToEquity > 10 ? debtToEquity / 100 : debtToEquity).toFixed(2);
    strengths.push(`Conservative balance sheet with minimal debt leverage (${ratioFmt}x)`);
  }

  if (earningsGrowth != null && earningsGrowth >= 0.1) {
    const egFmt = (earningsGrowth < 1 ? earningsGrowth * 100 : earningsGrowth).toFixed(1);
    strengths.push(`Robust earnings expansion (${egFmt}% YoY) driving shareholder value`);
  } else if (revenueGrowth != null && revenueGrowth >= 0.08) {
    const rgFmt = (revenueGrowth < 1 ? revenueGrowth * 100 : revenueGrowth).toFixed(1);
    strengths.push(`Steady top-line revenue growth (${rgFmt}% YoY) indicating healthy demand`);
  }

  if (dividendYield != null && dividendYield >= 1.5) {
    strengths.push(
      `Consistent dividend yield (${dividendYield.toFixed(1)}%) returning cash to shareholders`,
    );
  } else if (operatingCashflow != null && operatingCashflow > 0) {
    strengths.push("Positive operating cash flows backing reported net income");
  }

  // Ensure at least 2 clear strengths
  const defaultStrengths = [
    "Established market leadership with strong brand equity and wide reach",
    "Resilient operational cash generation supporting business reinvestment",
  ];
  for (const s of defaultStrengths) {
    if (strengths.length < 2 && !strengths.includes(s)) {
      strengths.push(s);
    }
  }

  // Watchouts
  if (peRatio != null && peRatio > 50) {
    watchouts.push(
      `High valuation multiple (P/E of ${peRatio.toFixed(1)}x > 50x) leaves minimal margin of safety`,
    );
  } else if (peRatio != null && peRatio > 35) {
    watchouts.push(
      `Elevated valuation multiple (P/E of ${peRatio.toFixed(1)}x) demands strong forward execution`,
    );
  }

  if (earningsGrowth != null && earningsGrowth < 0) {
    const egFmt = (earningsGrowth > -1 && earningsGrowth < 0 ? earningsGrowth * 100 : earningsGrowth).toFixed(1);
    watchouts.push(
      `Recent profit contraction (${egFmt}% YoY) signaling earnings volatility`,
    );
  } else if (revenueGrowth != null && revenueGrowth < 0) {
    const rgFmt = (revenueGrowth > -1 && revenueGrowth < 0 ? revenueGrowth * 100 : revenueGrowth).toFixed(1);
    watchouts.push(
      `Top-line revenue contraction (${rgFmt}% YoY) indicating demand headwinds`,
    );
  }

  if (debtToEquity != null && (debtToEquity > 1.5 || debtToEquity > 150)) {
    const ratioFmt = (debtToEquity > 10 ? debtToEquity / 100 : debtToEquity).toFixed(2);
    watchouts.push(
      `High financial leverage (debt-to-equity of ${ratioFmt}x) elevates sensitivity to interest rate spikes`,
    );
  }

  if (profitMargins != null && profitMargins > 0 && profitMargins < 0.05) {
    watchouts.push("Thin profit margins vulnerable to input cost fluctuations");
  } else if (profitMargins != null && profitMargins <= 0) {
    watchouts.push("Operating at negative net profit margin requiring turnaround execution");
  }

  // Ensure 1-2 watchouts
  const defaultWatchouts = [
    "Exposed to broader macroeconomic cycles, inflation, and rate volatility",
    "Intense industry competition may require ongoing capital expenditures",
  ];
  for (const w of defaultWatchouts) {
    if (watchouts.length < 1 && !watchouts.includes(w)) {
      watchouts.push(w);
    }
  }

  return {
    strengths: strengths.slice(0, 2),
    watchouts: watchouts.slice(0, 2),
  };
}

/** Extra seeded stocks for offline / fallback coverage beyond snapshot.json */
const EXTRA_FALLBACK_STOCKS: Record<string, LiveStockSnapshot> = {
  "ZOMATO.NS": {
    ticker: "ZOMATO.NS",
    name: "Zomato Limited",
    price: 262.5,
    currency: "INR",
    change: 3.8,
    changePercent: 1.47,
    dayHigh: 266.0,
    dayLow: 258.2,
    fiftyTwoWeekHigh: 298.2,
    fiftyTwoWeekLow: 112.5,
    marketCap: 2315000000000,
    marketCapFormatted: "₹2.32L Cr",
    peRatio: 68.4,
    dividendYield: 0,
    sector: "Consumer Services",
    industry: "Internet & Direct Marketing Retail",
    summary:
      "Zomato Limited connects customers, restaurant partners, and delivery partners through food ordering and quick-commerce platform Blinkit.",
    strengths: [
      "Robust earnings expansion (14.2% YoY) driving shareholder value",
      "Established market leadership with strong brand equity and wide reach",
    ],
    watchouts: [
      "High valuation multiple (P/E of 68.4x > 50x) leaves minimal margin of safety",
      "Intense industry competition may require ongoing capital expenditures",
    ],
    asOf: "2026-11-10",
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 228.5,
    currency: "USD",
    change: 1.85,
    changePercent: 0.82,
    dayHigh: 230.1,
    dayLow: 226.4,
    fiftyTwoWeekHigh: 237.23,
    fiftyTwoWeekLow: 164.08,
    marketCap: 3480000000000,
    marketCapFormatted: "$3.48T",
    peRatio: 33.8,
    dividendYield: 0.44,
    sector: "Technology",
    industry: "Consumer Electronics",
    summary:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.",
    strengths: [
      "Strong operating margin (30.7%) reflecting solid pricing power",
      "Established market leadership with strong brand equity and wide reach",
    ],
    watchouts: [
      "Elevated valuation multiple (P/E of 33.8x) demands strong forward execution",
      "Exposed to broader macroeconomic cycles, inflation, and rate volatility",
    ],
    asOf: "2026-11-10",
  },
};

/** Helpers to extract raw primitives from Yahoo Finance JSON objects */
function extractNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  if (
    typeof val === "object" &&
    "raw" in (val as Record<string, unknown>) &&
    typeof (val as { raw: unknown }).raw === "number"
  ) {
    const r = (val as { raw: number }).raw;
    return isNaN(r) ? null : r;
  }
  return null;
}

function extractString(val: unknown): string | null {
  if (typeof val === "string" && val.trim().length > 0) return val.trim();
  if (
    typeof val === "object" &&
    val != null &&
    "fmt" in (val as Record<string, unknown>) &&
    typeof (val as { fmt: unknown }).fmt === "string"
  ) {
    return (val as { fmt: string }).fmt.trim();
  }
  return null;
}

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: YAHOO_HEADERS,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Fallback to data/snapshot.json for seeded Indian stocks when offline or on error */
export function getSnapshotFallback(tickerOrSymbol: string): LiveStockSnapshot | null {
  const clean = tickerOrSymbol.trim().toUpperCase();
  const stripped = clean.replace(/\.(NS|BO)$/i, "");

  // Check extra fallback stocks
  if (EXTRA_FALLBACK_STOCKS[clean]) return EXTRA_FALLBACK_STOCKS[clean];
  if (EXTRA_FALLBACK_STOCKS[`${stripped}.NS`]) return EXTRA_FALLBACK_STOCKS[`${stripped}.NS`];

  // Search snapshot.json
  const stock = rawSnapshot.stocks.find(
    (s) =>
      s.ticker === clean ||
      s.ticker === stripped ||
      `${s.ticker}.NS` === clean ||
      s.name.toUpperCase().includes(stripped),
  );

  if (!stock) return null;

  const points =
    stock.recentPrices?.value?.points?.length && stock.recentPrices.value.points.length > 0
      ? stock.recentPrices.value.points
      : stock.prices?.value?.points || [];

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const prevPoint = points.length > 1 ? points[points.length - 2] : lastPoint;

  const price = lastPoint?.close ?? 0;
  const currency = stock.prices?.value?.currency ?? "INR";
  const change = lastPoint && prevPoint ? Number((lastPoint.close - prevPoint.close).toFixed(2)) : 0;
  const changePercent =
    prevPoint && prevPoint.close > 0
      ? Number(((change / prevPoint.close) * 100).toFixed(2))
      : 0;

  const allPoints = [
    ...(stock.prices?.value?.points || []),
    ...(stock.recentPrices?.value?.points || []),
  ];
  const closes = allPoints
    .map((p) => p.close)
    .filter((c) => typeof c === "number" && !isNaN(c));
  const fiftyTwoWeekHigh = closes.length > 0 ? Math.max(...closes) : null;
  const fiftyTwoWeekLow = closes.length > 0 ? Math.min(...closes) : null;

  const annuals = stock.financials?.annual?.value || [];
  const latestAnnual = annuals.length > 0 ? annuals[annuals.length - 1] : null;
  const prevAnnual = annuals.length > 1 ? annuals[annuals.length - 2] : null;

  const marketCap =
    latestAnnual && price > 0
      ? price * (latestAnnual.sharesOutstandingCr * 10000000)
      : null;
  const marketCapFormatted = formatMarketCap(marketCap, currency);

  const peRatio =
    latestAnnual && latestAnnual.epsInr > 0
      ? Number((price / latestAnnual.epsInr).toFixed(2))
      : null;

  const dividendYield =
    latestAnnual && latestAnnual.dpsInr > 0 && price > 0
      ? Number(((latestAnnual.dpsInr / price) * 100).toFixed(2))
      : null;

  const sectorName =
    rawSnapshot.sectors.find((sec) => sec.id === stock.sectorId)?.name ?? null;

  const operatingMargins =
    latestAnnual && latestAnnual.revenueCr > 0
      ? latestAnnual.ebitCr / latestAnnual.revenueCr
      : null;
  const profitMargins =
    latestAnnual && latestAnnual.revenueCr > 0
      ? latestAnnual.patCr / latestAnnual.revenueCr
      : null;
  const revenueGrowth =
    latestAnnual && prevAnnual && prevAnnual.revenueCr > 0
      ? (latestAnnual.revenueCr - prevAnnual.revenueCr) / prevAnnual.revenueCr
      : null;
  const earningsGrowth =
    latestAnnual && prevAnnual && prevAnnual.patCr > 0
      ? (latestAnnual.patCr - prevAnnual.patCr) / prevAnnual.patCr
      : null;
  const debtToEquity =
    latestAnnual && latestAnnual.netWorthCr > 0
      ? latestAnnual.totalDebtCr / latestAnnual.netWorthCr
      : null;

  const heuristics = generateHeuristics({
    peRatio,
    operatingMargins,
    profitMargins,
    revenueGrowth,
    earningsGrowth,
    debtToEquity,
    dividendYield,
    price,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    operatingCashflow: latestAnnual?.operatingCashFlowCr ?? null,
  });

  return {
    ticker: `${stock.ticker}.NS`,
    name: stock.name,
    price,
    currency,
    change,
    changePercent,
    dayHigh: null,
    dayLow: null,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    marketCap,
    marketCapFormatted,
    peRatio,
    dividendYield,
    sector: sectorName,
    industry:
      stock.sectorModel === "financial"
        ? "Banking & Financial Services"
        : sectorName || "Diversified",
    summary: stock.businessSummary?.value ?? null,
    strengths: heuristics.strengths,
    watchouts: heuristics.watchouts,
    asOf: lastPoint?.date || stock.recentPrices?.asOf || new Date().toISOString().split("T")[0],
  };
}

/**
 * Searches for equity stocks using Yahoo Finance search API.
 * Falls back to local seeded data if offline or network unavailable.
 */
export async function searchStocks(
  query: string,
): Promise<Array<StockSearchResult>> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    trimmed,
  )}&quotesCount=8&newsCount=0`;

  try {
    const res = await fetchWithTimeout(url, 4000);
    if (res.ok) {
      const data = (await res.json()) as {
        quotes?: Array<{
          symbol?: string;
          shortname?: string;
          longname?: string;
          exchDisp?: string;
          exchange?: string;
          quoteType?: string;
          typeDisp?: string;
        }>;
      };

      if (Array.isArray(data.quotes) && data.quotes.length > 0) {
        const equities = data.quotes
          .filter(
            (q) =>
              q.symbol &&
              (q.quoteType === "EQUITY" ||
                q.typeDisp?.toUpperCase() === "EQUITY"),
          )
          .map((q) => ({
            symbol: q.symbol!,
            name: q.longname || q.shortname || q.symbol!,
            exchange: q.exchDisp || q.exchange || "NSE",
            type: q.typeDisp || q.quoteType || "EQUITY",
          }));

        if (equities.length > 0) {
          return equities;
        }
      }
    }
  } catch {
    // Network or rate-limit failure; fallback below
  }

  // Graceful fallback to snapshot.json + extra fallback stocks
  const qLower = trimmed.toLowerCase();
  const qClean = qLower.replace(/\.(ns|bo)$/i, "");

  const results: StockSearchResult[] = [];
  const seen = new Set<string>();

  for (const s of rawSnapshot.stocks) {
    const tickerLower = s.ticker.toLowerCase();
    const nameLower = s.name.toLowerCase();
    if (
      tickerLower.includes(qClean) ||
      nameLower.includes(qClean) ||
      `${tickerLower}.ns`.includes(qLower)
    ) {
      const symbol = `${s.ticker}.NS`;
      if (!seen.has(symbol)) {
        seen.add(symbol);
        results.push({
          symbol,
          name: s.name,
          exchange: "NSE",
          type: "EQUITY",
        });
      }
    }
  }

  // Check extra fallback stocks (e.g. ZOMATO, AAPL)
  for (const extra of Object.values(EXTRA_FALLBACK_STOCKS)) {
    const symLower = extra.ticker.toLowerCase();
    const nameLower = extra.name.toLowerCase();
    if (
      symLower.includes(qLower) ||
      symLower.includes(qClean) ||
      nameLower.includes(qLower)
    ) {
      if (!seen.has(extra.ticker)) {
        seen.add(extra.ticker);
        results.push({
          symbol: extra.ticker,
          name: extra.name,
          exchange: extra.ticker.endsWith(".NS") ? "NSE" : "NASDAQ",
          type: "EQUITY",
        });
      }
    }
  }

  return results.slice(0, 8);
}

/**
 * Resolves ticker or symbol to query-ready symbol.
 * Appends .NS for Indian tickers if needed, or queries searchStocks.
 */
export async function resolveTickerSymbol(tickerOrSymbol: string): Promise<string> {
  const trimmed = tickerOrSymbol.trim().toUpperCase();
  if (trimmed.includes(".")) return trimmed;

  // Check if it exists in snapshot.json stocks
  const inSnapshot = rawSnapshot.stocks.some((s) => s.ticker === trimmed);
  if (inSnapshot) return `${trimmed}.NS`;

  // Check extra fallback stocks
  if (EXTRA_FALLBACK_STOCKS[`${trimmed}.NS`]) return `${trimmed}.NS`;
  if (EXTRA_FALLBACK_STOCKS[trimmed]) return trimmed;

  // Attempt search to resolve
  try {
    const searchRes = await searchStocks(trimmed);
    const exact = searchRes.find(
      (r) =>
        r.symbol.toUpperCase() === trimmed ||
        r.symbol.toUpperCase() === `${trimmed}.NS`,
    );
    if (exact) return exact.symbol;
    if (searchRes.length > 0) return searchRes[0].symbol;
  } catch {
    // Ignore search resolution failure
  }

  // Default to .NS for typical uppercase Indian tickers or raw
  return `${trimmed}.NS`;
}

/**
 * Fetches live stock quote and fundamentals from Yahoo Finance.
 * Gracefully falls back to data/snapshot.json for seeded Indian stocks if network fails.
 */
export async function getLiveStockQuote(
  tickerOrSymbol: string,
): Promise<LiveStockSnapshot | null> {
  const cleanInput = tickerOrSymbol.trim();
  if (!cleanInput) return null;

  const symbol = await resolveTickerSymbol(cleanInput);

  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=1d&range=5d`;
  const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    symbol,
  )}?modules=price,summaryDetail,financialData,defaultKeyStatistics,assetProfile`;

  let chartData: Record<string, unknown> | null = null;
  let summaryData: Record<string, unknown> | null = null;

  try {
    const [chartRes, summaryRes] = await Promise.allSettled([
      fetchWithTimeout(chartUrl, 4000),
      fetchWithTimeout(summaryUrl, 4000),
    ]);

    if (chartRes.status === "fulfilled" && chartRes.value.ok) {
      chartData = (await chartRes.value.json()) as Record<string, unknown>;
    }
    if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
      summaryData = (await summaryRes.value.json()) as Record<string, unknown>;
    }
  } catch {
    // Handled below by fallback
  }

  // Parse Yahoo Finance responses if available
  if (chartData || summaryData) {
    try {
      const summaryResult = (
        summaryData as {
          quoteSummary?: {
            result?: Array<{
              price?: Record<string, unknown>;
              summaryDetail?: Record<string, unknown>;
              financialData?: Record<string, unknown>;
              defaultKeyStatistics?: Record<string, unknown>;
              assetProfile?: Record<string, unknown>;
            }>;
          };
        }
      )?.quoteSummary?.result?.[0];

      const chartResult = (
        chartData as {
          chart?: {
            result?: Array<{
              meta?: Record<string, unknown>;
            }>;
          };
        }
      )?.chart?.result?.[0];

      const priceObj = summaryResult?.price;
      const detailObj = summaryResult?.summaryDetail;
      const finObj = summaryResult?.financialData;
      const profileObj = summaryResult?.assetProfile;
      const meta = chartResult?.meta;

      const price =
        extractNumber(priceObj?.regularMarketPrice) ??
        extractNumber(meta?.regularMarketPrice) ??
        extractNumber(finObj?.currentPrice);

      if (price != null && price > 0) {
        const name =
          extractString(priceObj?.longName) ||
          extractString(priceObj?.shortName) ||
          extractString(meta?.shortName) ||
          symbol;

        const currency =
          extractString(priceObj?.currency) ||
          extractString(meta?.currency) ||
          (symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD");

        const previousClose =
          extractNumber(priceObj?.regularMarketPreviousClose) ??
          extractNumber(meta?.previousClose) ??
          extractNumber(meta?.chartPreviousClose);

        let change = extractNumber(priceObj?.regularMarketChange);
        if (change == null && previousClose != null) {
          change = Number((price - previousClose).toFixed(2));
        }
        change = change ?? 0;

        let changePercent = extractNumber(priceObj?.regularMarketChangePercent);
        if (changePercent == null && previousClose != null && previousClose > 0) {
          changePercent = Number(((change / previousClose) * 100).toFixed(2));
        } else if (changePercent != null && Math.abs(changePercent) < 0.2 && previousClose) {
          changePercent = Number((changePercent * 100).toFixed(2));
        }
        changePercent = changePercent ?? 0;

        const dayHigh =
          extractNumber(priceObj?.regularMarketDayHigh) ??
          extractNumber(meta?.regularMarketDayHigh) ??
          extractNumber(meta?.dayHigh);

        const dayLow =
          extractNumber(priceObj?.regularMarketDayLow) ??
          extractNumber(meta?.regularMarketDayLow) ??
          extractNumber(meta?.dayLow);

        const fiftyTwoWeekHigh =
          extractNumber(detailObj?.fiftyTwoWeekHigh) ??
          extractNumber(meta?.fiftyTwoWeekHigh);

        const fiftyTwoWeekLow =
          extractNumber(detailObj?.fiftyTwoWeekLow) ??
          extractNumber(meta?.fiftyTwoWeekLow);

        const marketCap =
          extractNumber(priceObj?.marketCap) ??
          extractNumber(detailObj?.marketCap);

        const marketCapFormatted = formatMarketCap(marketCap, currency);

        const peRatio =
          extractNumber(detailObj?.trailingPE) ??
          extractNumber(detailObj?.forwardPE);

        const rawDiv = extractNumber(detailObj?.dividendYield);
        const dividendYield =
          rawDiv != null
            ? rawDiv < 1
              ? Number((rawDiv * 100).toFixed(2))
              : Number(rawDiv.toFixed(2))
            : null;

        const sector = extractString(profileObj?.sector);
        const industry = extractString(profileObj?.industry);
        const summary = extractString(profileObj?.longBusinessSummary);

        const heuristics = generateHeuristics({
          peRatio,
          profitMargins: extractNumber(finObj?.profitMargins),
          operatingMargins: extractNumber(finObj?.operatingMargins),
          revenueGrowth: extractNumber(finObj?.revenueGrowth),
          earningsGrowth: extractNumber(finObj?.earningsGrowth),
          debtToEquity: extractNumber(finObj?.debtToEquity),
          dividendYield,
          price,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          roe: extractNumber(finObj?.returnOnEquity),
          operatingCashflow: extractNumber(finObj?.operatingCashflow),
        });

        const asOf =
          meta?.regularMarketTime && typeof meta.regularMarketTime === "number"
            ? new Date(meta.regularMarketTime * 1000).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

        return {
          ticker: symbol,
          name,
          price,
          currency,
          change,
          changePercent,
          dayHigh,
          dayLow,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          marketCap,
          marketCapFormatted,
          peRatio,
          dividendYield,
          sector,
          industry,
          summary,
          strengths: heuristics.strengths,
          watchouts: heuristics.watchouts,
          asOf,
        };
      }
    } catch {
      // Fallback on extraction error
    }
  }

  // Graceful fallback to snapshot.json / offline seeded stock
  return getSnapshotFallback(symbol) ?? getSnapshotFallback(cleanInput);
}
