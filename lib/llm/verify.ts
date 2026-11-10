import type { Locale } from "@/lib/engine/types";
import type { RephraseItemInput, RephraseItemOutput } from "./provider";

/**
 * 6-Pillar Rephrase Verification Engine (§11.4):
 * 1. Numeric Preservation: multiset identity of all numbers, currency, ratios, and percentages.
 * 2. Entity Preservation: tickers, company names, and financial metrics preserved without illegal additions.
 * 3. Length Bounds: rephrased text must be between 20% and 150% of original character length.
 * 4. Shape Preservation: single sentence ending with a period, no internal linebreaks, fences, or HTML.
 * 5. Language/Script: Hinglish (hi-en) must remain in Roman script (zero Devanagari characters).
 * 6. Safety: zero advice words (buy, sell, target, guaranteed, multibagger, recommend).
 */

const ADVICE_WORDS_REGEX =
  /\b(buy|buys|buying|sell|sells|selling|target|targets|guaranteed|guarantee|guarantees|multibagger|multibaggers|recommend|recommends|recommended|recommending|recommendation|recommendations)\b/i;

const DEVANAGARI_REGEX = /[\u0900-\u097F\uA8E0-\uA8FF]/;

const NUMERIC_TOKEN_REGEX =
  /(?:-?\s*₹\s*|-?\s*Rs\.?\s*)\d+(?:,\d+)*(?:\.\d+)?|\b\d+:\d+\b|-?\b\d+(?:\.\d+)?[xX]\b|-?\b\d+(?:,\d+)*(?:\.\d+)?%|-?\b\d+(?:,\d+)*(?:\.\d+)?\b/g;

/**
 * Groups of equivalent company/ticker representations.
 */
const COMPANY_EQUIVALENCE_GROUPS: string[][] = [
  ["INFY", "Infosys", "Infosys Limited"],
  ["TCS", "Tata Consultancy Services", "Tata Consultancy Services Limited"],
  ["HDFCBANK", "HDFC Bank", "HDFC Bank Limited"],
  ["ICICIBANK", "ICICI Bank", "ICICI Bank Limited"],
  ["ITC", "ITC Limited"],
  ["HINDUNILVR", "Hindustan Unilever", "Hindustan Unilever Limited", "HUL"],
  ["TATAMOTORS", "Tata Motors", "Tata Motors Limited"],
  ["RELIANCE", "Reliance", "Reliance Industries", "Reliance Industries Limited"],
  ["LT", "Larsen & Toubro", "Larsen & Toubro Limited", "L&T"],
  ["BHARTIARTL", "Bharti Airtel", "Bharti Airtel Limited", "Airtel"],
  ["SUNPHARMA", "Sun Pharma", "Sun Pharmaceutical", "Sun Pharmaceutical Industries Limited"],
  ["TITAN", "Titan", "Titan Company", "Titan Company Limited"],
  ["NIFTY", "Nifty", "Nifty 50"],
];

/**
 * Groups of equivalent financial metrics representations.
 */
const METRIC_EQUIVALENCE_GROUPS: string[][] = [
  ["P/E", "PE", "price-to-earnings", "price to earnings"],
  ["P/B", "PB", "price-to-book", "price to book"],
  ["debt-to-equity", "debt to equity", "debt/equity", "D/E"],
  ["drawdown", "max drawdown"],
  ["ROE", "return on equity"],
  ["ROCE", "return on capital employed"],
  ["PAT", "profit after tax"],
  ["CAGR", "compound annual growth rate"],
  ["operating margin"],
  ["dividend yield"],
  ["interest cover"],
  ["volatility"],
  ["EBITDA"],
  ["EBIT"],
  ["EPS"],
  ["DPS"],
  ["net worth"],
  ["revenue"],
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeToken(token: string): string {
  return token.replace(/\s+/g, "");
}

/**
 * Extracts all numeric tokens (including decimals, percentages, currency, and ratios).
 */
export function extractNumericTokens(text: string): string[] {
  const matches = text.match(NUMERIC_TOKEN_REGEX) || [];
  return matches.map(normalizeToken);
}

/**
 * Checks Pillar 1: Numeric Preservation.
 */
function checkNumericPreservation(original: string, rephrased: string): boolean {
  const origTokens = extractNumericTokens(original);
  const rephTokens = extractNumericTokens(rephrased);

  if (origTokens.length !== rephTokens.length) {
    return false;
  }

  // Multiset comparison
  const sortedOrig = [...origTokens].sort();
  const sortedReph = [...rephTokens].sort();

  return sortedOrig.every((val, idx) => val === sortedReph[idx]);
}

/**
 * Checks Pillar 2: Entity Preservation.
 */
function checkEntityPreservation(original: string, rephrased: string): boolean {
  // Check company / ticker preservation
  for (const group of COMPANY_EQUIVALENCE_GROUPS) {
    const presentInOrig = group.some((alias) => {
      const reg = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      return reg.test(original);
    });

    const presentInReph = group.some((alias) => {
      const reg = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      return reg.test(rephrased);
    });

    // If company was in original, it must be in rephrased
    if (presentInOrig && !presentInReph) {
      return false;
    }
    // If company was NOT in original, it must NOT appear in rephrased (no hallucinated companies)
    if (!presentInOrig && presentInReph) {
      return false;
    }
  }

  // Check metric preservation
  for (const group of METRIC_EQUIVALENCE_GROUPS) {
    const presentInOrig = group.some((alias) => {
      const reg = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      return reg.test(original);
    });

    const presentInReph = group.some((alias) => {
      const reg = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      return reg.test(rephrased);
    });

    // If metric was in original, it must be in rephrased
    if (presentInOrig && !presentInReph) {
      return false;
    }
  }

  return true;
}

/**
 * Checks Pillar 3: Length Bounds (between 20% and 150% of original character length).
 */
function checkLengthBounds(original: string, rephrased: string): boolean {
  if (original.length === 0 || rephrased.length === 0) {
    return false;
  }
  const minLen = Math.floor(original.length * 0.2);
  const maxLen = Math.ceil(original.length * 1.5);
  return rephrased.length >= minLen && rephrased.length <= maxLen;
}

/**
 * Checks Pillar 4: Shape Preservation.
 * Single sentence ending in '.', no internal linebreaks, code fences, or HTML tags.
 */
function checkShapePreservation(rephrased: string): boolean {
  const trimmed = rephrased.trim();
  if (!trimmed.endsWith(".")) {
    return false;
  }
  if (trimmed.includes("\n") || trimmed.includes("\r")) {
    return false;
  }
  if (trimmed.includes("```") || /<[a-z][\s\S]*>/i.test(trimmed)) {
    return false;
  }

  // Check for internal sentence boundaries (terminator followed by whitespace and uppercase letter)
  const inner = trimmed.slice(0, -1);
  if (/[!?]/.test(inner)) {
    return false;
  }
  const sentenceBoundaryRegex = /(?<!\b(?:Ltd|Inc|Corp|Pvt|Rs|vs|eg|ie))\.\s+[A-Z]/;
  if (sentenceBoundaryRegex.test(inner)) {
    return false;
  }

  return true;
}

/**
 * Checks Pillar 5: Language/Script.
 * Hinglish (hi-en) must remain in Roman script (no Devanagari Unicode characters).
 */
function checkLanguageScript(rephrased: string, locale: Locale): boolean {
  if (locale === "hi-en" && DEVANAGARI_REGEX.test(rephrased)) {
    return false;
  }
  // English sentences should also not contain Devanagari script
  if (locale === "en" && DEVANAGARI_REGEX.test(rephrased)) {
    return false;
  }
  return true;
}

/**
 * Checks Pillar 6: Safety.
 * Must NOT contain advice words.
 */
function checkSafety(rephrased: string): boolean {
  return !ADVICE_WORDS_REGEX.test(rephrased);
}

export type VerificationResult = {
  valid: boolean;
  failures: string[];
  pillars: {
    numeric: boolean;
    entity: boolean;
    length: boolean;
    shape: boolean;
    language: boolean;
    safety: boolean;
  };
};

/**
 * Performs detailed 6-pillar verification with failure diagnostics.
 */
export function verifyRephraseDetailed(
  original: string,
  rephrased: string,
  locale: Locale
): VerificationResult {
  const pillars = {
    numeric: checkNumericPreservation(original, rephrased),
    entity: checkEntityPreservation(original, rephrased),
    length: checkLengthBounds(original, rephrased),
    shape: checkShapePreservation(rephrased),
    language: checkLanguageScript(rephrased, locale),
    safety: checkSafety(rephrased),
  };

  const failures: string[] = [];
  if (!pillars.numeric) failures.push("Pillar 1: Numeric preservation failed");
  if (!pillars.entity) failures.push("Pillar 2: Entity preservation failed");
  if (!pillars.length) failures.push("Pillar 3: Length bounds failed");
  if (!pillars.shape) failures.push("Pillar 4: Shape preservation failed");
  if (!pillars.language) failures.push("Pillar 5: Language/script verification failed");
  if (!pillars.safety) failures.push("Pillar 6: Safety violation detected");

  return {
    valid: failures.length === 0,
    failures,
    pillars,
  };
}

/**
 * Strict 6-pillar verification function:
 * Returns true if candidate satisfies all 6 verification rules, false otherwise.
 */
export function verifyRephrase(
  original: string,
  rephrased: string,
  locale: Locale
): boolean {
  return (
    checkNumericPreservation(original, rephrased) &&
    checkEntityPreservation(original, rephrased) &&
    checkLengthBounds(original, rephrased) &&
    checkShapePreservation(rephrased) &&
    checkLanguageScript(rephrased, locale) &&
    checkSafety(rephrased)
  );
}

/**
 * Safely processes a single rephrase item:
 * If candidate text is missing or fails verification, reverts to verbatim original text.
 */
export function safeRephraseItem(
  item: RephraseItemInput,
  candidateText?: string
): RephraseItemOutput {
  if (
    typeof candidateText === "string" &&
    verifyRephrase(item.text, candidateText, item.locale)
  ) {
    return { id: item.id, text: candidateText };
  }
  return { id: item.id, text: item.text };
}

/**
 * Safely processes a batch of rephrased items:
 * - If candidate batch has unknown IDs or extra items (§11.5), whole batch rejects.
 * - Otherwise verifies each candidate individually; failed candidates fall back to original text.
 */
export function safeRephraseBatch(
  items: RephraseItemInput[],
  candidates: RephraseItemOutput[]
): RephraseItemOutput[] {
  const itemMap = new Map(items.map((i) => [i.id, i]));

  // Batch validation: candidate count must match and contain only known IDs
  if (candidates.length !== items.length) {
    return items.map((i) => ({ id: i.id, text: i.text }));
  }

  for (const c of candidates) {
    if (!itemMap.has(c.id)) {
      // Unknown ID: reject whole batch
      return items.map((i) => ({ id: i.id, text: i.text }));
    }
  }

  const candidateMap = new Map(candidates.map((c) => [c.id, c.text]));

  return items.map((item) => {
    const candidateText = candidateMap.get(item.id);
    return safeRephraseItem(item, candidateText);
  });
}
