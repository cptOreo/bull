import { describe, expect, it } from "vitest";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { GLOSSARY, GLOSSARY_BY_ID } from "@/content/glossary";

/**
 * Banned investment advice words (§9.2, Task 44):
 * No static interface copy or glossary explanation may contain directive advice,
 * price targets, return guarantees, or speculative hype.
 */
const BANNED_ADVICE_WORDS_REGEX = /\b(buy|sell|target|guaranteed|multibagger)\b/i;

const DEVANAGARI_REGEX = /[\u0900-\u097F\uA8E0-\uA8FF]/;

function extractAllStrings(obj: unknown, path = ""): Array<{ path: string; text: string }> {
  const result: Array<{ path: string; text: string }> = [];
  if (typeof obj === "string") {
    result.push({ path, text: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      result.push(...extractAllStrings(item, `${path}[${index}]`));
    });
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      result.push(...extractAllStrings(value, path ? `${path}.${key}` : key));
    }
  }
  return result;
}

function verifyKeyParity(obj1: Record<string, unknown>, obj2: Record<string, unknown>, path = ""): void {
  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  expect(keys1, `Key mismatch at ${path || "root"}`).toEqual(keys2);

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    const subPath = path ? `${path}.${key}` : key;

    if (val1 !== null && typeof val1 === "object" && !Array.isArray(val1)) {
      expect(typeof val2, `Type mismatch at ${subPath}`).toBe("object");
      verifyKeyParity(val1 as Record<string, unknown>, val2 as Record<string, unknown>, subPath);
    }
  }
}

describe("safety.copy - 1:1 key parity between English and Hinglish", () => {
  it("enforces strict identical key structure across copy.en and copy.hi-en", () => {
    verifyKeyParity(copyEn, copyHiEn);
  });

  it("ensures all copy values are non-empty strings", () => {
    const enStrings = extractAllStrings(copyEn);
    const hiEnStrings = extractAllStrings(copyHiEn);

    expect(enStrings.length).toBeGreaterThan(50);
    expect(hiEnStrings.length).toBe(enStrings.length);

    for (const item of enStrings) {
      expect(item.text.trim().length, `Empty English copy at ${item.path}`).toBeGreaterThan(0);
    }

    for (const item of hiEnStrings) {
      expect(item.text.trim().length, `Empty Hinglish copy at ${item.path}`).toBeGreaterThan(0);
    }
  });
});

describe("safety.copy - banned investment advice words", () => {
  it("verifies NO static copy in copy.en contains banned words (buy, sell, target, guaranteed, multibagger)", () => {
    const enStrings = extractAllStrings(copyEn);
    const violations: Array<{ path: string; match: string; text: string }> = [];

    for (const item of enStrings) {
      const match = item.text.match(BANNED_ADVICE_WORDS_REGEX);
      if (match) {
        violations.push({ path: item.path, match: match[0], text: item.text });
      }
    }

    expect(violations, `Banned advice words found in copy.en: ${JSON.stringify(violations)}`).toEqual([]);
  });

  it("verifies NO static copy in copy.hi-en contains banned words (buy, sell, target, guaranteed, multibagger)", () => {
    const hiStrings = extractAllStrings(copyHiEn);
    const violations: Array<{ path: string; match: string; text: string }> = [];

    for (const item of hiStrings) {
      const match = item.text.match(BANNED_ADVICE_WORDS_REGEX);
      if (match) {
        violations.push({ path: item.path, match: match[0], text: item.text });
      }
    }

    expect(violations, `Banned advice words found in copy.hi-en: ${JSON.stringify(violations)}`).toEqual([]);
  });

  it("verifies NO entry in content/glossary contains banned advice words", () => {
    const glossaryStrings = extractAllStrings(GLOSSARY);
    const violations: Array<{ path: string; match: string; text: string }> = [];

    for (const item of glossaryStrings) {
      const match = item.text.match(BANNED_ADVICE_WORDS_REGEX);
      if (match) {
        violations.push({ path: item.path, match: match[0], text: item.text });
      }
    }

    expect(violations, `Banned advice words found in glossary: ${JSON.stringify(violations)}`).toEqual([]);
  });
});

describe("safety.copy - script integrity", () => {
  it("verifies all Hinglish copy is written in Roman script with zero Devanagari characters", () => {
    const hiStrings = extractAllStrings(copyHiEn);
    const devanagariMatches: string[] = [];

    for (const item of hiStrings) {
      if (DEVANAGARI_REGEX.test(item.text)) {
        devanagariMatches.push(`${item.path}: ${item.text}`);
      }
    }

    expect(devanagariMatches, `Devanagari characters found in Hinglish copy: ${devanagariMatches.join(", ")}`).toEqual([]);
  });

  it("verifies glossary Hinglish sections contain zero Devanagari characters", () => {
    const hiGlossaryStrings = GLOSSARY.flatMap((entry) => extractAllStrings(entry.hiEn, entry.id));
    const devanagariMatches: string[] = [];

    for (const item of hiGlossaryStrings) {
      if (DEVANAGARI_REGEX.test(item.text)) {
        devanagariMatches.push(`${item.path}: ${item.text}`);
      }
    }

    expect(devanagariMatches, `Devanagari characters found in glossary hiEn: ${devanagariMatches.join(", ")}`).toEqual([]);
  });
});

describe("content/glossary - beginner financial glossary coverage", () => {
  it("explains all 8 required financial terms", () => {
    const expectedTerms = [
      "pe",
      "pb",
      "roe",
      "roce",
      "debtToEquity",
      "volatility",
      "drawdown",
      "cagr",
    ];

    expect(GLOSSARY.length).toBe(8);
    for (const termId of expectedTerms) {
      const entry = GLOSSARY_BY_ID[termId];
      expect(entry, `Missing glossary term: ${termId}`).toBeDefined();
      expect(entry.en.title).toBeTruthy();
      expect(entry.en.definition).toBeTruthy();
      expect(entry.en.plainExplanation).toBeTruthy();
      expect(entry.en.formula).toBeTruthy();
      expect(entry.en.whyItMatters).toBeTruthy();
      expect(entry.en.limitations).toBeTruthy();

      expect(entry.hiEn.title).toBeTruthy();
      expect(entry.hiEn.definition).toBeTruthy();
      expect(entry.hiEn.plainExplanation).toBeTruthy();
      expect(entry.hiEn.formula).toBeTruthy();
      expect(entry.hiEn.whyItMatters).toBeTruthy();
      expect(entry.hiEn.limitations).toBeTruthy();
    }
  });
});
