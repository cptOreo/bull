import { z } from "zod";

export interface VerificationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface VerificationConfig {
  numericTolerance?: number;
  maxLength?: number;
  requiredEntities?: string[];
  forbiddenPatterns?: RegExp[];
  language?: "en" | "hi-en";
}

const DEFAULT_CONFIG: Required<VerificationConfig> = {
  numericTolerance: 0.05,
  maxLength: 5000,
  requiredEntities: [],
  forbiddenPatterns: [
    /(?:should|must|ought to|strongly)\s+(?:buy|sell|accumulate|exit)\b/i,
    /(?:my|our)\s+(?:recommendation|advice)\s+is\s+to\s+(?:buy|sell)\b/i,
    /₹?\d+(\.\d+)?\s*(crore|cr|lakh|l)?\s*(price target|target price)/i,
    /(?:guaranteed|risk[- ]?free)\s*(?:return|profit|gain)/i,
    /will\s+(?:definitely|surely)\s+(?:go\s+up|go\s+down|double|triple)/i,
  ],
  language: "en",
};

export function verifyResponse(
  response: string,
  context: { stockData?: Record<string, unknown>; userQuery?: string } = {},
  config: VerificationConfig = {}
): VerificationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  if (response.length > cfg.maxLength) {
    errors.push(`Response exceeds maximum length (${response.length} > ${cfg.maxLength})`);
  }

  for (const pattern of cfg.forbiddenPatterns) {
    if (pattern.test(response)) {
      errors.push(`Forbidden pattern detected: ${pattern.source}`);
    }
  }

  if (context.stockData) {
    const numbersInResponse = response.match(/[\d,]+\.?\d*/g) || [];
    for (const numStr of numbersInResponse) {
      const num = parseFloat(numStr.replace(/,/g, ""));
      if (isNaN(num)) continue;
      
      let found = false;
      for (const [key, value] of Object.entries(context.stockData)) {
        if (typeof value === "number") {
          const tolerance = Math.abs(value) * cfg.numericTolerance;
          if (Math.abs(num - value) <= tolerance) {
            found = true;
            break;
          }
        }
      }
      if (!found && num > 1000) {
        warnings.push(`Unverified number: ${numStr} (not traced to provided data)`);
      }
    }
  }

  for (const entity of cfg.requiredEntities) {
    if (!response.toLowerCase().includes(entity.toLowerCase())) {
      warnings.push(`Required entity not mentioned: ${entity}`);
    }
  }

  if (cfg.language === "hi-en") {
    const hasHinglish = /hai|hain|kya|kaise|kyun|yeh|woh|main|aap|hum|stock|share|price|profit|loss|company|business/.test(response.toLowerCase());
    if (!hasHinglish) {
      warnings.push("Response may not be in Hinglish as requested");
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

export function sanitizeResponse(response: string): string {
  return response
    .replace(/\b(I recommend|You should|Must buy|Strong buy|Sell now)\b/gi, "")
    .replace(/\b(target price|price target|upside|downside)\b/gi, "fair value estimate")
    .replace(/\b(guaranteed|risk-free|sure shot)\b/gi, "theoretical");
}