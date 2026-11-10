import { describe, expect, it } from "vitest";
import {
  APPROVED_EXEMPTIONS,
  isExempt,
} from "@/lib/engine/safety.exemptions";
import { scanAllPatterns } from "@/lib/engine/safety.patterns";

describe("Safety exemptions whitelist (§9.2, §9.4)", () => {
  it("strictly caps the exemptions list to at most 6 entries", () => {
    expect(APPROVED_EXEMPTIONS.length).toBeGreaterThan(0);
    expect(APPROVED_EXEMPTIONS.length).toBeLessThanOrEqual(6);
  });

  it("ensures every approved exemption triggers at least one banned pattern when checked unexempted", () => {
    for (const exemption of APPROVED_EXEMPTIONS) {
      const violations = scanAllPatterns(exemption);
      expect(
        violations.length,
        `Exemption "${exemption}" did not trigger any banned pattern unexempted. Whitelist must not absorb safe copy.`,
      ).toBeGreaterThan(0);
    }
  });

  it("matches exemptions by exact full-string equality, never by broad regex or substring", () => {
    for (const exemption of APPROVED_EXEMPTIONS) {
      // Exact match passes
      expect(isExempt(exemption)).toBe(true);
      // Trimmed match passes
      expect(isExempt(`  ${exemption}  `)).toBe(true);

      // Substrings must NOT be exempt
      const sub = exemption.slice(10, 30);
      expect(isExempt(sub)).toBe(false);

      // Appending malicious text must NOT be exempt
      expect(isExempt(`${exemption} Buy INFY now.`)).toBe(false);
      expect(isExempt(`You should buy now. ${exemption}`)).toBe(false);
      expect(isExempt(`${exemption} Guaranteed returns!`)).toBe(false);
    }
  });

  it("returns false for arbitrary non-exempt strings", () => {
    expect(isExempt("This is educational analysis")).toBe(false);
    expect(isExempt("buy or sell recommendation")).toBe(false);
    expect(isExempt("Bull provides educational analysis for learning purposes.")).toBe(false);
    expect(isExempt("")).toBe(false);
  });
});
