export interface YahooSearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  exchange?: string;
  quoteType?: string;
  typeDisp?: string;
}

export interface YahooQuoteSummary {
  price?: {
    regularMarketPrice?: { raw: number; fmt: string };
    regularMarketChange?: { raw: number; fmt: string };
    regularMarketChangePercent?: { raw: number; fmt: string };
    regularMarketPreviousClose?: { raw: number };
    regularMarketDayHigh?: { raw: number };
    regularMarketDayLow?: { raw: number };
    fiftyTwoWeekHigh?: { raw: number };
    fiftyTwoWeekLow?: { raw: number };
    marketCap?: { raw: number; fmt: string };
    currency?: { raw: string };
    shortName?: string;
    longName?: string;
    exchange?: string;
  };
  summaryDetail?: {
    trailingPE?: { raw: number; fmt: string };
    forwardPE?: { raw: number; fmt: string };
    priceToBook?: { raw: number; fmt: string };
    dividendYield?: { raw: number; fmt: string };
    profitMargins?: { raw: number };
    operatingMargins?: { raw: number };
    returnOnEquity?: { raw: number };
    returnOnAssets?: { raw: number };
    debtToEquity?: { raw: number };
    currentRatio?: { raw: number };
    quickRatio?: { raw: number };
  };
  financialData?: {
    revenueGrowth?: { raw: number };
    earningsGrowth?: { raw: number };
    ebitdaMargins?: { raw: number };
    operatingCashflow?: { raw: number };
    freeCashflow?: { raw: number };
  };
  defaultKeyStatistics?: {
    enterpriseValue?: { raw: number };
    forwardEps?: { raw: number };
    trailingEps?: { raw: number };
    bookValue?: { raw: number };
    sharesOutstanding?: { raw: number };
  };
  assetProfile?: {
    sector?: string;
    industry?: string;
    longBusinessSummary?: string;
    fullTimeEmployees?: number;
  };
}

const YAHOO_BASE = "https://query1.finance.yahoo.com";
const YAHOO_BASE_V2 = "https://query2.finance.yahoo.com";
const TIMEOUT = 4000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractRaw<T>(obj: { raw?: T } | undefined): T | null {
  return obj?.raw ?? null;
}

export async function searchStocks(query: string): Promise<Array<{
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  price?: number;
  changePercent?: number;
}>> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(trimmed)}&quotesCount=10&newsCount=0`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);

    const data = await res.json();
    if (!data.quotes?.length) return [];

    return data.quotes
      .filter((q: YahooSearchResult) => q.symbol && (q.quoteType === "EQUITY" || q.typeDisp?.toUpperCase() === "EQUITY"))
      .slice(0, 8)
      .map((q: YahooSearchResult) => ({
        symbol: q.symbol!,
        name: q.longname || q.shortname || q.symbol!,
        exchange: q.exchDisp || q.exchange || "NSE",
        type: q.typeDisp || q.quoteType || "EQUITY",
      }));
  } catch (error) {
    console.warn("Yahoo search failed:", error);
    return [];
  }
}

export async function getQuoteSummary(symbol: string): Promise<YahooQuoteSummary | null> {
  const modules = "price,summaryDetail,financialData,defaultKeyStatistics,assetProfile";
  const url = `${YAHOO_BASE_V2}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Quote summary failed: ${res.status}`);

    const data = await res.json();
    return data.quoteSummary?.result?.[0] ?? null;
  } catch (error) {
    console.warn(`Yahoo quote summary failed for ${symbol}:`, error);
    return null;
  }
}

export async function getPriceHistory(
  symbol: string,
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max" = "1y",
  interval: "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1wk" | "1mo" = "1d"
): Promise<{ timestamps: number[]; closes: number[]; highs: number[]; lows: number[]; volumes: number[] } | null> {
  const url = `${YAHOO_BASE_V2}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Price history failed: ${res.status}`);

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const indicators = result.indicators?.quote?.[0] || {};

    return {
      timestamps,
      closes: indicators.close || [],
      highs: indicators.high || [],
      lows: indicators.low || [],
      volumes: indicators.volume || [],
    };
  } catch (error) {
    console.warn(`Yahoo price history failed for ${symbol}:`, error);
    return null;
  }
}

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
  pbRatio: number | null;
  dividendYield: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  sector: string | null;
  industry: string | null;
  summary: string | null;
  strengths: string[];
  watchouts: string[];
  asOf: string;
  source: "yahoo" | "screener" | "snapshot";
  financials?: {
    currency: "INR";
    units: "crore";
    basis: "consolidated" | "standalone";
    annual: {
      value: Array<{
        fy: string;
        periodEnd: string;
        sourceId: string;
        revenueCr: number;
        ebitdaCr: number;
        ebitCr: number;
        patCr: number;
        epsInr: number;
        dpsInr: number;
        netWorthCr: number;
        totalDebtCr: number;
        interestExpenseCr: number;
        operatingCashFlowCr: number;
        sharesOutstandingCr: number;
        cashAndEquivalentsCr?: number;
      }> | null;
      asOf: string;
      source: string;
      note?: string;
    };
  };
}

function formatMarketCap(marketCap: number | null, currency: string): string {
  if (!marketCap) return "N/A";
  const prefix = currency === "INR" ? "₹" : "$";
  if (marketCap >= 1e12) return `${prefix}${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `${prefix}${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `${prefix}${(marketCap / 1e6).toFixed(2)}M`;
  if (currency === "INR") {
    const crore = marketCap / 1e7;
    if (crore >= 1e5) return `${prefix}${(crore / 1e5).toFixed(2)}L Cr`;
    return `${prefix}${crore.toLocaleString("en-IN")} Cr`;
  }
  return `${prefix}${marketCap.toLocaleString()}`;
}

interface HeuristicInputs {
  peRatio: number | null;
  pbRatio: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  currentRatio: number | null;
  freeCashflow: number | null;
}

function generateHeuristics(input: HeuristicInputs): { strengths: string[]; watchouts: string[] } {
  const { peRatio, pbRatio, operatingMargin, netMargin, roe, roce, debtToEquity, dividendYield, revenueGrowth, earningsGrowth, currentRatio, freeCashflow } = input;
  const strengths: string[] = [];
  const watchouts: string[] = [];

  if (operatingMargin != null && operatingMargin >= 15) {
    strengths.push(`Strong operating margin (${operatingMargin.toFixed(1)}%) reflecting solid pricing power`);
  } else if (netMargin != null && netMargin >= 12) {
    strengths.push(`Healthy net profit margin (${netMargin.toFixed(1)}%) demonstrating bottom-line discipline`);
  }

  if (peRatio != null && peRatio > 0 && peRatio <= 25) {
    strengths.push(`Reasonable valuation multiple (P/E of ${peRatio.toFixed(1)}x) offering favorable risk-reward`);
  } else if (pbRatio != null && pbRatio > 0 && pbRatio <= 3) {
    strengths.push(`Attractive price-to-book (${pbRatio.toFixed(1)}x) suggesting asset value cushion`);
  }

  if (debtToEquity != null && debtToEquity <= 0.3) {
    strengths.push(`Conservative balance sheet with minimal debt leverage (${debtToEquity.toFixed(2)}x)`);
  }

  if (roe != null && roe >= 15) {
    strengths.push(`High return on equity (${roe.toFixed(1)}%) indicating efficient capital allocation`);
  } else if (roce != null && roce >= 15) {
    strengths.push(`Strong return on capital employed (${roce.toFixed(1)}%) showing effective reinvestment`);
  }

  if (dividendYield != null && dividendYield >= 1.5) {
    strengths.push(`Consistent dividend yield (${dividendYield.toFixed(1)}%) returning cash to shareholders`);
  }

  if (freeCashflow != null && freeCashflow > 0) {
    strengths.push("Positive free cash flow supporting shareholder returns and reinvestment");
  }

  if (currentRatio != null && currentRatio >= 1.5) {
    strengths.push(`Healthy current ratio (${currentRatio.toFixed(1)}x) indicating short-term liquidity`);
  }

  if (earningsGrowth != null && earningsGrowth >= 10) {
    strengths.push(`Robust earnings growth (${earningsGrowth.toFixed(1)}% YoY) driving value creation`);
  } else if (revenueGrowth != null && revenueGrowth >= 8) {
    strengths.push(`Steady revenue growth (${revenueGrowth.toFixed(1)}% YoY) indicating healthy demand`);
  }

  const defaultStrengths = [
    "Established market leadership with strong brand equity",
    "Resilient operational cash generation supporting reinvestment",
  ];
  for (const s of defaultStrengths) {
    if (strengths.length < 2 && !strengths.includes(s)) strengths.push(s);
  }

  if (peRatio != null && peRatio > 50) {
    watchouts.push(`High valuation multiple (P/E of ${peRatio.toFixed(1)}x > 50x) leaves minimal margin of safety`);
  } else if (peRatio != null && peRatio > 35) {
    watchouts.push(`Elevated valuation multiple (P/E of ${peRatio.toFixed(1)}x) demands strong forward execution`);
  }

  if (pbRatio != null && pbRatio > 5) {
    watchouts.push(`High price-to-book (${pbRatio.toFixed(1)}x) suggests limited asset coverage`);
  }

  if (debtToEquity != null && debtToEquity > 1.5) {
    watchouts.push(`High financial leverage (D/E of ${debtToEquity.toFixed(2)}x) elevates sensitivity to rate spikes`);
  }

  if (netMargin != null && netMargin > 0 && netMargin < 5) {
    watchouts.push("Thin profit margins vulnerable to input cost fluctuations");
  } else if (netMargin != null && netMargin <= 0) {
    watchouts.push("Operating at negative net profit margin requiring turnaround execution");
  }

  if (roe != null && roe < 8) {
    watchouts.push(`Low return on equity (${roe.toFixed(1)}%) indicating poor capital efficiency`);
  }

  if (currentRatio != null && currentRatio < 1) {
    watchouts.push(`Current ratio below 1.0x (${currentRatio.toFixed(1)}x) signals potential liquidity stress`);
  }

  if (earningsGrowth != null && earningsGrowth < 0) {
    watchouts.push(`Earnings contraction (${earningsGrowth.toFixed(1)}% YoY) signaling fundamental deterioration`);
  }

  if (freeCashflow != null && freeCashflow < 0) {
    watchouts.push("Negative free cash flow requiring external funding for operations");
  }

  const defaultWatchouts = [
    "Exposed to macroeconomic cycles, inflation, and rate volatility",
    "Industry competition may require ongoing capital expenditures",
  ];
  for (const w of defaultWatchouts) {
    if (watchouts.length < 1 && !watchouts.includes(w)) watchouts.push(w);
  }

  return { strengths: strengths.slice(0, 2), watchouts: watchouts.slice(0, 2) };
}

export async function getStockSnapshot(symbol: string): Promise<LiveStockSnapshot | null> {
  const [summary] = await Promise.allSettled([
    getQuoteSummary(symbol),
  ]);

  if (summary.status === "rejected" || !summary.value) {
    return null;
  }

  const data = summary.value;
  const price = data.price;
  const summaryDetail = data.summaryDetail;
  const financialData = data.financialData;
  const profile = data.assetProfile;

  if (!price?.regularMarketPrice?.raw) return null;

  const currentPrice = price.regularMarketPrice.raw;
  const previousClose = price.regularMarketPreviousClose?.raw ?? currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  const marketCap = price.marketCap?.raw ?? null;
  const currency = price.currency?.raw ?? (symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD");

  const peRatio = extractRaw(summaryDetail?.trailingPE) ?? extractRaw(summaryDetail?.forwardPE) ?? null;
  const pbRatio = extractRaw(summaryDetail?.priceToBook) ?? null;
  const dividendYield = extractRaw(summaryDetail?.dividendYield);
  const roe = extractRaw(summaryDetail?.returnOnEquity);
  const roce = extractRaw(summaryDetail?.returnOnAssets);
  const operatingMargin = extractRaw(financialData?.ebitdaMargins) ?? extractRaw(summaryDetail?.operatingMargins) ?? null;
  const netMargin = extractRaw(summaryDetail?.profitMargins) ?? null;
  const debtToEquity = extractRaw(summaryDetail?.debtToEquity) ?? null;

  const { strengths, watchouts } = generateHeuristics({
    peRatio,
    pbRatio,
    operatingMargin,
    netMargin,
    roe,
    roce,
    debtToEquity,
    dividendYield,
    revenueGrowth: extractRaw(financialData?.revenueGrowth),
    earningsGrowth: extractRaw(financialData?.earningsGrowth),
    currentRatio: extractRaw(summaryDetail?.currentRatio),
    freeCashflow: extractRaw(financialData?.freeCashflow),
  });

  return {
    ticker: symbol,
    name: price.longName || price.shortName || symbol,
    price: currentPrice,
    currency,
    change,
    changePercent,
    dayHigh: extractRaw(price.regularMarketDayHigh) ?? null,
    dayLow: extractRaw(price.regularMarketDayLow) ?? null,
    fiftyTwoWeekHigh: extractRaw(price.fiftyTwoWeekHigh) ?? null,
    fiftyTwoWeekLow: extractRaw(price.fiftyTwoWeekLow) ?? null,
    marketCap,
    marketCapFormatted: formatMarketCap(marketCap, currency),
    peRatio,
    pbRatio,
    dividendYield: dividendYield ? (dividendYield < 1 ? dividendYield * 100 : dividendYield) : null,
    roe: roe ? roe * 100 : null,
    roce: roce ? roce * 100 : null,
    debtToEquity,
    operatingMargin: operatingMargin ? operatingMargin * 100 : null,
    netMargin: netMargin ? netMargin * 100 : null,
    sector: profile?.sector ?? null,
    industry: profile?.industry ?? null,
    summary: profile?.longBusinessSummary ?? null,
    strengths,
    watchouts,
    asOf: new Date().toISOString().split("T")[0],
    source: "yahoo",
  };
}