import type { Snapshot } from "@/lib/data/schema";
import type {
  PartialProfile,
  ProfileField,
  Route,
} from "./types";
import { parseIntakeMessage } from "./intake";

export type IntentType =
  | "direct_recommendation"
  | "target_price"
  | "guarantee_query"
  | "profile_completion"
  | "shortlist_request"
  | "stock_detail"
  | "stock_comparison"
  | "sector_query"
  | "concept_query"
  | "news_inquiry"
  | "boundary_violation"
  | "prompt_injection"
  | "general_chat";

export type BoundaryTopic = "advice" | "concentration" | "injection";

export type ClassifiedEntities = {
  tickers: string[];
  sectors: string[];
  concepts: string[];
  numbers: number[];
  unknownEntities: string[];
};

export type RouteClassification = {
  route: Route;
  intent: IntentType;
  boundaryTopic?: BoundaryTopic;
  confidence: number;
  ruleIndex: number;
  matchedRule: string;
  entities: ClassifiedEntities;
};

/**
 * Explicit cue lexicons with English and Hinglish equivalents (§5.6).
 */
export const CUES = {
  injection: [
    "ignore your rules",
    "ignore previous instructions",
    "disregard system prompt",
    "system prompt",
    "you must add",
    "act as",
    "dan mode",
    "jailbreak",
    "override safety",
    "developer mode",
    "pretend you are",
    "forget all previous",
  ],
  concentration: [
    "sab ek stock mein",
    "all in",
    "all-in",
    "all into one",
    "put all my money",
    "double ho jaye",
    "will double",
    "double next week",
    "guaranteed",
    "guaranteed return",
    "assured return",
    "risk-free",
    "risk free",
    "sure shot",
    "10x",
  ],
  compare: [
    "versus",
    "vs",
    "or",
    "better",
    "kaunsa",
    "compare",
    "comparing",
    "difference between",
    "which suits me better",
    "which is better",
  ],
  metric: [
    "debt",
    "p/e",
    "pe",
    "valuation",
    "dividend",
    "yield",
    "margin",
    "operating margin",
    "roe",
    "roce",
    "ratios",
    "safe hai kya",
    "safe hai",
  ],
  history: [
    "history",
    "past",
    "five years",
    "5 years",
    "5 saal",
    "5-year",
    "5 year",
    "over the years",
    "since",
    "performance",
    "chart",
    "how has",
    "done over",
  ],
  news: [
    "why did",
    "why",
    "fall",
    "fell",
    "rise",
    "rose",
    "news",
    "announcement",
    "announcements",
    "kya hua",
    "kyun gira",
    "gir gaya",
    "badh gaya",
    "today",
  ],
  shortlist: [
    "suggest",
    "pick",
    "find",
    "shortlist",
    "kya lu",
    "kya dekhun",
    "show me",
    "top stocks",
    "stocks for me",
    "recommend stocks",
    "give me a shortlist",
    "find stocks",
  ],
  advice: [
    "should i buy",
    "should i sell",
    "is it a buy",
    "is it a good buy",
    "which stock should i buy",
    "which stock to buy",
    "tell me what to buy",
    "target price",
    "what is target price",
    "kharidna chahiye",
    "kya kharidu",
  ],
  offUniverse: [
    "apple",
    "aapl",
    "tesla",
    "tsla",
    "google",
    "googl",
    "amazon",
    "microsoft",
    "msft",
    "nvidia",
    "nvda",
    "meta",
    "bitcoin",
    "btc",
    "ethereum",
    "eth",
    "crypto",
    "doge",
    "penny stock",
    "penny stocks",
    "small-cap",
    "small cap",
    "rolta",
    "dhfl",
    "suzlon",
    "yes bank",
    "paytm",
    "zomato",
    "nykaa",
    "adani",
  ],
} as const;

/**
 * Checks if text contains any phrase from the given cue lexicon.
 */
function hasCue(text: string, cues: readonly string[]): boolean {
  const norm = text.toLowerCase();
  return cues.some((cue) => {
    // If cue has word characters only, use word boundary regex
    if (/^[a-z0-9\s]+$/i.test(cue)) {
      return new RegExp(`\\b${cue}\\b`, "i").test(norm);
    }
    return norm.includes(cue.toLowerCase());
  });
}

/**
 * Checks whether a profile is complete across all 5 fields (§6.3).
 */
function isProfileFullyComplete(profile: PartialProfile | null): boolean {
  if (!profile) return false;
  const required: ProfileField[] = ["goal", "horizon", "riskComfort", "experience", "locale"];
  return required.every((field) => profile[field] !== undefined);
}

/**
 * 13-Rule Deterministic Route Classifier (§5.6, Task 31).
 *
 * Ordered rule table; the first rule that matches wins.
 * 100% deterministic, zero network, zero LLM.
 */
export function classify(
  message: string,
  profile: PartialProfile | null,
  snapshot: Snapshot,
): RouteClassification {
  const intakeParsed = parseIntakeMessage(message, profile ?? {});
  const entities = intakeParsed.entities;

  // Identify covered stocks from snapshot
  const coveredTickers = new Set(snapshot.stocks.map((s) => s.ticker.toUpperCase()));
  const matchedCoveredTickers = entities.tickers.filter((t) => coveredTickers.has(t.toUpperCase()));

  // Identify exclusions from snapshot
  const exclusionNames = snapshot.exclusions.flatMap((e) => [
    e.name.toLowerCase(),
    ...e.aliases.map((a) => a.toLowerCase()),
  ]);

  const norm = message.toLowerCase();
  const unknownEntities: string[] = [];

  // Check for exclusions or off-universe entities
  for (const excl of exclusionNames) {
    if (new RegExp(`\\b${excl}\\b`, "i").test(norm)) {
      unknownEntities.push(excl);
    }
  }
  for (const off of CUES.offUniverse) {
    if (new RegExp(`\\b${off}\\b`, "i").test(norm)) {
      unknownEntities.push(off);
    }
  }

  const allEntities: ClassifiedEntities = {
    tickers: matchedCoveredTickers,
    sectors: entities.sectors,
    concepts: entities.concepts,
    numbers: entities.rawNumbers,
    unknownEntities,
  };

  // Rule 1: Text contains a meta-instruction to change the rules
  if (hasCue(message, CUES.injection)) {
    return {
      route: "boundary",
      intent: "prompt_injection",
      boundaryTopic: "injection",
      confidence: 1.0,
      ruleIndex: 1,
      matchedRule: "Rule 1: Meta-instruction to change rules or prompt injection",
      entities: allEntities,
    };
  }

  // Rule 2: Text asks for a single stock or an all-in bet with return/doubling claim
  if (hasCue(message, CUES.concentration)) {
    return {
      route: "boundary",
      intent: "guarantee_query",
      boundaryTopic: "concentration",
      confidence: 1.0,
      ruleIndex: 2,
      matchedRule: "Rule 2: All-in bet, doubling claim, or guaranteed return query",
      entities: allEntities,
    };
  }

  // Rule 3: Two covered stocks plus a comparison cue
  if (matchedCoveredTickers.length >= 2 && hasCue(message, CUES.compare)) {
    return {
      route: "compare",
      intent: "stock_comparison",
      confidence: 0.95,
      ruleIndex: 3,
      matchedRule: "Rule 3: Two covered stocks plus comparison cue",
      entities: allEntities,
    };
  }

  // Rule 4: One covered stock plus a metric cue
  if (matchedCoveredTickers.length === 1 && hasCue(message, CUES.metric)) {
    return {
      route: "stock_detail",
      intent: "stock_detail",
      confidence: 0.95,
      ruleIndex: 4,
      matchedRule: "Rule 4: One covered stock plus metric cue",
      entities: allEntities,
    };
  }

  // Rule 5: One covered stock plus a history cue
  if (matchedCoveredTickers.length === 1 && hasCue(message, CUES.history)) {
    return {
      route: "history",
      intent: "stock_detail",
      confidence: 0.95,
      ruleIndex: 5,
      matchedRule: "Rule 5: One covered stock plus history cue",
      entities: allEntities,
    };
  }

  // Rule 6: One covered stock plus a news cue
  if (matchedCoveredTickers.length === 1 && hasCue(message, CUES.news)) {
    return {
      route: "news",
      intent: "news_inquiry",
      confidence: 0.95,
      ruleIndex: 6,
      matchedRule: "Rule 6: One covered stock plus news cue",
      entities: allEntities,
    };
  }

  // Sector preference query (e.g., "IT sector stocks", "banking stocks")
  if (entities.sectors.length > 0) {
    return {
      route: isProfileFullyComplete(profile) ? "shortlist" : "intake",
      intent: "sector_query",
      confidence: 0.95,
      ruleIndex: 12,
      matchedRule: "Rule 12: Sector preference query",
      entities: allEntities,
    };
  }

  // Rule 7: Shortlist cue with a complete profile
  const hasShortlistCue = hasCue(message, CUES.shortlist);
  if (hasShortlistCue && isProfileFullyComplete(profile)) {
    return {
      route: "shortlist",
      intent: "shortlist_request",
      confidence: 0.95,
      ruleIndex: 7,
      matchedRule: "Rule 7: Shortlist cue with complete profile",
      entities: allEntities,
    };
  }

  // Rule 8: Shortlist cue without a complete profile
  if (hasShortlistCue && !isProfileFullyComplete(profile)) {
    return {
      route: "intake",
      intent: "shortlist_request",
      confidence: 0.95,
      ruleIndex: 8,
      matchedRule: "Rule 8: Shortlist cue without complete profile",
      entities: allEntities,
    };
  }

  // Check advice cues before Rule 9 so Rule 9 does NOT swallow Rule 11
  const hasAdviceCue = hasCue(message, CUES.advice);

  // Rule 9: One covered stock and no other cue (and NO advice cue, per §5.6 design note)
  if (matchedCoveredTickers.length === 1 && !hasAdviceCue) {
    return {
      route: "stock_detail",
      intent: "stock_detail",
      confidence: 0.9,
      ruleIndex: 9,
      matchedRule: "Rule 9: One covered stock alone without other cues",
      entities: allEntities,
    };
  }

  // Rule 10: Unknown stock name, exclusion, or off-universe asset
  if (unknownEntities.length > 0) {
    return {
      route: "coverage_miss",
      intent: "boundary_violation",
      confidence: 0.95,
      ruleIndex: 10,
      matchedRule: "Rule 10: Uncovered company, exclusion, or off-universe asset",
      entities: allEntities,
    };
  }

  // Rule 11: Advice cue with one stock or no stock
  if (hasAdviceCue) {
    const isTargetPrice = /\b(?:target price|price target)\b/i.test(message);
    return {
      route: "boundary",
      intent: isTargetPrice ? "target_price" : "direct_recommendation",
      boundaryTopic: "advice",
      confidence: 0.95,
      ruleIndex: 11,
      matchedRule: "Rule 11: Advice or target price cue",
      entities: allEntities,
    };
  }

  // Rule 12: Answers current intake question or sector query
  if (entities.sectors.length > 0) {
    return {
      route: isProfileFullyComplete(profile) ? "shortlist" : "intake",
      intent: "sector_query",
      confidence: 0.85,
      ruleIndex: 12,
      matchedRule: "Rule 12: Sector preference query",
      entities: allEntities,
    };
  }

  if (intakeParsed.explicit.length > 0) {
    return {
      route: "intake",
      intent: "profile_completion",
      confidence: 0.9,
      ruleIndex: 12,
      matchedRule: "Rule 12: Answers current intake question",
      entities: allEntities,
    };
  }

  if (entities.concepts.length > 0) {
    return {
      route: "clarify",
      intent: "concept_query",
      confidence: 0.85,
      ruleIndex: 12,
      matchedRule: "Rule 12: Concept inquiry",
      entities: allEntities,
    };
  }

  // Rule 13: None of the above -> clarify (general_chat)
  return {
    route: "clarify",
    intent: "general_chat",
    confidence: 0.5,
    ruleIndex: 13,
    matchedRule: "Rule 13: Unmatched input or general greeting",
    entities: allEntities,
  };
}

/**
 * Convenience helper returning Route enum string directly.
 */
export function classifyRoute(
  message: string,
  profile: PartialProfile | null,
  snapshot: Snapshot,
): Route {
  return classify(message, profile, snapshot).route;
}
