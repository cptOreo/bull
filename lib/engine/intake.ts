import type {
  Goal,
  Horizon,
  RiskComfort,
  Experience,
  Locale,
  ProfileField,
  PartialProfile,
  Block,
  Option,
} from "./types";

export type ConversationStage =
  | "new"
  | "profiling"
  | "shortlisting"
  | "comparing"
  | "exploring"
  | "educating";

export type ParsedAmount = {
  raw: string;
  value: number;
  type: "sip" | "lumpsum" | "general";
};

export type ParsedEntities = {
  tickers: string[];
  sectors: string[];
  amounts: ParsedAmount[];
  rawNumbers: number[];
  concepts: string[];
};

export type IntakeResult = {
  profile: PartialProfile;
  assumed: ProfileField[];
  explicit: ProfileField[];
  missing: ProfileField[];
  complete: boolean;
  stage: ConversationStage;
  nextQuestion: Block | null;
  entities: ParsedEntities;
};

export const INTAKE_FIELD_SEQUENCE: readonly ProfileField[] = [
  "goal",
  "horizon",
  "riskComfort",
  "experience",
  "locale",
] as const;

/** Canonical ticker alias map */
const TICKER_ALIASES: Record<string, string> = {
  INFY: "INFY",
  INFOSYS: "INFY",
  TCS: "TCS",
  "TATA CONSULTANCY": "TCS",
  "TATA CONSULTANCY SERVICES": "TCS",
  HDFCBANK: "HDFCBANK",
  "HDFC BANK": "HDFCBANK",
  HDFC: "HDFCBANK",
  ICICIBANK: "ICICIBANK",
  "ICICI BANK": "ICICIBANK",
  ICICI: "ICICIBANK",
  ITC: "ITC",
  HINDUNILVR: "HINDUNILVR",
  HUL: "HINDUNILVR",
  "HINDUSTAN UNILEVER": "HINDUNILVR",
  TATAMOTORS: "TATAMOTORS",
  "TATA MOTORS": "TATAMOTORS",
  TAMO: "TATAMOTORS",
  RELIANCE: "RELIANCE",
  RIL: "RELIANCE",
  LT: "LT",
  "L&T": "LT",
  "LARSEN": "LT",
  "LARSEN & TOUBRO": "LT",
  "LARSEN AND TOUBRO": "LT",
  BHARTIARTL: "BHARTIARTL",
  "BHARTI AIRTEL": "BHARTIARTL",
  AIRTEL: "BHARTIARTL",
  SUNPHARMA: "SUNPHARMA",
  "SUN PHARMA": "SUNPHARMA",
  "SUN PHARMACEUTICAL": "SUNPHARMA",
  TITAN: "TITAN",
  "TITAN COMPANY": "TITAN",
};

/** Sector alias map */
const SECTOR_ALIASES: Record<string, string> = {
  it: "it",
  tech: "it",
  technology: "it",
  software: "it",
  banking: "financial",
  bank: "financial",
  financial: "financial",
  finance: "financial",
  lending: "financial",
  fmcg: "fmcg",
  "consumer goods": "fmcg",
  auto: "automobile",
  automobile: "automobile",
  automotive: "automobile",
  car: "automobile",
  energy: "energy",
  oil: "energy",
  gas: "energy",
  petroleum: "energy",
  "capital goods": "capital_goods",
  infra: "capital_goods",
  infrastructure: "capital_goods",
  telecom: "telecom",
  telecommunications: "telecom",
  pharma: "healthcare",
  pharmaceutical: "healthcare",
  healthcare: "healthcare",
  "consumer discretionary": "consumer_discretionary",
  retail: "consumer_discretionary",
  jewellery: "consumer_discretionary",
  jewelry: "consumer_discretionary",
};

/**
 * Question templates and options for all 5 intake fields (§6.3).
 */
const INTAKE_QUESTIONS: Record<
  ProfileField,
  {
    en: { question: string; options: Option[] };
    "hi-en": { question: string; options: Option[] };
  }
> = {
  goal: {
    en: {
      question:
        "What matters most for this money: growing wealth, regular dividends, learning how stocks work, or protecting capital?",
      options: [
        { label: "Grow wealth over time", value: "grow_wealth" },
        { label: "Regular dividend income", value: "dividends" },
        { label: "Learn how companies work", value: "learn" },
        { label: "Protect what I have", value: "preserve" },
      ],
    },
    "hi-en": {
      question:
        "Is paise ke liye sabse zaroori kya hai: wealth grow karna, regular dividends, stocks samajhna ya capital protect karna?",
      options: [
        { label: "Lambi muddat mein wealth grow karna", value: "grow_wealth" },
        { label: "Regular dividend income paana", value: "dividends" },
        { label: "Companies kaise kaam karti hain sikhna", value: "learn" },
        { label: "Apni capital ko surakshit rakhna", value: "preserve" },
      ],
    },
  },
  horizon: {
    en: {
      question: "When might you need this money?",
      options: [
        { label: "1 to 3 years", value: "1_3y" },
        { label: "3 to 5 years", value: "3_5y" },
        { label: "5 to 10 years", value: "5_10y" },
        { label: "10 years or more", value: "10y_plus" },
      ],
    },
    "hi-en": {
      question: "Aapko is paise ki zaroorat kab tak pad sakti hai?",
      options: [
        { label: "1 se 3 saal", value: "1_3y" },
        { label: "3 se 5 saal", value: "3_5y" },
        { label: "5 se 10 saal", value: "5_10y" },
        { label: "10 saal ya usse zyada", value: "10y_plus" },
      ],
    },
  },
  riskComfort: {
    en: {
      question:
        "If your stocks fell, how big a fall could you live with without selling: about 10%, about 20%, about 30% or more, or not sure?",
      options: [
        { label: "About 10%", value: "low" },
        { label: "About 20%", value: "medium" },
        { label: "About 30% or more", value: "high" },
        { label: "Not sure", value: "unsure" },
      ],
    },
    "hi-en": {
      question:
        "Agar stock prices mein girawat aaye, toh bina panic kiye kitna drop jhel sakte hain: lagbhag 10%, 20%, 30% ya unsure?",
      options: [
        { label: "Lagbhag 10%", value: "low" },
        { label: "Lagbhag 20%", value: "medium" },
        { label: "30% ya usse zyada", value: "high" },
        { label: "Sure nahi hain", value: "unsure" },
      ],
    },
  },
  experience: {
    en: {
      question:
        "How much have you done so far: never bought a stock, bought a few, or only mutual fund SIPs?",
      options: [
        { label: "Never bought a stock", value: "none" },
        { label: "Bought a few", value: "few" },
        { label: "Only mutual fund SIPs", value: "sip" },
      ],
    },
    "hi-en": {
      question: "Stock market mein abhi tak aapka kitna experience raha hai?",
      options: [
        { label: "Direct stocks mein bilkul naye hain", value: "none" },
        { label: "Kuch companies mein invest kiya hai", value: "few" },
        { label: "Sirf mutual fund SIPs kiye hain", value: "sip" },
      ],
    },
  },
  locale: {
    en: {
      question: "Reply in English or Hinglish?",
      options: [
        { label: "English", value: "en" },
        { label: "Hinglish", value: "hi-en" },
      ],
    },
    "hi-en": {
      question: "Aap explanations aur calculations kis language mein chahte hain?",
      options: [
        { label: "English", value: "en" },
        { label: "Hinglish", value: "hi-en" },
      ],
    },
  },
};

/**
 * Returns the next unanswered intake question block in sequence (§6.3),
 * or null if all 5 profile fields are answered.
 */
export function getNextIntakeQuestion(
  profile: PartialProfile,
  locale: Locale = "en",
): Block | null {
  for (const field of INTAKE_FIELD_SEQUENCE) {
    if (profile[field] === undefined) {
      const config = INTAKE_QUESTIONS[field][locale] ?? INTAKE_QUESTIONS[field].en;
      return {
        type: "intake_question",
        field,
        question: config.question,
        options: config.options,
      };
    }
  }
  return null;
}

/**
 * Extracts entities: tickers, sectors, concepts, and rupee amounts.
 */
function extractEntities(text: string): ParsedEntities {
  const norm = text.toLowerCase();

  // 1. Tickers
  const matchedTickers = new Set<string>();
  for (const [alias, ticker] of Object.entries(TICKER_ALIASES)) {
    const pattern = new RegExp(`\\b${alias.toLowerCase().replace(/&/g, "(?:&|and)")}\\b`, "i");
    if (pattern.test(norm) || text.includes(alias)) {
      matchedTickers.add(ticker);
    }
  }

  // 2. Sectors
  const matchedSectors = new Set<string>();
  for (const [alias, sector] of Object.entries(SECTOR_ALIASES)) {
    const pattern = new RegExp(`\\b${alias}\\b`, "i");
    if (pattern.test(norm)) {
      matchedSectors.add(sector);
    }
  }

  // 3. Concepts
  const matchedConcepts = new Set<string>();
  const conceptKeywords: Record<string, string> = {
    "p/e": "C3",
    pe: "C3",
    "p/b": "C4",
    pb: "C4",
    roe: "C5",
    roce: "C5",
    debt: "C6",
    drawdown: "C7",
    volatility: "C7",
    diversification: "C8",
    concentration: "C8",
  };
  for (const [keyword, conceptId] of Object.entries(conceptKeywords)) {
    if (new RegExp(`\\b${keyword}\\b`, "i").test(norm)) {
      matchedConcepts.add(conceptId);
    }
  }

  // 4. Amounts & Raw Numbers
  const amounts: ParsedAmount[] = [];
  const rawNumbers: number[] = [];

  // Match currency tokens: ₹1,000, Rs. 10000, 2 lakh, 50k
  const currencyRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k)?/gi;
  let match: RegExpExecArray | null;

  while ((match = currencyRegex.exec(text)) !== null) {
    const numPart = parseFloat(match[1].replace(/,/g, ""));
    const unit = (match[2] ?? "").toLowerCase();
    let multiplier = 1;
    if (unit === "k") multiplier = 1000;
    else if (unit === "lakh" || unit === "lac") multiplier = 100000;
    else if (unit === "crore" || unit === "cr") multiplier = 10000000;

    const value = numPart * multiplier;
    const raw = match[0].trim();

    // Determine type
    const surrounding = text
      .slice(Math.max(0, match.index - 20), Math.min(text.length, match.index + raw.length + 20))
      .toLowerCase();
    const type: "sip" | "lumpsum" | "general" = surrounding.includes("sip")
      ? "sip"
      : surrounding.includes("save") || surrounding.includes("lump") || surrounding.includes("invest")
        ? "lumpsum"
        : "general";

    amounts.push({ raw, value, type });
  }

  // Word amounts like "2 lakh", "50000 saved"
  const wordAmountRegex = /\b(\d+)\s*(lakh|lac|crore|cr)\b/gi;
  while ((match = wordAmountRegex.exec(text)) !== null) {
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = unit === "crore" || unit === "cr" ? 10000000 : 100000;
    const value = num * multiplier;
    const raw = match[0].trim();
    if (!amounts.some((a) => a.value === value)) {
      amounts.push({ raw, value, type: "lumpsum" });
    }
  }

  // Raw numbers
  const numberMatches = text.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g);
  if (numberMatches) {
    for (const nm of numberMatches) {
      const val = parseFloat(nm.replace(/,/g, ""));
      if (!Number.isNaN(val)) {
        rawNumbers.push(val);
      }
    }
  }

  return {
    tickers: Array.from(matchedTickers),
    sectors: Array.from(matchedSectors),
    amounts,
    rawNumbers,
    concepts: Array.from(matchedConcepts),
  };
}

/**
 * Extracts 5 profile fields deterministically from user message (§6.3).
 */
function extractProfileFields(text: string): {
  extracted: PartialProfile;
  isAssumedGoal: boolean;
} {
  const norm = text.toLowerCase();
  const extracted: PartialProfile = {};
  let isAssumedGoal = false;

  // 1. Experience (§6.3)
  // "student", "never bought", "no experience" -> none
  if (
    /\b(?:student|never bought|no experience|fresher|beginner|new to (?:stocks|market)|first time|pehle kabhi nahi)\b/i.test(
      norm,
    )
  ) {
    extracted.experience = "none";
  } else if (/\b(?:few|bought a few|few stocks|some stocks|kuch companies)\b/i.test(norm)) {
    extracted.experience = "few";
  } else if (
    /\b(?:sip|sips|mutual fund|mutual funds|mf|sirf sip)\b/i.test(norm)
  ) {
    extracted.experience = "sip";
  }

  // 2. Horizon (§6.3)
  if (
    /\b(?:10\+?\s*(?:years?|saal)|10y_plus|10\s*years?\s*or\s*more|>10y|10-20\s*years?|very long term)\b/i.test(
      norm,
    )
  ) {
    extracted.horizon = "10y_plus";
  } else if (
    /\b(?:3\s*(?:to|-)\s*5\s*(?:years?|saal|y)|3_5y|3\s*se\s*5\s*saal|medium term)\b/i.test(
      norm,
    )
  ) {
    extracted.horizon = "3_5y";
  } else if (
    /(?:\b(?:1\s*(?:to|-)\s*3\s*(?:years?|saal|y)|1_3y|1-2\s*years?|1\s*se\s*3\s*saal|short term|under 1 year|less than a year)\b|<=\s*1\s*y|<1y|< 1 year|< 1y)/i.test(
      norm,
    )
  ) {
    extracted.horizon = "1_3y";
  } else if (
    /(?<!\d\s*(?:-|to)\s*)(?:\b(?:5\+?\s*(?:years?|saal|year|y)|5\s*(?:to|-)\s*10\s*(?:years?|saal|y)|5_10y|long term|5\s*se\s*10\s*saal)\b|>5y|> 5 years|> 5y)/i.test(
      norm,
    )
  ) {
    extracted.horizon = "5_10y";
  }

  // 3. Risk Comfort (§6.3)
  if (
    /\b(?:not sure|unsure|not-sure|confused|don'?t know|cautious approach|sure nahi)\b/i.test(
      norm,
    )
  ) {
    extracted.riskComfort = "unsure";
  } else if (
    /\b(?:high|aggressive|high risk|30%?\s*drop\s*or\s*more|30%?\s*drop|30%)\b/i.test(
      norm,
    )
  ) {
    extracted.riskComfort = "high";
  } else if (
    /\b(?:medium|moderate|balanced|around\s*20%|20%?\s*drop|20%)\b/i.test(
      norm,
    )
  ) {
    extracted.riskComfort = "medium";
  } else if (
    /\b(?:low|cautious|conservative|around\s*10%|10%?\s*drop|10%)\b/i.test(
      norm,
    )
  ) {
    extracted.riskComfort = "low";
  }

  // 4. Goal (§6.3)
  if (
    /\b(?:dividend|dividends|regular income|regular dividend|passive income|yield)\b/i.test(
      norm,
    )
  ) {
    extracted.goal = "dividends";
  } else if (
    /\b(?:learn|learning|understand|study|educational|how stocks work)\b/i.test(
      norm,
    )
  ) {
    extracted.goal = "learn";
  } else if (
    /\b(?:protect|preserve|capital preservation|safety|protect what i have|surakshit)\b/i.test(
      norm,
    )
  ) {
    extracted.goal = "preserve";
  } else if (
    /\b(?:grow wealth|grow my wealth|growth|wealth creation|capital appreciation|grow_wealth)\b/i.test(
      norm,
    )
  ) {
    extracted.goal = "grow_wealth";
  } else if (
    /\b(?:tax saving|tax save|save tax|elss)\b/i.test(norm)
  ) {
    extracted.goal = "grow_wealth";
  } else if (
    // §6.3: "If the goal is missing but the message says 'start', 'invest' or 'grow',
    // it defaults to grow_wealth and marks the field as assumed."
    /\b(?:start|invest|grow|pick a few stocks|help me pick)\b/i.test(norm)
  ) {
    extracted.goal = "grow_wealth";
    isAssumedGoal = true;
  }

  // 5. Locale (§6.3)
  if (/\b(?:english|en|angrezi)\b/i.test(norm)) {
    extracted.locale = "en";
  } else if (/\b(?:hinglish|hi-en|hindi)\b/i.test(norm)) {
    extracted.locale = "hi-en";
  }

  return { extracted, isAssumedGoal };
}

/**
 * Determines stage transitions (§7, Task 30).
 */
function inferStage(
  message: string,
  profile: PartialProfile,
  entities: ParsedEntities,
): ConversationStage {
  const norm = message.toLowerCase();

  // Comparing (2+ tickers or compare cue)
  if (
    entities.tickers.length >= 2 ||
    /\b(?:compare|versus|vs|better choice|kaunsa)\b/i.test(norm)
  ) {
    return "comparing";
  }

  // Exploring (1 ticker inquiry)
  if (
    entities.tickers.length === 1 ||
    /\b(?:tell me about|analyze|analysis|debt|news|fall|history|performance|safe hai kya)\b/i.test(
      norm,
    )
  ) {
    if (entities.tickers.length === 1) {
      return "exploring";
    }
  }

  // Educating (concept queries without specific stock)
  if (
    entities.concepts.length > 0 ||
    /\b(?:what is|explain|samjhao|ratio|pe ratio|roe|roce|cagr)\b/i.test(norm)
  ) {
    return "educating";
  }

  // Shortlisting
  if (
    /\b(?:shortlist|suggest|recommend|pick|find stocks|give me a shortlist|show me|top stocks)\b/i.test(
      norm,
    )
  ) {
    return "shortlisting";
  }

  // Profiling
  const hasProfileFields =
    profile.goal !== undefined ||
    profile.horizon !== undefined ||
    profile.riskComfort !== undefined ||
    profile.experience !== undefined;

  if (hasProfileFields) {
    return "profiling";
  }

  return "new";
}

/**
 * Main parser entry point for intake messages (§6.3, Task 30).
 * 100% deterministic pure function.
 */
export function parseIntakeMessage(
  message: string,
  current: PartialProfile = {},
  currentAssumed: ProfileField[] = [],
): IntakeResult {
  const entities = extractEntities(message);
  const { extracted, isAssumedGoal } = extractProfileFields(message);

  const mergedProfile: PartialProfile = {
    ...current,
    ...extracted,
  };

  const explicitSet = new Set<ProfileField>();
  const assumedSet = new Set<ProfileField>(currentAssumed);

  for (const field of INTAKE_FIELD_SEQUENCE) {
    if (extracted[field] !== undefined) {
      if (field === "goal" && isAssumedGoal) {
        assumedSet.add("goal");
      } else {
        explicitSet.add(field);
        assumedSet.delete(field);
      }
    }
  }

  const missing = INTAKE_FIELD_SEQUENCE.filter(
    (field) => mergedProfile[field] === undefined,
  );
  const complete = missing.length === 0;

  const stage = inferStage(message, mergedProfile, entities);
  const nextQuestion = getNextIntakeQuestion(mergedProfile, mergedProfile.locale ?? "en");

  return {
    profile: mergedProfile,
    assumed: Array.from(assumedSet),
    explicit: Array.from(explicitSet),
    missing,
    complete,
    stage,
    nextQuestion,
    entities,
  };
}
