# Bull v2 — Learning Platform Design Spec

**Product**: Bull — Adaptive Financial Learning Platform for Indian Investors
**Version**: v2 (Complete redesign from v0 course deliverable)
**Spec Date**: 10 November 2026
**Status**: Approved for implementation planning
**Target**: World-class learning application — Coursera clarity + Brilliant interactivity + Awwwards polish

---

## 1. Vision & Learning Philosophy

### 1.1 Core Vision
Transform Bull from a "stock discovery tool with Academy" into a **living financial learning platform** where:
- Every stock interaction is a learning opportunity
- AI tutor adapts to the learner's level, goals, and context
- Unlimited live stock coverage (2000+ Indian equities) with real-time data
- Learning is visual, interactive, and grounded in real companies the user cares about

### 1.2 Learning Philosophy: Hybrid Guided Paths + AI Tutor
- **Structured mastery paths** (Brilliant-style): Visual skill tree with prerequisites, mastery levels, XP progression
- **Goal-based entry points** (Coursera-style): "Analyze Any Stock", "Build Dividend Portfolio", "Read Financial Statements", "Understand Moats"
- **Always-available AI tutor**: Conversational, Socratic, context-aware, multilingual (English + Hinglish)
- **Applied practice**: Every concept practiced on real stocks the user has viewed
- **No gamification of trading**: XP only for demonstrated understanding (lessons, checks, missions, quiz)

### 1.3 Design Principles
| Principle | Application |
|-----------|-------------|
| **Clarity over cleverness** | Coursera-style content hierarchy, generous whitespace, clear visual hierarchy |
| **Delight in details** | Brilliant-style micro-interactions, progressive disclosure, animated mastery rings |
| **Polish without distraction** | Awwwards-level motion choreography that serves understanding, not spectacle |
| **Dark mode first** | Zinc-950 canvas, emerald/amber accents, glass-morphism surfaces |
| **Accessibility as default** | 4.5:1 contrast, keyboard navigation, ARIA live regions, prefers-reduced-motion |
| **Free-tier realistic** | Yahoo Finance APIs, Gemini Flash/Groq free tiers, intelligent caching |

---

## 2. Information Architecture & Routes

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/` | **Adaptive Home Dashboard** | New user: goal selector → track. Returning: skill tree progress + continue learning + AI chat sidebar. Universal Cmd+K. |
| `/learn` | **Interactive Skill Tree** | Force-directed/grid visualization, mastery rings (Novice→Expert), goal-based tracks, concept search/filter |
| `/learn/[concept]` | **Interactive Lesson** | 5 steps: Concept → Your Stock → Guided Practice → Applied Mission → Mastery Check |
| `/research` | **AI Analyst Workspace** | Dual-mode chat (Tutor ↔ Analyst), persistent sidebar + full page, tool invocations visible, citations |
| `/stock/[ticker]` | **Live Stock Deep Dive** | Real-time quote, 6 tabs (Overview, Financials, Valuation, Risks, News, Learn), DCF builder, learn chips |
| `/practice` | **Practice Arena** | Scenario cards (Find red flag, Compare, DCF, Screen), adaptive difficulty, streak bonuses |
| `/profile` | **Learning Progress** | Skill tree heatmap, XP timeline, streak calendar, badges, saved analyses |

**Universal Navigation**: Cmd+K command palette (Search Stocks, Go to Page, Ask AI, Learn Concept) accessible everywhere.

---

## 3. Design System & Visual Language

### 3.1 Color System
```css
/* Light Mode */
--canvas: #FAFAF8;           /* Warm white */
--surface: #FFFFFF;
--border: #E6E6E2;           /* Zinc-200 */
--primary: #059669;          /* Emerald-600 */
--accent: #F59E0B;           /* Amber-500 */

/* Dark Mode (Default) */
--canvas: #09090B;           /* Zinc-950 */
--surface: #18181B;          /* Zinc-900 */
--border: #27272A;           /* Zinc-800 */
--primary: #10B981;          /* Emerald-500 */
--accent: #FBBF24;           /* Amber-400 */

/* Semantic */
--positive: #10B981;         /* Emerald-500 */
--negative: #F43F5E;         /* Rose-500 */
--attention: #FBBF24;        /* Amber-400 */
--info: #3B82F6;             /* Blue-500 */
```

### 3.2 Typography
| Role | Font | Usage |
|------|------|-------|
| Display | Space Grotesk (variable) | Headlines, numbers, tickers, hero text |
| UI | DM Sans (variable) | Body, labels, buttons, UI text |
| Mono | JetBrains Mono | Financial data, formulas, code, tables |

**Fluid Scale**: `clamp(1rem, 2vw, 1.5rem)` for responsive harmony.

### 3.3 Spacing & Layout
- **Base unit**: 4px (8pt grid)
- **Containers**: 1200px (learn), 1400px (research), 900px (content)
- **Sidebar**: 280px expanded → 72px collapsed (icon-only)

### 3.4 Component Library (shadcn/ui + Custom)
- **Cards**: Subtle border, hover lift (translateY(-2px)), glass-morphism in dark mode
- **Buttons**: 3 sizes (sm, md, lg), 4 variants (primary, secondary, ghost, destructive)
- **Inputs**: Floating labels, inline validation, Cmd+K command palette
- **Charts**: Recharts (standard) + D3.js (skill tree, waterfall, sankey, treemaps)
- **Tooltips**: Rich content support (charts, citations, mini-stock cards)

### 3.5 Motion Choreography (Framer Motion)
| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Page transitions | 300ms | `easeOut` | Shared layout + fade |
| Micro-interactions (hover, tap, focus) | 150ms | `spring` | Stiffness 300, damping 30 |
| Skill tree node entrance | 400ms stagger | `easeOut` | Delay 50ms per node |
| Edge drawing | 600ms | `easeInOut` | Stroke-dashoffset animation |
| Mastery ring fill | 800ms | `spring` | From current → target % |
| Chart progressive reveal | 500ms | `easeOut` | IntersectionObserver triggered |
| Chat message slide-up | 200ms | `easeOut` | Staggered for history load |
| Command palette | 200ms | `spring` | Scale(0.95→1) + fade |

**Respects**: `prefers-reduced-motion` — disables all non-essential animation.

---

## 4. AI Chatbot Architecture: Tutor + Analyst Hybrid

### 4.1 Dual-Mode Interface (`/research` + persistent sidebar)
```
┌─────────────────────────────────────────────────────┐
│  Tutor ● Analyst                    [Context: RELIANCE] │
├─────────────────────────────────────────────────────┤
│  💬 Messages...                                     │
│  🔧 Tool: search_stocks("high ROE low debt")  ✓     │
│  📊 Tool: compare_stocks(["TCS", "INFY"])      ✓     │
│  💡 Suggested: "Show DCF for TCS" | "Explain ROE"    │
├─────────────────────────────────────────────────────┤
│  [Message input...]                    [Send]       │
└─────────────────────────────────────────────────────┘
```

### 4.2 Tutor Mode (Learning Companion)
| Capability | Description |
|------------|-------------|
| **Concept Explanation** | Plain English + analogies (kirana store, apartment complex) |
| **Adaptive Difficulty** | Detects knowledge level from mastery state + chat history |
| **Socratic Questioning** | Guides discovery: "What would happen if margins dropped 2%?" |
| **Practice Generation** | Creates problems from stocks user viewed: "Calculate P/E for Zomato" |
| **Gap Detection** | Tracks weak concepts → suggests next lesson |
| **Multilingual** | English + Hinglish (romanized Hindi), auto-detect or toggle |
| **Memory** | Remembers mastery per concept, preferred analogies, weak areas |

### 4.3 Analyst Mode (Research Agent)
**Function Calling Tools** (via Vercel AI SDK):
| Tool | Purpose |
|------|---------|
| `search_stocks(query)` | Live search with fundamentals preview |
| `get_fundamentals(ticker)` | Financial statements, ratios, valuation, profile |
| `get_price_history(ticker, period)` | Charts, returns, volatility, drawdown |
| `screen_stocks(criteria)` | Filter by P/E, ROE, debt, growth, sector, market cap |
| `compare_stocks(tickers[])` | Side-by-side computed metrics table |
| `build_dcf(ticker, assumptions)` | DCF model with sensitivity table |
| `analyze_sector(sector)` | Sector overview, leaders, trends, key metrics |
| `generate_report(analysis)` | Structured markdown report with citations |

**Workflow**: User states goal → AI plans steps → confirms → executes → presents results with citations.

### 4.4 Shared Intelligence Layer
- **RAG System**: Vector index (local, IndexedDB) of financial concepts, formulas, examples, analogies
- **User Model**: Profile (goals, risk, experience) + mastery state + chat history + viewed stocks
- **Context Injection**: Current stock, page, learning goal, selected text auto-injected
- **Safety**: No buy/sell/hold language, no price targets, educational disclaimer on every stock answer

### 4.5 Free-Tier LLM Strategy
| Priority | Provider | Model | Free Tier |
|----------|----------|-------|-----------|
| Primary | Google AI | Gemini 1.5 Flash | 1,500 req/day |
| Fallback 1 | Groq | Llama 3.1 70B | 14,400 req/day |
| Fallback 2 | OpenRouter | Various free models | Varies |
| Local Fallback | — | Template-only | Unlimited |

**Optimization**: Structured prompts, few-shot examples, JSON mode for tools, conversation summarization for context window management.

---

## 5. Live Stock Search & Data Architecture (Free Tier Only)

### 5.1 Universal Search (Cmd+K)
- **Trigger**: ≥2 characters, 250ms debounce
- **Sources** (priority order):
  1. **Yahoo Finance Search API** — `query1.finance.yahoo.com/v1/finance/search` — global, free
  2. **Local Alias Map** — NSE/BSE symbols, common names — instant, offline
  3. **Screener.in Company List** (cached) — Indian coverage
- **Results**: Symbol, name, exchange, type, last price, currency
- **Navigation**: Arrow keys, Enter to dissect, Esc to dismiss

### 5.2 Stock Data Pipeline
```
User Request
     │
     ▼
┌─────────────────────────────────────┐
│  TanStack Query Cache Check         │
│  (stale-while-revalidate)           │
└─────────────────────────────────────┘
     │
     ├─► Quote (30s stale) ──► Yahoo v8/finance/chart
     ├─► Fundamentals (1hr stale) ──► Yahoo v10/finance/quoteSummary
     │       Modules: price, summaryDetail, financialData,
     │                defaultKeyStatistics, assetProfile
     └─► Price Series (5min/1hr stale) ──► Yahoo chart API
             Monthly 5y + Daily 1y + Intraday 1d
     │
     ▼
┌─────────────────────────────────────┐
│  Transform & Enrich                 │
│  • Compute ratios (P/E, P/B, ROE,   │
│    ROCE, margins, D/E, interest cov)│
│  • Generate strengths/watchouts     │
│    (heuristic, Web Worker)          │
│  • Normalize for charts             │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  IndexedDB Persistence              │
│  (offline-first, background sync)   │
└─────────────────────────────────────┘
```

### 5.3 Rate Limiting & Resilience
- **Timeout**: 4s per request
- **Retry**: Exponential backoff (1s, 2s, 4s), max 3 attempts
- **Circuit Breaker**: 5 failures → 60s cooldown
- **Fallback Chain**: Yahoo → Screener.in (cached) → Local snapshot (v0 data)

### 5.4 Data Models
```typescript
interface LiveStockSnapshot {
  ticker: string;
  name: string;
  price: number;
  currency: 'INR' | 'USD';
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  sector: string;
  industry: string;
  summary: string;
  strengths: string[];      // heuristic, max 2
  watchouts: string[];      // heuristic, max 2
  asOf: string;             // ISO 8601
  source: 'yahoo' | 'screener' | 'snapshot';
}

interface PriceSeries {
  monthly: PricePoint[];    // 60 points, 5 years
  daily: PricePoint[];      // 252 points, 1 year
  intraday: PricePoint[];   // 390 points, 1 day (1min)
}
```

### 5.5 Coverage
- **Primary**: All NSE/BSE equities (~2,000+) via Yahoo Finance
- **Secondary**: Major global (US, UK, EU, Japan, HK) via Yahoo
- **Enhanced Indian**: Screener.in cached list for better search relevance

---

## 6. Learning Experience Design

### 6.1 Skill Tree Visualization (`/learn`)
**Implementation**: D3.js force-directed graph (WebGL fallback for 100+ nodes)

| Element | Specification |
|---------|---------------|
| **Nodes** | Concept circles (60px), icon + title, mastery ring (stroke-dasharray) |
| **States** | Locked (gray, lock icon) → Available (outline primary) → Learning (pulse) → Mastered (filled + ring %) |
| **Levels** | Novice (1) → Apprentice (2) → Competent (3) → Proficient (4) → Expert (5) |
| **Edges** | Curved paths, animated draw on load, hover highlights prerequisite chain |
| **Interactions** | Pan/zoom (wheel/trackpad), click → lesson, search, filter by track |
| **Onboarding** | Guided tour: "Click a node to learn", "Rings show mastery", "Lines show prerequisites" |

### 6.2 Goal-Based Entry Points (4 Tracks)
| Track | Concepts (unlock order) |
|-------|-------------------------|
| **Analyze Any Stock** | Valuation Basics → P/E & Multiples → DCF Modeling → Financial Statements → Ratio Analysis → Risk Assessment → Report Writing |
| **Build Dividend Portfolio** | Dividend Basics → Yield & Payout → Dividend Safety → Sector Diversification → Growth vs Yield → Rebalancing → Tax Efficiency |
| **Read Financial Statements** | Income Statement → Balance Sheet → Cash Flow → Notes & Accounting → Quality Checks → Red Flags → Forecasting |
| **Understand Moats** | Pricing Power → Switching Costs → Network Effects → Scale Advantages → Brand → Intangibles → Moat Erosion |

### 6.3 Interactive Lesson Structure (`/learn/[concept]`)
```
Step 1: CONCEPT (3-5 min)
├── Plain English explanation
├── Visual analogy (interactive illustration)
├── Formula (interactive: change variables, see result)
└── "Why this matters" — real-world context

Step 2: YOUR STOCK (2 min)
├── Auto-selects stock user viewed most recently
├── Shows real numbers for this concept
├── "Your Zomato has P/E of 68x — here's what that means"
└── Link to full stock page

Step 3: GUIDED PRACTICE (3-5 min)
├── Fill-in-blank calculation
├── Multiple choice with explanation
├── Slider simulation (e.g., "Move price to see P/E change")
└── Immediate feedback + hint system

Step 4: APPLIED MISSION (5-10 min)
├── "Calculate intrinsic value for [stock] using DCF"
├── "Compare [stock] peers on ROE and explain difference"
├── "Find 3 red flags in [stock]'s cash flow statement"
├── Submit → AI reviews → XP awarded

Step 5: MASTERY CHECK (2 min)
├── 3 questions, need 2/3 to level up
├── Adaptive: harder if user aced practice
└── Mastery ring animates to new level
```

### 6.4 XP & Mastery System (Extended from v0)
| Action | XP | Mastery Progress |
|--------|-----|------------------|
| Complete Lesson | 20 | +10% |
| Guided Practice | 10 | +5% |
| Applied Mission | 30 | +20% |
| Mastery Check (pass) | 50 | Level up |
| Daily Quiz (4/5) | 15 | +5% |
| Practice Scenario | 15 | +5% |
| Streak Bonus (7/30/100) | 50/100/200 | — |

**Levels**: 0→1 (100 XP), 1→2 (250), 2→3 (500), 3→4 (1000), 4→5 (2000)

### 6.5 Practice Arena (`/practice`)
- **Scenario Types**: "Find the Red Flag", "Compare Valuation", "Build a DCF", "Screen for Quality"
- **Adaptive Difficulty**: Matches user's lowest mastery concept in the scenario
- **Streak**: Daily practice → 7-day (50 XP), 30-day (100 XP), 100-day (200 XP)
- **Leaderboard**: None — only "You vs Yesterday"

### 6.6 Progress Dashboard (`/profile`)
| Visualization | Implementation |
|---------------|----------------|
| **Skill Tree Heatmap** | Grid of all concepts, color = mastery level |
| **XP Timeline** | Area chart with level-up milestone markers |
| **Streak Calendar** | GitHub-style contribution graph (IST) |
| **Badges** | 12 badges: earned (color), unearned (outline + criteria) |
| **Saved Analyses** | Cards linking to `/research` reports |

---

## 7. Key UI Components & Signature Interactions

### 7.1 Universal Command Palette (Cmd+K)
- **Tabs**: Search Stocks | Go to Page | Ask AI | Learn Concept
- **Stock Results**: Rich cards (ticker, name, price, change%, sector, "Dissect" action)
- **Page Results**: Icon, description, keyboard shortcut (e.g., "g h" → Home)
- **AI Tab**: Pre-filled context chips (Current: RELIANCE, Page: Stock Deep Dive)
- **Learn Tab**: Skill tree nodes with mastery preview rings
- **Motion**: 200ms spring entrance, staggered results (50ms delay)

### 7.2 Adaptive Home Dashboard (`/`)
```
NEW USER                          RETURNING USER
┌─────────────────────┐           ┌─────────┬──────────┬──────────┐
│                     │           │ Skill   │ Continue │  AI Chat │
│   What's your       │           │ Tree    │ Learning │ Sidebar  │
│   goal?             │           │ Progress│   ┌───┐  │  (Tutor) │
│                     │           │         │   │   │  │          │
│  ┌───┐ ┌───┐ ┌───┐  │           │  ┌─────┐ │   │   │  ┌─────┐  │
│  │📈 │ │💰 │ │📚 │  │           │  │Concept│ │   │   │  │Msg  │  │
│  │Grow │ │Div │ │Learn│  │           │  │Node │ │   │   │  │...  │  │
│  └───┘ └───┘ └───┘  │           │  └─────┘ │   │   │  └─────┘  │
│                     │           │          └───┘   │          │
└─────────────────────┘           └─────────┴──────────┴──────────┘
```

### 7.3 Stock Deep Dive (`/stock/[ticker]`)
**Header**: Hero with real-time price, animated 52w range pin, key stats (Market Cap, P/E, Yield, Sector)

**Tabs**:
| Tab | Content |
|-----|---------|
| **Overview** | Business model, strengths/watchouts, key ratios grid, learn chips |
| **Financials** | Interactive IS/BS/CF (expandable rows, YoY%, sparklines) |
| **Valuation** | DCF Builder (assumptions panel → sensitivity table), multiples vs peers/history |
| **Risks** | Flag cards (severity: high/medium/low), concentration, corporate actions |
| **News** | Dated items with Fact/Commentary/Announcement badges, source links |
| **Learn** | Concept badges → skill tree, mastery state, "Practice this on [stock]" |

### 7.4 Interactive Ratio Simulator (Embedded + Standalone)
- **Sliders**: Price, EPS, Debt/Equity, Net Margin — real-time computed outputs
- **Outputs**: P/E, Earnings Yield, Payback Years, Valuation Zone (color gauge)
- **Zones**: Deep Value (<15x) → Reasonable (15-30x) → Growth (30-50x) → Speculation (>50x)
- **Plain English**: Dynamic paragraph updates as sliders move
- **Presets**: "Value Stock", "Growth Stock", "Distressed", "Quality Compounders"

### 7.5 AI Chat Panel (Persistent Sidebar + Full Page)
- **Mode Pills**: Tutor | Analyst (segmented control, keyboard: `⌘1` / `⌘2`)
- **Context Chip**: "Current: RELIANCE" — click to clear, auto-sets on stock page
- **Message Blocks**: Text, stock cards (rich), charts (Recharts), tables, code blocks (DCF), reports
- **Tool Invocations**: Expandable steps with spinner → ✓ done → output preview
- **Citations**: Inline `[¹]` → hover tooltip (source, date, link)
- **Suggested Follow-ups**: Dynamic chips based on message context

---

## 8. Technical Architecture

### 8.1 Stack
| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 App Router + React 19 + TypeScript strict |
| **Styling** | Tailwind CSS 4 + shadcn/ui (accessible primitives) |
| **State (Global)** | Zustand (auth, profile, progress, chat, UI) |
| **State (Server)** | TanStack Query v5 (caching, deduping, persistence) |
| **Motion** | Framer Motion (layout, gesture, scroll, shared layout) |
| **Charts** | Recharts (standard) + D3.js v7 (skill tree, advanced) |
| **Data Persistence** | IndexedDB (via idb) + localStorage (profile) |
| **Heavy Computation** | Web Workers (heuristics, DCF, screening) |
| **AI** | Vercel AI SDK + existing `lib/llm/` providers (Gemini Flash, Groq, OpenRouter) |
| **RAG** | Local vector index (IndexedDB + Transformers.js) |
| **Testing** | Vitest (unit) + Playwright (e2e, P2) |
| **Quality** | ESLint 9 + Prettier + TypeScript strict + Husky pre-commit |

### 8.2 Architecture Layers
```
app/                          # Next.js routes (thin, compose only)
├── (auth)/                   # Route groups
├── (dashboard)/
├── learn/
├── research/
├── stock/[ticker]/
├── practice/
├── profile/
├── layout.tsx                # Providers, theme, navigation
├── globals.css               # Design tokens, Tailwind
└── page.tsx                  # Adaptive home

components/
├── ui/                       # shadcn primitives + custom
│   ├── button.tsx
│   ├── card.tsx
│   ├── command-palette.tsx
│   ├── chart-wrapper.tsx
│   ├── mastery-ring.tsx
│   └── ...
├── chat/
│   ├── chat-panel.tsx        # Sidebar + full page
│   ├── message-block.tsx     # Text, stock, chart, table, code
│   ├── tool-invocation.tsx
│   ├── composer.tsx
│   └── mode-toggle.tsx
├── learn/
│   ├── skill-tree-canvas.tsx # D3/WebGL
│   ├── skill-tree-node.tsx
│   ├── lesson-player.tsx     # 5-step lesson engine
│   ├── practice-arena.tsx
│   ├── progress-dashboard.tsx
│   └── mastery-ring.tsx
├── stock/
│   ├── stock-header.tsx      # Hero, 52w range, key stats
│   ├── stock-tabs.tsx
│   ├── financial-statements.tsx
│   ├── dcf-builder.tsx
│   ├── risk-flags.tsx
│   ├── news-feed.tsx
│   └── learn-chips.tsx
├── search/
│   ├── command-palette.tsx
│   ├── search-results.tsx
│   └── stock-search-result.tsx
└── layout/
    ├── sidebar.tsx           # Collapsible, responsive
    ├── header.tsx            # Cmd+K, theme, profile
    └── footer.tsx

lib/
├── engine/                   # Pure TS (port + extend from v0)
│   ├── curriculum.ts         # Concepts, tracks, unlocks
│   ├── xp.ts                 # XP sources, levels, badges
│   ├── mastery.ts            # Mastery transitions, checks
│   ├── scoring.ts            # Stock scoring (optional v2)
│   └── safety.ts             # Content safety (port from v0)
├── data/
│   ├── yahoo-client.ts       # Yahoo Finance API wrapper
│   ├── screener-client.ts    # Screener.in cached data
│   ├── transformers.ts       # Raw → LiveStockSnapshot
│   ├── heuristics.ts         # Strengths/watchouts (Web Worker)
│   ├── cache.ts              # TanStack Query config
│   └── indexed-db.ts         # Persistence layer
├── llm/
│   ├── providers.ts          # Gemini, Groq, OpenRouter
│   ├── tools.ts              # Function definitions (search, compare, DCF...)
│   ├── rag.ts                # Local vector index, retrieval
│   ├── verification.ts       # Output verification (port from v0)
│   └── prompts.ts            # System prompts, few-shots
├── state/
│   ├── use-auth.ts
│   ├── use-profile.ts
│   ├── use-progress.ts
│   ├── use-chat.ts
│   └── use-ui.ts
├── hooks/
│   ├── use-stock.ts          # TanStack Query wrapper
│   ├── use-search.ts
│   ├── use-skill-tree.ts
│   └── use-lesson.ts
└── utils/
    ├── formatters.ts         # Indian grouping, ratios, dates
    ├── validators.ts
    ├── constants.ts
    └── cn.ts

content/
├── copy.en.ts
├── copy.hi-en.ts
├── glossary.ts
├── lessons/                  # Lesson content (MDX or JSON)
│   ├── pe-ratio.json
│   ├── dcf-modeling.json
│   └── ...
├── tracks/                   # Track definitions
│   ├── analyze-stock.json
│   ├── dividend-portfolio.json
│   └── ...
└── practice/                 # Practice scenarios
    ├── find-red-flag.json
    └── ...
```

### 8.3 Data Flow (Stock Deep Dive Example)
```
User navigates to /stock/RELIANCE
         │
         ▼
app/stock/[ticker]/page.tsx
         │
         ├──► useStock("RELIANCE") ──► TanStack Query
         │       │
         │       ├──► Query Key: ["stock", "RELIANCE"]
         │       ├──► staleTime: 30s (quote), 1hr (fundamentals)
         │       └──► queryFn: yahooClient.getSnapshot("RELIANCE")
         │
         ├──► <StockHeader data={stock} />
         ├──► <StockTabs>
         │       ├──► <Overview> ──► strengths/watchouts, ratios grid, learn chips
         │       ├──► <Financials> ──► Interactive statements
         │       ├──► <Valuation> ──► DCF Builder (useDCF hook)
         │       ├──► <Risks> ──► Risk flags from heuristics
         │       ├──► <News> ──► News feed
         │       └──► <Learn> ──► Concept chips → skill tree links
         │
         └──► <ChatPanel context={stock} defaultMode="tutor" />
```

---

## 9. Phased Implementation Plan

### Phase 1: Foundation + Live Search + AI Chat (Weeks 1-2)
**Goal**: Shippable core — search any stock, chat with AI tutor, view stock overview

| Task | Deliverable |
|------|-------------|
| 1.1 | Design system setup: Tailwind 4 tokens, shadcn/ui, Space Grotesk/DM Sans/JetBrains Mono |
| 1.2 | Motion primitives: Framer Motion wrapper, page transitions, micro-interaction hooks |
| 1.3 | Universal Cmd+K Command Palette component (search, pages, AI, learn tabs) |
| 1.4 | Yahoo Finance client: search, quote, fundamentals, price series + TanStack Query config |
| 1.5 | Smart caching: 30s/1hr/5min stale times, IndexedDB persistence, fallback chain |
| 1.6 | Stock Deep Dive: Header, 52w range pin, Overview tab (ratios, strengths/watchouts) |
| 1.7 | AI Chat Panel: Sidebar + full page, Tutor mode, existing LLM providers |
| 1.8 | Adaptive Home Dashboard: New user goal selector, returning user 3-panel layout |
| 1.9 | Responsive layout: Sidebar (280→72px), mobile tabs, tablet/desktop breakpoints |
| 1.10 | Dark mode default, theme toggle, prefers-reduced-motion support |

**Shippable**: Search 2000+ stocks → view live overview → chat with AI tutor about any concept

### Phase 2: Learning Platform (Weeks 2-3)
**Goal**: Complete learning experience — skill tree, lessons, practice, progress

| Task | Deliverable |
|------|-------------|
| 2.1 | Skill Tree Canvas: D3 force-directed graph, node states, mastery rings, pan/zoom |
| 2.2 | Goal-Based Tracks: 4 tracks, unlock logic, prerequisite edges |
| 2.3 | Lesson Engine: 5-step player (Concept → Your Stock → Practice → Mission → Check) |
| 2.4 | Interactive Components: Formula explorer, slider sim, fill-in-blank, MCQ |
| 2.5 | Applied Missions: Real stock tasks, AI review, XP award |
| 2.6 | Mastery System: 5 levels, ring animation, XP thresholds, streak calendar |
| 2.7 | Practice Arena: 4 scenario types, adaptive difficulty, daily streak |
| 2.8 | Progress Dashboard: Heatmap, XP timeline, badges, saved analyses |
| 2.9 | AI Tutor Enhancements: Socratic mode, practice generation, gap detection |
| 2.10 | Content: 20+ lessons, 4 tracks, 12 practice scenarios, glossary |

**Shippable**: Complete learning paths from novice to expert with real stock practice

### Phase 3: Analyst Workspace + Polish (Weeks 3-4)
**Goal**: Professional research tools + Awwwards-level polish

| Task | Deliverable |
|------|-------------|
| 3.1 | Analyst Mode: Function calling tools (screen, compare, DCF, sector, report) |
| 3.2 | Stock Deep Dive: Financials tab (interactive statements), Valuation tab (DCF Builder) |
| 3.3 | DCF Builder: Assumptions panel → real-time valuation → sensitivity table → export |
| 3.4 | RAG System: Local vector index (Transformers.js), financial knowledge retrieval |
| 3.5 | Report Generation: Structured markdown, citations, export (PDF/MD/Notion) |
| 3.6 | Advanced Charts: Waterfall (DCF), Sankey (revenue breakdown), Treemap (portfolio) |
| 3.7 | Motion Polish: Staggered entrances, scroll-driven charts, shared layout transitions |
| 3.8 | Accessibility Audit: WCAG 2.1 AA, keyboard nav, ARIA, color contrast, screen readers |
| 3.9 | Performance: Code splitting, lazy loading, bundle analysis, Core Web Vitals |
| 3.10 | Error Boundaries: Graceful degradation, offline indicator, retry UX |

**Shippable**: Professional analyst workspace indistinguishable from paid tools

---

## 10. Migration Strategy from v0

| Asset | Migration Approach |
|-------|-------------------|
| **Engine Logic** (`lib/engine/*`) | Port pure TS modules (curriculum, XP, mastery, safety, scoring) — zero React deps |
| **Data Schemas** (`lib/data/schema.ts`) | Extend for live data, keep Zod validation |
| **Safety & Verification** | Port `lib/llm/verification.ts`, `lib/engine/safety.ts` |
| **Formatters** | Port `lib/engine/format.ts`, `lib/engine/hash.ts` |
| **Content** | Rewrite lessons as interactive JSON/MDX, expand from 8→25+ concepts |
| **Tests** | Port Vitest suites, add component tests for new UI |
| **Eval Harness** | Extend for new routes, keep golden set for safety regression |

**Strategy**: New repo or `/v2` route → parallel development → feature parity → cutover.

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Learning Completion** | 60% of starters complete "Analyze Any Stock" track | Track progress events |
| **AI Chat Engagement** | 3+ messages/session for returning users | Chat event logs |
| **Stock Search Usage** | Cmd+K used in 40% of sessions | Command palette events |
| **Practice Retention** | 30% 7-day streak among active learners | Streak analytics |
| **Analyst Mode Adoption** | 20% of chat sessions use Analyst mode | Mode switch events |
| **Performance** | LCP < 2.5s, INP < 200ms, CLS < 0.1 | Core Web Vitals (RUM) |
| **Accessibility** | 0 critical/serious axe violations | Automated + manual audit |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Yahoo Finance API changes/rate limits | High | High | Fallback chain, aggressive caching, Screener.in supplement |
| Free LLM tier exhaustion | Medium | Medium | Multi-provider fallback, conversation summarization, template fallback |
| Skill tree performance (100+ nodes) | Medium | Medium | WebGL/canvas fallback, virtualization, progressive load |
| DCF model complexity in browser | Low | High | Web Worker, simplified default assumptions, export to Excel |
| Scope creep (feature requests) | High | Medium | Strict phased gates, "v2.1 backlog" for non-MVP |

---

## 13. Appendix: Concept Catalog (Initial 25)

| Category | Concepts |
|----------|----------|
| **Valuation** | P/E Ratio, P/B Ratio, EV/EBITDA, DCF Modeling, Dividend Discount Model, Relative Valuation |
| **Financial Statements** | Income Statement, Balance Sheet, Cash Flow Statement, Quality of Earnings, Red Flags |
| **Profitability** | ROE, ROCE, ROIC, Operating Margin, Net Margin, DuPont Analysis |
| **Leverage & Risk** | Debt-to-Equity, Interest Coverage, Altman Z-Score, Drawdown, Volatility |
| **Growth** | Revenue CAGR, EPS CAGR, Sustainable Growth Rate, Reinvestment Rate |
| **Moats** | Pricing Power, Switching Costs, Network Effects, Scale, Brand, Intangibles |
| **Portfolio** | Diversification, Position Sizing, Rebalancing, Risk Parity, Factor Investing |

---

*Design spec approved for implementation planning. Next step: Invoke `superpowers-writing-plans` skill to create detailed implementation plan.*