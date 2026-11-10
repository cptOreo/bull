import type { Snapshot, Stock } from "@/lib/data/schema";
import type {
  Answer,
  Block,
  ComparisonRow,
  DetailSection,
  EngineDeps,
  HowChosenView,
  Locale,
  MetricSet,
  NewsItemView,
  Option,
  PartialProfile,
  Profile,
  ProfileField,
  ProfileState,
  Ref,
  RefUnit,
  ScoredStock,
  ShortlistCard,
  TurnInput,
} from "./types";
import { classify } from "./classify";
import {
  parseIntakeMessage,
  getNextIntakeQuestion,
} from "./intake";
import { deriveMetrics } from "./metrics";
import { scoreStock, selectShortlist } from "./score";
import { deriveRiskFlags } from "./risk";
import {
  composeShortlistCard,
  composeHowChosen,
  composeLimitations,
} from "./narrative";
import {
  createConfigRef,
  createProfileRef,
  createDataRef,
  createDerivedRef,
} from "./refs";
import { inspectAnswer, assertSafeAnswer, extractNumericTokens } from "./safety";
import { shortHash } from "./hash";

const ENGINE_VERSION = "0.1.0";

/**
 * Registers data refs for numeric claims appearing in audited news items.
 */
function registerNewsRefs(newsItems: NewsItemView[], refsMap: Map<string, Ref>): void {
  for (const item of newsItems) {
    const text = `${item.headline} ${item.summary}`;
    const tokens = extractNumericTokens(text);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const isPercent = token.includes("%");
      const clean = token.replace(/[₹%xX]/gi, "").replace(/Rs\.?\s*/gi, "").replace(/,/g, "").trim();
      const numVal = parseFloat(clean);
      if (!Number.isNaN(numVal)) {
        const refId = `data:news:${numVal}:${i}`;
        refsMap.set(
          refId,
          createDataRef(
            refId,
            numVal,
            isPercent ? "percent" : "count",
            item.publishedAt,
            item.sourceName,
          ),
        );
      }
    }
  }
}

/**
 * Helper to register all numeric values from MetricSet into refs collection
 * so Rule 2 of safety choke point resolves all formatted variations.
 */
function registerAllMetricRefs(stock: Stock, metrics: MetricSet, refsMap: Map<string, Ref>): void {
  for (const [key, ref] of Object.entries(metrics.refs as Record<string, Ref>)) {
    refsMap.set(key, ref);
  }
  const v = metrics.values;
  const registerNum = (id: string, val: number | null, unit: RefUnit) => {
    if (val !== null && !Number.isNaN(val)) {
      refsMap.set(`val:${id}`, createDerivedRef(`val:${id}`, val, unit, id, []));
      refsMap.set(
        `val1:${id}`,
        createDerivedRef(`val1:${id}`, parseFloat(val.toFixed(1)), unit, id, []),
      );
      refsMap.set(
        `val2:${id}`,
        createDerivedRef(`val2:${id}`, parseFloat(val.toFixed(2)), unit, id, []),
      );
    }
  };

  registerNum(`${stock.ticker}:pe`, v.pe, "ratio");
  registerNum(`${stock.ticker}:pb`, v.pb, "ratio");
  registerNum(`${stock.ticker}:dividendYieldPct`, v.dividendYieldPct, "percent");
  registerNum(`${stock.ticker}:roePct`, v.roePct, "percent");
  registerNum(`${stock.ticker}:rocePct`, v.rocePct, "percent");
  registerNum(`${stock.ticker}:operatingMarginPct`, v.operatingMarginPct, "percent");
  registerNum(`${stock.ticker}:debtToEquity`, v.debtToEquity, "ratio");
  registerNum(`${stock.ticker}:interestCoverTimes`, v.interestCoverTimes, "times");
  registerNum(`${stock.ticker}:revenueCagrPct`, v.revenueCagrPct, "percent");
  registerNum(`${stock.ticker}:patCagrPct`, v.patCagrPct, "percent");
  registerNum(`${stock.ticker}:volatilityPct`, v.volatilityPct, "percent");
  registerNum(`${stock.ticker}:maxDrawdownPct`, v.maxDrawdownPct, "percent");
  registerNum(`${stock.ticker}:fiveYearReturnPct`, v.fiveYearReturnPct, "percent");
  registerNum(`index:5yRet`, v.indexReturnPct, "percent");
  registerNum(`${stock.ticker}:oneSessionMovePct`, v.oneSessionMovePct, "percent");
  registerNum(`${stock.ticker}:latestClose`, v.latestClose, "price");
}

/**
 * Helper to derive metrics with proper sector resolution.
 */
function getStockMetrics(stock: Stock, snapshot: Snapshot, now: string) {
  const sector = snapshot.sectors.find((s) => s.id === stock.sectorId) ?? snapshot.sectors[0];
  return deriveMetrics(stock, sector, snapshot.index, now);
}

/**
 * Approved exact exemption strings for the mandatory education note (§9.2, Task 28).
 */
const EDUCATION_NOTE_TEXT: Record<Locale, string> = {
  en: "This is educational analysis and not a buy or sell recommendation.",
  "hi-en": "Yeh educational analysis hai aur koi buy ya sell recommendation nahi hai.",
};

/**
 * Standard configuration refs present in answers (§9.3, Task 29).
 */
function getStandardConfigRefs(): Ref[] {
  return [
    createConfigRef("config:universe:size", 12, "count"),
    createConfigRef("config:factors:count", 6, "count"),
    createConfigRef("config:shortlist:cap", 2, "count"),
    createConfigRef("config:shortlist:min", 3, "count"),
    createConfigRef("config:shortlist:max", 5, "count"),
    createConfigRef("config:window:years", 5, "count"),
    createConfigRef("config:news:window_days", 90, "count"),
    createConfigRef("config:threshold:one_pct", 1, "percent"),
    createConfigRef("config:benchmark:roe", 15.0, "percent"),
    createConfigRef("config:benchmark:roce", 15.0, "percent"),
    createConfigRef("config:benchmark:margin", 12.0, "percent"),
    createConfigRef("config:benchmark:cagr", 10.0, "percent"),
    createConfigRef("config:benchmark:patCagr", 8.0, "percent"),
    createConfigRef("config:benchmark:indexVolatility", 16.8, "percent"),
    createConfigRef("config:benchmark:indexDrawdown", -22.4, "percent"),
    createConfigRef("config:benchmark:de", 1.0, "ratio"),
    createConfigRef("config:intake:1", 1, "count"),
    createConfigRef("config:intake:2", 2, "count"),
    createConfigRef("config:intake:3", 3, "count"),
    createConfigRef("config:intake:4", 4, "count"),
    createConfigRef("config:intake:5", 5, "count"),
    createConfigRef("config:intake:10", 10, "percent"),
    createConfigRef("config:intake:20", 20, "percent"),
    createConfigRef("config:intake:30", 30, "percent"),
  ];
}

/**
 * Resolves a partial profile by filling default assumptions (§6.3).
 */
function resolveProfileWithAssumptions(
  partial: PartialProfile | null,
  assumedFields: ProfileField[] = [],
  locale: Locale = "en",
): { profile: Profile; assumed: ProfileField[] } {
  const currentAssumed = new Set<ProfileField>(assumedFields);
  const p = partial ?? {};

  let goal = p.goal;
  if (!goal) {
    goal = "grow_wealth";
    currentAssumed.add("goal");
  }

  let horizon = p.horizon;
  if (!horizon) {
    horizon = "3_5y";
    currentAssumed.add("horizon");
  }

  let riskComfort = p.riskComfort;
  if (!riskComfort) {
    riskComfort = "unsure";
    currentAssumed.add("riskComfort");
  }

  let experience = p.experience;
  if (!experience) {
    experience = "sip";
    currentAssumed.add("experience");
  }

  const loc = p.locale ?? locale;

  return {
    profile: {
      goal,
      horizon,
      riskComfort,
      experience,
      locale: loc,
    },
    assumed: Array.from(currentAssumed),
  };
}

/**
 * Constructs a fallback safe answer that strictly passes inspectAnswer (§9.1, Task 32).
 */
function createSafeFallbackAnswer(
  snapshotId: string,
  locale: Locale,
  now: string,
): Answer {
  const text =
    locale === "hi-en"
      ? "Is sawal ka calculation safety standards ke mutabiq verify nahi ho saka. Kripya doosra sawal poochein."
      : "The calculations for that inquiry could not be verified against safety bounds. Please try asking another question.";

  const answer: Answer = {
    route: "clarify",
    blocks: [
      { type: "text", text },
      { type: "education_note", text: EDUCATION_NOTE_TEXT[locale] },
    ],
    refs: getStandardConfigRefs(),
    profileState: null,
    meta: {
      snapshotId,
      engineVersion: ENGINE_VERSION,
      scoreId: "safe_fallback",
      locale,
      generatedAt: now,
    },
  };

  return answer;
}

/**
 * Central Answer Composer (§5.4, §10, Task 32).
 * Assembles blocks, binds refs, runs the safety choke point scanner.
 */
export function composeAnswer(
  input: TurnInput,
  deps: EngineDeps,
): Answer {
  const { message, locale = "en", now } = input;
  const snapshot = deps.snapshot;

  // 1. Intake Parsing & Profiling Update
  const intakeResult = parseIntakeMessage(message, input.profile ?? {});
  const activeProfile = intakeResult.profile;
  const activeAssumed = intakeResult.assumed;

  // 2. Route Classification
  const classification = classify(message, activeProfile, snapshot);
  const route = classification.route;

  const blocks: Block[] = [];
  const refsMap = new Map<string, Ref>();

  for (const ref of getStandardConfigRefs()) {
    refsMap.set(ref.id, ref);
  }

  // Helper to add profile refs
  const registerProfileRefs = (prof: Profile) => {
    refsMap.set("profile:goal", createProfileRef("profile:goal", prof.goal, prof.goal));
    refsMap.set("profile:horizon", createProfileRef("profile:horizon", prof.horizon, prof.horizon));
    refsMap.set(
      "profile:riskComfort",
      createProfileRef("profile:riskComfort", prof.riskComfort, prof.riskComfort),
    );
    refsMap.set(
      "profile:experience",
      createProfileRef("profile:experience", prof.experience, prof.experience),
    );
    refsMap.set("profile:locale", createProfileRef("profile:locale", prof.locale, prof.locale));
  };

  let scoreId = "none";
  const targetProfileState: ProfileState | null = {
    profile: activeProfile,
    assumed: activeAssumed,
    missing: intakeResult.missing,
    complete: intakeResult.complete,
  };

  switch (route) {
    case "shortlist": {
      const { profile: resolvedProfile, assumed } = resolveProfileWithAssumptions(
        activeProfile,
        activeAssumed,
        locale,
      );
      registerProfileRefs(resolvedProfile);

      // Score universe
      const scoredStocks: ScoredStock[] = snapshot.stocks.map((stock) => {
        const metrics = getStockMetrics(stock, snapshot, now);
        registerAllMetricRefs(stock, metrics, refsMap);
        return scoreStock(resolvedProfile, metrics, stock);
      });

      const shortlistResult = selectShortlist(scoredStocks);
      scoreId = shortHash(shortlistResult.cards.map((c) => c.stock.ticker));

      // Build shortlist cards
      const cards: ShortlistCard[] = shortlistResult.cards.map((scored) => {
        const flags = deriveRiskFlags(scored.metrics, scored.stock);
        return composeShortlistCard(scored, resolvedProfile, { flags, locale });
      });

      // Diversity note (§6.4)
      const diversityNote =
        locale === "hi-en"
          ? "Mukhtalif industries ki companies dikhayi gayi hain taaki single sector concentration ke bina alag business models ko samjha ja sake."
          : "Showing companies across distinct industries to help you evaluate different business models without single-sector concentration.";

      const howChosen: HowChosenView = composeHowChosen(resolvedProfile);

      // If assumed fields exist, show profile_summary first
      if (assumed.length > 0) {
        blocks.push({
          type: "profile_summary",
          profile: resolvedProfile,
          assumed,
        });
      }

      blocks.push({
        type: "shortlist",
        cards,
        thinFit: shortlistResult.thinFit,
        sectors: shortlistResult.sectorsCount,
        diversityNote,
        howChosen,
      });

      // Limitations block
      const sampleStock = snapshot.stocks[0];
      const sampleMetrics = getStockMetrics(sampleStock, snapshot, now);
      blocks.push({
        type: "limitations",
        items: composeLimitations({ metrics: sampleMetrics, locale }),
      });

      // Mandatory education note
      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "compare": {
      const { profile: resolvedProfile, assumed } = resolveProfileWithAssumptions(
        activeProfile,
        activeAssumed,
        locale,
      );
      registerProfileRefs(resolvedProfile);

      const tickerA = classification.entities.tickers[0] ?? "TCS";
      const tickerB = classification.entities.tickers[1] ?? "INFY";

      const stockA = snapshot.stocks.find((s) => s.ticker === tickerA) ?? snapshot.stocks[0];
      const stockB = snapshot.stocks.find((s) => s.ticker === tickerB) ?? snapshot.stocks[1];

      const metricsA = getStockMetrics(stockA, snapshot, now);
      const metricsB = getStockMetrics(stockB, snapshot, now);

      registerAllMetricRefs(stockA, metricsA, refsMap);
      registerAllMetricRefs(stockB, metricsB, refsMap);

      // Profile summary if assumed
      if (assumed.length > 0) {
        blocks.push({
          type: "profile_summary",
          profile: resolvedProfile,
          assumed,
        });
      }

      const rows: ComparisonRow[] = [
        {
          label: "P/E Ratio",
          stockAValue: metricsA.values.pe !== null ? metricsA.values.pe.toFixed(1) : "N/A",
          stockBValue: metricsB.values.pe !== null ? metricsB.values.pe.toFixed(1) : "N/A",
        },
        {
          label: "P/B Ratio",
          stockAValue: metricsA.values.pb !== null ? metricsA.values.pb.toFixed(1) : "N/A",
          stockBValue: metricsB.values.pb !== null ? metricsB.values.pb.toFixed(1) : "N/A",
        },
        {
          label: "ROE",
          stockAValue: metricsA.values.roePct !== null ? `${metricsA.values.roePct.toFixed(1)}%` : "N/A",
          stockBValue: metricsB.values.roePct !== null ? `${metricsB.values.roePct.toFixed(1)}%` : "N/A",
        },
        {
          label: "Operating Margin",
          stockAValue:
            metricsA.values.operatingMarginPct !== null
              ? `${metricsA.values.operatingMarginPct.toFixed(1)}%`
              : "N/A",
          stockBValue:
            metricsB.values.operatingMarginPct !== null
              ? `${metricsB.values.operatingMarginPct.toFixed(1)}%`
              : "N/A",
        },
        {
          label: "Debt to Equity",
          stockAValue:
            metricsA.values.debtToEquity !== null ? metricsA.values.debtToEquity.toFixed(2) : "N/A",
          stockBValue:
            metricsB.values.debtToEquity !== null ? metricsB.values.debtToEquity.toFixed(2) : "N/A",
        },
        {
          label: "Dividend Yield",
          stockAValue:
            metricsA.values.dividendYieldPct !== null
              ? `${metricsA.values.dividendYieldPct.toFixed(1)}%`
              : "N/A",
          stockBValue:
            metricsB.values.dividendYieldPct !== null
              ? `${metricsB.values.dividendYieldPct.toFixed(1)}%`
              : "N/A",
        },
        {
          label: "Profile fit context",
          stockAValue: `${stockA.ticker} matches your focus on ${resolvedProfile.goal} and ${resolvedProfile.horizon} horizon.`,
          stockBValue: `${stockB.ticker} matches your focus on ${resolvedProfile.goal} and ${resolvedProfile.horizon} horizon.`,
        },
      ];

      const compareIntro =
        locale === "hi-en"
          ? "Dono companies ka side-by-side factual comparison. Kisi ek stock mein invest karna mutual fund ke mukable zyada company-specific risk carry karta hai."
          : "Side-by-side factual comparison. Holding individual shares carries higher company-specific risk than holding a diversified mutual fund.";

      blocks.push({ type: "text", text: compareIntro });
      blocks.push({
        type: "comparison",
        tickers: [stockA.ticker, stockB.ticker],
        rows,
      });

      blocks.push({
        type: "limitations",
        items: composeLimitations({ metrics: metricsA, locale }),
      });
      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "stock_detail": {
      const ticker = classification.entities.tickers[0] ?? "INFY";
      const stock = snapshot.stocks.find((s) => s.ticker === ticker) ?? snapshot.stocks[0];
      const metrics = getStockMetrics(stock, snapshot, now);

      registerAllMetricRefs(stock, metrics, refsMap);

      const sections: DetailSection[] = [
        {
          id: "valuation",
          title: "Valuation",
          rows: [
            {
              label: "P/E Ratio",
              value: metrics.values.pe !== null ? metrics.values.pe.toFixed(1) : "N/A",
            },
            {
              label: "P/B Ratio",
              value: metrics.values.pb !== null ? metrics.values.pb.toFixed(1) : "N/A",
            },
          ],
        },
        {
          id: "profitability",
          title: "Profitability",
          rows: [
            {
              label: "ROE",
              value: metrics.values.roePct !== null ? `${metrics.values.roePct.toFixed(1)}%` : "N/A",
            },
            {
              label: "Operating Margin",
              value:
                metrics.values.operatingMarginPct !== null
                  ? `${metrics.values.operatingMarginPct.toFixed(1)}%`
                  : "N/A",
            },
          ],
        },
        {
          id: "debt",
          title: "Debt & Solvency",
          rows: [
            {
              label: "Debt to Equity",
              value:
                metrics.values.debtToEquity !== null ? metrics.values.debtToEquity.toFixed(2) : "N/A",
              note:
                stock.sectorModel === "financial"
                  ? "For banks and lending institutions, customer deposits are excluded from debt calculations."
                  : undefined,
            },
            {
              label: "Interest Cover",
              value:
                stock.sectorModel === "financial"
                  ? "N/A"
                  : metrics.values.interestCoverTimes !== null
                    ? `${metrics.values.interestCoverTimes.toFixed(1)}x`
                    : "N/A",
            },
          ],
        },
      ];

      blocks.push({
        type: "stock_detail",
        ticker: stock.ticker,
        sections,
      });

      blocks.push({
        type: "limitations",
        items: composeLimitations({ metrics, locale }),
      });
      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "news": {
      const ticker = classification.entities.tickers[0] ?? "INFY";
      const stock = snapshot.stocks.find((s) => s.ticker === ticker) ?? snapshot.stocks[0];
      const metrics = getStockMetrics(stock, snapshot, now);

      registerAllMetricRefs(stock, metrics, refsMap);

      // Filter news up to 90 days from snapshot.news
      const stockNews = snapshot.news.filter((n) => n.ticker === stock.ticker);
      const newsItems: NewsItemView[] = stockNews.slice(0, 5).map((n) => ({
        headline: n.headline,
        summary: n.summary,
        sourceName: n.sourceName,
        publishedAt: n.publishedAt,
        kind: n.kind,
        sourceUrl: n.sourceUrl ?? null,
      }));

      registerNewsRefs(newsItems, refsMap);

      const movePct = metrics.values.oneSessionMovePct;
      const moveDirection = movePct < 0 ? "fell" : movePct > 0 ? "rose" : "remained unchanged";

      const moveExplanation =
        Math.abs(movePct) < 1.0
          ? `${stock.name} ${moveDirection} during its latest recorded session. No major market announcements were recorded.`
          : `${stock.name} recorded a price move in its latest recorded session. Below are recent announcements for context.`;

      blocks.push({ type: "text", text: moveExplanation });
      blocks.push({ type: "news", items: newsItems });
      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "history": {
      const ticker = classification.entities.tickers[0] ?? "HDFCBANK";
      const stock = snapshot.stocks.find((s) => s.ticker === ticker) ?? snapshot.stocks[0];
      const metrics = getStockMetrics(stock, snapshot, now);

      registerAllMetricRefs(stock, metrics, refsMap);

      let historyNote =
        locale === "hi-en"
          ? `${stock.name} ka 5-year performance Nifty 50 benchmark ke saath normalize karke compare kiya gaya hai.`
          : `${stock.name} 5-year performance compared against the Nifty 50 benchmark.`;

      if (stock.corporateActions.length > 0) {
        const action = stock.corporateActions[0];
        historyNote +=
          locale === "hi-en"
            ? ` Note: Corporate action (${action.type}) recorded. Is event se pehle ke prices aur ratios directly continuous nahi hain.`
            : ` Note: Corporate action (${action.type}) recorded. Historical prices before this event are not directly comparable.`;
      }

      historyNote +=
        locale === "hi-en"
          ? " Past financial performance future returns ka indication nahi hai."
          : " Past financial performance does not indicate future results.";

      blocks.push({ type: "text", text: historyNote });

      blocks.push({
        type: "stock_detail",
        ticker: stock.ticker,
        sections: [
          {
            id: "price_history",
            title: "5-Year History",
            rows: [
              {
                label: "Stock 5-Year Return",
                value: `${metrics.values.fiveYearReturnPct.toFixed(1)}%`,
              },
              {
                label: "Nifty 50 Return",
                value: `${metrics.values.indexReturnPct.toFixed(1)}%`,
              },
            ],
          },
        ],
      });

      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "coverage_miss": {
      const missName = classification.entities.unknownEntities[0] ?? "The requested company";
      const matchingExclusion = snapshot.exclusions.find(
        (e) =>
          e.name.toLowerCase().includes(missName.toLowerCase()) ||
          e.aliases.some((a) => a.toLowerCase().includes(missName.toLowerCase())),
      );

      const reason = matchingExclusion ? matchingExclusion.reason : null;

      blocks.push({
        type: "coverage_miss",
        name: matchingExclusion ? matchingExclusion.name : missName,
        reason,
      });

      const explanation =
        matchingExclusion
          ? `${matchingExclusion.name} is excluded from the covered universe: ${matchingExclusion.reason}`
          : `${missName} is outside the 12 covered Nifty 50 companies tracked by Bull.`;

      blocks.push({ type: "text", text: explanation });
      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "boundary": {
      const topic = classification.boundaryTopic ?? "advice";
      let explanation = "";

      if (topic === "injection") {
        explanation =
          "SEBI does not approve stock tips or return claims. To verify registered intermediaries, consult the official database at sebi.gov.in. Bull operates deterministically under strict educational guidelines and does not follow instructions that override safety rules.";
      } else if (topic === "concentration") {
        explanation =
          locale === "hi-en"
            ? "Bull investment advice, buy ya sell recommendation, ya target price provide nahi karta."
            : "Bull does not recommend stocks, manage portfolios, or promise returns.";
      } else {
        explanation =
          locale === "hi-en"
            ? "Bull investment advice, buy ya sell recommendation, ya target price provide nahi karta."
            : "Bull does not provide investment advice, buy or sell recommendations, or target prices.";
      }

      blocks.push({
        type: "boundary",
        topic,
        explanation,
      });

      blocks.push({
        type: "education_note",
        text: EDUCATION_NOTE_TEXT[locale],
      });
      break;
    }

    case "intake": {
      const nextQ = getNextIntakeQuestion(activeProfile, locale);
      if (nextQ && nextQ.type === "intake_question") {
        blocks.push(nextQ);
        for (const opt of nextQ.options) {
          refsMap.set(
            `profile:option:${opt.value}`,
            createProfileRef(`profile:option:${opt.value}`, opt.value, opt.label),
          );
        }
      } else {
        blocks.push({
          type: "text",
          text:
            locale === "hi-en"
              ? "Aapki preferences note kar li gayi hain. Ab aap shortlist dekh sakte hain."
              : "Your preferences have been recorded. You can now generate your shortlist.",
        });
      }
      break;
    }

    case "clarify":
    default: {
      const question =
        locale === "hi-en"
          ? "Kya aap thoda aur detail mein batana chahenge?"
          : "Could you clarify what you would like to explore?";

      const options: Option[] = [
        {
          label: locale === "hi-en" ? "Mere liye stocks dhundo" : "Find stocks for me",
          value: "shortlist",
        },
        {
          label: locale === "hi-en" ? "ITC ka debt samjhao" : "Explain ITC's debt",
          value: "itc_debt",
        },
        {
          label:
            locale === "hi-en"
              ? "Dividends ke liye TCS vs Infosys"
              : "TCS vs Infosys for dividends",
          value: "compare_it",
        },
      ];

      blocks.push({
        type: "choices",
        question,
        options,
      });
      break;
    }
  }

  const answer: Answer = {
    route,
    blocks,
    refs: Array.from(refsMap.values()),
    profileState: targetProfileState,
    meta: {
      snapshotId: snapshot.snapshotId,
      engineVersion: ENGINE_VERSION,
      scoreId,
      locale,
      generatedAt: now,
    },
  };

  // Run the safety choke point scanner
  const inspection = inspectAnswer(answer);
  if (!inspection.valid) {
    console.warn("Safety choke point inspection failed on generated answer:", inspection.violations);
    // Fall back safely to an educational error answer that passes inspection
    const safeFallback = createSafeFallbackAnswer(
      snapshot.snapshotId,
      locale,
      now,
      inspection.violations.join("; "),
    );
    assertSafeAnswer(safeFallback);
    return safeFallback;
  }

  return answer;
}

/**
 * Main turn handler for Bull v0 (§5.4, §10, Task 32).
 * 100% deterministic pure function.
 */
export function handleTurn(
  input: TurnInput,
  deps: EngineDeps,
): Answer {
  return composeAnswer(input, deps);
}

/**
 * Direct engine entry point (§7, Task 32).
 */
export function buildAnswer(
  snapshot: Snapshot,
  profileState: ProfileState | null,
  intakeState: PartialProfile | null,
  query: string,
  now: string,
  locale: Locale = "en",
): Answer {
  const mergedProfile: PartialProfile = {
    ...(profileState?.profile ?? {}),
    ...(intakeState ?? {}),
  };

  const input: TurnInput = {
    message: query,
    profile: mergedProfile,
    locale,
    now,
    events: [],
  };

  return handleTurn(input, { snapshot });
}
