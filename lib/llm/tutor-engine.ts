import { LESSONS_DATABASE, type LessonData } from "@/lib/data/lessons";
import { snapshot } from "@/lib/data/snapshot";
import { FINANCIAL_TERMS } from "@/components/ui/glossary-tooltip";
import { PREDEFINED_COMMENTARIES } from "./slopmonster";
import { getLiveStockQuote } from "@/lib/data/live";
import type { Block, Locale, LiveStockSnapshot } from "@/lib/engine/types";

export interface TutorResponse {
  route: string;
  text: string;
  blocks?: Block[];
  followUps: string[];
  stockSnapshot?: LiveStockSnapshot;
}

const COMMON_CONVERSATIONAL_INTENTS: Record<string, { en: string; hiEn: string; followUps: string[] }> = {
  greeting: {
    en: `Hello! I am Bull, your financial education tutor.

I help you analyze companies from a business owner's perspective—evaluating cash generation, operating profit, balance sheet strength, and fair valuation multiples rather than daily stock price noise.

You can ask me:
• How any Indian or global business makes money (e.g. "Tell me about Zomato", "Tata Motors business model")
• How to evaluate valuation ratios (e.g. "What is P/E ratio?", "Explain DCF modeling")
• How to spot accounting red flags (e.g. "Cash flow divergence", "Promoter pledging")

What concept or company would you like to explore?`,
    hiEn: `Namaste! Main Bull hoon, aapka financial education tutor.

Main aapko share market ko ek business owner ke nazarie se samajhne mein madad karta hoon—cash flow, profit margins, balance sheet health aur valuation multiples.

Aap mujhse pooch sakte hain:
• Kisi bhi company ka business model (jaise "Zomato kaise kamata hai?")
• Valuation ratios ka matlab (jaise "P/E ratio kya hota hai?")
• Accounting red flags kaise pehchanein

Aap aaj kis company ya topic ke baare mein jaanna chahte hain?`,
    followUps: [
      "Explain P/E ratio with a kirana store example",
      "Tell me about Zomato's unit economics",
      "How to spot accounting red flags in financial statements",
    ],
  },

  whatIsShare: {
    en: `When you purchase a share, you become a legal fractional owner of an operating business.

You own a proportional slice of its physical buildings, factories, bank balances, customer contracts, and future cash profits. Daily market quotes change based on human sentiment, but your real wealth tracks the company's operating earnings power over time.

Think of it like buying one flat in a 100-flat building: you don't check street quotes every morning; you evaluate your property by the rental income it generates and whether the neighborhood is developing.`,
    hiEn: `Jab aap kisi company ka share khareedte hain, toh aap us business ke hissedar (proportional owner) ban jaate hain.

Aap company ki property, bank balance aur aane wale saalon ke munafey ke hissedar hote hain. Daily stock price market sentiment se badalta hai, lekin lambe samay mein aapki wealth company ke asali munafey par depend karti hai.

Jaise agar aap 100 flats wali building mein 1 flat khareedein, toh aap roz use bechne ki chinta nahi karte; aap dekhte hain ki monthly rent kaisa aa raha hai.`,
    followUps: [
      "What is the difference between equity and debt?",
      "How do company earnings turn into shareholder returns?",
      "Explore the Owner's Mindset lesson",
    ],
  },

  howMarketWorks: {
    en: `The stock market is a public auction house where buyers and sellers exchange fractional deeds of companies.

In the short run (days or weeks), market prices reflect daily emotions, economic headlines, and liquidity. In the long run (years), share prices track the economic earnings power and cash flows of the underlying business.

As Benjamin Graham noted: "In the short run, the market is a voting machine, but in the long run, it is a weighing machine."`,
    hiEn: `Stock market ek public auction ki tarah hai jahan log companies ki hissedari khareedte aur bechte hain.

Short term mein (kuch din ya hafte), prices logon ke emotions aur news par utar-chadhav dikhate hain. Lekin long term mein (saalon mein), share price company ke actual profits aur cash flows ke sath chalti hai.`,
    followUps: [
      "What is P/E ratio?",
      "How do dividends work?",
      "What is an economic moat?",
    ],
  },

  howToStart: {
    en: `The safest way to begin investing is to focus on business literacy before deploying capital:

1. Understand the Business Model: Never invest in a company whose cash engine you cannot explain in plain language to a 10-year-old.
2. Check Financial Solvency: Ensure operating cash flow covers debt obligations comfortably.
3. Demand a Margin of Safety: Never overpay for future growth. Compare P/E, P/B, and EV/EBITDA multiples against historical peer averages.
4. Practice First: Use our Practice Arena simulations to model a DCF or audit financial statements before taking market risk.`,
    hiEn: `Investing shuru karne ka sabse surakshit tareeka hai pehle business samajhna:

1. Business Model Samjhein: Aisi company mein paisa mat lagayein jiska kaam aap asaan bhasha mein na samjha sakein.
2. Karz aur Cash Flow Dekhein: Dekhein ki company debt chukane ke baad clean cash bacha paati hai ya nahi.
3. Sahi Valuation Par Dhyan Dein: Kisi bhi company ke liye bohot zyada price mat dein.
4. Pehle Practice Karein: Hamare Practice Arena mein simulations try karein.`,
    followUps: [
      "Start with the P/E Ratio Lesson",
      "Try the DCF Valuation Simulation",
      "How to read a Balance Sheet",
    ],
  },

  redFlagsSummary: {
    en: `Here are the top accounting red flags cautious investors look for in financial statements:

1. Cash Flow Divergence: The company reports rising net profits on the Income Statement, but Operating Cash Flow on the Cash Flow Statement is negative or falling. Cash in the bank does not lie.
2. Promoter Pledging: Company founders have pledged their shares as collateral for personal or related-party bank loans.
3. Trade Receivables Spikes: Accounts receivable growing much faster than revenue, meaning goods are shipped but customers haven't actually paid.
4. Frequent Auditor Resignations: Mid-term statutory auditor resignations without clear operational reasons.`,
    hiEn: `Financial statements mein ye sabse bade accounting red flags hote hain:

1. Cash Flow Divergence: Net profit paper par badh raha hai, lekin operating cash flow negative hai.
2. Promoter Pledging: Founders ne apne shares bank ke paas girvi (pledge) rakhe hain loan lene ke liye.
3. Trade Receivables ka badhna: Sales se zyada tezi se receivables badhna, matlab maal bika par paisa nahi aaya.
4. Auditor ka resignation: Auditor ka achanak resignation dena warning sign ho sakta hai.`,
    followUps: [
      "Open Red Flag Hunter in Practice Arena",
      "Read Financial Statements Track",
      "Analyze Zomato's Cash Flow",
    ],
  },
};

/**
 * Searches the 33 lesson repository and glossary to answer concept inquiries.
 */
function findConceptMatch(query: string): LessonData | null {
  const q = query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim();
  const tokens = q.split(/\s+/).filter(Boolean);

  // Exact ID checks
  if (LESSONS_DATABASE[q]) return LESSONS_DATABASE[q];

  // Map common user search terms to lesson IDs
  const aliasMap: Record<string, string> = {
    pe: "pe-ratio",
    "p/e": "pe-ratio",
    "price to earnings": "pe-ratio",
    pb: "pb-ratio",
    "p/b": "pb-ratio",
    "price to book": "pb-ratio",
    "book value": "pb-ratio",
    dcf: "dcf-modeling",
    "discounted cash flow": "dcf-modeling",
    roe: "roe",
    "return on equity": "roe",
    roce: "roce",
    "return on capital employed": "roce",
    margin: "operating-margin",
    "operating margin": "operating-margin",
    ebitda: "ev-ebitda",
    "ev ebitda": "ev-ebitda",
    dividend: "dividend-yield",
    "dividend yield": "dividend-yield",
    payout: "payout-ratio",
    "payout ratio": "payout-ratio",
    aristocrat: "aristocrats",
    aristocrats: "aristocrats",
    moat: "network-effects",
    moats: "network-effects",
    "network effect": "network-effects",
    "network effects": "network-effects",
    "switching cost": "switching-costs",
    "switching costs": "switching-costs",
    "pricing power": "pricing-power",
    "balance sheet": "balance-sheet",
    "income statement": "income-statement",
    "cash flow": "cash-flow",
    "operating cash flow": "cash-flow",
    "red flags": "accounting-red-flags",
    "red flag": "accounting-red-flags",
    "working capital": "working-capital",
    "margin of safety": "margin-of-safety",
    peg: "peg-ratio",
    "fcf yield": "fcf-yield",
  };

  for (const [alias, lessonId] of Object.entries(aliasMap)) {
    if (q.includes(alias) && LESSONS_DATABASE[lessonId]) {
      return LESSONS_DATABASE[lessonId];
    }
  }

  // Search by title or tagline match
  for (const lesson of Object.values(LESSONS_DATABASE)) {
    const lTitle = lesson.title.toLowerCase();
    const lTag = lesson.tagline.toLowerCase();
    if (q.includes(lTitle) || lTitle.includes(q)) {
      return lesson;
    }
    const hasWordMatch = tokens.some((t) => t.length > 3 && (lTitle.includes(t) || lTag.includes(t)));
    if (hasWordMatch) {
      return lesson;
    }
  }

  return null;
}

/**
 * Searches curated stocks or predefined commentaries for company business model inquiries.
 */
function findStockMatch(query: string): { ticker: string; name: string; commentary?: string } | null {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();

  // Check predefined commentaries first
  for (const ticker of Object.keys(PREDEFINED_COMMENTARIES)) {
    if (q.includes(ticker.toLowerCase())) {
      const snapStock = snapshot.stocks.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase());
      return {
        ticker,
        name: snapStock ? snapStock.name : ticker,
        commentary: PREDEFINED_COMMENTARIES[ticker],
      };
    }
  }

  // Stock name alias match
  const stockAliases: Record<string, string> = {
    zomato: "ZOMATO",
    blinkit: "ZOMATO",
    "tata motors": "TATAMOTORS",
    tatamotors: "TATAMOTORS",
    reliance: "RELIANCE",
    jio: "RELIANCE",
    tcs: "TCS",
    "tata consultancy": "TCS",
    infosys: "INFY",
    infy: "INFY",
    hdfc: "HDFCBANK",
    "hdfc bank": "HDFCBANK",
    icici: "ICICIBANK",
    "icici bank": "ICICIBANK",
    itc: "ITC",
    hul: "HINDUNILVR",
    unilever: "HINDUNILVR",
    "hindustan unilever": "HINDUNILVR",
    "l&t": "LT",
    larsen: "LT",
    airtel: "BHARTIARTL",
    bharti: "BHARTIARTL",
    "sun pharma": "SUNPHARMA",
    titan: "TITAN",
    tanishq: "TITAN",
    paytm: "PAYTM",
    wipro: "WIPRO",
    maruti: "MARUTI",
    suzuki: "MARUTI",
  };

  for (const [name, ticker] of Object.entries(stockAliases)) {
    if (q.includes(name)) {
      const commentary = PREDEFINED_COMMENTARIES[ticker];
      const snapStock = snapshot.stocks.find((s) => s.ticker === ticker);
      return {
        ticker,
        name: snapStock ? snapStock.name : name.toUpperCase(),
        commentary,
      };
    }
  }

  return null;
}

/**
 * Master educational tutor answering engine.
 * Guaranteed to return clear, verified educational responses with 0 AI slop.
 */
export async function generateTutorResponse(
  message: string,
  locale: Locale = "en"
): Promise<TutorResponse> {
  const clean = message.trim();
  const lower = clean.toLowerCase();

  // 1. General conversational intents
  if (/^(hi|hello|hey|namaste|greetings|start|who are you|help|kya hal hai)/i.test(lower) || lower.length < 3) {
    const data = COMMON_CONVERSATIONAL_INTENTS.greeting;
    return {
      route: "greeting",
      text: locale === "hi-en" ? data.hiEn : data.en,
      followUps: data.followUps,
    };
  }

  if (/what is (a )?share|what is (a )?stock|share kya hota hai|stock kya hota hai/i.test(lower)) {
    const data = COMMON_CONVERSATIONAL_INTENTS.whatIsShare;
    return {
      route: "concept",
      text: locale === "hi-en" ? data.hiEn : data.en,
      followUps: data.followUps,
    };
  }

  if (/how (does )?(the )?market work|how does stock market work|market kaise kaam karta hai/i.test(lower)) {
    const data = COMMON_CONVERSATIONAL_INTENTS.howMarketWorks;
    return {
      route: "concept",
      text: locale === "hi-en" ? data.hiEn : data.en,
      followUps: data.followUps,
    };
  }

  if (/how to start|how do i start|where to start|shuru kaise karein|beginner/i.test(lower)) {
    const data = COMMON_CONVERSATIONAL_INTENTS.howToStart;
    return {
      route: "concept",
      text: locale === "hi-en" ? data.hiEn : data.en,
      followUps: data.followUps,
    };
  }

  if (/red flag|fraud|divergence|pledging|audit/i.test(lower) && !lower.includes("vs")) {
    const data = COMMON_CONVERSATIONAL_INTENTS.redFlagsSummary;
    return {
      route: "concept",
      text: locale === "hi-en" ? data.hiEn : data.en,
      followUps: data.followUps,
    };
  }

  // 2. Financial concept inquiries (33 Skill Tree Lessons)
  const matchedLesson = findConceptMatch(clean);
  if (matchedLesson) {
    const lessonText = `### ${matchedLesson.title}

${matchedLesson.plainEnglish}

**Mental Model (${matchedLesson.mentalModel.title}):**
${matchedLesson.mentalModel.description}

**Why It Matters to an Owner:**
${matchedLesson.whyItMatters}

**Formula:**
\`${matchedLesson.formula.expression}\`

[Explore the full 5-Step ${matchedLesson.title} Lesson →](/learn/${matchedLesson.id})`;

    return {
      route: "concept",
      text: lessonText,
      followUps: [
        `How does ${matchedLesson.defaultStock.name} look on this metric?`,
        "Try another valuation multiple",
        "View Skill Tree curriculum",
      ],
    };
  }

  // 3. Stock business model & valuation inquiries
  const matchedStock = findStockMatch(clean);
  if (matchedStock) {
    let quote: LiveStockSnapshot | null = null;
    try {
      quote = await getLiveStockQuote(matchedStock.ticker);
    } catch {
      // Offline fallback
    }

    const commentary =
      matchedStock.commentary ||
      `**${matchedStock.name}** operates across core Indian commercial sectors. When analyzing this company as an owner, evaluate its operating margin stability, debt obligations, and free cash flow generation rather than short-term price movements.`;

    const stockResponseText = `### ${matchedStock.name} (${matchedStock.ticker})

${commentary}

${quote ? `**Live Snapshot:** Current Price: ₹${quote.price} · P/E Multiple: ${quote.peRatio ? `${quote.peRatio}x` : "N/A"} · 52-Week Range: ₹${quote.dayLow} - ₹${quote.dayHigh}` : ""}

[Open in Live Stock Dissector →](/stock/${matchedStock.ticker})`;

    return {
      route: "stock_detail",
      text: stockResponseText,
      stockSnapshot: quote || undefined,
      followUps: [
        `Compare ${matchedStock.name} with industry peers`,
        `Check ${matchedStock.name}'s balance sheet debt`,
        "Ask about valuation multiples",
      ],
    };
  }

  // 4. Fallback: Search glossary terms or provide Socratic guidance
  const queryTokens = clean.toLowerCase().split(/\s+/).filter(Boolean);
  const termMatch = Object.values(FINANCIAL_TERMS).find((t) =>
    queryTokens.some((tok) => tok.length > 3 && t.name.toLowerCase().includes(tok))
  );

  if (termMatch) {
    return {
      route: "concept",
      text: `### ${termMatch.name} (${termMatch.shortLabel})

${termMatch.definition}

**Real-World Analogy:**
${termMatch.analogy}

${termMatch.formula ? `**Formula:** \`${termMatch.formula}\`` : ""}
${termMatch.ruleOfThumb ? `**Rule of Thumb:** ${termMatch.ruleOfThumb}` : ""}`,
      followUps: [
        "How do investors use this in practice?",
        "Compare with other ratios",
        "Explore the Skill Tree",
      ],
    };
  }

  // 5. Default natural Socratic response
  return {
    route: "general",
    text: `That is an interesting question about "${clean}".

In business valuation and equity analysis, we evaluate every company through three core lenses:
1. **The Cash Engine:** Does the company produce clean operating cash flow, or does it consume cash to survive?
2. **The Economic Moat:** Can competitors easily copy the product, or does customer switching cost and brand loyalty defend its profit margins?
3. **The Margin of Safety:** Are you buying at a fair price relative to its annual earnings power?

You can ask me to break down any specific stock (e.g. Zomato, Reliance, TCS, Tata Motors) or any valuation metric (e.g. P/E ratio, DCF, ROE, Moats).`,
    followUps: [
      "Explain P/E Ratio with kirana store analogy",
      "Tell me about Zomato's business model",
      "How to read a Balance Sheet",
    ],
  };
}
