# Bull v2 Learning Platform - Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-subagent-driven-development (recommended) or superpowers-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Build Bull v2 — a world-class adaptive financial learning platform with live stock search (2000+ Indian equities), dual-mode AI chat (Tutor + Analyst), interactive skill tree with mastery progression, and Awwwards-level motion design.

**Architecture**: Next.js 15 App Router with four-layer architecture: routes → components → lib (engine, data, llm, state, hooks) → content. Pure TS engine modules (port from v0) with zero React deps. TanStack Query for server state, Zustand for client state, Framer Motion for animation, D3.js for skill tree visualization.

**Tech Stack**: Next.js 15, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui, Framer Motion, TanStack Query v5, Zustand, D3.js v7, Recharts, Vercel AI SDK, Vitest, Playwright.

---

## Phase 1: Foundation + Live Search + AI Chat (Remaining Tasks)

### Task 1.11: Stock Deep Dive - Financials Tab
**Files**: `components/stock/financial-statements.tsx`, `components/stock/stock-tabs.tsx`
- Interactive IS/BS/CF tables with expandable rows
- YoY% calculations with sparklines
- Expandable rows for detailed line items
- Tabular-nums for financial figures

### Task 1.12: Stock Deep Dive - Valuation Tab
**Files**: `components/stock/valuation-tab.tsx`, `components/stock/dcf-builder.tsx`
- DCF Builder with assumptions panel
- Real-time valuation updates as sliders change
- Sensitivity table (WACC vs Terminal Growth grid)
- Export to clipboard/CSV
- Historical P/E percentile chart
- Peer comparison table

### Task 1.13: Stock Deep Dive - Risks Tab
**Files**: `components/stock/risk-flags.tsx`, `components/stock/concentration-risk.tsx`
- Flag cards with severity badges (high/medium/low)
- Concentration risk analysis
- Corporate actions timeline
- Severity color coding (red/amber/blue)

### Task 1.14: Stock Deep Dive - News Tab
**Files**: `components/stock/news-feed.tsx`
- Dated items with Fact/Commentary/Announcement badges
- Source links with external link icons
- "Show more" pagination
- Loading skeletons

### Task 1.15: Stock Deep Dive - Learn Tab
**Files**: `components/stock/learn-chips.tsx`
- Concept badges linking to skill tree
- Mastery state preview (ring + level)
- "Practice this on [stock]" action buttons
- Auto-selects concepts relevant to the stock

### Task 1.16: AI Chat Panel - Analyst Mode
**Files**: `components/chat/chat-panel.tsx`, `lib/llm/tools.ts`, `lib/llm/index.ts`
- Mode toggle: Tutor ↔ Analyst (segmented control, keyboard ⌘1/⌘2)
- Analyst mode with function calling tools
- Tool definitions for 8 tools (search, fundamentals, price history, screen, compare, DCF, sector, report)

### Task 1.17: AI Chat Panel - Tool Invocations UI
**Files**: `components/chat/tool-invocation.tsx`, `components/chat/message-block.tsx`
- Expandable tool invocation steps
- Spinner → ✓ done → output preview
- Error handling with retry
- Collapsible raw JSON view

### Task 1.18: AI Chat Panel - Citations
**Files**: `components/chat/citation.tsx`, `lib/llm/verification.ts`
- Inline citations [¹] with hover tooltip
- Source, date, link in tooltip
- Verification pass for all AI responses

### Task 1.19: AI Chat Panel - Suggested Follow-ups
**Files**: `components/chat/follow-up-chips.tsx`
- Dynamic chips based on message context
- Context-aware suggestions (stock, concept, analysis)
- Click to auto-send

### Task 1.20: Command Palette - Go to Page Tab
**Files**: `components/search/page-search-result.tsx`
- Icon, description, keyboard shortcut (e.g., "g h" → Home)
- Fuzzy search by page title/description

### Task 1.21: Command Palette - Learn Concept Tab
**Files**: `components/search/learn-search-result.tsx`
- Skill tree nodes with mastery preview rings
- Mastery state preview (ring + level)
- Click → navigate to lesson

### Task 1.22: Universal Search - Screener.in Cache
**Files**: `lib/data/screener-client.ts`, `lib/data/alias-map.ts`
- Cached Screener.in company list (24h TTL)
- Indian stock search relevance boost
- Fuzzy matching for names/tickers

### Task 1.23: Data Pipeline - Web Worker for Heuristics
**Files**: `lib/data/heuristics.worker.ts`, `lib/data/heuristics.ts`
- Web Worker for non-blocking heuristic computation
- Transferable objects for performance
- Main thread communication via postMessage

### Task 1.24: Data Pipeline - Price Series Normalization
**Files**: `lib/data/transformers.ts`
- Monthly 5y (60 points) + Daily 1y (252 points) + Intraday 1d (390 points)
- Resampling logic for different intervals
- Missing data interpolation

### Task 1.25: Data Pipeline - Transformers
**Files**: `lib/data/transformers.ts`
- Raw Yahoo API → LiveStockSnapshot transformation
- Computed ratios (P/E, P/B, ROE, ROCE, margins, D/E, interest coverage)
- Merge snapshots (primary + fallback)

### Task 1.26: Data Pipeline - Heuristics in Web Worker
**Files**: `lib/data/heuristics.worker.ts`
- Offload strengths/watchouts computation to Web Worker
- Non-blocking UI during computation
- Batch processing for multiple stocks

---

## Phase 2: Learning Platform

### Task 2.1: Skill Tree Canvas - D3 Force-Directed Graph
**Files**: `components/learn/skill-tree-canvas.tsx`, `components/learn/skill-tree-node.tsx`
- D3 force-directed graph with WebGL fallback for 100+ nodes
- Node positioning with collision detection
- Pan/zoom with wheel/trackpad
- Click → lesson navigation

### Task 2.2: Skill Tree Node Component
**Files**: `components/learn/skill-tree-node.tsx`, `components/ui/mastery-ring.tsx`
- Concept circles (60px) with icon + title
- Mastery ring (stroke-dasharray animation)
- States: Locked (gray, lock) → Available (outline) → Learning (pulse) → Mastered (filled + ring %)
- 5 mastery levels: Novice (1) → Apprentice (2) → Competent (3) → Proficient (4) → Expert (5)

### Task 2.3: Prerequisite Edges
**Files**: `components/learn/skill-tree-edge.tsx`
- Curved SVG paths with animated stroke-dashoffset
- Hover highlights prerequisite chain
- Animated draw on load (600ms easeInOut)

### Task 2.4: Node States & Mastery Levels
**Files**: `lib/engine/mastery.ts`, `components/ui/mastery-ring.tsx`
- States: Locked (gray, lock) → Available (outline) → Learning (pulse) → Mastered (filled + ring %)
- 5 levels: Novice (1) → Apprentice (2) → Competent (3) → Proficient (4) → Expert (5)
- Ring animation: 800ms spring from current → target %

### Task 2.5: Prerequisite Edges with Hover Highlight
**Files**: `components/learn/skill-tree-edge.tsx`
- Curved SVG paths with stroke-dashoffset animation
- Hover highlights entire prerequisite chain
- 600ms easeInOut draw animation on load

### Task 2.6: Interactions (Pan/Zoom, Click, Search, Filter)
**Files**: `components/learn/skill-tree-canvas.tsx`, `hooks/use-skill-tree.ts`
- Pan/zoom with wheel/trackpad (D3 zoom behavior)
- Click node → navigate to lesson
- Search concepts with live filtering
- Filter by track (4 track tabs)

### Task 2.7: Onboarding Tour
**Files**: `components/learn/skill-tree-onboarding.tsx`
- Guided tour: "Click a node to learn", "Rings show mastery", "Lines show prerequisites"
- Dismissible, localStorage persisted
- Skip option

### Task 2.8: Goal-Based Tracks (4 Tracks)
**Files**: `content/tracks/*.json`, `lib/engine/curriculum.ts`
- Track 1: Analyze Any Stock (7 concepts)
- [ ] Track 2: Build Dividend Portfolio (7 concepts)
- [ ] Track 3: Read Financial Statements (7 concepts)
- [ ] Track 4: Understand Moats (7 concepts)

### Task 2.9: Track Progress UI
**Files**: `app/learn/page.tsx`, `hooks/use-skill-tree.ts`
- Ring fill = mastery %, tooltip shows XP needed
- Filter by track (4 track tabs)
- Search concepts with live filtering
- Legend for states/levels

### Task 2.10: Track Progress UI - Ring Fill & Tooltips
**Files**: `components/ui/mastery-ring.tsx`, `hooks/use-skill-tree.ts`
- Ring fill = mastery %, tooltip shows XP needed
- Filter by track (4 track tabs)
- Search concepts with live filtering
- Legend for states/levels

### Task 2.11-2.14: Goal-Based Tracks (4 Tracks)
**Files**: `content/tracks/*.json`, `lib/engine/curriculum.ts`
- Track 1: Analyze Any Stock (7 concepts: Valuation Basics → P/E & Multiples → DCF Modeling → Financial Statements → Ratio Analysis → Risk Assessment → Report Writing)
- Track 2: Build Dividend Portfolio (7 concepts: Dividend Basics → Yield & Payout → Dividend Safety → Sector Diversification → Growth vs Yield → Rebalancing → Tax Efficiency)
- Track 3: Read Financial Statements (7 concepts: Income Statement → Balance Sheet → Cash Flow → Notes & Accounting → Quality Checks → Red Flags → Forecasting)
- Track 4: Understand Moats (7 concepts: Pricing Power → Switching Costs → Network Effects → Scale Advantages → Brand → Intangibles → Moat Erosion)

### Task 2.15: Lesson Engine - 5-Step Player
**Files**: `components/learn/lesson-player.tsx`, `components/learn/lesson-step-*.tsx`
- 5-step player: Concept → Your Stock → Guided Practice → Applied Mission → Mastery Check
- Step navigation with progress indicator
- State persistence (localStorage + URL sync)

### Task 2.16: Step 1 - Concept
**Files**: `components/learn/lesson-step-concept.tsx`
- Plain English explanation + visual analogy
- Interactive formula (change variables, see result)
- "Why this matters" — real-world context

### Task 2.17: Step 2 - Your Stock
**Files**: `components/learn/lesson-step-your-stock.tsx`
- Auto-selects recent stock
- Shows real numbers for this concept
- "Your Zomato has P/E of 68x — here's what that means"
- Link to full stock page

### Task 2.18: Step 3 - Guided Practice
**Files**: `components/learn/lesson-step-practice.tsx`
- Fill-in-blank calculation
- Multiple choice with explanation
- Slider simulation (e.g., "Move price to see P/E change")
- Immediate feedback + hint system

### Task 2.19: Step 4 - Applied Mission
**Files**: `components/learn/lesson-step-mission.tsx`
- Real stock tasks: "Calculate intrinsic value for [stock] using DCF"
- "Compare [stock] peers on ROE and explain difference"
- "Find 3 red flags in [stock]'s cash flow statement"
- Submit → AI reviews → XP awarded

### Task 2.20: Step 5 - Mastery Check
**Files**: `components/learn/lesson-step-check.tsx`
- 3 questions, need 2/3 to level up
- Adaptive: harder if user aced practice
- Mastery ring animates to new level

### Task 2.21: Interactive Formula Explorer
**Files**: `components/learn/formula-explorer.tsx`
- Change variables, see result in real-time
- Formula breakdown with tooltips
- Preset scenarios (Value, Growth, Distressed, Quality)

### Task 2.22: Slider Simulator
**Files**: `components/learn/slider-simulator.tsx`
- Embedded in lessons + standalone
- Sliders: Price, EPS, Debt/Equity, Net Margin
- Real-time computed outputs: P/E, Earnings Yield, Payback Years, Valuation Zone

### Task 2.23: Fill-in-blank & MCQ Components
**Files**: `components/learn/fill-blank.tsx`, `components/learn/mcq.tsx`
- Immediate feedback + hint system
- Explain correct/incorrect answers
- Adaptive: harder if user aced practice

### Task 2.24: AI Review for Missions
**Files**: `lib/llm/mission-review.ts`, `components/learn/lesson-step-mission.tsx`
- Submit mission → AI reviews → XP awarded
- Structured feedback with specific feedback
- Pass/fail with constructive feedback

### Task 2.25: Mastery Levels & Ring Animation
**Files**: `lib/engine/mastery.ts`, `components/ui/mastery-ring.tsx`
- 5 levels: Novice (1) → Apprentice (2) → Competent (3) → Proficient (4) → Expert (5)
- Ring animation: 800ms spring from current → target %
- Ring fill = mastery %, tooltip shows XP needed

### Task 2.26: XP System
**Files**: `lib/engine/xp.ts`
- XP Sources: Lesson (20), Practice (10), Mission (30), Check-pass (50), Quiz (15), Streak (50/100/200)
- Level thresholds: 0→1 (100), 1→2 (250), 2→3 (500), 3→4 (1000), 4→5 (2000)
- XP progress bar with animation

### Task 2.27: Level Thresholds & XP Progress Bar
**Files**: `lib/engine/xp.ts`, `components/ui/xp-progress.tsx`
- Level thresholds: 0→1 (100), 1→2 (250), 2→3 (500), 3→4 (1000), 4→5 (2000)
- Animated progress bar to next level

### Task 2.28: Streak Calendar
**Files**: `components/learn/streak-calendar.tsx`
- GitHub-style contribution graph (IST)
- Daily streak tracking
- Streak bonuses: 7-day (50), 30-day (100), 100-day (200)

### Task 2.29: Badge System (12 Badges)
**Files**: `lib/engine/xp.ts`, `components/learn/badge-shelf.tsx`
- First Steps, Analyst, Dividend Investor, Statement Reader, Moat Master
- Streak 7/30/100, Risk Namer, DCF Builder, Screener, Professor
- Earned (color), unearned (outline + criteria)

### Task 2.28: Streak Calendar
**Files**: `components/learn/streak-calendar.tsx`
- GitHub-style contribution graph (IST)
- Daily streak tracking
- Streak bonuses: 7-day (50 XP), 30-day (100 XP), 100-day (200 XP)

### Task 2.29: Badge System (12 Badges)
**Files**: `lib/engine/xp.ts`, `components/learn/badge-shelf.tsx`
- Badges: First Steps, Analyst, Dividend Investor, Statement Reader, Moat Master
- Streak 7/30/100, Risk Namer, DCF Builder, Screener, Professor
- Earned (color), unearned (outline + criteria)

### Task 2.30: XP Timeline
**Files**: `components/learn/xp-timeline.tsx`
- Area chart with level-up milestone markers
- Hover tooltip with date, XP gained, source
- Responsive down to mobile

### Task 2.31: Skill Tree Heatmap
**Files**: `components/learn/mastery-heatmap.tsx`
- Grid of all concepts, color = mastery level
- Hover tooltip: concept name, level, progress
- Filter by track

### Task 2.32: Badge Shelf
**Files**: `components/learn/badge-shelf.tsx`
- 12 badges: earned (color), unearned (outline + criteria)
- Hover tooltip with criteria
- Click to view progress toward badge

### Task 2.31: Skill Tree Heatmap
**Files**: `components/learn/mastery-heatmap.tsx`
- Grid of all concepts, color = mastery level
- Hover tooltip: concept name, level, progress
- Filter by track

### Task 2.33-2.37: Practice Arena
**Files**: `components/learn/practice-arena.tsx`, `components/learn/practice-scenario-card.tsx`
- 4 scenario types: Find Red Flag, Compare Valuation, Build DCF, Screen for Quality
- Scenario cards with real stock data
- Adaptive difficulty (matches lowest mastery concept)
- 12 scenarios with real stock data
- Daily streak: 7-day (50 XP), 30-day (100 XP), 100-day (200 XP)

### Task 2.38-2.43: Progress Dashboard
**Files**: `app/profile/page.tsx`, `components/learn/progress-dashboard.tsx`, `components/learn/mastery-heatmap.tsx`, `components/learn/xp-timeline.tsx`, `components/learn/streak-calendar.tsx`, `components/learn/badge-shelf.tsx`
- Skill tree heatmap (grid, color = mastery)
- XP timeline (area chart + level milestones)
- Streak calendar (GitHub-style)
- Badge shelf (earned/unearned)
- Saved analyses cards

### Task 2.44-2.50: AI Tutor Enhancements
**Files**: `lib/llm/prompts.ts`, `lib/llm/rag.ts`, `lib/llm/index.ts`
- Socratic questioning: "What would happen if margins dropped 2%?"
- Practice generation from viewed stocks
- Gap detection (weak concepts → suggest next lesson)
- Multilingual: English + Hinglish (romanized Hindi)
- Adaptive difficulty from mastery + chat history
- Memory: mastery per concept, preferred analogies, weak areas
- Socratic questioning integrated into lesson steps

### Task 2.51-2.52: Content
**Files**: `content/lessons/*.json`, `content/tracks/*.json`, `content/practice/*.json`, `content/glossary.ts`
- 25+ lessons (JSON/MDX) across 4 tracks
- 4 track definitions with unlock order
- 12 practice scenarios
- Glossary with 50+ financial terms

---

## Phase 3: Analyst Workspace + Polish

### Task 3.1-3.6: Analyst Mode Function Calling Tools
**Files**: `lib/llm/tools.ts`, `lib/llm/index.ts`, `lib/llm/providers.ts`
- `search_stocks(query)` - Live search with fundamentals preview
- `get_fundamentals(ticker)` - Financials, ratios, valuation, profile
- `get_price_history(ticker, period)` - Charts, returns, volatility, drawdown
- `screen_stocks(criteria)` - Filter by P/E, ROE, debt, growth, sector, market cap
- `compare_stocks(tickers[])` - Side-by-side computed metrics table
- `build_dcf(ticker, assumptions)` - DCF model with sensitivity table
- `analyze_sector(sector)` - Sector overview, leaders, trends, key metrics
- `generate_report(analysis)` - Structured markdown report with citations

### Task 3.7: Analyst Workflow
**Files**: `lib/llm/index.ts`, `components/chat/chat-panel.tsx`
- User states goal → AI plans steps → confirms → executes → presents with citations
- Tool invocations visible: expandable steps with spinner → ✓ done → output preview
- Citations: Inline [¹] → hover tooltip (source, date, link)

### Task 3.2-3.6: Stock Deep Dive Complete Tabs
**Files**: `components/stock/financial-statements.tsx`, `components/stock/valuation-tab.tsx`, `components/stock/dcf-builder.tsx`, `components/stock/risk-flags.tsx`, `components/stock/news-feed.tsx`, `components/stock/learn-chips.tsx`
- Financials: Interactive IS/BS/CF (expandable rows, YoY%, sparklines)
- Valuation: DCF Builder + sensitivity table + export
- DCF Builder: Assumptions → real-time valuation → sensitivity table → export
- Risks: Flag cards (high/medium/low), concentration, corporate actions
- News: Dated items with Fact/Commentary/Announcement badges, source links
- Learn: Concept badges → skill tree, mastery state, "Practice this on [stock]"

### Task 3.11: DCF Builder
**Files**: `components/stock/dcf-builder.tsx`, `lib/engine/dcf.ts`
- Assumptions panel: revenue growth, margin, tax rate, WACC, terminal growth, years
- Real-time valuation updates as sliders change
- Sensitivity table: WACC vs Terminal Growth grid
- Export: clipboard, CSV, JSON

### Task 3.12-3.15: RAG System
**Files**: `lib/llm/rag.ts`, `lib/data/indexed-db.ts`
- Local vector index (Transformers.js all-MiniLM-L6-v2)
- IndexedDB storage for embeddings
- 20+ financial concepts, formulas, examples, analogies
- Top-K semantic search with cosine similarity
- Category filtering (valuation, profitability, risk, etc.)

### Task 3.15-3.17: Report Generation
**Files**: `lib/llm/report.ts`, `components/chat/report-viewer.tsx`
- Structured markdown with citations
- Export: Markdown, HTML, PDF (via jsPDF), Notion
- Sections: Executive Summary → Key Findings → Data Tables → Risks → Sources

### Task 3.16-3.18: Advanced Charts
**Files**: `components/charts/waterfall.tsx`, `components/charts/sankey.tsx`, `components/charts/treemap.tsx`
- Waterfall: DCF components (Revenue → EBITDA → NOPAT → FCF → Terminal → EV)
- Sankey: Revenue breakdown (segments, geographies, products)
- Treemap: Portfolio allocation, sector exposure, market cap distribution

### Task 3.17-3.23: Motion Polish
**Files**: `components/ui/motion-primitives.tsx`, various component files
- Staggered entrances (50ms delay, spring easing)
- Scroll-driven charts (IntersectionObserver)
- Shared layout transitions (Framer Motion layoutId)
- Mastery ring animation (spring fill)
- Edge drawing animation (stroke-dashoffset)
- Chart progressive reveal (path drawing on scroll)
- Skill tree node entrance (staggered 50ms, easeOut)

### Task 3.24-3.29: Accessibility Audit
**Files**: Various, `package.json` (axe-core)
- WCAG 2.1 AA: contrast (4.5:1), keyboard nav, ARIA, screen readers
- Focus management: visible rings, logical tab order, skip links
- ARIA live regions: chat messages, loading states, notifications
- Reduced motion: disables all non-essential animation
- Color blind safe: patterns + colors for data viz
- Touch targets: minimum 44px

### Task 3.30-3.33: Performance
**Files**: `next.config.ts`, `package.json`, various
- Code splitting: dynamic imports for D3, Charts, Lesson Player
- Lazy loading: images, non-critical components, below-fold
- Bundle analysis: webpack bundle analyzer, tree shaking
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1

### Task 3.34-3.37: Error Boundaries & Resilience
**Files**: `app/error.tsx`, `app/global-error.tsx`, `components/ui/error-boundary.tsx`
- Error boundaries: graceful degradation per component
- Offline indicator: visual indicator, cached data access
- Retry UX: exponential backoff UI, manual retry buttons
- Graceful degradation: feature flags for API failures

### Task 4.1-4.7: Content & Tests
**Files**: `content/lessons/*.json`, `content/tracks/*.json`, `content/practice/*.json`, `tests/**`
- 25+ lessons (JSON/MDX) across 4 tracks
- 4 track definitions with unlock order
- 12 practice scenarios
- Glossary with 50+ financial terms
- Unit tests: all new components, hooks, utils (Vitest)
- Component tests: Skill tree, lesson player, practice arena, chat panel
- Integration tests: Full user flows
- E2E tests: Playwright smoke tests (P2)
- Accessibility tests: axe-core automated + manual audit
- Performance tests: LCP, INP, CLS measurement