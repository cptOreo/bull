import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/data/live";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchStocks(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Stock search API error:", error);
    return NextResponse.json(
      { error: "Failed to search stocks", results: [] },
      { status: 500 },
    );
  }
}
