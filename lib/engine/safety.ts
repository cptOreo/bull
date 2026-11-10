import type { Answer, Block, Ref } from "@/lib/engine/types";
import { formatRefValue } from "@/lib/engine/refs";
import { formatSignedPercent } from "@/lib/engine/format";
import {
  normalizeText,
  scanAllPatterns,
  type PatternCategory,
  type PatternSeverity,
} from "@/lib/engine/safety.patterns";
import { isExempt } from "@/lib/engine/safety.exemptions";

export type SafetyViolation = {
  rule: 1 | 2 | 3;
  category: PatternCategory | "untraced_number" | "single_stock_boundary";
  severity: PatternSeverity;
  match: string;
  message: string;
  location?: string;
};

export class SafetyViolationError extends Error {
  constructor(public violations: string[]) {
    super(
      `Safety inspection failed with ${violations.length} violation(s):\n${violations.join("\n")}`,
    );
    this.name = "SafetyViolationError";
  }
}

/**
 * Scans text for banned safety patterns (§9.1, §9.2).
 * If the text exactly matches an approved exemption and bypassExemptions is false,
 * it returns zero violations.
 */
export function scanText(
  text: string,
  options?: { bypassExemptions?: boolean },
): SafetyViolation[] {
  if (!options?.bypassExemptions && isExempt(text)) {
    return [];
  }

  const matches = scanAllPatterns(text);
  return matches.map((m) => ({
    rule: 1,
    category: m.category,
    severity: m.severity,
    match: m.match,
    message: m.reason,
  }));
}

/**
 * Masks non-claim tokens (dates, Ref IDs, version strings, index names)
 * before numeric extraction (§9.3).
 */
function maskNonClaimTokens(text: string): string {
  return (
    text
      // Ref IDs: data:INFY:pe, derived:TCS:roe, config:shortlist:cap, profile:horizon
      .replace(/\b(?:data|derived|config|profile):[a-zA-Z0-9_:.-]+\b/g, " ")
      // ISO timestamps and dates: 2026-11-10T14:00:00Z, 2026-11-10
      .replace(/\b\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?\b/g, " ")
      // Written dates with day, month, year: 31 October 2026, 10 Nov 2026, 09 Nov 2026
      .replace(
        /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
        " ",
      )
      // Month Year: October 2026, Nov 2026
      .replace(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
        " ",
      )
      // FY years: FY2026, FY26, FY-26
      .replace(/\bFY-?\s*\d{2,4}\b/gi, " ")
      // Version strings: v0, v1, v0.1.0, 1.0.0 (semver requires 2+ dots or leading v)
      .replace(/\bv\d+(?:\.\d+)*\b/gi, " ")
      .replace(/\b\d+\.\d+\.\d+\b/g, " ")
      .replace(/\bBull\s+v\d+\b/gi, " ")
      // Index name: Nifty 50, NIFTY 50, Nifty50
      .replace(/\bNIFTY\s*50\b/gi, " ")
      // Section markers: §9.1, § 10.3
      .replace(/§\s*\d+(?:\.\d+)*/g, " ")
      // Standalone 4-digit calendar years (1900-2099) not preceded or followed by currency/decimals/%
      .replace(/(?<![₹Rs.,\d])\b(?:19|20)\d{2}\b(?!\.\d|,\d|%)/g, " ")
  );
}

/**
 * Extracts every numeric token from text (§9.3).
 * Excludes date and time tokens, version strings, ref ids, and index names.
 */
export function extractNumericTokens(text: string): string[] {
  const norm = normalizeText(text);
  let working = maskNonClaimTokens(norm);
  const tokens: string[] = [];

  const extractPattern = (regex: RegExp) => {
    const matches = Array.from(working.matchAll(regex));
    for (const m of matches) {
      tokens.push(m[0].trim());
    }
    working = working.replace(regex, " ");
  };

  // 1. Currency amounts: ₹1,550.25, Rs. 500, Rs 500, ₹10,000
  extractPattern(/(?:₹|Rs\.?\s*)\s*-?\d+(?:,\d+)*(?:\.\d+)?/gi);

  // 2. Percentages: 31.8%, -2.5%, +1.2%, 20%
  extractPattern(/[+-]?\d+(?:,\d+)*(?:\.\d+)?%/g);

  // 3. Multipliers / times: 12.5x, 2X
  extractPattern(/\b\d+(?:\.\d+)?[xX]\b/g);

  // 4. Numbers with decimals: 25.40, 0.15, -1.25
  extractPattern(/[+-]?\b\d+(?:,\d+)*\.\d+\b/g);

  // 5. Grouped numbers: 15,340, 1,23,456
  extractPattern(/\b\d{1,3}(?:,\d{2,3})+\b/g);

  // 6. Plain integers: 50, 42
  extractPattern(/[+-]?\b\d+\b/g);

  return tokens;
}

/**
 * Checks whether a single extracted numeric token resolves to any Ref in the refs collection.
 */
function tokenResolvesToRef(token: string, refs: Ref[]): boolean {
  const isPercent = token.includes("%");
  const isTimes = /[xX]$/i.test(token);
  const clean = token
    .replace(/[₹%xX]/gi, "")
    .replace(/Rs\.?\s*/gi, "")
    .replace(/,/g, "")
    .trim();

  const numVal = parseFloat(clean);
  if (Number.isNaN(numVal)) {
    return false;
  }

  for (const ref of refs) {
    // 1. Profile ref check
    if (ref.kind === "profile") {
      if (
        ref.displayValue.includes(token) ||
        ref.displayValue.includes(clean)
      ) {
        return true;
      }
      continue;
    }

    // 2. String value ref check
    if (typeof ref.value === "string") {
      if (ref.value === token || ref.value === clean) {
        return true;
      }
      continue;
    }

    // 3. Numeric value ref check
    if (typeof ref.value === "number") {
      // Direct numerical difference tolerance ±0.01
      if (Math.abs(numVal - ref.value) <= 0.01001) {
        return true;
      }

      // Percentage scale: decimal 0.20 in Ref vs 20% in text
      if (isPercent || ref.unit === "percent") {
        if (Math.abs(numVal - ref.value * 100) <= 0.01001) {
          return true;
        }
        if (Math.abs(numVal * 100 - ref.value) <= 0.01001) {
          return true;
        }
      }

      // Multiplier unit match
      if (isTimes && ref.unit === "times") {
        if (Math.abs(numVal - ref.value) <= 0.01001) {
          return true;
        }
      }

      // Formatted ref value string comparison
      const formatted = formatRefValue(ref);
      if (formatted === token) {
        return true;
      }
      const cleanFormatted = formatted
        .replace(/[₹%xX]/gi, "")
        .replace(/Rs\.?\s*/gi, "")
        .replace(/,/g, "")
        .trim();
      if (cleanFormatted === clean) {
        return true;
      }

      // Signed percent format comparison (+1.2% / -1.0%)
      if (ref.unit === "percent") {
        if (formatSignedPercent(ref.value) === token) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Verifies that all numeric tokens in the given text resolve to one of the provided Refs (§9.3).
 */
export function verifyTraceability(text: string, refs: Ref[]): boolean {
  if (isExempt(text)) {
    return true;
  }

  const tokens = extractNumericTokens(text);
  for (const token of tokens) {
    if (!tokenResolvesToRef(token, refs)) {
      return false;
    }
  }
  return true;
}

type TextExtract = { text: string; location: string };

/**
 * Extracts all user-visible text strings from any Answer block structure.
 */
function extractAnswerTextStrings(blocks: Block[]): TextExtract[] {
  const result: TextExtract[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "text":
        result.push({ text: block.text, location: "text" });
        break;
      case "intake_question":
        result.push({
          text: block.question,
          location: `intake_question(${block.field}).question`,
        });
        for (const opt of block.options) {
          result.push({
            text: opt.label,
            location: `intake_question(${block.field}).option`,
          });
        }
        break;
      case "choices":
        result.push({ text: block.question, location: "choices.question" });
        for (const opt of block.options) {
          result.push({ text: opt.label, location: "choices.option" });
        }
        break;
      case "shortlist":
        result.push({
          text: block.diversityNote,
          location: "shortlist.diversityNote",
        });
        result.push({
          text: block.howChosen.anchorsSummary,
          location: "shortlist.howChosen.anchorsSummary",
        });
        for (const card of block.cards) {
          result.push({
            text: card.name,
            location: `shortlist.card(${card.ticker}).name`,
          });
          result.push({
            text: card.businessDescription,
            location: `shortlist.card(${card.ticker}).businessDescription`,
          });
          for (const reason of card.reasons) {
            result.push({
              text: reason,
              location: `shortlist.card(${card.ticker}).reason`,
            });
          }
          result.push({
            text: card.riskSentence,
            location: `shortlist.card(${card.ticker}).riskSentence`,
          });
        }
        break;
      case "stock_detail":
        for (const sec of block.sections) {
          result.push({
            text: sec.title,
            location: `stock_detail(${block.ticker}).section(${sec.id}).title`,
          });
          for (const row of sec.rows) {
            result.push({
              text: row.label,
              location: `stock_detail(${block.ticker}).row.label`,
            });
            result.push({
              text: row.value,
              location: `stock_detail(${block.ticker}).row.value`,
            });
            if (row.note) {
              result.push({
                text: row.note,
                location: `stock_detail(${block.ticker}).row.note`,
              });
            }
          }
        }
        break;
      case "comparison":
        for (const row of block.rows) {
          result.push({ text: row.label, location: "comparison.row.label" });
          result.push({
            text: row.stockAValue,
            location: "comparison.row.stockAValue",
          });
          result.push({
            text: row.stockBValue,
            location: "comparison.row.stockBValue",
          });
        }
        break;
      case "news":
        for (const item of block.items) {
          result.push({ text: item.headline, location: "news.headline" });
          result.push({ text: item.summary, location: "news.summary" });
          result.push({ text: item.sourceName, location: "news.sourceName" });
        }
        break;
      case "coverage_miss":
        result.push({ text: block.name, location: "coverage_miss.name" });
        if (block.reason) {
          result.push({
            text: block.reason,
            location: "coverage_miss.reason",
          });
        }
        break;
      case "boundary":
        result.push({
          text: block.explanation,
          location: `boundary(${block.topic}).explanation`,
        });
        break;
      case "limitations":
        for (const item of block.items) {
          result.push({ text: item, location: "limitations.item" });
        }
        break;
      case "education_note":
        result.push({ text: block.text, location: "education_note.text" });
        break;
      case "profile_summary":
        // Profile summary renders user profile selections
        break;
    }
  }

  return result;
}

/**
 * Central Choke Point: inspects an Answer before it can be returned or rendered (§9.1).
 *
 * Enforces:
 * - Rule 1: Zero banned patterns across all text fields (unless covered by exact exemption).
 * - Rule 2 (Numeric Traceability): Every numeric token across all text strings must resolve
 *   to a Ref in answer.refs within ±0.01 tolerance or percentage/formatting equivalent.
 * - Rule 3: Single stock boundary check (shortlist cannot present 1 card as recommendation).
 */
export function inspectAnswer(answer: Answer): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Rule 3: Single stock boundary check
  for (const block of answer.blocks) {
    if (block.type === "shortlist" && block.cards.length === 1) {
      violations.push(
        "Single stock boundary violation: shortlist cannot recommend a single stock or present 1 card as recommendation",
      );
    }
  }

  // Extract all text strings across all blocks
  const textExtracts = extractAnswerTextStrings(answer.blocks);

  for (const { text, location } of textExtracts) {
    // Exempt strings bypass pattern and numeric traceability checks
    if (isExempt(text)) {
      continue;
    }

    // Rule 1: Banned pattern checks
    const patternMatches = scanAllPatterns(text);
    for (const match of patternMatches) {
      violations.push(
        `[Rule 1] Banned pattern (${match.category}/${match.severity}) in ${location}: "${match.match}" - ${match.reason}`,
      );
    }

    // Rule 2: Numeric traceability checks
    const numericTokens = extractNumericTokens(text);
    for (const token of numericTokens) {
      if (!tokenResolvesToRef(token, answer.refs)) {
        violations.push(
          `[Rule 2] Untraced numeric token in ${location}: "${token}" does not resolve to any Ref in answer.refs`,
        );
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Asserts that an Answer is safe. Throws SafetyViolationError if invalid (§9.1).
 */
export function assertSafeAnswer(answer: Answer): void {
  const result = inspectAnswer(answer);
  if (!result.valid) {
    throw new SafetyViolationError(result.violations);
  }
}
