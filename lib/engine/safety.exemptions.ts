/**
 * Safety approved exemptions whitelist (§9.2, §9.4).
 *
 * Strictly capped to at most 6 exact phrases.
 * Exemption matching is strictly by exact full-string equality (never substring, never regex).
 * Every exemption on this list must trigger at least one banned pattern when checked unexempted,
 * ensuring the list cannot quietly absorb normal copy.
 */

export const APPROVED_EXEMPTIONS: readonly string[] = [
  // 1. Education note disclaimer (English)
  "This is educational analysis and not a buy or sell recommendation.",

  // 2. Education note disclaimer (Hinglish)
  "Yeh educational analysis hai aur koi buy ya sell recommendation nahi hai.",

  // 3. Advice boundary refusal copy (English)
  "Bull does not provide investment advice, buy or sell recommendations, or target prices.",

  // 4. Advice boundary refusal copy (Hinglish)
  "Bull investment advice, buy ya sell recommendation, ya target price provide nahi karta.",

  // 5. Portfolio & return promise boundary refusal copy
  "Bull does not recommend stocks, manage portfolios, or promise returns.",

  // 6. /method transparency & safety page boundary statement
  "We never give buy or sell recommendations for any individual stock.",
] as const;

/**
 * Checks whether a text string exactly matches one of the approved exemptions.
 * Matching is by exact full-string equality (after trimming).
 * Substring matching or broad regex matching is explicitly forbidden.
 */
export function isExempt(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  return APPROVED_EXEMPTIONS.some((exemption) => exemption === trimmed);
}
