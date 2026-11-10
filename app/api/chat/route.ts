import { NextResponse } from "next/server";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import { rephraseAnswer, getLlmProvider } from "@/lib/llm";
import type { TurnInput } from "@/lib/engine/types";

export async function POST(req: Request) {
  try {
    const turnInput = (await req.json()) as TurnInput;
    const answer = handleTurn(turnInput, { snapshot });

    // If Gemini or other LLM provider is configured, run verification-gated rephrase
    const provider = getLlmProvider();
    const finalAnswer =
      provider.name !== "null"
        ? await rephraseAnswer(answer, provider)
        : answer;

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
