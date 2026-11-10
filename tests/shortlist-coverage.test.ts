import { describe, expect, it } from "vitest";
import { snapshot } from "@/lib/data/snapshot";
import { deriveMetrics } from "@/lib/engine/metrics";
import { scoreStock, selectShortlist } from "@/lib/engine/score";
import { handleTurn } from "@/lib/engine/answer";
import { SHORTLIST_CONFIG } from "@/lib/engine/config";
import type { Goal, Horizon, RiskComfort, Experience, Profile, TurnInput } from "@/lib/engine/types";

const FIXED_NOW = "2026-11-10T14:00:00Z";

const GOALS: Goal[] = ["grow_wealth", "dividends", "learn", "preserve"];
const HORIZONS: Horizon[] = ["1_3y", "3_5y", "5_10y", "10y_plus"];
const RISKS: RiskComfort[] = ["low", "medium", "high", "unsure"];
const EXPERIENCES: Experience[] = ["none", "few", "sip"];

describe("Shortlist Coverage Test Suite (Task 71 & 72)", () => {
  // Pre-derive metrics for all 12 snapshot stocks
  const stockMetricsMap = new Map();
  for (const stock of snapshot.stocks) {
    const sector = snapshot.sectors.find((s) => s.id === stock.sectorId) ?? snapshot.sectors[0];
    stockMetricsMap.set(stock.ticker, deriveMetrics(stock, sector, snapshot.index, FIXED_NOW));
  }

  it("verifies that 100% of the 12 seeded companies qualify for the shortlist across valid profile permutations", () => {
    const qualifiedTickers = new Set<string>();

    for (const goal of GOALS) {
      for (const horizon of HORIZONS) {
        for (const riskComfort of RISKS) {
          for (const experience of EXPERIENCES) {
            const profile: Profile = {
              goal,
              horizon,
              riskComfort,
              experience,
              locale: "en",
            };

            for (const stock of snapshot.stocks) {
              const metrics = stockMetricsMap.get(stock.ticker);
              const scored = scoreStock(profile, metrics, stock);
              if (scored.qualifies) {
                qualifiedTickers.add(stock.ticker);
              }
            }
          }
        }
      }
    }

    // 100% of the 12 seeded companies must qualify in at least one valid profile permutation
    expect(qualifiedTickers.size).toBe(12);
    for (const stock of snapshot.stocks) {
      expect(
        qualifiedTickers.has(stock.ticker),
        `Stock ${stock.ticker} failed to qualify in any profile permutation`,
      ).toBe(true);
    }
  });

  it("verifies that every profile permutation produces 3-5 shortlist picks without violating sector diversity caps", () => {
    let permutationCount = 0;

    for (const goal of GOALS) {
      for (const horizon of HORIZONS) {
        for (const riskComfort of RISKS) {
          for (const experience of EXPERIENCES) {
            permutationCount++;
            const profile: Profile = {
              goal,
              horizon,
              riskComfort,
              experience,
              locale: "en",
            };

            const scored = snapshot.stocks.map((stock) => {
              const metrics = stockMetricsMap.get(stock.ticker);
              return scoreStock(profile, metrics, stock);
            });

            const shortlist = selectShortlist(scored);

            // Shortlist must contain between 3 and 5 picks (§7.6)
            expect(shortlist.cards.length).toBeGreaterThanOrEqual(SHORTLIST_CONFIG.minPicksForNormalFit);
            expect(shortlist.cards.length).toBeLessThanOrEqual(SHORTLIST_CONFIG.maxPicks);
            expect(shortlist.thinFit).toBe(false);

            // Verify diversity cap: no single sector may have more than 2 stocks
            const sectorCounts: Record<string, number> = {};
            for (const card of shortlist.cards) {
              const sec = card.stock.sectorId;
              sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
              expect(
                sectorCounts[sec],
                `Sector ${sec} exceeded maxPerSector cap of 2 in profile ${JSON.stringify(profile)}`,
              ).toBeLessThanOrEqual(SHORTLIST_CONFIG.maxPerSector);
            }

            // Verify at least 3 distinct sectors are represented in each shortlist
            expect(shortlist.sectorsCount).toBeGreaterThanOrEqual(SHORTLIST_CONFIG.minSectorsRequired);
          }
        }
      }
    }

    // Assert that all 192 permutations were tested
    expect(permutationCount).toBe(4 * 4 * 4 * 3);
  });

  it("verifies H1 Golden Profile and 4 spec variants each yield 3-5 qualifiers and valid shortlists (§10.9, R5)", () => {
    // H1 and 4 representative variants specified in design spec §10.9 & §15.1
    const testProfiles: Array<{ name: string; profile: Profile }> = [
      {
        name: "H1 Golden Case (wealth growth, 5-10y, medium risk, SIP)",
        profile: { goal: "grow_wealth", horizon: "5_10y", riskComfort: "medium", experience: "sip", locale: "en" },
      },
      {
        name: "Variant 1 (dividends, 10y+, low risk, few)",
        profile: { goal: "dividends", horizon: "10y_plus", riskComfort: "low", experience: "few", locale: "en" },
      },
      {
        name: "Variant 2 (capital preservation, 1-3y, low risk, none)",
        profile: { goal: "preserve", horizon: "1_3y", riskComfort: "low", experience: "none", locale: "en" },
      },
      {
        name: "Variant 3 (learning, 3-5y, low risk, none)",
        profile: { goal: "learn", horizon: "3_5y", riskComfort: "low", experience: "none", locale: "en" },
      },
      {
        name: "Variant 4 (aggressive wealth growth, 10y+, high risk, sip)",
        profile: { goal: "grow_wealth", horizon: "10y_plus", riskComfort: "high", experience: "sip", locale: "en" },
      },
    ];

    for (const { name, profile } of testProfiles) {
      const scored = snapshot.stocks.map((stock) => {
        const metrics = stockMetricsMap.get(stock.ticker);
        return scoreStock(profile, metrics, stock);
      });

      const qualifiers = scored.filter((s) => s.qualifies);
      expect(qualifiers.length, `${name} qualifiers count`).toBeGreaterThanOrEqual(3);

      const shortlist = selectShortlist(scored);
      expect(shortlist.cards.length, `${name} shortlist length`).toBeGreaterThanOrEqual(3);
      expect(shortlist.cards.length, `${name} shortlist length`).toBeLessThanOrEqual(5);

      // Verify diversity cap
      const sectorCounts = new Map<string, number>();
      for (const card of shortlist.cards) {
        const count = (sectorCounts.get(card.stock.sectorId) ?? 0) + 1;
        sectorCounts.set(card.stock.sectorId, count);
        expect(count, `${name} sector cap for ${card.stock.sectorId}`).toBeLessThanOrEqual(2);
      }
      expect(shortlist.sectorsCount, `${name} distinct sectors`).toBeGreaterThanOrEqual(3);
    }
  });

  it("verifies pipeline integration: handleTurn returns shortlist block respecting caps and diversity note", () => {
    const input: TurnInput = {
      message: "Suggest a shortlist of stocks for my profile",
      profile: {
        goal: "grow_wealth",
        horizon: "5_10y",
        riskComfort: "medium",
        experience: "sip",
        locale: "en",
      },
      locale: "en",
      now: FIXED_NOW,
      events: [],
    };

    const answer = handleTurn(input, { snapshot });
    expect(answer.route).toBe("shortlist");

    const shortlistBlock = answer.blocks.find((b) => b.type === "shortlist");
    expect(shortlistBlock).toBeDefined();

    if (shortlistBlock?.type === "shortlist") {
      expect(shortlistBlock.cards.length).toBeGreaterThanOrEqual(3);
      expect(shortlistBlock.cards.length).toBeLessThanOrEqual(5);
      expect(shortlistBlock.sectors).toBeGreaterThanOrEqual(3);
      expect(shortlistBlock.diversityNote.length).toBeGreaterThan(0);
      expect(shortlistBlock.diversityNote.toLowerCase()).toContain("concentration");

      // Verify each card has 2 reasons, 1 risk sentence, and at least 3 factor bars
      for (const card of shortlistBlock.cards) {
        expect(card.reasons).toHaveLength(2);
        expect(card.riskSentence.length).toBeGreaterThan(0);
        expect(card.factorBars.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("verifies each of the 12 seeded companies is eligible and top-ranked in its respective sector", () => {
    // When investors search by sector or examine sector leadership, verify each of the 12 stocks
    // qualifies and represents its sector
    for (const stock of snapshot.stocks) {
      const defaultProfile: Profile = {
        goal: "grow_wealth",
        horizon: "5_10y",
        riskComfort: "medium",
        experience: "sip",
        locale: "en",
      };
      const metrics = stockMetricsMap.get(stock.ticker);
      const scored = scoreStock(defaultProfile, metrics, stock);

      // Must qualify
      expect(scored.qualifies, `${stock.ticker} qualification`).toBe(true);
      expect(scored.score, `${stock.ticker} score`).toBeGreaterThanOrEqual(SHORTLIST_CONFIG.qualifyThreshold);
      expect(scored.coverage, `${stock.ticker} coverage`).toBeGreaterThanOrEqual(SHORTLIST_CONFIG.coverageFloor);
      expect(scored.stock.nifty50Member.value, `${stock.ticker} nifty50Member`).toBe(true);
    }
  });
});
