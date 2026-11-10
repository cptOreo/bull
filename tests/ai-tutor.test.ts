import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { POST } from "@/app/api/chat/route";
import { getLiveStockQuote, identifyStockInQuery } from "@/lib/data/live";
import {
  SLOPMONSTER_SYSTEM_PROMPT,
  buildChaiCommentaryFromSnapshot,
  generateFollowUps,
} from "@/lib/llm/slopmonster";
import { GeminiLlmProvider } from "@/lib/llm/gemini";
import { CircuitBreaker } from "@/lib/llm/provider";
import type { Block, LiveStockSnapshot } from "@/lib/engine/types";

function runDeslop(text: string): { status: number; stdout: string } {
  const res = spawnSync("python3", ["scripts/deslop.py", "--text", text], {
    encoding: "utf8",
  });
  return { status: res.status ?? 1, stdout: res.stdout || res.stderr };
}

describe("AI Tutor & Chat Pipeline (/api/chat & Gemini 3.5 Flash)", () => {
  describe("Multi-Turn Conversational Memory", () => {
    it("handles single-turn question with message field", async () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Tell me about Zomato",
          locale: "en",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.blocks).toBeDefined();
      expect(data.blocks.length).toBeGreaterThanOrEqual(2);
      expect(data.blocks[0].type).toBe("stock_snapshot");
      expect(data.blocks[0].snapshot.ticker).toBe("ZOMATO");

      expect(data.followUps).toBeDefined();
      expect(data.followUps.length).toBeGreaterThanOrEqual(2);
      expect(data.followUps.length).toBeLessThanOrEqual(3);
    });

    it("maintains conversation memory across multi-turn turns (follow-up without ticker)", async () => {
      // Turn 1: Discuss Zomato
      const turn1Req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Tell me about Zomato" }],
        }),
      });
      const turn1Res = await POST(turn1Req);
      const turn1Data = await turn1Res.json();
      const turn1Text = turn1Data.blocks.find((b: Block) => b.type === "text")?.text ?? "";

      // Turn 2: Follow-up question without repeating "Zomato": "Why is its P/E so high?"
      const turn2Req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Tell me about Zomato" },
            { role: "assistant", content: turn1Text },
            { role: "user", content: "Why is its P/E so high?" },
          ],
        }),
      });

      const turn2Res = await POST(turn2Req);
      expect(turn2Res.status).toBe(200);
      const turn2Data = await turn2Res.json();

      // Should retain Zomato context from turn 1
      expect(turn2Data.blocks[0].type).toBe("stock_snapshot");
      expect(turn2Data.blocks[0].snapshot.ticker).toBe("ZOMATO");

      const turn2Text = turn2Data.blocks.find((b: Block) => b.type === "text")?.text;
      expect(turn2Text).toBeDefined();
      expect(turn2Text).toContain("kirana store");
      expect(turn2Text.toLowerCase()).toContain("price-to-earnings");

      // Verify follow-up chips
      expect(turn2Data.followUps).toBeDefined();
      expect(turn2Data.followUps.length).toBeGreaterThanOrEqual(2);
      expect(turn2Data.followUps).toContain("What is its debt level?");
    });

    it("handles competitor comparison follow-up: 'How does that compare to Swiggy?'", async () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Tell me about Zomato" },
            { role: "assistant", content: "Zomato runs food delivery and Blinkit." },
            { role: "user", content: "How does that compare to Swiggy?" },
          ],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      const textBlock = data.blocks.find((b: Block) => b.type === "text");
      expect(textBlock).toBeDefined();
      expect(textBlock.text).toContain("Swiggy");
      expect(textBlock.text).toContain("quick commerce");
      expect(textBlock.text).toContain("dark store");

      expect(data.followUps).toBeDefined();
      expect(data.followUps.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Stock Snapshot Extraction & Embedding", () => {
    it("extracts and embeds snapshot for Tata Motors", async () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is your view on Tata Motors?",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      const snapshotBlock = data.blocks.find((b: Block) => b.type === "stock_snapshot");
      expect(snapshotBlock).toBeDefined();
      expect(snapshotBlock.snapshot.ticker).toBe("TATAMOTORS");
      expect(snapshotBlock.snapshot.price).toBeGreaterThan(0);
      expect(snapshotBlock.snapshot.marketCapFormatted).toContain("Cr");
      expect(snapshotBlock.snapshot.strengths.length).toBeGreaterThanOrEqual(2);
      expect(snapshotBlock.snapshot.watchouts.length).toBeGreaterThanOrEqual(1);
    });

    it("resolves alias 'Jio' or 'RIL' to RELIANCE snapshot", async () => {
      expect(identifyStockInQuery("Tell me about Jio")).toBe("RELIANCE");
      expect(identifyStockInQuery("What is RIL trading at?")).toBe("RELIANCE");

      const quote = await getLiveStockQuote("RELIANCE");
      expect(quote).not.toBeNull();
      expect(quote?.ticker.replace(/\.(NS|BO)$/i, "")).toBe("RELIANCE");
    });
  });

  describe("Anti-Slop Verification via scripts/deslop.py", () => {
    it("ensures SLOPMONSTER_SYSTEM_PROMPT adheres strictly to deslop rules", () => {
      const res = spawnSync(
        "python3",
        ["scripts/deslop.py", "--markdown", "--text", SLOPMONSTER_SYSTEM_PROMPT],
        { encoding: "utf8" }
      );
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("score 5/5");
      expect(res.stdout).toContain("CLEAN");
    });

    it("ensures live API response text scores 5/5 CLEAN on scripts/deslop.py", async () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Tell me about Zomato",
        }),
      });

      const res = await POST(req);
      const data = await res.json();
      const textBlock = data.blocks.find((b: Block) => b.type === "text");
      expect(textBlock).toBeDefined();

      const deslopResult = runDeslop(textBlock.text);
      expect(deslopResult.status).toBe(0);
      expect(deslopResult.stdout).toContain("score 5/5");
      expect(deslopResult.stdout).toContain("CLEAN");
    });

    it("ensures all dynamic follow-up suggestion chips score 5/5 on deslop.py", () => {
      const sampleSnap: LiveStockSnapshot = {
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
        industry: "Quick Commerce",
        summary: "Food delivery and quick commerce network.",
        strengths: ["Blinkit scale"],
        watchouts: ["Capex spending"],
        asOf: "2026-11-10",
      };

      const testQueries = [
        "Tell me about Zomato",
        "Why is its P/E so high?",
        "What is its debt level?",
        "How does that compare to Swiggy?",
        "Compare TCS and Infosys",
      ];

      for (const query of testQueries) {
        const chips = generateFollowUps({
          snapshot: sampleSnap,
          query,
        });

        expect(chips.length).toBeGreaterThanOrEqual(2);
        expect(chips.length).toBeLessThanOrEqual(3);

        for (const chip of chips) {
          const res = runDeslop(chip);
          expect(res.status).toBe(0);
          expect(res.stdout).toContain("score 5/5");
        }
      }
    });
  });

  describe("Graceful Offline & Circuit Breaker Fallback", () => {
    it("falls back to grounded chai commentary when Gemini is offline or null", async () => {
      // In testing environment, GEMINI_API_KEY is unset, so getLlmProvider() returns NullLlmProvider
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Tell me about Reliance",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.provider).toBe("null");
      const textBlock = data.blocks.find((b: Block) => b.type === "text");
      expect(textBlock).toBeDefined();
      expect(textBlock.text).toContain("Reliance");
      expect(textBlock.text).toContain("Jio");

      const deslopResult = runDeslop(textBlock.text);
      expect(deslopResult.status).toBe(0);
      expect(deslopResult.stdout).toContain("score 5/5");
    });

    it("circuit breaker records failures and opens safely after repeated timeouts", async () => {
      const breaker = new CircuitBreaker(2);
      expect(breaker.isOpen()).toBe(false);

      const fakeProvider = new GeminiLlmProvider({
        apiKey: "test-fake-key",
        timeoutMs: 10,
        circuitBreaker: breaker,
      });

      const sampleSnap: LiveStockSnapshot = {
        ticker: "TCS",
        name: "Tata Consultancy Services Ltd",
        price: 4150,
        currency: "INR",
        change: 25,
        changePercent: 0.6,
        dayHigh: 4180,
        dayLow: 4120,
        fiftyTwoWeekHigh: 4500,
        fiftyTwoWeekLow: 3400,
        marketCap: 1500000,
        marketCapFormatted: "₹15.00L Cr",
        peRatio: 29.5,
        dividendYield: 1.5,
        sector: "Information Technology",
        industry: "IT Services",
        summary: "Global software services provider.",
        strengths: ["Zero debt"],
        watchouts: ["Tech budget cuts"],
        asOf: "2026-11-10",
      };

      // Fails due to invalid endpoint/network
      const result1 = await fakeProvider.generateStockCommentary(sampleSnap, "Tell me about TCS");
      expect(result1).toBeNull();
      expect(breaker.failureCount).toBe(1);

      const result2 = await fakeProvider.generateStockCommentary(sampleSnap, "Tell me about TCS");
      expect(result2).toBeNull();
      expect(breaker.isOpen()).toBe(true);

      // Third call should immediately return null without network attempt
      const result3 = await fakeProvider.generateStockCommentary(sampleSnap, "Tell me about TCS");
      expect(result3).toBeNull();
    });

    it("buildChaiCommentaryFromSnapshot produces clean 5/5 fallback for arbitrary stocks", () => {
      const newCoSnapshot: LiveStockSnapshot = {
        ticker: "CLEANTECH",
        name: "CleanTech India Ltd",
        price: 520.0,
        currency: "INR",
        change: 12.0,
        changePercent: 2.36,
        dayHigh: 530.0,
        dayLow: 512.0,
        fiftyTwoWeekHigh: 580.0,
        fiftyTwoWeekLow: 320.0,
        marketCap: 12500,
        marketCapFormatted: "₹12,500 Cr",
        peRatio: 22.4,
        dividendYield: 0.8,
        sector: "Renewable Energy",
        industry: "Solar Equipment",
        summary: "Manufactures precision commercial solar components for domestic plants.",
        strengths: ["Strong order book with domestic utility operators"],
        watchouts: ["Volatile raw material pricing for polysilicon"],
        asOf: "2026-11-10",
      };

      const commentary = buildChaiCommentaryFromSnapshot(newCoSnapshot, "Why is its P/E so high?");
      expect(commentary).toContain("kirana store");

      const deslopResult = runDeslop(commentary);
      expect(deslopResult.status).toBe(0);
      expect(deslopResult.stdout).toContain("score 5/5");
      expect(deslopResult.stdout).toContain("CLEAN");
    });
  });
});
