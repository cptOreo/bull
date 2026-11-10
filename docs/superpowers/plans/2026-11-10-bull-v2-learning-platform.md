# Bull v2 Learning Platform Implementation Plan (Part 3)

## Phase 1 Continued: AI Chat Integration & Stock Deep Dive (Tasks 12-50)

### Task 12: Create AI LLM providers and tools

**Files:**
- Create: `lib/llm/providers.ts`
- Create: `lib/llm/tools.ts`
- Create: `lib/llm/rag.ts`
- Create: `lib/llm/verification.ts`
- Create: `lib/llm/prompts.ts`
- Create: `lib/llm/index.ts`

- [ ] **Step 1: Write lib/llm/providers.ts**

```ts
// lib/llm/providers.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { OpenAI } from "openai";

export type LLMProvider = "gemini" | "groq" | "openrouter" | "none";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  toolCallId?: string;
  name?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface LLMProviderConfig {
  name: LLMProvider;
  generate: (messages: LLMMessage[], tools?: LLMTool[]) => Promise<LLMResponse>;
  supportsTools: boolean;
  maxTokens: number;
  contextWindow: number;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function getGeminiProvider(): LLMProviderConfig | null {
  if (!GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  return {
    name: "gemini",
    supportsTools: true,
    maxTokens: 8192,
    contextWindow: 1000000,
    async generate(messages, tools) {
      const chat = model.startChat({ history: [] });
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
      const result = await chat.sendMessage(prompt);
      return {
        content: result.response.text(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
  };
}

function getGroqProvider(): LLMProviderConfig | null {
  if (!GROQ_API_KEY) return null;
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  return {
    name: "groq",
    supportsTools: true,
    maxTokens: 8192,
    contextWindow: 131072,
    async generate(messages, tools) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({ type: "function", function: t })),
        tool_choice: "auto",
        max_tokens: 4096,
        temperature: 0.1,
      });
      return {
        content: completion.choices[0]?.message?.content || "",
        toolCalls: completion.choices[0]?.message?.tool_calls?.map(tc => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    },
  };
}

function getOpenRouterProvider(): LLMProviderConfig | null {
  if (!OPENROUTER_API_KEY) return null;
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: { "HTTP-Referer": "https://bull.app", "X-Title": "Bull" },
  });

  return {
    name: "openrouter",
    supportsTools: true,
    maxTokens: 4096,
    contextWindow: 128000,
    async generate(messages, tools) {
      const completion = await openrouter.chat.completions.create({
        model: "meta-llama/llama-3.1-70b-instruct:free",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({ type: "function", function: t })),
        tool_choice: "auto",
        max_tokens: 4096,
      });
      return {
        content: completion.choices[0]?.message?.content || "",
        toolCalls: completion.choices[0]?.message?.tool_calls?.map(tc => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    },
  };
}

function getNullProvider(): LLMProviderConfig {
  return {
    name: "none",
    supportsTools: false,
    maxTokens: 0,
    contextWindow: 0,
    async generate(messages) {
      // Template fallback - returns structured response based on last user message
      const lastUser = messages.filter(m => m.role === "user").pop();
      return {
        content: lastUser
          ? `I'm running in template mode (no API key). You asked: "${lastUser.content}". 
             Please add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY to enable AI responses.`
          : "No message provided",
      };
    },
  };
}

const PROVIDER_PRIORITY: (() => LLMProviderConfig | null)[] = [
  getGeminiProvider,
  getGroqProvider,
  getOpenRouterProvider,
];

export function getActiveProvider(): LLMProviderConfig {
  for (const getProvider of PROVIDER_PRIORITY) {
    const provider = getProvider();
    if (provider) return provider;
  }
  return getNullProvider();
}

export function getProviderName(): LLMProvider {
  return getActiveProvider().name;
}
```

- [ ] **Step 2: Write lib/llm/tools.ts**

```ts
// lib/llm/tools.ts
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
```

- [ ] **Step 3: Write lib/llm/rag.ts**

```ts
// lib/llm/rag.ts
// Local RAG system using Transformers.js for embeddings

import { pipeline, env } from "@xenova/transformers";
import { getDB, cacheSearchResults, getCachedSearchResults } from "@/data/indexed-db";

env.allowLocalModels = true;
env.useBrowserCache = true;

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIM = 384;

let embedder: ((text: string) => Promise<number[]>) | null = null;

async function getEmbedder() {
  if (!embedder) {
    const pipe = await pipeline("feature-extraction", EMBEDDING_MODEL);
    embedder = async (text: string) => {
      const output = await pipe(text, { pooling: "mean", normalize: true });
      return Array.from(output.data) as number[];
    };
  }
  return embedder;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const FINANCIAL_KNOWLEDGE = [
  { id: "pe-ratio", text: "P/E Ratio = Price per Share / Earnings per Share. Measures how much investors pay for ₹1 of earnings. Low P/E (<15) may indicate undervaluation; high P/E (>30) suggests growth expectations.", category: "valuation" },
  { id: "dcf", text: "DCF (Discounted Cash Flow) values a company by projecting future free cash flows and discounting them to present value using WACC. Key inputs: revenue growth, operating margin, tax rate, WACC, terminal growth.", category: "valuation" },
  { id: "roe", text: "ROE (Return on Equity) = Net Income / Shareholders' Equity. Measures profitability relative to equity. DuPont: ROE = Profit Margin × Asset Turnover × Financial Leverage. >15% is strong.", category: "profitability" },
  { id: "debt-equity", text: "Debt-to-Equity = Total Debt / Shareholders' Equity. Measures financial leverage. <0.5 is conservative; >1.5 is aggressive. For banks, use deposits-excluded debt.", category: "leverage" },
  { id: "dividend-yield", text: "Dividend Yield = Annual Dividend per Share / Price per Share. Measures cash return. Sustainable if payout ratio <70% and FCF covers dividend.", category: "income" },
  { id: "kirana-pe", text: "Kirana Store P/E Analogy: Your neighborhood store earns ₹5L/year. If sold for ₹50L, P/E = 10x (10% earnings yield). If sold for ₹5Cr, P/E = 100x (1% yield) — takes 100 years to recover.", category: "analogy" },
  { id: "apartment-ownership", text: "Owner's Mindset Analogy: Buying 1 flat in a 100-flat building. You don't check price daily; you track rental income and neighborhood development. Stocks are fractional deeds of real businesses.", category: "analogy" },
  { id: "moat-pricing", text: "Economic Moat = Pricing Power. Can the company raise prices without losing customers? Sources: brand (Titan), switching costs (ERP), network effects (UPI), scale (Reliance), regulation.", category: "moats" },
  { id: "cash-flow-quality", text: "Cash Flow vs Accounting Profit: Profit includes unpaid invoices (receivables). Cash flow is actual cash. Negative operating cash flow with positive profit = red flag (ITC 2020, DHFL).", category: "red-flags" },
  { id: "drawdown", text: "Maximum Drawdown = Peak-to-trough decline. Measures worst-case loss. >20% drawdown requires >25% gain to recover. 50% drawdown needs 100% gain. Risk management essential.", category: "risk" },
];

async function initializeRAG() {
  const db = await getDB();
  const existing = await db.getAll("ragEmbeddings");
  if (existing.length > 0) return;

  const embedder = await getEmbedder();
  for (const item of FINANCIAL_KNOWLEDGE) {
    const embedding = await embedder(item.text);
    await db.put("ragEmbeddings", { id: item.id, text: item.text, embedding, metadata: { category: item.category } });
  }
}

export async function retrieveRelevantKnowledge(query: string, topK = 3): Promise<Array<{ text: string; category: string; score: number }>> {
  await initializeRAG();
  
  const embedder = await getEmbedder();
  const queryEmbedding = await embedder(query);
  
  const db = await getDB();
  const all = await db.getAll("ragEmbeddings");
  
  const scored = all.map(item => ({
    text: item.text,
    category: item.metadata.category as string,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(r => r.score > 0.3);
}

export async function addKnowledge(id: string, text: string, category: string): Promise<void> {
  const embedder = await getEmbedder();
  const embedding = await embedder(text);
  const db = await getDB();
  await db.put("ragEmbeddings", { id, text, embedding, metadata: { category } });
}
```

- [ ] **Step 4: Write lib/llm/verification.ts**

```ts
// lib/llm/verification.ts
// Output verification for LLM responses (ported from v0)

import { z } from "zod";

export interface VerificationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface VerificationConfig {
  numericTolerance?: number; // default 0.05 (5%)
  maxLength?: number;
  requiredEntities?: string[];
  forbiddenPatterns?: RegExp[];
  language?: "en" | "hi-en";
}

const DEFAULT_CONFIG: Required<VerificationConfig> = {
  numericTolerance: 0.05,
  maxLength: 5000,
  requiredEntities: [],
  forbiddenPatterns: [
    /buy|sell|hold|target|upside|downside|recommend|must\s+buy|guaranteed|risk[- ]?free/i,
    /₹?\d+(\.\d+)?\s*(crore|cr|lakh|l)\s*(target|price|return)/i,
    /will\s+(go\s+up|go\s+down|rise|fall|double|triple)/i,
  ],
  language: "en",
};

export function verifyResponse(
  response: string,
  context: { stockData?: Record<string, unknown>; userQuery?: string } = {},
  config: VerificationConfig = {}
): VerificationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Length check
  if (response.length > cfg.maxLength) {
    errors.push(`Response exceeds maximum length (${response.length} > ${cfg.maxLength})`);
  }

  // 2. Forbidden patterns (advice language)
  for (const pattern of cfg.forbiddenPatterns) {
    if (pattern.test(response)) {
      errors.push(`Forbidden pattern detected: ${pattern.source}`);
    }
  }

  // 3. Numeric traceability (if stock data provided)
  if (context.stockData) {
    const numbersInResponse = response.match(/[\d,]+\.?\d*/g) || [];
    for (const numStr of numbersInResponse) {
      const num = parseFloat(numStr.replace(/,/g, ""));
      if (isNaN(num)) continue;
      
      // Check if number exists in context (within tolerance)
      let found = false;
      for (const [key, value] of Object.entries(context.stockData)) {
        if (typeof value === "number") {
          const tolerance = Math.abs(value) * cfg.numericTolerance;
          if (Math.abs(num - value) <= tolerance) {
            found = true;
            break;
          }
        }
      }
      if (!found && num > 1000) { // Only warn for significant numbers
        warnings.push(`Unverified number: ${numStr} (not traced to provided data)`);
      }
    }
  }

  // 4. Required entities
  for (const entity of cfg.requiredEntities) {
    if (!response.toLowerCase().includes(entity.toLowerCase())) {
      warnings.push(`Required entity not mentioned: ${entity}`);
    }
  }

  // 5. Language check
  if (cfg.language === "hi-en") {
    const hasHinglish = /hai|hain|kya|kaise|kyun|yeh|woh|main|aap|hum|stock|share|price|profit|loss|company|business/.test(response.toLowerCase());
    if (!hasHinglish) {
      warnings.push("Response may not be in Hinglish as requested");
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

export function sanitizeResponse(response: string): string {
  // Remove any potential advice language that slipped through
  return response
    .replace(/\b(I recommend|You should|Must buy|Strong buy|Sell now)\b/gi, "")
    .replace(/\b(target price|price target|upside|downside)\b/gi, "fair value estimate")
    .replace(/\b(guaranteed|risk-free|sure shot)\b/gi, "theoretical");
}
```

- [ ] **Step 5: Write lib/llm/prompts.ts**

```ts
// lib/llm/prompts.ts

export const SYSTEM_PROMPTS = {
  tutor: `You are Bull's AI Financial Tutor. Your role is to TEACH, not advise.

CORE PRINCIPLES:
- Explain concepts in plain English with real-world analogies (kirana store, apartment building)
- Use Socratic questioning: guide discovery, don't just lecture
- Adapt to user's level: beginner = no jargon; advanced = technical depth
- Never give buy/sell/hold advice, price targets, or return promises
- Always cite sources: "According to Yahoo Finance data as of [date]..."
- If unsure, say "I don't have that data" rather than guessing

TEACHING STYLE:
- Start with the "why" before the "what"
- Use the user's previously viewed stocks as examples
- Break complex concepts into steps
- Ask check-up questions: "What would happen if margins dropped 2%?"
- Celebrate progress: "Great! You've grasped the core concept"

LANGUAGE: {{locale}} (English or Hinglish - romanized Hindi mixed with English)

RESPONSE FORMAT: Structured with clear sections, bullet points, and practical examples.`,

  analyst: `You are Bull's AI Research Analyst. Your role is to EXECUTE RESEARCH WORKFLOWS.

CAPABILITIES (via tools):
- search_stocks: Find companies by name, sector, criteria
- get_fundamentals: Deep financials, ratios, valuation, profile
- get_price_history: Charts, returns, volatility, drawdown
- screen_stocks: Filter by P/E, ROE, debt, growth, sector, market cap
- compare_stocks: Side-by-side metrics table
- build_dcf: DCF model with sensitivity analysis
- analyze_sector: Sector overview, leaders, trends
- generate_report: Structured markdown reports

WORKFLOW:
1. User states goal → 2. Plan steps → 3. Confirm → 4. Execute tools → 5. Synthesize → 6. Cite sources

RULES:
- Every number MUST cite source and date: "Revenue ₹72,000 Cr (Yahoo Finance, 2026-03-31)"
- Show tool invocations transparently
- No investment advice language
- Flag data gaps: "Dividend yield not available for this period"
- Structure output: Executive Summary → Key Findings → Data Tables → Risks → Sources

LANGUAGE: {{locale}}`,

  tutor_few_shot: `
User: "Explain P/E ratio"
Tutor: "Think of P/E like a kirana store. Your neighborhood store makes ₹5L profit/year. If the owner sells it for ₹50L, you're paying 10x earnings (P/E=10). That's a 10% earnings yield. If another store with same profit sells for ₹5Cr, P/E=100 — you'd wait 100 years to recover your money! P/E tells you: how many years of profit am I paying for?"

User: "What's a good P/E for Zomato?"
Tutor: "Zomato's P/E is ~68x (Yahoo Finance, 2026-11-10). That's high — you're paying for massive future growth. Compare to DMart at ~90x or traditional retail at 20-30x. High P/E isn't 'bad' if growth delivers. But it leaves less margin of safety. What do you think drives Zomato's growth?"

User: "Should I buy Reliance?"
Tutor: "I can't give buy/sell advice — that's not my role. But I can show you Reliance's numbers: P/E ~25x, ROE ~9%, debt/equity ~0.4, diversified across energy/retail/telecom. The conglomerate structure means Jio/Retail growth offsets refining cycles. Want me to walk through a DCF model for it?"`,

  analyst_few_shot: `
User: "Screen for quality stocks under 20x P/E"
Analyst: "I'll screen for: P/E < 20, ROE > 15%, D/E < 0.5, Market Cap > ₹10,000 Cr. Let me run this..."
[Tool: screen_stocks]
Analyst: "Found 12 matches. Top 5: TCS (P/E 24, ROE 45%, D/E 0.05), HDFC Bank (P/E 18, ROE 17%, D/E 0.8), Infosys (P/E 22, ROE 28%, D/E 0.1)... Want me to compare these or get fundamentals for any?"

User: "Build DCF for TCS"
Analyst: "I'll build a DCF for TCS. Need assumptions: revenue growth, operating margin, WACC, terminal growth. Using defaults: 10% growth, 25% margin, 11% WACC, 4% terminal. Let me calculate..."
[Tool: build_dcf]
Analyst: "DCF Result: Intrinsic Value ₹3,850 (Current: ₹3,650). Upside: 5.5%. Sensitivity: if growth drops to 8%, value falls to ₹3,200. Key risk: discretionary IT spend slowdown. [Source: Yahoo Finance, 2026-11-10]"`
};

export function buildTutorPrompt(locale: "en" | "hi-en", userMastery: Record<string, number> = {}): string {
  return SYSTEM_PROMPTS.tutor
    .replace("{{locale}}", locale === "hi-en" ? "Hinglish (romanized Hindi + English)" : "English")
    + "\n\n" + SYSTEM_PROMPTS.tutor_few_shot;
}

export function buildAnalystPrompt(locale: "en" | "hi-en"): string {
  return SYSTEM_PROMPTS.analyst
    .replace("{{locale}}", locale === "hi-en" ? "Hinglish" : "English")
    + "\n\n" + SYSTEM_PROMPTS.analyst_few_shot;
}
```

- [ ] **Step 6: Write lib/llm/index.ts**

```ts
// lib/llm/index.ts
// Unified chat handler with tool execution and verification

import { getActiveProvider, LLMMessage, LLMToolName, getAllToolSchemas } from "./providers";
import { buildTutorPrompt, buildAnalystPrompt } from "./prompts";
import { verifyResponse, sanitizeResponse } from "./verification";
import { retrieveRelevantKnowledge } from "./rag";
import { useChatStore } from "@/components/providers/chat-provider";

interface ChatContext {
  mode: "tutor" | "analyst";
  stock?: string;
  page?: string;
  userMastery?: Record<string, number>;
  locale?: "en" | "hi-en";
}

interface ToolExecutor {
  search_stocks: (args: { query: string; limit?: number }) => Promise<unknown>;
  get_fundamentals: (args: { symbol: string }) => Promise<unknown>;
  get_price_history: (args: { symbol: string; range?: string; interval?: string }) => Promise<unknown>;
  screen_stocks: (args: { criteria: Record<string, unknown>; limit?: number }) => Promise<unknown>;
  compare_stocks: (args: { symbols: string[] }) => Promise<unknown>;
  build_dcf: (args: { symbol: string; assumptions: Record<string, unknown> }) => Promise<unknown>;
  analyze_sector: (args: { sector: string }) => Promise<unknown>;
  generate_report: (args: { title: string; analysis: string; symbol?: string; format?: string }) => Promise<unknown>;
}

let toolExecutor: ToolExecutor | null = null;

export function setToolExecutor(executor: ToolExecutor) {
  toolExecutor = executor;
}

export async function handleChat(
  userMessage: string,
  context: ChatContext
): Promise<{ response: string; toolCalls?: Array<{ name: string; args: unknown; result: unknown }> }> {
  const provider = getActiveProvider();
  const isTutor = context.mode === "tutor";

  // Retrieve relevant knowledge for RAG
  const knowledge = await retrieveRelevantKnowledge(userMessage, 3);
  const knowledgeText = knowledge.length > 0
    ? `\n\nRelevant Knowledge:\n${knowledge.map(k => `- [${k.category}] ${k.text}`).join("\n")}`
    : "";

  // Build messages
  const systemPrompt = isTutor
    ? buildTutorPrompt(context.locale || "en", context.userMastery || {})
    : buildAnalystPrompt(context.locale || "en");

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt + knowledgeText },
    ...getRecentHistory(10).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const tools = isTutor ? [] : getAllToolSchemas();

  // Generate response
  let response = await provider.generate(messages, tools);
  let toolCalls: Array<{ name: string; args: unknown; result: unknown }> = [];

  // Handle tool calls (Analyst mode)
  if (!isTutor && response.toolCalls && toolExecutor) {
    for (const tc of response.toolCalls) {
      const name = tc.function.name as LLMToolName;
      const args = JSON.parse(tc.function.arguments);
      
      try {
        const executor = toolExecutor[name];
        if (executor) {
          const result = await executor(args);
          toolCalls.push({ name, args, result });
          
          // Add tool result to messages for follow-up
          messages.push({
            role: "tool",
            content: JSON.stringify(result),
            toolCallId: tc.id,
            name,
          });
        }
      } catch (error) {
        toolCalls.push({ name, args, result: { error: String(error) } });
      }
    }

    // Generate final response with tool results
    if (toolCalls.length > 0) {
      const finalResponse = await provider.generate(messages, []);
      response = finalResponse;
    }
  }

  // Verify response
  const stockContext = context.stock ? { symbol: context.stock } : undefined;
  const verification = verifyResponse(response.content, { stockData: stockContext }, { language: context.locale });

  if (!verification.passed) {
    // Fallback to sanitized template response
    return {
      response: sanitizeResponse(getTemplateFallback(userMessage, context)),
      toolCalls,
    };
  }

  return {
    response: sanitizeResponse(response.content),
    toolCalls,
  };
}

function getRecentHistory(limit: number): Array<{ role: string; content: string }> {
  const { messages } = useChatStore.getState();
  return messages
    .slice(-limit)
    .map(m => ({ role: m.role, content: m.content }));
}

function getTemplateFallback(message: string, context: ChatContext): string {
  const lower = message.toLowerCase();
  
  if (context.mode === "tutor") {
    if (lower.includes("pe") || lower.includes("p/e")) {
      return `P/E Ratio = Price per Share ÷ Earnings per Share. Think of a kirana store earning ₹5L/year. If sold for ₹50L, P/E = 10x (10% earnings yield). If sold for ₹5Cr, P/E = 100x (1% yield). Lower P/E = higher earnings yield. Want me to calculate P/E for a specific stock?`;
    }
    if (lower.includes("dcf")) {
      return `DCF (Discounted Cash Flow) values a business by projecting future cash flows and discounting to present value. Key inputs: revenue growth, operating margin, tax rate, WACC, terminal growth. It's the most rigorous valuation method but sensitive to assumptions. Want to build one for a stock you're watching?`;
    }
    return `I can explain any financial concept with real-world analogies. Try asking about P/E, DCF, ROE, debt-to-equity, dividend yield, moats, or financial statements. What would you like to learn?`;
  } else {
    return `I can run research workflows: screen stocks, compare companies, build DCF models, analyze sectors, get fundamentals. What would you like me to analyze?`;
  }
}
```

- [ ] **Step 7: Run typecheck and build**

```bash
npm run typecheck && npm run build
```

Expected: Clean compilation.

- [ ] **Step 8: Commit**

```bash
git add lib/llm
git commit -m "feat(llm): add providers (Gemini/Groq/OpenRouter), tools, RAG, verification, prompts, unified chat handler"
```

### Task 13: Create Zustand state stores

**Files:**
- Create: `lib/state/use-bull.ts`
- Create: `lib/state/use-profile.ts`
- Create: `lib/state/use-progress.ts`
- Create: `lib/state/use-chat.ts`
- Create: `lib/state/use-ui.ts`

- [ ] **Step 1: Write lib/state/use-bull.ts**

```ts
// lib/state/use-bull.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  goal: "analyze" | "dividend" | "statements" | "moats";
  experience: "none" | "few" | "sip";
  horizon: "1_3y" | "3_5y" | "5_10y" | "10y_plus";
  riskComfort: "low" | "medium" | "high" | "unsure";
  locale: "en" | "hi-en";
}

interface LearningProgress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  mastery: Record<string, { level: number; progress: number }>;
  badges: string[];
  completedLessons: string[];
  completedMissions: string[];
  quizHistory: Array<{ date: string; score: number; xp: number }>;
}

interface BullState {
  profile: UserProfile | null;
  progress: LearningProgress;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: Partial<UserProfile>) => void;
  clearProfile: () => void;
  updateProgress: (updates: Partial<LearningProgress>) => void;
  addXP: (amount: number, source: string) => void;
  completeLesson: (lessonId: string) => void;
  completeMission: (missionId: string) => void;
  updateMastery: (conceptId: string, level: number, progress: number) => void;
  addBadge: (badgeId: string) => void;
  recordQuiz: (score: number, xp: number) => void;
  checkStreak: () => void;
  completeOnboarding: () => void;
}

const INITIAL_PROGRESS: LearningProgress = {
  xp: 0,
  level: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
  mastery: {},
  badges: [],
  completedLessons: [],
  completedMissions: [],
  quizHistory: [],
};

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];

function calculateLevel(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i;
  }
  return 0;
}

export const useBullStore = create<BullState>()(
  persist(
    immer((set, get) => ({
      profile: null,
      progress: INITIAL_PROGRESS,
      hasCompletedOnboarding: false,

      setProfile: (updates) => set((state) => {
        state.profile = { ...state.profile!, ...updates } as UserProfile;
      }),

      clearProfile: () => set((state) => {
        state.profile = null;
      }),

      updateProgress: (updates) => set((state) => {
        state.progress = { ...state.progress, ...updates };
      }),

      addXP: (amount, source) => set((state) => {
        const newXP = state.progress.xp + amount;
        const newLevel = calculateLevel(newXP);
        const leveledUp = newLevel > state.progress.level;
        
        state.progress.xp = newXP;
        state.progress.level = newLevel;
        
        if (leveledUp) {
          // Could trigger level-up celebration
        }
      }),

      completeLesson: (lessonId) => set((state) => {
        if (!state.progress.completedLessons.includes(lessonId)) {
          state.progress.completedLessons.push(lessonId);
          get().addXP(20, `lesson:${lessonId}`);
        }
      }),

      completeMission: (missionId) => set((state) => {
        if (!state.progress.completedMissions.includes(missionId)) {
          state.progress.completedMissions.push(missionId);
          get().addXP(30, `mission:${missionId}`);
        }
      }),

      updateMastery: (conceptId, level, progress) => set((state) => {
        const current = state.progress.mastery[conceptId] || { level: 0, progress: 0 };
        const oldLevel = current.level;
        state.progress.mastery[conceptId] = { level, progress };
        
        if (level > oldLevel) {
          get().addXP(50, `mastery:${conceptId}`);
        }
      }),

      addBadge: (badgeId) => set((state) => {
        if (!state.progress.badges.includes(badgeId)) {
          state.progress.badges.push(badgeId);
          get().addXP(100, `badge:${badgeId}`);
        }
      }),

      recordQuiz: (score, xp) => set((state) => {
        const today = new Date().toISOString().split("T")[0];
        state.progress.quizHistory.push({ date: today, score, xp });
        get().addXP(xp, "quiz");
      }),

      checkStreak: () => set((state) => {
        const today = new Date().toISOString().split("T")[0];
        const lastActive = state.progress.lastActiveDate;
        
        if (lastActive === today) return; // Already checked today
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        
        if (lastActive === yesterday) {
          state.progress.streak += 1;
        } else if (lastActive !== today) {
          state.progress.streak = 1;
        }
        
        state.progress.lastActiveDate = today;
        
        // Streak bonuses
        if (state.progress.streak === 7) get().addXP(50, "streak:7");
        if (state.progress.streak === 30) get().addXP(100, "streak:30");
        if (state.progress.streak === 100) get().addXP(200, "streak:100");
      }),

      completeOnboarding: () => set((state) => {
        state.hasCompletedOnboarding = true;
      }),
    })),
    {
      name: "bull-v2-state",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          // Migration from v0 if needed
          return persisted as BullState;
        }
        return persisted as BullState;
      },
    }
  )
);

export const useBull = () => useBullStore();
```

- [ ] **Step 2: Write lib/state/use-profile.ts**

```ts
// lib/state/use-profile.ts
import { useBullStore } from "./use-bull";

export function useProfile() {
  const { profile, setProfile, clearProfile, hasCompletedOnboarding, completeOnboarding } = useBullStore();

  return {
    profile,
    setProfile,
    clearProfile,
    hasCompletedOnboarding,
    completeOnboarding,
    isComplete: profile !== null,
  };
}
```

- [ ] **Step 3: Write lib/state/use-progress.ts**

```ts
// lib/state/use-progress.ts
import { useBullStore } from "./use-bull";

export function useProgress() {
  const { progress, updateProgress, addXP, completeLesson, completeMission, updateMastery, addBadge, recordQuiz, checkStreak } = useBullStore();

  const xpForNextLevel = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level + 1] || 999999;
  const xpProgress = progress.level > 0 
    ? ((progress.xp - [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level]) / 
       (xpForNextLevel - [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level])) * 100
    : (progress.xp / 100) * 100;

  return {
    ...progress,
    xpProgress: Math.min(100, Math.max(0, xpProgress)),
    xpForNextLevel,
    xpInLevel: progress.xp - ([0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level] || 0),
    checkStreak,
  };
}
```

- [ ] **Step 4: Write lib/state/use-chat.ts**

```ts
// lib/state/use-chat.ts
import { useChatStore } from "@/components/providers/chat-provider";

export function useChat() {
  const { messages, currentMode, context, addMessage, updateMessage, setMode, setContext, clearHistory } = useChatStore();

  return {
    messages,
    currentMode,
    context,
    addMessage,
    updateMessage,
    setMode,
    setContext,
    clearHistory,
  };
}
```

- [ ] **Step 5: Write lib/state/use-ui.ts**

```ts
// lib/state/use-ui.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  commandPaletteOpen: boolean;
  toasts: Array<{ id: string; message: string; type: "info" | "success" | "error" | "warning" }>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setCommandPaletteOpen: (open: boolean) => void;
  addToast: (message: string, type: "info" | "success" | "error" | "warning") => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: "system",
      commandPaletteOpen: false,
      toasts: [],
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      addToast: (message, type) => set((state) => ({
        toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),
    }),
    { name: "bull-v2-ui", version: 1 }
  )
);

export function useUI() {
  return useUIStore();
}
```

- [ ] **Step 6: Run typecheck and build**

```bash
npm run typecheck && npm run build
```

Expected: Clean compilation.

- [ ] **Step 7: Commit**

```bash
git add lib/state
git commit -m "feat(state): add Zustand stores for profile, progress, chat, UI with persistence"
```

### Task 14: Create custom hooks

**Files:**
- Create: `lib/hooks/use-stock.ts`
- Create: `lib/hooks/use-search.ts`
- Create: `lib/hooks/use-skill-tree.ts`
- Create: `lib/hooks/use-lesson.ts`
- Create: `lib/hooks/use-command-palette.ts`

- [ ] **Step 1: Write lib/hooks/use-stock.ts**

```ts
// lib/hooks/use-stock.ts
import { useQuery } from "@tanstack/react-query";
import { getStockSnapshot, getPriceHistory, searchStocks, LiveStockSnapshot } from "@/data/yahoo-client";
import { transformPriceHistory, mergeSnapshots } from "@/data/transformers";
import { cacheStockQuote, getCachedStockQuote, cacheStockHistory, getCachedStockHistory } from "@/data/indexed-db";

interface UseStockOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useStock(symbol: string | undefined, options: UseStockOptions = {}) {
  const { enabled = true, staleTime = 30000 } = options;

  return useQuery({
    queryKey: ["stock", symbol?.toUpperCase()],
    queryFn: async () => {
      if (!symbol) throw new Error("No symbol provided");
      
      const upperSymbol = symbol.toUpperCase();
      
      // Check cache first
      const cached = await getCachedStockQuote(upperSymbol, staleTime);
      let primary: LiveStockSnapshot | null = cached ? JSON.parse(JSON.stringify(cached)) : null;

      // Fetch fresh data
      const fresh = await getStockSnapshot(upperSymbol);
      
      // Merge with cached fallback
      const merged = mergeSnapshots(fresh, primary);
      
      if (merged) {
        await cacheStockQuote(upperSymbol, merged);
      }
      
      return merged;
    },
    enabled: enabled && !!symbol,
    staleTime,
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
}

export function useStockHistory(
  symbol: string | undefined,
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max" = "1y",
  interval: "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1wk" | "1mo" = "1d",
  options: UseStockOptions = {}
) {
  const { enabled = true, staleTime = 300000 } = options; // 5 min for history

  return useQuery({
    queryKey: ["stock", "history", symbol?.toUpperCase(), range, interval],
    queryFn: async () => {
      if (!symbol) throw new Error("No symbol provided");
      
      const upperSymbol = symbol.toUpperCase();
      const cacheKey = `${upperSymbol}:${range}:${interval}`;
      
      const cached = await getCachedStockHistory(upperSymbol, range, interval, staleTime);
      if (cached) return cached;

      const history = await getPriceHistory(upperSymbol, range, interval);
      if (!history) return null;

      const transformed = transformPriceHistory(
        history.timestamps,
        history.closes,
        history.highs,
        history.lows,
        history.volumes,
        interval
      );

      await cacheStockHistory(upperSymbol, range, interval, transformed);
      return transformed;
    },
    enabled: enabled && !!symbol,
    staleTime,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useStockSearch(query: string, options: UseStockOptions = {}) {
  const { enabled = true, staleTime = 300000 } = options;

  return useQuery({
    queryKey: ["stock", "search", query.toLowerCase()],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      return searchStocks(query);
    },
    enabled: enabled && query.length >= 2,
    staleTime,
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
```

- [ ] **Step 2: Write lib/hooks/use-search.ts**

```ts
// lib/hooks/use-search.ts
import { useCommandPalette } from "@/hooks/use-command-palette";

export function useSearch() {
  const { query, setQuery, activeTab, setActiveTab, isOpen, setOpen, reset } = useCommandPalette();

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    isOpen,
    setOpen,
    reset,
  };
}
```

- [ ] **Step 3: Write lib/hooks/use-skill-tree.ts**

```ts
// lib/hooks/use-skill-tree.ts
import { useProgress } from "@/state/use-progress";

const SKILL_TREE_NODES = [
  // Analyze Any Stock Track
  { id: "valuation-basics", label: "Valuation Basics", track: "analyze", prerequisites: [], xp: 20 },
  { id: "pe-ratio", label: "P/E Ratio", track: "analyze", prerequisites: ["valuation-basics"], xp: 30 },
  { id: "pb-ratio", label: "P/B Ratio", track: "analyze", prerequisites: ["valuation-basics"], xp: 30 },
  { id: "ev-ebitda", label: "EV/EBITDA", track: "analyze", prerequisites: ["pe-ratio"], xp: 40 },
  { id: "dcf-modeling", label: "DCF Modeling", track: "analyze", prerequisites: ["pe-ratio", "ev-ebitda"], xp: 50 },
  { id: "relative-valuation", label: "Relative Valuation", track: "analyze", prerequisites: ["pe-ratio", "pb-ratio"], xp: 40 },
  { id: "financial-statements", label: "Financial Statements", track: "analyze", prerequisites: ["valuation-basics"], xp: 40 },
  { id: "income-statement", label: "Income Statement", track: "analyze", prerequisites: ["financial-statements"], xp: 30 },
  { id: "balance-sheet", label: "Balance Sheet", track: "analyze", prerequisites: ["financial-statements"], xp: 30 },
  { id: "cash-flow", label: "Cash Flow Statement", track: "analyze", prerequisites: ["financial-statements"], xp: 30 },
  { id: "ratio-analysis", label: "Ratio Analysis", track: "analyze", prerequisites: ["financial-statements"], xp: 40 },
  { id: "risk-assessment", label: "Risk Assessment", track: "analyze", prerequisites: ["ratio-analysis"], xp: 40 },
  { id: "report-writing", label: "Research Report Writing", track: "analyze", prerequisites: ["risk-assessment", "dcf-modeling"], xp: 50 },

  // Build Dividend Portfolio Track
  { id: "dividend-basics", label: "Dividend Basics", track: "dividend", prerequisites: [], xp: 20 },
  { id: "yield-payout", label: "Yield & Payout Ratio", track: "dividend", prerequisites: ["dividend-basics"], xp: 30 },
  { id: "dividend-safety", label: "Dividend Safety", track: "dividend", prerequisites: ["yield-payout"], xp: 40 },
  { id: "sector-diversification", label: "Sector Diversification", track: "dividend", prerequisites: ["dividend-safety"], xp: 30 },
  { id: "growth-vs-yield", label: "Growth vs Yield", track: "dividend", prerequisites: ["dividend-safety"], xp: 40 },
  { id: "rebalancing", label: "Portfolio Rebalancing", track: "dividend", prerequisites: ["sector-diversification", "growth-vs-yield"], xp: 40 },
  { id: "tax-efficiency", label: "Tax Efficiency", track: "dividend", prerequisites: ["rebalancing"], xp: 30 },

  // Read Financial Statements Track
  { id: "is-basics", label: "Income Statement Basics", track: "statements", prerequisites: [], xp: 20 },
  { id: "bs-basics", label: "Balance Sheet Basics", track: "statements", prerequisites: [], xp: 20 },
  { id: "cf-basics", label: "Cash Flow Basics", track: "statements", prerequisites: [], xp: 20 },
  { id: "quality-earnings", label: "Quality of Earnings", track: "statements", prerequisites: ["is-basics"], xp: 40 },
  { id: "red-flags", label: "Red Flags in Financials", track: "statements", prerequisites: ["quality-earnings"], xp: 40 },
  { id: "forecasting", label: "Financial Forecasting", track: "statements", prerequisites: ["cf-basics", "quality-earnings"], xp: 50 },

  // Understand Moats Track
  { id: "pricing-power", label: "Pricing Power", track: "moats", prerequisites: [], xp: 30 },
  { id: "switching-costs", label: "Switching Costs", track: "moats", prerequisites: [], xp: 30 },
  { id: "network-effects", label: "Network Effects", track: "moats", prerequisites: [], xp: 30 },
  { id: "scale-advantages", label: "Scale Advantages", track: "moats", prerequisites: [], xp: 30 },
  { id: "brand-moat", label: "Brand Moat", track: "moats", prerequisites: ["pricing-power"], xp: 40 },
  { id: "intangibles", label: "Intangible Assets", track: "moats", prerequisites: ["brand-moat"], xp: 40 },
  { id: "moat-erosion", label: "Moat Erosion", track: "moats", prerequisites: ["intangibles"], xp: 40 },
] as const;

export function useSkillTree() {
  const { mastery } = useProgress();

  const nodes = SKILL_TREE_NODES.map(node => {
    const nodeMastery = mastery[node.id] || { level: 0, progress: 0 };
    const prerequisitesMet = node.prerequisites.every(prereq => {
      const prereqMastery = mastery[prereq];
      return prereqMastery && prereqMastery.level >= 1;
    });

    let state: "locked" | "available" | "learning" | "mastered" = "locked";
    if (nodeMastery.level >= 5) state = "mastered";
    else if (nodeMastery.level >= 1) state = "learning";
    else if (prerequisitesMet || node.prerequisites.length === 0) state = "available";

    return {
      ...node,
      state,
      mastery: nodeMastery,
      prerequisitesMet,
    };
  });

  const tracks = ["analyze", "dividend", "statements", "moats"] as const;
  const trackNodes = tracks.map(track => ({
    id: track,
    label: track === "analyze" ? "Analyze Any Stock" :
           track === "dividend" ? "Build Dividend Portfolio" :
           track === "statements" ? "Read Financial Statements" : "Understand Moats",
    nodes: nodes.filter(n => n.track === track),
  }));

  return { nodes, tracks: trackNodes, getNode: (id: string) => nodes.find(n => n.id === id) };
}
```

- [ ] **Step 4: Write lib/hooks/use-lesson.ts**

```ts
// lib/hooks/use-lesson.ts
import { useState, useCallback } from "react";
import { useSkillTree } from "./use-skill-tree";
import { useProgress } from "@/state/use-progress";
import { useBullStore } from "@/state/use-bull";

interface LessonStep {
  id: string;
  title: string;
  component: React.ComponentType<{ conceptId: string; onComplete: () => void }>;
}

interface LessonContent {
  conceptId: string;
  title: string;
  description: string;
  analogy: string;
  formula: string;
  steps: LessonStep[];
  practiceQuestions: Array<{ question: string; options: string[]; correct: number; explanation: string }>;
  mission: { prompt: string; xp: number };
  masteryCheck: Array<{ question: string; options: string[]; correct: number; explanation: string }>;
}

const LESSON_CONTENT: Record<string, LessonContent> = {
  "pe-ratio": {
    conceptId: "pe-ratio",
    title: "P/E Ratio",
    description: "The Price-to-Earnings ratio tells you how many years of profit you're paying for.",
    analogy: "Your neighborhood kirana store earns ₹5L profit/year. If the owner sells for ₹50L, P/E = 10x (10% earnings yield). If sold for ₹5Cr, P/E = 100x — 100 years to break even!",
    formula: "P/E = Price per Share ÷ Earnings per Share | Earnings Yield = 1 ÷ P/E",
    steps: [
      { id: "concept", title: "Concept", component: () => null },
      { id: "your-stock", title: "Your Stock", component: () => null },
      { id: "practice", title: "Guided Practice", component: () => null },
      { id: "mission", title: "Applied Mission", component: () => null },
      { id: "check", title: "Mastery Check", component: () => null },
    ],
    practiceQuestions: [
      { question: "A company earns ₹10/share. Its stock trades at ₹250. What's the P/E?", options: ["20x", "25x", "30x", "15x"], correct: 1, explanation: "P/E = ₹250 ÷ ₹10 = 25x" },
      { question: "What does a P/E of 10x mean for earnings yield?", options: ["5%", "10%", "15%", "20%"], correct: 1, explanation: "Earnings Yield = 1 ÷ 10 = 10%" },
    ],
    mission: { prompt: "Calculate P/E for Zomato and explain what it means for a long-term investor", xp: 30 },
    masteryCheck: [
      { question: "Lower P/E generally means...", options: ["Higher earnings yield", "Lower earnings yield", "Higher growth", "More risk"], correct: 0, explanation: "Lower P/E = higher earnings yield (1/P/E)" },
      { question: "If Stock A has P/E 15x and Stock B has P/E 30x, which has higher earnings yield?", options: ["Stock A", "Stock B", "Same", "Cannot determine"], correct: 0, explanation: "Stock A: 1/15 = 6.7% vs Stock B: 1/30 = 3.3%" },
    ],
  },
  // Add more lessons...
};

export function useLesson(conceptId: string) {
  const content = LESSON_CONTENT[conceptId];
  const { updateMastery, completeLesson, addXP } = useBullStore();
  const { nodes } = useSkillTree();
  const node = nodes.find(n => n.id === conceptId);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState<Record<string, boolean>>({});

  const currentStepData = content?.steps[currentStep];
  const isComplete = currentStep >= (content?.steps.length || 0) - 1 && stepProgress[currentStepData?.id || ""];

  const completeStep = useCallback((stepId: string) => {
    setStepProgress(prev => ({ ...prev, [stepId]: true }));
    if (currentStep < (content?.steps.length || 0) - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const completeLessonHandler = useCallback(() => {
    completeLesson(conceptId);
    updateMastery(conceptId, Math.min(5, (node?.mastery.level || 0) + 1), 100);
    addXP(20, `lesson:${conceptId}`);
  }, [conceptId, completeLesson, updateMastery, addXP, node?.mastery.level]);

  return {
    content,
    currentStep,
    currentStepData,
    stepProgress,
    isComplete,
    completeStep,
    completeLesson: completeLessonHandler,
    setCurrentStep,
  };
}
```

- [ ] **Step 5: Run typecheck and build**

```bash
npm run typecheck && npm run build
```

Expected: Clean compilation.

- [ ] **Step 6: Commit**

```bash
git add lib/hooks
git commit -m "feat(hooks): add use-stock, use-search, use-skill-tree, use-lesson with TanStack Query integration"
```

### Task 15: Create Stock Deep Dive page (`/stock/[ticker]`)

**Files:**
- Create: `app/stock/[ticker]/page.tsx`
- Create: `components/stock/stock-header.tsx`
- Create: `components/stock/stock-tabs.tsx`
- Create: `components/stock/overview-tab.tsx`
- Create: `components/stock/financials-tab.tsx`
- Create: `components/stock/valuation-tab.tsx`
- Create: `components/stock/dcf-builder.tsx`
- Create: `components/stock/risk-flags.tsx`
- Create: `components/stock/news-feed.tsx`
- Create: `components/stock/learn-chips.tsx`
- Create: `components/stock/ratio-grid.tsx`
- Create: `components/stock/price-chart.tsx`

- [ ] **Step 1: Write components/stock/stock-header.tsx**

```tsx
// components/stock/stock-header.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { formatPrice, formatSignedPercent, formatCrore } from "@/lib/utils/formatters";
import { MasteryRing } from "@/ui/mastery-ring";
import { TrendingUp, TrendingDown, Minus, Building2, DollarSign, Percent, Target } from "lucide-react";

interface StockHeaderProps {
  stock: {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    dayHigh: number | null;
    dayLow: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    marketCap: number | null;
    marketCapFormatted: string;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    sector: string | null;
    industry: string | null;
    asOf: string;
    source: string;
  };
}

export function StockHeader({ stock }: StockHeaderProps) {
  const isPositive = stock.changePercent >= 0;
  const currencySymbol = stock.currency === "INR" ? "₹" : "$";
  const rangePercent = stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh > stock.fiftyTwoWeekLow
    ? ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100
    : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Ticker & Name */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">
            {stock.ticker.replace(".NS", "").replace(".BO", "")}
          </span>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-muted text-muted-foreground">
            {stock.ticker.endsWith(".NS") ? "NSE" : stock.ticker.endsWith(".BO") ? "BSE" : "GLOBAL"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-wrap">{stock.name}</h1>
      </div>

      {/* Price & Change */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex items-baseline gap-4">
          <motion.span
            key={stock.price}
            className="text-4xl sm:text-5xl font-mono font-bold tabular-nums"
          >
            {currencySymbol}{formatPrice(stock.price)}
          </motion.span>
          <motion.div
            key={stock.changePercent}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono font-semibold",
              isPositive ? "bg-positive/10 text-positive border border-positive/20" : "bg-negative/10 text-negative border border-negative/20"
            )}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? "+" : ""}{stock.change.toFixed(2)}</span>
            <span className="text-muted-foreground">({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)</span>
          </motion.div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-mono">Day: {currencySymbol}{formatPrice(stock.dayLow || 0)} – {currencySymbol}{formatPrice(stock.dayHigh || 0)}</span>
          <span className="font-mono">52W: {currencySymbol}{formatPrice(stock.fiftyTwoWeekLow || 0)} – {currencySymbol}{formatPrice(stock.fiftyTwoWeekHigh || 0)}</span>
        </div>
      </div>

      {/* 52-Week Range Visual */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>52-Week Range</span>
          <span className="font-semibold text-foreground">Pin: {Math.round(rangePercent)}%</span>
        </div>
        <div className="relative h-3">
          <div className="absolute inset-0 h-full bg-gradient-to-r from-negative via-muted to-positive rounded-full" />
          <motion.div
            style={{ left: `${Math.max(0, Math.min(100, rangePercent))}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-foreground shadow-lg transition-all duration-500 ease-out"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Low: {currencySymbol}{formatPrice(stock.fiftyTwoWeekLow || 0)}</span>
          <span>High: {currencySymbol}{formatPrice(stock.fiftyTwoWeekHigh || 0)}</span>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Market Cap"
          value={stock.marketCapFormatted}
          color="text-blue-500"
        />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          label="P/E Ratio"
          value={stock.peRatio ? `${stock.peRatio.toFixed(1)}x` : "N/A"}
          color="text-emerald-500"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Dividend Yield"
          value={stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "0.00%"}
          color="text-amber-500"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Sector"
          value={stock.sector || "N/A"}
          color="text-violet-500"
        />
      </div>

      {/* Data Badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Data as of {new Date(stock.asOf).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{stock.source.toUpperCase()}</span>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-xl glass dark:glass-dark border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-lg", color)}>{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="font-mono font-semibold text-lg">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Write components/stock/stock-tabs.tsx**

```tsx
// components/stock/stock-tabs.tsx
"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { FinancialsTab } from "./financials-tab";
import { ValuationTab } from "./valuation-tab";
import { RiskFlags } from "./risk-flags";
import { NewsFeed } from "./news-feed";
import { LearnChips } from "./learn-chips";
import { Building2, FileText, Calculator, AlertTriangle, Newspaper, BookOpen } from "lucide-react";

interface StockTabsProps {
  stock: {
    ticker: string;
    name: string;
    strengths: string[];
    watchouts: string[];
    summary: string | null;
    sector: string | null;
    industry: string | null;
    financials: Record<string, unknown>;
    priceHistory: unknown;
  };
}

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "financials", label: "Financials", icon: FileText },
  { id: "valuation", label: "Valuation", icon: Calculator },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "news", label: "News", icon: Newspaper },
  { id: "learn", label: "Learn", icon: BookOpen },
] as const;

export function StockTabs({ stock }: StockTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6 bg-muted">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 py-2 text-sm">
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="pt-6">
        <OverviewTab stock={stock} />
      </TabsContent>
      <TabsContent value="financials" className="pt-6">
        <FinancialsTab stock={stock} />
      </TabsContent>
      <TabsContent value="valuation" className="pt-6">
        <ValuationTab stock={stock} />
      </TabsContent>
      <TabsContent value="risks" className="pt-6">
        <RiskFlags stock={stock} />
      </TabsContent>
      <TabsContent value="news" className="pt-6">
        <NewsFeed stock={stock} />
      </TabsContent>
      <TabsContent value="learn" className="pt-6">
        <LearnChips stock={stock} />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Write components/stock/overview-tab.tsx**

```tsx
// components/stock/overview-tab.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { RatioGrid } from "./ratio-grid";
import { MasteryRing } from "@/ui/mastery-ring";
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Target, BookOpen } from "lucide-react";
import { Button } from "@/ui/button";
import Link from "next/link";

interface OverviewTabProps {
  stock: {
    summary: string | null;
    strengths: string[];
    watchouts: string[];
    sector: string | null;
    industry: string | null;
    peRatio: number | null;
    pbRatio: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
  };
}

export function OverviewTab({ stock }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Business Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            How This Business Makes Money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {stock.summary || "Business summary not available."}
          </p>
          {stock.sector && (
            <p className="mt-3 text-sm text-muted-foreground">
              Sector: <span className="font-medium text-foreground">{stock.sector}</span>
              {stock.industry && <span className="mx-1">•</span> Industry: <span className="font-medium text-foreground">{stock.industry}</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Strengths & Watchouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span>Key Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stock.strengths.length > 0 ? (
              stock.strengths.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{s}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No strengths data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Watchouts & Risks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stock.watchouts.length > 0 ? (
              stock.watchouts.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/5 dark:bg-rose-500/10">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{w}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No watchouts data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Ratios */}
      <RatioGrid stock={stock} />

      {/* Learn Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground self-center">Learn concepts:</span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/pe-ratio"><BookOpen className="h-3.5 w-3.5 mr-1.5" />P/E Ratio</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/dcf-modeling"><Calculator className="h-3.5 w-3.5 mr-1.5" />DCF Modeling</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/pricing-power"><Target className="h-3.5 w-3.5 mr-1.5" />Pricing Power</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/learn/cash-flow"><FileText className="h-3.5 w-3.5 mr-1.5" />Cash Flow</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write components/stock/ratio-grid.tsx**

```tsx
// components/stock/ratio-grid.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/ui/card";
import { GlossaryTooltip } from "@/ui/glossary-tooltip";
import { formatRatio, formatPercent, formatSignedPercent } from "@/lib/utils/formatters";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";

interface RatioGridProps {
  stock: {
    peRatio: number | null;
    pbRatio: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    dividendYield: number | null;
  };
}

const RATIOS = [
  { key: "peRatio", label: "P/E Ratio", format: (v: number) => `${v.toFixed(1)}x`, tooltip: "pe" },
  { key: "pbRatio", label: "P/B Ratio", format: (v: number) => `${v.toFixed(1)}x`, tooltip: "pb" },
  { key: "roe", label: "ROE", format: (v: number) => `${formatPercent(v)}`, tooltip: "roe" },
  { key: "roce", label: "ROCE", format: (v: number) => `${formatPercent(v)}`, tooltip: "roce" },
  { key: "debtToEquity", label: "Debt/Equity", format: (v: number) => `${v.toFixed(2)}x`, tooltip: "de" },
  { key: "operatingMargin", label: "Op. Margin", format: (v: number) => `${formatPercent(v)}`, tooltip: "om" },
  { key: "netMargin", label: "Net Margin", format: (v: number) => `${formatPercent(v)}`, tooltip: "nm" },
  { key: "dividendYield", label: "Div. Yield", format: (v: number) => `${formatPercent(v)}`, tooltip: "dy" },
] as const;

function RatioCard({ label, value, tooltip, trend }: { label: string; value: string; tooltip: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <GlossaryTooltip term={tooltip}>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
          </GlossaryTooltip>
        </div>
        {trend && (
          <span className={cn("h-3.5 w-3.5", trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground")}>
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
            {trend === "neutral" && <Minus className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}

export function RatioGrid({ stock }: RatioGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {RATIOS.map(({ key, label, format, tooltip }) => {
        const value = stock[key as keyof typeof stock];
        const displayValue = value != null ? format(value as number) : "N/A";
        const trend = value != null ? (
          key === "peRatio" || key === "pbRatio" || key === "debtToEquity" ? (value < 20 ? "up" : value > 40 ? "down" : "neutral") :
          key === "roe" || key === "roce" || key === "operatingMargin" || key === "netMargin" ? (value > 15 ? "up" : value < 8 ? "down" : "neutral") :
          "neutral"
        ) : "neutral";

        return (
          <RatioCard
            key={key}
            label={label}
            value={displayValue}
            tooltip={tooltip}
            trend={trend as "up" | "down" | "neutral"}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Write remaining stock tab components (financials, valuation, DCF, risks, news, learn chips)**

```tsx
// components/stock/financials-tab.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, formatCrore, formatPercent } from "@/lib/utils/formatters";

interface FinancialsTabProps {
  stock: { financials: Record<string, unknown> };
}

const FINANCIAL_STATEMENTS = [
  { id: "income", label: "Income Statement", rows: [
    { label: "Revenue", key: "revenue", type: "currency" },
    { label: "EBITDA", key: "ebitda", type: "currency" },
    { label: "EBIT", key: "ebit", type: "currency" },
    { label: "Net Profit", key: "pat", type: "currency" },
    { label: "EPS (₹)", key: "eps", type: "number" },
    { label: "DPS (₹)", key: "dps", type: "number" },
  ]},
  { id: "balance", label: "Balance Sheet", rows: [
    { label: "Net Worth", key: "netWorth", type: "currency" },
    { label: "Total Debt", key: "totalDebt", type: "currency" },
    { label: "Shares Outstanding (Cr)", key: "shares", type: "number" },
  ]},
  { id: "cashflow", label: "Cash Flow", rows: [
    { label: "Operating CF", key: "operatingCF", type: "currency" },
    { label: "Investing CF", key: "investingCF", type: "currency" },
    { label: "Financing CF", key: "financingCF", type: "currency" },
    { label: "Free CF", key: "freeCF", type: "currency" },
  ]},
];

function FinancialTable({ statement, data }: { statement: typeof FINANCIAL_STATEMENTS[0]; data: Record<string, unknown> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 w-48">Metric</th>
            <th className="pb-2 text-right">FY2026</th>
            <th className="pb-2 text-right">FY2025</th>
            <th className="pb-2 text-right">FY2024</th>
            <th className="pb-2 text-right">FY2023</th>
            <th className="pb-2 text-right">FY2022</th>
          </tr>
        </thead>
        <tbody>
          {statement.rows.map((row, i) => (
            <motion.tr key={row.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <td className="py-2 font-medium">{row.label}</td>
              {["FY2026", "FY2025", "FY2024", "FY2023", "FY2022"].map((fy, j) => (
                <td key={fy} className="py-2 text-right font-mono tabular-nums">
                  {data[`${row.key}_${fy}`] != null 
                    ? row.type === "currency" 
                      ? `₹${formatCrore(data[`${row.key}_${fy}`] as number)} Cr`
                      : row.type === "number"
                      ? (data[`${row.key}_${fy}`] as number).toLocaleString()
                      : String(data[`${row.key}_${fy}`])
                    : "—"}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinancialsTab({ stock }: FinancialsTabProps) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {FINANCIAL_STATEMENTS.map(s => (
            <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>
          ))}
        </TabsList>

        {FINANCIAL_STATEMENTS.map(statement => (
          <TabsContent key={statement.id} value={statement.id} className="pt-6">
            <Card>
              <CardContent className="pt-0">
                <FinancialTable statement={statement} data={stock.financials as Record<string, unknown>} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

```tsx
// components/stock/valuation-tab.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { DCFBuilder } from "./dcf-builder";
import { RatioGrid } from "./ratio-grid";
import { Calculator, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatRatio, formatPercent } from "@/lib/utils/formatters";

interface ValuationTabProps {
  stock: {
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    roe: number | null;
    roce: number | null;
    debtToEquity: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
  };
}

const VALUATION_TABS = [
  { id: "multiples", label: "Multiples", icon: Calculator },
  { id: "dcf", label: "DCF Model", icon: BarChart3 },
  { id: "history", label: "Historical", icon: TrendingUp },
] as const;

export function ValuationTab({ stock }: ValuationTabProps) {
  return (
    <div className="space-y-6">
      {/* Current Multiples Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Current Valuation Multiples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RatioGrid stock={stock} />
        </CardContent>
      </Card>

      {/* Tabs for detailed analysis */}
      <Tabs defaultValue="multiples" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {VALUATION_TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              <t.icon className="h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="multiples" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Peer Comparison</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Peer comparison requires sector data. Coming soon.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Historical Range</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Historical P/E percentile chart. Coming soon.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dcf" className="pt-6">
          <DCFBuilder ticker={stock.ticker} />
        </TabsContent>

        <TabsContent value="history" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Valuation History</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Historical valuation chart. Coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

```tsx
// components/stock/dcf-builder.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Slider } from "@/ui/slider";
import { Calculator, Download, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice, formatPercent, formatRatio, formatCrore } from "@/lib/utils/formatters";

interface DCFBuilderProps {
  ticker: string;
}

const DEFAULT_ASSUMPTIONS = {
  revenueGrowth: 0.12,
  operatingMargin: 0.22,
  taxRate: 0.25,
  wacc: 0.11,
  terminalGrowth: 0.04,
  projectionYears: 5,
};

export function DCFBuilder({ ticker }: DCFBuilderProps) {
  const [assumptions, setAssumptions] = React.useState(DEFAULT_ASSUMPTIONS);
  const [dcfResult, setDcfResult] = React.useState<{
    intrinsicValue: number;
    currentPrice: number;
    upside: number;
    sensitivity: Array<{ wacc: number; growth: number; value: number }>;
  } | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // In real implementation, call the API
      // For now, simulate calculation
      await new Promise(r => setTimeout(r, 1000));
      
      const { revenueGrowth, operatingMargin, taxRate, wacc, terminalGrowth, projectionYears } = assumptions;
      const baseRevenue = 100000; // Would fetch actual
      const baseEBIT = baseRevenue * operatingMargin;
      const baseNOPAT = baseEBIT * (1 - taxRate);
      
      let pvSum = 0;
      for (let year = 1; year <= projectionYears; year++) {
        const revenue = baseRevenue * Math.pow(1 + revenueGrowth, year);
        const ebit = revenue * operatingMargin;
        const nopat = ebit * (1 - taxRate);
        const pv = nopat / Math.pow(1 + wacc, year);
        pvSum += pv;
      }
      
      const terminalValue = (baseNOPAT * Math.pow(1 + revenueGrowth, projectionYears) * (1 + terminalGrowth)) / (wacc - terminalGrowth);
      const terminalPV = terminalValue / Math.pow(1 + wacc, projectionYears);
      
      const enterpriseValue = pvSum + terminalPV;
      const equityValue = enterpriseValue - 10000; // net debt
      const shares = 100; // Would fetch actual
      const intrinsicValue = equityValue / shares;
      const currentPrice = 100; // Would fetch actual
      const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;

      // Sensitivity table
      const sensitivity = [];
      for (const w of [wacc - 0.01, wacc, wacc + 0.01]) {
        for (const g of [terminalGrowth - 0.01, terminalGrowth, terminalGrowth + 0.01]) {
          if (w <= g) continue;
          const tv = (baseNOPAT * Math.pow(1 + revenueGrowth, projectionYears) * (1 + g)) / (w - g);
          const tpv = tv / Math.pow(1 + w, projectionYears);
          const ev = pvSum * (wacc / w) + tpv; // Approximate
          const eq = ev - 10000;
          sensitivity.push({ wacc: w, growth: g, value: eq / shares });
        }
      }

      setDcfResult({
        intrinsicValue,
        currentPrice,
        upside,
        sensitivity,
      });
    } catch (error) {
      console.error("DCF calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          DCF Valuation Model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assumptions Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Assumptions
            </h4>
            
            <AssumptionSlider
              label="Revenue Growth (YoY)"
              value={assumptions.revenueGrowth}
              onChange={v => setAssumptions(prev => ({ ...prev, revenueGrowth: v }))}
              min={0.02} max={0.30} step={0.01}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Operating Margin"
              value={assumptions.operatingMargin}
              onChange={v => setAssumptions(prev => ({ ...prev, operatingMargin: v }))}
              min={0.05} max={0.40} step={0.01}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="WACC (Discount Rate)"
              value={assumptions.wacc}
              onChange={v => setAssumptions(prev => ({ ...prev, wacc: v }))}
              min={0.07} max={0.18} step={0.005}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Terminal Growth"
              value={assumptions.terminalGrowth}
              onChange={v => setAssumptions(prev => ({ ...prev, terminalGrowth: v }))}
              min={0.02} max={0.06} step={0.005}
              format={v => formatPercent(v * 100)}
            />
            <AssumptionSlider
              label="Projection Years"
              value={assumptions.projectionYears}
              onChange={v => setAssumptions(prev => ({ ...prev, projectionYears: v }))}
              min={3} max={10} step={1}
              format={v => `${v}y`}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" /> Results
            </h4>
            
            <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
              {isCalculating ? "Calculating..." : "Calculate DCF"}
            </Button>

            {dcfResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Intrinsic Value</p>
                    <p className="font-mono text-2xl font-bold text-primary">₹{formatPrice(dcfResult.intrinsicValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="font-mono text-2xl font-bold">₹{formatPrice(dcfResult.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upside/Downside</p>
                    <p className={cn("font-mono text-2xl font-bold", dcfResult.upside >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {dcfResult.upside >= 0 ? "+" : ""}{formatPercent(dcfResult.upside)}
                    </p>
                  </div>
                </div>

                {/* Sensitivity Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2">WACC \ Growth</th>
                        {[-0.01, 0, 0.01].map(g => (
                          <th key={g} className="pb-2 text-center">{formatPercent((assumptions.terminalGrowth + g) * 100)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[-0.01, 0, 0.01].map(w => (
                        <tr key={w}>
                          <td className="py-2 font-medium font-mono">{formatPercent((assumptions.wacc + w) * 100)}</td>
                          {[-0.01, 0, 0.01].map(g => (
                            <td key={g} className="py-2 text-center font-mono">
                              {dcfResult.sensitivity.find(s => Math.abs(s.wacc - (assumptions.wacc + w)) < 0.001 && Math.abs(s.growth - (assumptions.terminalGrowth + g)) < 0.001)?.value 
                                ? `₹${formatPrice(dcfResult.sensitivity.find(s => Math.abs(s.wacc - (assumptions.wacc + w)) < 0.001 && Math.abs(s.growth - (assumptions.terminalGrowth + g)) < 0.001)!.value)}`
                                : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssumptionSlider({ label, value, onChange, min, max, step, format }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}
```

```tsx
// components/stock/risk-flags.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { AlertTriangle, AlertCircle, Info, Shield, TrendingDown, DollarSign } from "lucide-react";

interface RiskFlagsProps {
  stock: {
    watchouts: string[];
    peRatio: number | null;
    debtToEquity: number | null;
    netMargin: number | null;
    roe: number | null;
  };
}

const RISK_CATEGORIES = [
  { key: "valuation", label: "Valuation Risk", icon: DollarSign, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", severity: "medium" },
  { key: "leverage", label: "Leverage Risk", icon: Shield, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", severity: "high" },
  { key: "profitability", label: "Profitability Risk", icon: TrendingDown, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", severity: "high" },
  { key: "market", label: "Market Risk", icon: AlertCircle, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", severity: "medium" },
  { key: "concentration", label: "Concentration Risk", icon: AlertTriangle, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", severity: "medium" },
];

function getRiskFlags(stock: RiskFlagsProps["stock"]) {
  const flags: Array<{ category: typeof RISK_CATEGORIES[0]; message: string }> = [];

  if (stock.peRatio != null && stock.peRatio > 50) {
    flags.push({ category: RISK_CATEGORIES[0], message: `High P/E (${stock.peRatio.toFixed(1)}x) — minimal margin of safety` });
  } else if (stock.peRatio != null && stock.peRatio > 35) {
    flags.push({ category: RISK_CATEGORIES[0], message: `Elevated P/E (${stock.peRatio.toFixed(1)}x) — requires strong execution` });
  }

  if (stock.debtToEquity != null && stock.debtToEquity > 1.5) {
    flags.push({ category: RISK_CATEGORIES[1], message: `High D/E (${stock.debtToEquity.toFixed(2)}x) — sensitive to rate hikes` });
  }

  if (stock.netMargin != null && stock.netMargin > 0 && stock.netMargin < 5) {
    flags.push({ category: RISK_CATEGORIES[2], message: `Thin margins (${stock.netMargin.toFixed(1)}%) — vulnerable to cost shocks` });
  } else if (stock.netMargin != null && stock.netMargin <= 0) {
    flags.push({ category: RISK_CATEGORIES[2], message: `Negative margins — turnaround required` });
  }

  if (stock.roe != null && stock.roe < 8) {
    flags.push({ category: RISK_CATEGORIES[2], message: `Low ROE (${stock.roe.toFixed(1)}%) — poor capital efficiency` });
  }

  // Default market risk
  flags.push({ category: RISK_CATEGORIES[3], message: "Exposed to macro cycles, inflation, rate volatility" });
  flags.push({ category: RISK_CATEGORIES[4], message: "Sector concentration risk — diversify across sectors" });

  return flags;
}

export function RiskFlags({ stock }: RiskFlagsProps) {
  const flags = getRiskFlags(stock);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Risk Flags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.map((flag, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border",
              flag.category.severity === "high" ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"
            )}
          >
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", flag.category.color)}>
              <flag.category.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{flag.category.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{flag.message}</p>
            </div>
            <Badge variant={flag.category.severity === "high" ? "destructive" : "warning"} size="sm">
              {flag.category.severity.toUpperCase()}
            </Badge>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
```

```tsx
// components/stock/news-feed.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { ExternalLink, Newspaper, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

interface NewsFeedProps {
  stock: { ticker: string; name: string };
}

const MOCK_NEWS = [
  { id: "1", headline: "Company reports Q3 results", summary: "Revenue grew 15% YoY driven by strong domestic demand. Margins expanded 200bps.", publishedAt: "2026-11-05T10:30:00Z", source: "Exchange Filing", kind: "fact" as const },
  { id: "2", headline: "Analyst upgrades rating", summary: "Brokerage raises target citing market share gains in quick commerce. Maintains Buy.", publishedAt: "2026-11-03T14:15:00Z", source: "Brokerage Report", kind: "commentary" as const },
  { id: "3", headline: "New facility inauguration", summary: "Opened 50th dark store in Bangalore. Total network now covers 120 cities.", publishedAt: "2026-10-28T09:00:00Z", source: "Company Press Release", kind: "announcement" as const },
];

function NewsCard({ item }: { item: typeof MOCK_NEWS[0] }) {
  const kindStyles = {
    fact: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    commentary: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    announcement: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={kindStyles[item.kind]} size="sm">
              {item.kind.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(item.publishedAt.split("T")[0])}</span>
            <span className="text-xs text-muted-foreground">{item.source}</span>
          </div>
          <h4 className="font-medium line-clamp-1">{item.headline}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
        </div>
        <a href="#" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Read full article">
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
    </motion.article>
  );
}

export function NewsFeed({ stock }: NewsFeedProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5" /> Latest News
        </h3>
        <span className="text-sm text-muted-foreground">Showing latest 3 items</span>
      </div>
      <div className="space-y-3">
        {MOCK_NEWS.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
      <div className="text-center pt-4">
        <span className="text-sm text-muted-foreground">More news loading... (Yahoo Finance integration pending)</span>
      </div>
    </div>
  );
}
```

```tsx
// components/stock/learn-chips.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { MasteryRing } from "@/ui/mastery-ring";
import { Button } from "@/ui/button";
import Link from "next/link";
import { BookOpen, Target, TrendingUp, CheckCircle } from "lucide-react";
import { useProgress } from "@/state/use-progress";

const STOCK_CONCEPTS = [
  { id: "pe-ratio", label: "P/E Ratio", track: "Analyze Any Stock" },
  { id: "dcf-modeling", label: "DCF Modeling", track: "Analyze Any Stock" },
  { id: "dividend-safety", label: "Dividend Safety", track: "Build Dividend Portfolio" },
  { id: "cash-flow", label: "Cash Flow Analysis", track: "Read Financial Statements" },
  { id: "pricing-power", label: "Pricing Power", track: "Understand Moats" },
  { id: "roe", label: "ROE & DuPont", track: "Analyze Any Stock" },
] as const;

export function LearnChips({ stock }: { stock: { ticker: string; name: string } }) {
  const { mastery } = useProgress();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Learn with {stock.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Practice these concepts using {stock.name}'s real financial data
        </p>
        <div className="flex flex-wrap gap-3">
          {STOCK_CONCEPTS.map((concept, i) => {
            const nodeMastery = mastery[concept.id] || { level: 0, progress: 0 };
            return (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl glass dark:glass-dark border border-border/50 group"
              >
                <MasteryRing progress={nodeMastery.progress * 20} size={36} strokeWidth={3} showLabel={false} level={nodeMastery.level} />
                <div className="flex-1 min-w-0">
                  <Link href={`/learn/${concept.id}`} className="font-medium hover:text-primary transition-colors">
                    {concept.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">{concept.track}</p>
                </div>
                <div className="flex items-center gap-2">
                  {nodeMastery.level >= 5 && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/learn/${concept.id}`}>Practice</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

```tsx
// components/stock/price-chart.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { ChartWrapper } from "@/ui/chart-wrapper";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatPrice } from "@/lib/utils/formatters";

interface PriceChartProps {
  data: { date: string; close: number }[];
  ticker: string;
  currency: string;
  indexData?: { date: string; close: number }[];
}

export function PriceChart({ data, ticker, currency, indexData }: PriceChartProps) {
  const currencySymbol = currency === "INR" ? "₹" : "$";

  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    price: d.close,
    ...(indexData?.find(i => i.date === d.date) ? { index: i.close } : {}),
  }));

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Price Chart (5Y)</span>
          <span className="text-sm text-muted-foreground">{currencySymbol}{formatPrice(data[data.length - 1]?.close || 0)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartWrapper height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${formatPrice(v)}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }}
                labelFormatter={d => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                formatter={(v: number) => [`${currencySymbol}${formatPrice(v)}`, "Price"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name={`${ticker} Price`}
              />
              {indexData && (
                <Line
                  type="monotone"
                  dataKey="index"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Nifty 50 (Normalized)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Write app/stock/[ticker]/page.tsx**

```tsx
// app/stock/[ticker]/page.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { StockHeader } from "@/components/stock/stock-header";
import { StockTabs } from "@/components/stock/stock-tabs";
import { PriceChart } from "@/components/stock/price-chart";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useStock, useStockHistory } from "@/hooks/use-stock";
import { Skeleton } from "@/ui/skeleton";

export default function StockPage() {
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase();
  const symbol = ticker?.includes(".") ? ticker : `${ticker}.NS`;

  const { data: stock, isLoading, error } = useStock(symbol, { enabled: !!ticker });
  const { data: priceHistory } = useStockHistory(symbol, "5y", "1d", { enabled: !!ticker });

  if (isLoading) return <StockSkeleton />;
  if (error || !stock) return notFound();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-1">
      <div className="flex-1 lg:pr-8 pb-8 lg:pb-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6 space-y-8">
          <StockHeader stock={stock} />
          <PriceChart data={priceHistory?.daily || []} ticker={stock.ticker} currency={stock.currency} />
          <StockTabs stock={stock} />
        </div>
      </div>
      <aside className="hidden lg:block w-96 border-l glass dark:glass-dark">
        <ChatPanel defaultMode="tutor" context={{ stock: stock.ticker, page: "stock" }} />
      </aside>
    </motion.div>
  );
}

function StockSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6 space-y-8">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```

- [ ] **Step 7: Run typecheck and build**

```bash
npm run typecheck && npm run build
```

Expected: Clean compilation.

- [ ] **Step 8: Commit**

```bash
git add app/stock components/stock
git commit -m "feat(stock): add stock deep dive page with header, tabs (overview, financials, valuation, DCF, risks, news, learn), price chart"
```

---

This completes the core Phase 1 implementation plan. The plan continues with Tasks 16-50 covering:

- Task 16: Research page (`/research`) with dual-mode AI chat
- Task 17: Learn page (`/learn`) with skill tree canvas
- Task 18: Lesson player (`/learn/[concept]`)
- Task 19: Practice arena (`/practice`)
- Task 20: Profile page (`/profile`) with progress dashboard
- Tasks 21-30: Phase 2 Learning Platform (skill tree D3, tracks, lessons, practice, progress)
- Tasks 31-40: Phase 3 Analyst Workspace (tools, RAG, reports, advanced charts)
- Tasks 41-50: Polish (motion, accessibility, performance, error boundaries)

---

**Plan complete and saved to `docs/superpowers/plans/2026-11-10-bull-v2-learning-platform.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** Use `superpowers-subagent-driven-development`

2. **Inline Execution** - Execute tasks in this session using `executing-plans`, batch execution with checkpoints for review. **REQUIRED SUB-SKILL:** Use `superpowers-executing-plans`

**Which approach?** (I'll proceed with Subagent-Driven as recommended)