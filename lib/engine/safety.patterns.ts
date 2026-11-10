/**
 * Safety banned-pattern taxonomy (§9.1, §9.2).
 *
 * Phrase-level regular expressions, case-insensitive, applied to normalized text
 * (curly quotes and dashes folded, whitespace collapsed).
 * Each pattern has an id, category, severity, regex set, and reason.
 */

export type PatternSeverity = "hard" | "soft";

export type PatternCategory =
  | "directive"
  | "target"
  | "promise"
  | "assurance"
  | "amount"
  | "ranking"
  | "prediction"
  | "persona"
  | "urgency"
  | "loss_framing"
  | "injection_echo"
  | "guarantee_word";

export type BannedPattern = {
  id: PatternCategory;
  category: PatternCategory;
  severity: PatternSeverity;
  patterns: RegExp[];
  reason: string;
};

export type PatternMatch = {
  id: PatternCategory;
  category: PatternCategory;
  severity: PatternSeverity;
  match: string;
  reason: string;
};

/**
 * Normalises text before scanning (§9.2):
 * - Curly quotes folded to straight quotes.
 * - Dashes (en-dash, em-dash, minus) folded to standard hyphen.
 * - Whitespace (spaces, tabs, newlines) collapsed to a single space.
 * - Leading and trailing whitespace trimmed.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export const BANNED_PATTERNS: readonly BannedPattern[] = [
  {
    id: "directive",
    category: "directive",
    severity: "hard",
    reason: "Advice and implicit recommendation",
    patterns: [
      /\b(?:you|we|i)\s+(?:should|must|ought to|recommend|suggest|advise)\s+(?:to\s+)?(?:buy|sell|hold|accumulate|exit|avoid)\b/i,
      /\b(?:we|i)\s+(?:recommend|suggest|advise)\s+(?:buying|selling|holding|accumulating|investing in)\b/i,
      /\b(?:recommend|recommends|recommended|recommending)\s+(?:to\s+)?(?:buy|sell|hold|accumulate)\b/i,
      /\b(?:buy|sell)\s+(?:or\s+sell\s+)?recommendations?\b/i,
      /\bgo for it\b/i,
      /\bbook profits\b/i,
      /\benter at\b/i,
      /\bexit now\b/i,
      /\badd (?:this|these) to (?:your|my) portfolio\b/i,
      /\bavoid this stock\b/i,
      /\bstop\s*loss\b/i,
      /\bentry\s*point\b/i,
      /\bconsider (?:buying|selling)\b/i,
      /(?:^|[.!?;\n])\s*(?:buy|sell|accumulate|hold|exit)\s+(?:now|this|today|immediately|it|shares|stocks)\b/i,
      /(?:^|[.!?;\n])\s*(?:[bB][uU][yY]|[sS][eE][lL][lL])\s+[A-Z]{2,10}\b/,
      /(?:^|[.!?;\n])\s*accumulate\s+this\s+stock\b/i,
    ],
  },
  {
    id: "target",
    category: "target",
    severity: "hard",
    reason: "Price prediction and target valuation",
    patterns: [
      /\btarget\s+price\b/i,
      /\bprice\s+target\b/i,
      /\btarget\s+of\s+(?:₹|Rs\.?|\d)/i,
      /\bupside\s+of\b/i,
      /\b(?:can|will)\s+reach\s+(?:₹|Rs\.?|\d)/i,
      /\bwill\s+reach\b/i,
      /\bwill\s+hit\s+(?:₹|Rs\.?|\d)/i,
      /\bfair\s+value\s+is\b/i,
      /\bexpected\s+return\b/i,
      /\bis\s+expected\s+to\s+touch\b/i,
      /\bexpected\s+to\s+reach\b/i,
    ],
  },
  {
    id: "promise",
    category: "promise",
    severity: "hard",
    reason: "Return promises and risk-free claims",
    patterns: [
      /(?<!not\s+|never\s+)\bguaranteed\b/i,
      /\bassured\s+returns?\b/i,
      /\brisk[- ]free\b/i,
      /\bwill\s+double\b/i,
      /\bdoubling\s+(?:your|one's|the)?\s*(?:money|capital|investment|returns)?\b/i,
      /\bmultibaggers?\b/i,
      /\bsure\s+shot\b/i,
      /\b10x\b/i,
      /\bcan'?t\s+lose\b/i,
      /\bsafe\s+bet\b/i,
      /\b(?:receive|get|earn|make)\s+\d+(?:\.\d+)?%\s+returns?\b/i,
      /\b\d+(?:\.\d+)?%\s+returns?\s+(?:annually|guaranteed|assured|every\s+year)\b/i,
    ],
  },
  {
    id: "assurance",
    category: "assurance",
    severity: "hard",
    reason: "False reassurance and sycophancy",
    patterns: [
      /\bit\s+is\s+safe\b/i,
      /\bthis\s+is\s+a\s+safe\s+stock\b/i,
      /\byou\s+won'?t\s+lose\b/i,
      /\bno\s+risk\s+here\b/i,
      /\bzero\s+(?:downside\s+)?risk\b/i,
      /\bgood\s+choice\b/i,
      /\bgreat\s+pick\b/i,
      /\byou\s+will\s+make\s+money\b/i,
      /\bcan'?t\s+go\s+wrong\b/i,
    ],
  },
  {
    id: "amount",
    category: "amount",
    severity: "hard",
    reason: "Per-stock rupee amounts and position sizing",
    patterns: [
      /\b(?:invest|put|allocate|split)\s+(?:₹|Rs\.?\s*)\d+(?:,\d+)*(?:\.\d+)?(?!\s+crore\b)/i,
      /\b(?:invest|put|allocate|split)\s+\d+\s*(?:rupees|inr)\b/i,
      /(?:₹|Rs\.?\s*)\d+(?:,\d+)*(?:\.\d+)?\s+(?:in|into|across|for)\s+(?:this|these|each|the)\s+stock/i,
      /\bsplit\s+(?:₹|Rs\.?\s*)\d+(?:,\d+)*(?:\.\d+)?\s+across\b/i,
    ],
  },
  {
    id: "ranking",
    category: "ranking",
    severity: "hard",
    reason: "Subjective superlatives and unsolicited ranking verdicts",
    patterns: [
      /\bbest\s+stock\b/i,
      /\btop\s+pick\b/i,
      /\bbetter\s+choice\b/i,
      /\bstrongest\s+stock\b/i,
      /\bsuperior\s+to\b/i,
      /\boutperformer\b/i,
      /\bwe\s+prefer\b/i,
      /\bundervalued\s+gem\b/i,
      /\branked\s+as\s+(?:the\s+)?(?:best|top|winner|number\s+one)\b/i,
      /\bnumber\s+one\s+stock\b/i,
    ],
  },
  {
    id: "prediction",
    category: "prediction",
    severity: "hard",
    reason: "Forward-looking market forecasts",
    patterns: [
      /\b(?:share\s+price|price|stock|shares)\s+will\s+rise\b/i,
      /\bwill\s+rise\b/i,
      /\bexpected\s+to\s+grow\b/i,
      /\blikely\s+to\s+beat\b/i,
      /\boutlook\s+is\s+positive\b/i,
      /\bwill\s+(?:surge|rally|plunge|crash|boom)\b/i,
      /\b(?:index|stock|shares?|price)\s+will\s+[\w\s]{0,25}next\s+week\b/i,
      /\blikely\s+to\s+[\w\s]{0,25}by\s+December\b/i,
    ],
  },
  {
    id: "persona",
    category: "persona",
    severity: "hard",
    reason: "Implies an advisory relationship",
    patterns: [
      /\bas\s+your\s+advisor\b/i,
      /\bour\s+advice\b/i,
      /\bwe\s+suggest\s+you\b/i,
      /\bspeak\s+to\s+our\s+expert\b/i,
      /\bour\s+recommendation\b/i,
      /\bmy\s+advice\s+to\s+you\b/i,
    ],
  },
  {
    id: "urgency",
    category: "urgency",
    severity: "hard",
    reason: "Manufactured action pressure",
    patterns: [
      /\bact\s+now\b/i,
      /\blast\s+chance\b/i,
      /\bbefore\s+it'?s\s+too\s+late\b/i,
      /\bdon'?t\s+miss\b/i,
      /\blimited\s+time\b/i,
      /\bhurry\b/i,
    ],
  },
  {
    id: "loss_framing",
    category: "loss_framing",
    severity: "hard",
    reason: "Manufactured loss aversion",
    patterns: [
      /\bdon'?t\s+lose\s+this\s+chance\b/i,
      /\byou'?ll\s+regret\b/i,
      /\bstreak\s+(?:is\s+)?about\s+to\s+end\b/i,
      /\byou\s+are\s+falling\s+behind\b/i,
    ],
  },
  {
    id: "injection_echo",
    category: "injection_echo",
    severity: "hard",
    reason: "Prompt-injection compliance or rule bypass echo",
    patterns: [
      /(?<!do\s+not\s+)\bignore\s+(?:your|all|previous|the)\s+rules\b/i,
      /\bignore\s+previous\s+instructions\b/i,
      /\badd\s+it\s+anyway\b/i,
      /\boverride\s+safety\s+guidelines\b/i,
      /\bdisregard\s+(?:system\s+prompt|all\s+prior\s+instructions)\b/i,
    ],
  },
  {
    id: "guarantee_word",
    category: "guarantee_word",
    severity: "soft",
    reason: "Absolutist language attached to market outcome",
    patterns: [
      /\b(?:will\s+always|always)\s+(?:go\s+up|rise|profit|make\s+money|reward)\b/i,
      /\bnever\s+(?:fall|drop|decline|lose|fail\s+to\s+pay)\b/i,
      /\b(?:stocks?|market)\s+always\s+(?:rewards?|goes?|rises?|profits?)\b/i,
    ],
  },
];

/**
 * Scans normalized text against a specific pattern category.
 */
export function scanPatternCategory(
  category: PatternCategory,
  text: string,
): PatternMatch[] {
  const norm = normalizeText(text);
  const rule = BANNED_PATTERNS.find((p) => p.category === category);
  if (!rule) return [];

  const matches: PatternMatch[] = [];
  for (const pattern of rule.patterns) {
    const match = norm.match(pattern);
    if (match) {
      matches.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        match: match[0],
        reason: rule.reason,
      });
    }
  }
  return matches;
}

/**
 * Scans normalized text against all banned pattern categories.
 */
export function scanAllPatterns(text: string): PatternMatch[] {
  const norm = normalizeText(text);
  const matches: PatternMatch[] = [];

  for (const rule of BANNED_PATTERNS) {
    for (const pattern of rule.patterns) {
      const match = norm.match(pattern);
      if (match) {
        matches.push({
          id: rule.id,
          category: rule.category,
          severity: rule.severity,
          match: match[0],
          reason: rule.reason,
        });
      }
    }
  }
  return matches;
}
