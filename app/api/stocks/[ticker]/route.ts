import { NextResponse } from "next/server";
import { getLiveStockQuote } from "@/lib/data/live";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  try {
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker ? decodeURIComponent(resolvedParams.ticker) : "";

    if (!ticker.trim()) {
      return NextResponse.json({ error: "Missing ticker parameter" }, { status: 400 });
    }

    const quote = await getLiveStockQuote(ticker);
    if (!quote) {
      return NextResponse.json(
        { error: `Stock "${ticker}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Stock quote API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock quote" },
      { status: 500 },
    );
  }
}
