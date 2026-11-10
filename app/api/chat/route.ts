import { NextResponse } from "next/server";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import { rephraseAnswer, getLlmProvider, buildChaiCommentaryFromSnapshot } from "@/lib/llm";
import { identifyStockInQuery, getLiveStockQuote } from "@/lib/data/live";
import type { TurnInput, Block, Answer } from "@/lib/engine/types";

export async function POST(req: Request) {
  try {
    const turnInput = (await req.json()) as TurnInput;
    const answer = handleTurn(turnInput, { snapshot });

    const provider = getLlmProvider();
    let blocks: Block[] = [...answer.blocks];

    // Detect if query asks about a stock (e.g., Zomato, Tata Motors, Reliance, TCS, or any ticker)
    const stockTicker = identifyStockInQuery(turnInput.message);

    if (stockTicker) {
      const stockSnapshot = await getLiveStockQuote(stockTicker);
      if (stockSnapshot) {
        // Normalize ticker display (e.g. TATAMOTORS.NS -> TATAMOTORS) for clean UI snapshot cards
        const cleanTicker = stockSnapshot.ticker.replace(/\.(NS|BO)$/i, "");
        const normalizedSnapshot: typeof stockSnapshot = {
          ...stockSnapshot,
          ticker: cleanTicker,
        };

        // Prepend live visual snapshot card
        blocks = [{ type: "stock_snapshot", snapshot: normalizedSnapshot }, ...blocks];

        // Send prompt to Gemini 3.5 Flash with SlopMonster anti-slop rules (or fallback to clean chai template)
        let commentary: string | null = null;
        if (typeof provider.generateStockCommentary === "function") {
          commentary = await provider.generateStockCommentary(
            stockSnapshot,
            turnInput.message
          );
        }

        if (!commentary) {
          commentary = buildChaiCommentaryFromSnapshot(stockSnapshot);
        }

        if (commentary) {
          if (answer.route === "coverage_miss") {
            // Replace the text block with conversational chai commentary
            const textIdx = blocks.findIndex((b) => b.type === "text");
            if (textIdx >= 0) {
              blocks[textIdx] = { type: "text", text: commentary };
            } else {
              blocks.splice(1, 0, { type: "text", text: commentary });
            }
          } else {
            // Prepend chai commentary text block right after the snapshot card
            blocks.splice(1, 0, { type: "text", text: commentary });
          }
        }
      }
    }

    const modifiedAnswer: Answer = {
      ...answer,
      blocks,
    };

    // If Gemini or other LLM provider is configured, run verification-gated rephrase
    const finalAnswer =
      provider.name !== "null"
        ? await rephraseAnswer(modifiedAnswer, provider)
        : modifiedAnswer;

    return NextResponse.json({
      ...finalAnswer,
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
