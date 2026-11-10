import { describe, expect, it } from "vitest";
import { handleTurn } from "@/lib/engine/answer";
import { inspectAnswer } from "@/lib/engine/safety";
import { snapshot } from "@/lib/data/snapshot";
import type { TurnInput, Locale, Goal, RiskComfort, Horizon } from "@/lib/engine/types";

const FIXED_NOW = "2026-11-10T14:00:00Z";
const LOCALES: Locale[] = ["en", "hi-en"];

describe("tests/safety.corpus - Sweep across all 12 stocks and both locales", () => {
  for (const stock of snapshot.stocks) {
    for (const locale of LOCALES) {
      it(`evaluates stock_detail safety for ${stock.ticker} in ${locale}`, () => {
        const input: TurnInput = {
          message: locale === "hi-en" ? `${stock.name} ka analysis dikhao` : `Analyze ${stock.name}`,
          profile: null,
          locale,
          now: FIXED_NOW,
          events: [],
        };

        const answer = handleTurn(input, { snapshot });
        const inspection = inspectAnswer(answer);
        expect(inspection.violations, `Violations in ${stock.ticker} (${locale})`).toEqual([]);
        expect(inspection.valid).toBe(true);
      });

      it(`evaluates news inquiry safety for ${stock.ticker} in ${locale}`, () => {
        const input: TurnInput = {
          message:
            locale === "hi-en"
              ? `${stock.ticker} ke baare mein kya news hai?`
              : `What is the latest news for ${stock.ticker}?`,
          profile: null,
          locale,
          now: FIXED_NOW,
          events: [],
        };

        const answer = handleTurn(input, { snapshot });
        const inspection = inspectAnswer(answer);
        expect(inspection.violations).toEqual([]);
        expect(inspection.valid).toBe(true);
      });

      it(`evaluates history inquiry safety for ${stock.ticker} in ${locale}`, () => {
        const input: TurnInput = {
          message:
            locale === "hi-en"
              ? `${stock.ticker} ka 5 saal ka history kaisa raha?`
              : `How has ${stock.ticker} performed over the last 5 years?`,
          profile: null,
          locale,
          now: FIXED_NOW,
          events: [],
        };

        const answer = handleTurn(input, { snapshot });
        const inspection = inspectAnswer(answer);
        expect(inspection.violations).toEqual([]);
        expect(inspection.valid).toBe(true);
      });
    }
  }
});

describe("tests/safety.corpus - Shortlist sweeps across goals and risk comforts", () => {
  const GOALS: Goal[] = ["grow_wealth", "dividends", "learn", "preserve"];
  const RISKS: RiskComfort[] = ["low", "medium", "high", "unsure"];
  const HORIZONS: Horizon[] = ["1_3y", "3_5y", "5_10y", "10y_plus"];

  for (const goal of GOALS) {
    for (const riskComfort of RISKS) {
      it(`verifies shortlist safety for profile goal=${goal}, risk=${riskComfort}`, () => {
        const input: TurnInput = {
          message: "Give me a shortlist of stocks",
          profile: {
            goal,
            riskComfort,
            horizon: "5_10y",
            experience: "sip",
            locale: "en",
          },
          locale: "en",
          now: FIXED_NOW,
          events: [],
        };

        const answer = handleTurn(input, { snapshot });
        const inspection = inspectAnswer(answer);
        expect(inspection.violations).toEqual([]);
        expect(inspection.valid).toBe(true);
      });
    }
  }

  for (const horizon of HORIZONS) {
    it(`verifies shortlist safety in Hinglish for horizon=${horizon}`, () => {
      const input: TurnInput = {
        message: "Mere liye stocks shortlist karo",
        profile: {
          goal: "dividends",
          riskComfort: "low",
          horizon,
          experience: "none",
          locale: "hi-en",
        },
        locale: "hi-en",
        now: FIXED_NOW,
        events: [],
      };

      const answer = handleTurn(input, { snapshot });
      const inspection = inspectAnswer(answer);
      expect(inspection.violations).toEqual([]);
      expect(inspection.valid).toBe(true);
    });
  }
});

describe("tests/safety.corpus - Metamorphic whitespace and casing transformations", () => {
  const queries = [
    "   WHY   DID   INFOSYS   FALL   TODAY?   ",
    "itc ka debt kitna hai? SAFE HAI KYA?",
    "tcs vs infosys, WHICH SUITS ME BETTER?",
    "   suggest    some   stocks   ",
    "Mere Paas 2 Lakh Hai. Sab Ek Stock Mein Daalna Hai.",
  ];

  for (const q of queries) {
    it(`preserves zero violations under metamorphic mutation: "${q}"`, () => {
      const input: TurnInput = {
        message: q,
        profile: null,
        locale: "en",
        now: FIXED_NOW,
        events: [],
      };

      const answer = handleTurn(input, { snapshot });
      const inspection = inspectAnswer(answer);
      expect(inspection.violations).toEqual([]);
      expect(inspection.valid).toBe(true);
    });
  }
});
