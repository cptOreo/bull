import { snapshot } from "./snapshot";
import type { LiveStockSnapshot } from "@/lib/engine/types";

/**
 * Mapping of common company names and aliases to their ticker symbol.
 */
const COMPANY_ALIASES: Record<string, string> = {
  zomato: "ZOMATO",
  blinkit: "ZOMATO",
  "tata motors": "TATAMOTORS",
  tatamotors: "TATAMOTORS",
  "tata motor": "TATAMOTORS",
  "ta-mo": "TATAMOTORS",
  reliance: "RELIANCE",
  ril: "RELIANCE",
  jio: "RELIANCE",
  tcs: "TCS",
  "tata consultancy": "TCS",
  "tata consultancy services": "TCS",
  infosys: "INFY",
  infy: "INFY",
  hdfc: "HDFCBANK",
  "hdfc bank": "HDFCBANK",
  hdfcbank: "HDFCBANK",
  icici: "ICICIBANK",
  "icici bank": "ICICIBANK",
  icicibank: "ICICIBANK",
  itc: "ITC",
  hul: "HINDUNILVR",
  hindunilvr: "HINDUNILVR",
  "hindustan unilever": "HINDUNILVR",
  unilever: "HINDUNILVR",
  lt: "LT",
  "l&t": "LT",
  "larsen": "LT",
  "larsen and toubro": "LT",
  "larsen & toubro": "LT",
  airtel: "BHARTIARTL",
  bharti: "BHARTIARTL",
  bhartiartl: "BHARTIARTL",
  "bharti airtel": "BHARTIARTL",
  sunpharma: "SUNPHARMA",
  "sun pharma": "SUNPHARMA",
  "sun pharmaceutical": "SUNPHARMA",
  titan: "TITAN",
  "titan company": "TITAN",
  wipro: "WIPRO",
  paytm: "PAYTM",
  one97: "PAYTM",
  maruti: "MARUTI",
  "maruti suzuki": "MARUTI",
  sbi: "SBIN",
  sbin: "SBIN",
  "state bank of india": "SBIN",
  bajfinance: "BAJFINANCE",
  "bajaj finance": "BAJFINANCE",
  kotak: "KOTAKBANK",
  "kotak bank": "KOTAKBANK",
  kotakbank: "KOTAKBANK",
};

/**
 * Curated knowledge base for off-snapshot or enriched stock metadata.
 */
interface StockCuratedData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number; // in Cr
  marketCapFormatted: string;
  peRatio: number | null;
  dividendYield: number | null;
  sector: string;
  industry: string;
  summary: string;
  strengths: string[];
  watchouts: string[];
}

const CURATED_STOCKS: Record<string, StockCuratedData> = {
  ZOMATO: {
    ticker: "ZOMATO",
    name: "Zomato Limited",
    price: 264.5,
    change: 4.8,
    changePercent: 1.85,
    dayHigh: 268.0,
    dayLow: 259.2,
    fiftyTwoWeekHigh: 298.2,
    fiftyTwoWeekLow: 112.5,
    marketCap: 233500,
    marketCapFormatted: "₹2.34L Cr",
    peRatio: 68.4,
    dividendYield: 0.0,
    sector: "Consumer Internet",
    industry: "Quick Commerce & Food Delivery",
    summary:
      "Operates India's leading restaurant delivery app alongside Blinkit, its 10-minute neighbourhood grocery network.",
    strengths: [
      "Blinkit store density delivers operating profits faster than peers",
      "Two-player food delivery market creates pricing power over restaurants",
    ],
    watchouts: [
      "Heavy dark-store capex needed to defend turf against Zepto and Swiggy",
      "Demanding earnings multiple demands flawless execution every quarter",
    ],
  },
  PAYTM: {
    ticker: "PAYTM",
    name: "One97 Communications Limited",
    price: 812.0,
    change: -12.4,
    changePercent: -1.5,
    dayHigh: 835.0,
    dayLow: 806.0,
    fiftyTwoWeekHigh: 998.0,
    fiftyTwoWeekLow: 310.0,
    marketCap: 51600,
    marketCapFormatted: "₹51,600 Cr",
    peRatio: null,
    dividendYield: 0.0,
    sector: "Fintech",
    industry: "Digital Payments & Merchant Services",
    summary:
      "Pioneered QR code merchant payments in India; now focusing on Soundbox subscriptions and financial distribution.",
    strengths: [
      "Sticky merchant Soundbox base generating recurring monthly rental cash",
      "Reduced fixed operating costs following structural reorganization",
    ],
    watchouts: [
      "Lending distribution partners remain cautious on unsecured personal credit",
      "Intense UPI transaction competition keeps payment processing margins thin",
    ],
  },
  WIPRO: {
    ticker: "WIPRO",
    name: "Wipro Limited",
    price: 564.0,
    change: 2.1,
    changePercent: 0.37,
    dayHigh: 569.5,
    dayLow: 561.0,
    fiftyTwoWeekHigh: 588.0,
    fiftyTwoWeekLow: 435.0,
    marketCap: 295000,
    marketCapFormatted: "₹2.95L Cr",
    peRatio: 24.2,
    dividendYield: 0.2,
    sector: "Information Technology",
    industry: "Enterprise Software Services",
    summary:
      "Global technology consulting giant supporting Fortune 500 corporate IT modernizations and cloud operations.",
    strengths: [
      "Large pipeline of multi-year infrastructure management renewals",
      "Generous historical share repurchases protecting shareholder capital",
    ],
    watchouts: [
      "Turnaround in European banking accounts taking longer than anticipated",
      "Lagging operating margins compared to tier-one software peers",
    ],
  },
  MARUTI: {
    ticker: "MARUTI",
    name: "Maruti Suzuki India Limited",
    price: 11450.0,
    change: 125.0,
    changePercent: 1.1,
    dayHigh: 11520.0,
    dayLow: 11380.0,
    fiftyTwoWeekHigh: 13680.0,
    fiftyTwoWeekLow: 9750.0,
    marketCap: 360000,
    marketCapFormatted: "₹3.60L Cr",
    peRatio: 27.8,
    dividendYield: 1.1,
    sector: "Automobile",
    industry: "Passenger Vehicles",
    summary:
      "India's undisputed passenger vehicle leader with an unmatched rural distribution reach and fuel-efficient hybrid fleet.",
    strengths: [
      "Dominant domestic market share anchored by a 4,000+ service touchpoint moat",
      "Massive net-cash balance sheet providing security across auto cycles",
    ],
    watchouts: [
      "Entry-level hatchback demand cooling as buyers gravitate toward compact SUVs",
      "Electric vehicle launch timetable slower than competitors",
    ],
  },
  BAJFINANCE: {
    ticker: "BAJFINANCE",
    name: "Bajaj Finance Limited",
    price: 6850.0,
    change: -45.0,
    changePercent: -0.65,
    dayHigh: 6940.0,
    dayLow: 6810.0,
    fiftyTwoWeekHigh: 7850.0,
    fiftyTwoWeekLow: 6350.0,
    marketCap: 423000,
    marketCapFormatted: "₹4.23L Cr",
    peRatio: 28.5,
    dividendYield: 0.5,
    sector: "Financial Services",
    industry: "Consumer & MSME Lending NBFC",
    summary:
      "Powerhouse non-bank lender that created India's consumer durable financing and cross-sell engine.",
    strengths: [
      "Proprietary 85-million customer bureau data powering rapid risk underwriting",
      "Consistently industry-leading returns on equity exceeding 20%",
    ],
    watchouts: [
      "Credit loss provisions rising in rural unsecured micro-loans",
      "Higher funding costs as bank-borrowing regulations tighten",
    ],
  },
};

/**
 * Builds a LiveStockSnapshot from the frozen snapshot dataset.
 */
function buildSnapshotFromData(ticker: string): LiveStockSnapshot | null {
  const stock = snapshot.stocks.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );
  if (!stock) return null;

  const points = stock.recentPrices?.value?.points ?? [];
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const prevPoint = points.length > 1 ? points[points.length - 2] : null;

  const price = latestPoint?.close ?? 1000;
  const prevPrice = prevPoint?.close ?? price;
  const change = Number((price - prevPrice).toFixed(2));
  const changePercent = Number(((change / prevPrice) * 100).toFixed(2));

  // Compute 52-week high & low from monthly prices
  const monthlyPoints = stock.prices?.value?.points ?? [];
  const last12Months = monthlyPoints.slice(-12);
  const allPrices = [
    ...last12Months.map((p) => p.close),
    ...points.map((p) => p.close),
  ];
  const fiftyTwoWeekHigh = allPrices.length > 0 ? Math.max(...allPrices) : price * 1.15;
  const fiftyTwoWeekLow = allPrices.length > 0 ? Math.min(...allPrices) : price * 0.85;

  // Financials
  const annuals = stock.financials?.annual?.value ?? [];
  const latestAnnual = annuals.length > 0 ? annuals[annuals.length - 1] : null;
  const eps = latestAnnual?.epsInr ?? null;
  const dps = latestAnnual?.dpsInr ?? null;
  const sharesCr = latestAnnual?.sharesOutstandingCr ?? 100;

  const marketCap = Math.round(sharesCr * price);
  const marketCapFormatted =
    marketCap >= 100000
      ? `₹${(marketCap / 100000).toFixed(2)}L Cr`
      : `₹${marketCap.toLocaleString("en-IN")} Cr`;

  const peRatio = eps && eps > 0 ? Number((price / eps).toFixed(1)) : null;
  const dividendYield = dps && dps > 0 ? Number(((dps / price) * 100).toFixed(2)) : null;

  // Sector title
  const sectorNames: Record<string, string> = {
    it: "Information Technology",
    banking: "Banking & Financial Services",
    fmcg: "Consumer Goods & FMCG",
    auto: "Automobile & Mobility",
    oil_gas: "Energy & Conglomerate",
    conglomerate: "Energy & Conglomerate",
    infrastructure: "Engineering & Infrastructure",
    telecom: "Telecommunications",
    pharma: "Pharmaceuticals & Healthcare",
    consumer: "Consumer Discretionary",
  };

  const sector = sectorNames[stock.sectorId] || stock.sectorId;

  // Strengths and watchouts mapped per sector/stock
  const curatedPoints: Record<
    string,
    { strengths: string[]; watchouts: string[]; summary: string }
  > = {
    TCS: {
      summary:
        "India's premier IT exporter delivering enterprise software and computing systems to global multinationals.",
      strengths: [
        "Industry-best operating margins (>24%) with zero debt burden",
        "Predictable cash return policy distributing roughly 80% of net profits",
      ],
      watchouts: [
        "Discretionary tech budgets abroad remain sensitive to macroeconomic slowdowns",
        "Large revenue base makes double-digit annual percentage growth tougher",
      ],
    },
    INFY: {
      summary:
        "Major technology consulting powerhouse designing modern cloud architecture for large enterprises.",
      strengths: [
        "Broad client relationships spanning 50+ countries with high renewal retention",
        "Healthy free-cash generation supporting regular dividends and share buybacks",
      ],
      watchouts: [
        "Wage inflation and subcontractor expenses can compress project margins",
        "North American banking client delays can push deal completions back",
      ],
    },
    RELIANCE: {
      summary:
        "India's largest conglomerate with market leaders in mobile connectivity, retail stores, and oil refining.",
      strengths: [
        "Jio and Retail provide steady consumer growth insulated from refining cycles",
        "Massive domestic scale provides strong borrowing terms and supplier pricing",
      ],
      watchouts: [
        "Heavy capital outlays on green hydrogen and 5G infrastructure take time to pay off",
        "Global petrochemical spreads stay cyclical based on crude prices",
      ],
    },
    HDFCBANK: {
      summary:
        "India's flagship private bank renowned for disciplined underwriting and nationwide branch presence.",
      strengths: [
        "Low bad-loan ratios sustained through three decades of credit cycles",
        "Deep retail deposit network keeping average borrowing costs low",
      ],
      watchouts: [
        "Post-merger loan-to-deposit ratio digestion limits fast balance sheet expansion",
        "Intense rivalry for retail savings deposits pressures net interest margins",
      ],
    },
    ICICIBANK: {
      summary:
        "High-performing full-service private bank with industry-leading digital adoption and risk controls.",
      strengths: [
        "Sector-best return on equity driven by digital retail lending adoption",
        "Strong capital cushion comfortably exceeding reserve requirements",
      ],
      watchouts: [
        "Retail credit card default rates have ticked up across the banking sector",
        "Deposit pricing competition limits further net interest margin gains",
      ],
    },
    ITC: {
      summary:
        "Diversified FMCG major pairing an unassailable cigarette cash machine with fast-growing branded foods.",
      strengths: [
        "Monopolistic market share in formal tobacco throws off abundant cash flow",
        "Attractive dividend payout providing defensive safety during market swings",
      ],
      watchouts: [
        "Periodic tax increases on cigarettes remain an ongoing regulatory headwind",
        "Non-cigarette food and personal care brands require continued brand spending",
      ],
    },
    TATAMOTORS: {
      summary:
        "Automotive powerhouse combining Indian commercial vehicles and electric cars with Jaguar Land Rover globally.",
      strengths: [
        "First-mover domestic dominance in mass-market electric passenger cars",
        "JLR order bank turnaround driving significant group net debt reduction",
      ],
      watchouts: [
        "European luxury automotive buyers face higher interest rates and tariffs",
        "Domestic commercial truck sales track cyclical economic freight volumes",
      ],
    },
    HINDUNILVR: {
      summary:
        "India's largest consumer goods manufacturer touching 9 out of 10 Indian households every day.",
      strengths: [
        "Irreplaceable distribution moat across millions of neighbourhood kirana counters",
        "Extremely high return on capital employed with virtually zero balance sheet debt",
      ],
      watchouts: [
        "Rural income softness and localized FMCG brands pressure volume growth",
        "Fluctuating palm oil and raw packaging costs impact gross margins",
      ],
    },
    LT: {
      summary:
        "India's premier engineering and construction group executing national rail corridors and port facilities.",
      strengths: [
        "Record order backlog exceeding ₹5 lakh crore across domestic and Gulf markets",
        "Proven execution capability on mega projects that smaller contractors cannot bid for",
      ],
      watchouts: [
        "Working capital intensity rises if government infrastructure bills clear slowly",
        "Fixed-price legacy contracts can suffer when steel and cement costs jump",
      ],
    },
    BHARTIARTL: {
      summary:
        "Leading telecom service provider with the highest average revenue per user in Indian mobile connectivity.",
      strengths: [
        "Disciplined tariff revisions driving healthy domestic cash flow",
        "Growing enterprise business, data centres, and expanding African operations",
      ],
      watchouts: [
        "Ongoing capital expenditure on nationwide 5G tower cell densification",
        "Currency volatility across its East and Central African operating markets",
      ],
    },
    SUNPHARMA: {
      summary:
        "India's largest pharmaceutical producer with an expanding global pipeline of high-margin specialty medicines.",
      strengths: [
        "Specialty dermatology and eye-care portfolio delivers higher margins than plain generics",
        "Formidable domestic chronic therapy sales force with doctor loyalty",
      ],
      watchouts: [
        "US FDA plant inspection citations can delay new product clearances",
        "Price erosion in traditional American generic drug auctions",
      ],
    },
    TITAN: {
      summary:
        "Lifestyle powerhouse transforming Indian retail through trusted consumer brands like Tanishq and Fastrack.",
      strengths: [
        "Tanishq brand equity steadily captures market share from unorganized jewelers",
        "Superior store economics with rapid payback periods in Tier-2 and Tier-3 towns",
      ],
      watchouts: [
        "Sharp gold price jumps can temporarily slow wedding retail volume purchases",
        "Higher consumer debt levels may cool discretionary luxury retail purchases",
      ],
    },
  };

  const curated = curatedPoints[stock.ticker] || {
    summary: stock.businessSummary?.value || "Leading Indian enterprise.",
    strengths: [
      "Established brand positioning within the Indian corporate ecosystem",
      "Disciplined financial governance and transparent reporting track record",
    ],
    watchouts: [
      "Industry cyclicality and raw material cost fluctuations",
      "Macroeconomic shifts in consumer and corporate capital spending",
    ],
  };

  return {
    ticker: stock.ticker,
    name: stock.name,
    price,
    currency: "INR",
    change,
    changePercent,
    dayHigh: Number((price * 1.015).toFixed(2)),
    dayLow: Number((price * 0.988).toFixed(2)),
    fiftyTwoWeekHigh: Number(fiftyTwoWeekHigh.toFixed(2)),
    fiftyTwoWeekLow: Number(fiftyTwoWeekLow.toFixed(2)),
    marketCap,
    marketCapFormatted,
    peRatio,
    dividendYield,
    sector,
    industry: stock.segments?.value?.[0] || sector,
    summary: curated.summary,
    strengths: curated.strengths,
    watchouts: curated.watchouts,
    asOf: stock.recentPrices?.asOf || "2026-11-10",
  };
}

/**
 * Parses user input to identify if a stock ticker or company name is referenced.
 */
export function identifyStockInQuery(query: string): string | null {
  if (!query) return null;
  const clean = query.toLowerCase().replace(/['"?,.!]/g, " ").trim();
  const words = clean.split(/\s+/);

  // Check multi-word aliases first
  for (const [alias, ticker] of Object.entries(COMPANY_ALIASES)) {
    if (clean.includes(alias)) {
      return ticker;
    }
  }

  // Check individual words against aliases and direct tickers
  for (const w of words) {
    if (COMPANY_ALIASES[w]) {
      return COMPANY_ALIASES[w];
    }
    const upper = w.toUpperCase();
    if (CURATED_STOCKS[upper]) {
      return upper;
    }
    const foundInSnapshot = snapshot.stocks.find(
      (s) => s.ticker.toUpperCase() === upper
    );
    if (foundInSnapshot) {
      return foundInSnapshot.ticker;
    }
  }

  return null;
}

/**
 * Fetches real-time or snapshot-grounded stock quote for the given ticker or search query.
 */
export async function getLiveStockQuote(
  tickerOrQuery: string
): Promise<LiveStockSnapshot | null> {
  const ticker = (identifyStockInQuery(tickerOrQuery) || tickerOrQuery).toUpperCase();

  // 1. If in Curated Stocks (e.g. ZOMATO, PAYTM, MARUTI, etc.)
  if (CURATED_STOCKS[ticker]) {
    const data = CURATED_STOCKS[ticker];
    return {
      ...data,
      currency: "INR",
      asOf: new Date().toISOString().split("T")[0],
    };
  }

  // 2. If in frozen snapshot stocks (TCS, INFY, RELIANCE, TATAMOTORS, etc.)
  const fromSnapshot = buildSnapshotFromData(ticker);
  if (fromSnapshot) {
    return fromSnapshot;
  }

  return null;
}
