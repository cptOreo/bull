import { TEMPLATES_EN } from "@/lib/engine/templates/en";
import { TEMPLATES_HI_EN } from "@/lib/engine/templates/hi-en";
import type { Factor, Locale, Template, TemplateBand, TemplateCategory } from "@/lib/engine/types";

export { TEMPLATES_EN } from "@/lib/engine/templates/en";
export { TEMPLATES_HI_EN } from "@/lib/engine/templates/hi-en";
export type { Template, TemplateBand, TemplateCategory };

/**
 * Extracts slot parameter names from a template text string (e.g. "{roe}" -> "roe").
 * Preserves the order of appearance.
 */
export function extractSlots(text: string): string[] {
  const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g);
  if (!matches) return [];
  const seen = new Set<string>();
  const slots: string[] = [];
  for (const m of matches) {
    const name = m.slice(1, -1);
    if (!seen.has(name)) {
      seen.add(name);
      slots.push(name);
    }
  }
  return slots;
}

/**
 * Retrieves all registered templates for the given locale.
 */
export function getAllTemplates(locale: Locale): Template[] {
  const map = locale === "hi-en" ? TEMPLATES_HI_EN : TEMPLATES_EN;
  return Object.values(map);
}

/**
 * Looks up a specific template by ID and locale.
 */
export function getTemplate(id: string, locale: Locale): Template | undefined {
  const map = locale === "hi-en" ? TEMPLATES_HI_EN : TEMPLATES_EN;
  return map[id];
}

/**
 * Helper to retrieve a reason template by factor, band, and locale.
 */
export function getReasonTemplate(
  factor: Factor,
  band: TemplateBand,
  locale: Locale,
): Template | undefined {
  const id = `reason_${factor}_${band}`;
  return getTemplate(id, locale);
}

export type ParityValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validates strict 1:1 parity between English and Hinglish templates:
 * - Exact same template IDs
 * - Exact same category, factor, and band
 * - Exact same slotNames and slot ordering
 * - Validates that declared slotNames match placeholders in template text
 */
export function validateTemplateParity(): ParityValidationResult {
  const errors: string[] = [];
  const enIds = Object.keys(TEMPLATES_EN);
  const hiIds = Object.keys(TEMPLATES_HI_EN);

  const enIdSet = new Set(enIds);
  const hiIdSet = new Set(hiIds);

  for (const id of enIds) {
    if (!hiIdSet.has(id)) {
      errors.push(`Template ID "${id}" exists in EN but missing in HI-EN`);
    }
  }

  for (const id of hiIds) {
    if (!enIdSet.has(id)) {
      errors.push(`Template ID "${id}" exists in HI-EN but missing in EN`);
    }
  }

  for (const id of enIds) {
    const en = TEMPLATES_EN[id];
    const hi = TEMPLATES_HI_EN[id];
    if (!en || !hi) continue;

    if (en.category !== hi.category) {
      errors.push(`Template "${id}" category mismatch: EN is "${en.category}", HI is "${hi.category}"`);
    }

    if (en.factor !== hi.factor) {
      errors.push(`Template "${id}" factor mismatch: EN is "${en.factor}", HI is "${hi.factor}"`);
    }

    if (en.band !== hi.band) {
      errors.push(`Template "${id}" band mismatch: EN is "${en.band}", HI is "${hi.band}"`);
    }

    // Check slotNames array parity
    if (en.slotNames.length !== hi.slotNames.length) {
      errors.push(
        `Template "${id}" slot count mismatch: EN has [${en.slotNames.join(",")}], HI has [${hi.slotNames.join(",")}]`,
      );
    } else {
      for (let i = 0; i < en.slotNames.length; i++) {
        if (en.slotNames[i] !== hi.slotNames[i]) {
          errors.push(
            `Template "${id}" slotName at index ${i} mismatch: EN has "${en.slotNames[i]}", HI has "${hi.slotNames[i]}"`,
          );
        }
      }
    }

    // Check text placeholder extract parity against declared slotNames
    const extractedEn = extractSlots(en.text);
    const extractedHi = extractSlots(hi.text);

    if (extractedEn.join(",") !== en.slotNames.join(",")) {
      errors.push(
        `Template "${id}" EN declared slotNames [${en.slotNames.join(",")}] do not match extracted slots [${extractedEn.join(",")}]`,
      );
    }

    if (extractedHi.join(",") !== hi.slotNames.join(",")) {
      errors.push(
        `Template "${id}" HI-EN declared slotNames [${hi.slotNames.join(",")}] do not match extracted slots [${extractedHi.join(",")}]`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
