import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { spawnSync } from "child_process";
import type { LiveStockSnapshot, Block } from "@/lib/engine/types";
import { identifyStockInQuery, getLiveStockQuote } from "@/lib/data/live";
import { StockSnapshotCard } from "@/components/chat/stock-snapshot-card";
import { MessageBubble } from "@/components/chat/message-bubble";
import {
  SLOPMONSTER_SYSTEM_PROMPT,
  PREDEFINED_COMMENTARIES,
  buildChaiCommentaryFromSnapshot,
} from "@/lib/llm/slopmonster";
import { POST } from "@/app/api/chat/route";

describe("SlopMonster Pipeline & Stock Snapshot Card", () => {
  const sampleSnapshot: LiveStockSnapshot = {
    ticker: "ZOMATO",
    name: "Zomato Limited",
    price: 264.5,
    currency: "INR",
    change: 4.8,
    changePercent: 1.85,
    dayHigh: 268.0,
    dayLow: 259.2,
    fiftyTwoWeekHigh: 298.2,
    fiftyTwoWeekLow: 112.5,
    marketCap: 233500,
    marketCapFormatted: "₹2.34L Cr",
    peRatio: 68.4,
    dividendYield: 0.0,
    sector: "Consumer Internet",
    industry: "Quick Commerce & Food Delivery",
    summary:
      "Operates India's leading restaurant delivery app alongside Blinkit, its 10-minute neighbourhood grocery network.",
    strengths: [
      "Blinkit store density delivers operating profits faster than peers",
      "Two-player food delivery market creates pricing power over restaurants",
    ],
    watchouts: [
      "Heavy dark-store capex needed to defend turf against Zepto and Swiggy",
      "Demanding earnings multiple demands flawless execution every quarter",
    ],
    asOf: "2026-11-10",
  };

  describe("Type Contracts", () => {
    it("satisfies the LiveStockSnapshot interface", () => {
      expect(sampleSnapshot.ticker).toBe("ZOMATO");
      expect(sampleSnapshot.price).toBe(264.5);
      expect(sampleSnapshot.marketCapFormatted).toBe("₹2.34L Cr");
      expect(sampleSnapshot.strengths.length).toBeGreaterThanOrEqual(2);
      expect(sampleSnapshot.watchouts.length).toBeGreaterThanOrEqual(1);
    });

    it("allows stock_snapshot block within Block union", () => {
      const block: Block = {
        type: "stock_snapshot",
        snapshot: sampleSnapshot,
      };
      expect(block.type).toBe("stock_snapshot");
      expect(block.snapshot.ticker).toBe("ZOMATO");
    });
  });

  describe("Stock Identification & Live Data Engine", () => {
    it("identifies stock tickers and company names from conversational queries", () => {
      expect(identifyStockInQuery("Tell me about Zomato")).toBe("ZOMATO");
      expect(identifyStockInQuery("How is Tata Motors doing today?")).toBe("TATAMOTORS");
      expect(identifyStockInQuery("What do you think about Reliance?")).toBe("RELIANCE");
      expect(identifyStockInQuery("Show me TCS")).toBe("TCS");
      expect(identifyStockInQuery("Infosys financials")).toBe("INFY");
      expect(identifyStockInQuery("What about Bharti Airtel?")).toBe("BHARTIARTL");
      expect(identifyStockInQuery("L&T share price")).toBe("LT");
      expect(identifyStockInQuery("Can I buy gold at Titan?")).toBe("TITAN");
      expect(identifyStockInQuery("Tell me a general investment rule")).toBeNull();
    });

    it("fetches live/grounded quote for off-snapshot stock (Zomato)", async () => {
      const quote = await getLiveStockQuote("Zomato");
      expect(quote).not.toBeNull();
      expect(quote?.ticker).toBe("ZOMATO");
      expect(quote?.price).toBeGreaterThan(0);
      expect(quote?.marketCapFormatted).toContain("Cr");
      expect(quote?.summary).toBeTruthy();
      expect(quote?.strengths.length).toBe(2);
    });

    it("fetches grounded quote for in-snapshot stock (Tata Motors)", async () => {
      const quote = await getLiveStockQuote("Tata Motors");
      expect(quote).not.toBeNull();
      expect(quote?.ticker).toBe("TATAMOTORS");
      expect(quote?.price).toBeGreaterThan(0);
      expect(quote?.fiftyTwoWeekHigh).toBeGreaterThan(0);
      expect(quote?.fiftyTwoWeekLow).toBeGreaterThan(0);
    });
  });

  describe("StockSnapshotCard UI Component", () => {
    it("renders complete visual snapshot card with price, metrics, and bullets", () => {
      render(<StockSnapshotCard snapshot={sampleSnapshot} />);

      // Ticker pill & company name & sector
      expect(screen.getByText("ZOMATO")).toBeInTheDocument();
      expect(screen.getByText("Zomato Limited")).toBeInTheDocument();
      expect(screen.getByText("Consumer Internet")).toBeInTheDocument();

      // Formatted live price and signed pill
      expect(screen.getByText(/264\.50/)).toBeInTheDocument();
      expect(screen.getByText("▲")).toBeInTheDocument();
      expect(screen.getByText(/\(\+1\.9%\)/)).toBeInTheDocument();

      // Metric grid
      expect(screen.getByText("Market Capitalization")).toBeInTheDocument();
      expect(screen.getByText("₹2.34L Cr")).toBeInTheDocument();
      expect(screen.getByText("Price to Earnings (P/E)")).toBeInTheDocument();
      expect(screen.getByText("68.4x")).toBeInTheDocument();

      // 52-week range
      expect(screen.getByText("52-Week Range")).toBeInTheDocument();
      expect(screen.getByText(/112\.50/)).toBeInTheDocument();
      expect(screen.getByText(/298\.20/)).toBeInTheDocument();

      // Business one-liner
      expect(screen.getByText(/Business Model:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Operates India's leading restaurant delivery app/i)
      ).toBeInTheDocument();

      // Why Investors Like It
      expect(screen.getByText(/Why Investors Like It/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Blinkit store density delivers operating profits faster than peers/i)
      ).toBeInTheDocument();

      // Things to Watch / Risks
      expect(screen.getByText(/Things to Watch \/ Risks/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Heavy dark-store capex needed to defend turf against Zepto/i)
      ).toBeInTheDocument();

      // Deep dive link
      const deepDiveLink = screen.getByRole("link", { name: /Full Deep Dive/i });
      expect(deepDiveLink).toHaveAttribute("href", "/stock/zomato");
    });

    it("renders negative change with rose badge and down arrow", () => {
      const negativeSnapshot: LiveStockSnapshot = {
        ...sampleSnapshot,
        change: -5.2,
        changePercent: -1.9,
      };

      render(<StockSnapshotCard snapshot={negativeSnapshot} />);
      expect(screen.getByText("▼")).toBeInTheDocument();
      expect(screen.getByText(/\(-1\.9%\)/)).toBeInTheDocument();
    });

    it("renders cleanly inside MessageBubble polymorphism", () => {
      const blocks: Block[] = [
        { type: "stock_snapshot", snapshot: sampleSnapshot },
        { type: "text", text: "Here is what you need to know about Zomato over chai." },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);
      expect(screen.getByText("ZOMATO")).toBeInTheDocument();
      expect(screen.getByText(/Here is what you need to know about Zomato over chai/i)).toBeInTheDocument();
    });
  });

  describe("Chat API Route Integration", () => {
    it("prepends stock_snapshot block and adds chai commentary when asking about Zomato", async () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Tell me about Zomato",
          profile: null,
          locale: "en",
          now: "2026-11-10T14:00:00Z",
          events: [],
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.blocks.length).toBeGreaterThanOrEqual(2);
      expect(data.blocks[0].type).toBe("stock_snapshot");
      expect(data.blocks[0].snapshot.ticker).toBe("ZOMATO");

      const textBlock = data.blocks.find((b: Block) => b.type === "text");
      expect(textBlock).toBeDefined();
      expect(textBlock.text).toContain("kirana store");
    });

    it("prepends stock_snapshot block when asking about Tata Motors", async () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What do you think of Tata Motors?",
          profile: null,
          locale: "en",
          now: "2026-11-10T14:00:00Z",
          events: [],
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.blocks[0].type).toBe("stock_snapshot");
      expect(data.blocks[0].snapshot.ticker).toBe("TATAMOTORS");
    });
  });

  describe("SlopMonster Anti-Slop Strict Verification (scripts/deslop.py)", () => {
    it("guarantees 5/5 score on SLOPMONSTER_SYSTEM_PROMPT", () => {
      const res = spawnSync(
        "python3",
        ["scripts/deslop.py", "--markdown", "--text", SLOPMONSTER_SYSTEM_PROMPT],
        { encoding: "utf8" }
      );
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("score 5/5");
      expect(res.stdout).toContain("CLEAN");
    });

    it("guarantees 5/5 score on all predefined stock chai commentaries", () => {
      for (const [, commentary] of Object.entries(PREDEFINED_COMMENTARIES)) {
        const res = spawnSync(
          "python3",
          ["scripts/deslop.py", "--text", commentary],
          { encoding: "utf8" }
        );
        expect(res.status).toBe(0);
        expect(res.stdout).toContain("score 5/5");
        expect(res.stdout).toContain("CLEAN");
      }
    });

    it("guarantees 5/5 score on dynamically constructed chai commentary", () => {
      const dynamicCommentary = buildChaiCommentaryFromSnapshot({
        ...sampleSnapshot,
        ticker: "NEWCO",
        summary: "Manufactures specialized solar inverters for domestic rooftops.",
        strengths: ["Clean balance sheet with no commercial bank borrowings"],
        watchouts: ["Fluctuations in international semiconductor component pricing"],
      });

      const res = spawnSync(
        "python3",
        ["scripts/deslop.py", "--text", dynamicCommentary],
        { encoding: "utf8" }
      );
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("score 5/5");
      expect(res.stdout).toContain("CLEAN");
    });
  });
});
