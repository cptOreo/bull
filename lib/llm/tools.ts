import { z } from "zod";

export const LLMTools = {
  search_stocks: {
    name: "search_stocks",
    description: "Search for stocks by name, ticker, or sector. Returns top matches with basic info.",
    parameters: z.object({
      query: z.string().describe("Search query (company name, ticker, sector)"),
      limit: z.number().default(8).describe("Maximum results to return"),
    }),
  },
  get_fundamentals: {
    name: "get_fundamentals",
    description: "Get detailed fundamentals for a stock including financials, ratios, and profile.",
    parameters: z.object({
      symbol: z.string().describe("Stock symbol (e.g., RELIANCE.NS, AAPL)"),
    }),
  },
  get_price_history: {
    name: "get_price_history",
    description: "Get historical price data for charting and analysis.",
    parameters: z.object({
      symbol: z.string().describe("Stock symbol"),
      range: z.enum(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"]).default("1y"),
      interval: z.enum(["1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo"]).default("1d"),
    }),
  },
  screen_stocks: {
    name: "screen_stocks",
    description: "Screen stocks by fundamental criteria. Returns matching symbols.",
    parameters: z.object({
      criteria: z.object({
        minMarketCap: z.number().optional(),
        maxMarketCap: z.number().optional(),
        minPE: z.number().optional(),
        maxPE: z.number().optional(),
        minROE: z.number().optional(),
        maxDebtToEquity: z.number().optional(),
        minDividendYield: z.number().optional(),
        sector: z.string().optional(),
        exchange: z.string().optional(),
      }).describe("Screening criteria"),
      limit: z.number().default(20),
    }),
  },
  compare_stocks: {
    name: "compare_stocks",
    description: "Compare multiple stocks side-by-side on key metrics.",
    parameters: z.object({
      symbols: z.array(z.string()).min(2).max(5).describe("Stock symbols to compare"),
    }),
  },
  build_dcf: {
    name: "build_dcf",
    description: "Build a DCF valuation model for a stock with customizable assumptions.",
    parameters: z.object({
      symbol: z.string().describe("Stock symbol"),
      assumptions: z.object({
        revenueGrowth: z.number().describe("Annual revenue growth rate (e.g., 0.15 for 15%)"),
        operatingMargin: z.number().describe("Target operating margin (e.g., 0.25 for 25%)"),
        taxRate: z.number().default(0.25).describe("Corporate tax rate"),
        wacc: z.number().describe("Weighted average cost of capital (e.g., 0.10 for 10%)"),
        terminalGrowth: z.number().default(0.04).describe("Terminal growth rate"),
        projectionYears: z.number().default(5).describe("Number of projection years"),
      }).describe("DCF assumptions"),
    }),
  },
  analyze_sector: {
    name: "analyze_sector",
    description: "Get sector overview with top companies, trends, and key metrics.",
    parameters: z.object({
      sector: z.string().describe("Sector name (e.g., 'Information Technology', 'Banking')"),
    }),
  },
  generate_report: {
    name: "generate_report",
    description: "Generate a structured markdown research report from analysis data.",
    parameters: z.object({
      title: z.string(),
      analysis: z.string().describe("Analysis content to include in report"),
      symbol: z.string().optional(),
      format: z.enum(["markdown", "html", "pdf"]).default("markdown"),
    }),
  },
} as const;

export type LLMToolName = keyof typeof LLMTools;

export function getToolSchema(name: LLMToolName) {
  return LLMTools[name];
}

export function getAllToolSchemas() {
  return Object.entries(LLMTools).map(([name, tool]) => ({
    type: "function" as const,
    function: {
      name,
      description: tool.description,
      parameters: tool.parameters.shape,
    },
  }));
}