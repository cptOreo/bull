import { NextResponse } from "next/server";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import {
  rephraseAnswer,
  getLlmProvider,
  buildChaiCommentaryFromSnapshot,
  generateFollowUps,
} from "@/lib/llm";
import { identifyStockInQuery, getLiveStockQuote } from "@/lib/data/live";
import type { TurnInput, Block, Answer, Locale, PartialProfile, LearningEvent } from "@/lib/engine/types";

export interface ChatRequestPayload {
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  message?: string;
  profile?: PartialProfile | null;
  locale?: string;
  now?: string;
  events?: LearningEvent[];
  overrides?: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestPayload;

    // 1. Support both single-turn (message) and multi-turn (messages) payloads
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    let currentMessage = (body.message ?? "").trim();

    if (!currentMessage && rawMessages.length > 0) {
      for (let i = rawMessages.length - 1; i >= 0; i--) {
        if (rawMessages[i].role === "user" && rawMessages[i].content.trim()) {
          currentMessage = rawMessages[i].content.trim();
          break;
        }
      }
    }

    // Build normalized conversational history
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> =
      rawMessages.length > 0
        ? rawMessages
        : currentMessage
        ? [{ role: "user", content: currentMessage }]
        : [];

    const locale = (body.locale as Locale) || "en";
    const now = body.now || new Date().toISOString();

    const turnInput: TurnInput = {
      message: currentMessage,
      profile: body.profile ?? null,
      locale,
      now,
      events: body.events ?? [],
    };

    // 2. Identify if ANY stock is referenced in the current turn or conversation history
    let stockTicker = identifyStockInQuery(currentMessage);

    // If current message doesn't explicitly name a stock (e.g. follow-up "Why is its P/E so high?"),
    // search backward in conversation history to retain stock context
    if (!stockTicker && conversationHistory.length > 0) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const found = identifyStockInQuery(conversationHistory[i].content);
        if (found) {
          stockTicker = found;
          break;
        }
      }
    }

    // 3. Run core engine turn
    const answer = handleTurn(turnInput, { snapshot });
    const provider = getLlmProvider();
    let blocks: Block[] = [...answer.blocks];

    let resolvedSnapshot: Awaited<ReturnType<typeof getLiveStockQuote>> = null;

    // 4. Resolve live stock quote and embed stock_snapshot block
    if (stockTicker) {
      resolvedSnapshot = await getLiveStockQuote(stockTicker);
      if (resolvedSnapshot) {
        const cleanTicker = resolvedSnapshot.ticker.replace(/\.(NS|BO)$/i, "");
        const normalizedSnapshot = {
          ...resolvedSnapshot,
          ticker: cleanTicker,
        };
        resolvedSnapshot = normalizedSnapshot;

        // Prepend live visual snapshot card if not already in blocks
        const hasSnapshotBlock = blocks.some((b) => b.type === "stock_snapshot");
        if (!hasSnapshotBlock) {
          blocks = [{ type: "stock_snapshot", snapshot: normalizedSnapshot }, ...blocks];
        }

        // Prior conversation history (excluding the current user message)
        const priorHistory = conversationHistory.length > 1
          ? conversationHistory.slice(0, -1)
          : undefined;

        // 5. Generate commentary via Gemini 3.5 Flash or SlopMonster fallback
        let commentary: string | null = null;
        if (typeof provider.generateStockCommentary === "function") {
          commentary = await provider.generateStockCommentary(
            normalizedSnapshot,
            currentMessage,
            undefined,
            priorHistory
          );
        }

        if (!commentary) {
          // Offline, rate-limited, or null provider fallback: verified 5/5 SlopMonster copy
          commentary = buildChaiCommentaryFromSnapshot(
            normalizedSnapshot,
            currentMessage,
            priorHistory
          );
        }

        if (commentary) {
          if (answer.route === "coverage_miss") {
            const textIdx = blocks.findIndex((b) => b.type === "text");
            if (textIdx >= 0) {
              blocks[textIdx] = { type: "text", text: commentary };
            } else {
              blocks.splice(1, 0, { type: "text", text: commentary });
            }
          } else {
            const textIdx = blocks.findIndex((b) => b.type === "text");
            if (textIdx >= 0 && answer.route !== "stock_detail" && answer.route !== "compare") {
              blocks[textIdx] = { type: "text", text: commentary };
            } else {
              blocks.splice(1, 0, { type: "text", text: commentary });
            }
          }
        }
      }
    }

    // 6. Dynamic follow-up suggestion chips (2-3 contextual chips)
    const followUps = generateFollowUps({
      snapshot: resolvedSnapshot,
      query: currentMessage,
      history: conversationHistory,
      locale,
    });

    const modifiedAnswer: Answer = {
      ...answer,
      blocks,
      followUps,
    };

    // 7. If provider configured, run verification-gated rephrase
    const finalAnswer =
      provider.name !== "null"
        ? await rephraseAnswer(modifiedAnswer, provider)
        : modifiedAnswer;

    return NextResponse.json({
      ...finalAnswer,
      followUps,
      provider: provider.name,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Engine turn execution failed" },
      { status: 500 }
    );
  }
}
