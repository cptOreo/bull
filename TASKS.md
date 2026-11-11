# Bull v2 Learning Platform - Complete Implementation Task List

## Phase 1: Foundation + Live Search + AI Chat (Partially Complete)

### ✅ Done
- [x] Design system setup: Tailwind 4 tokens, shadcn/ui, fonts
- [x] Motion primitives: Framer Motion wrapper, page transitions, micro-interaction hooks
- [x] Universal Cmd+K Command Palette component (search, pages, AI, learn tabs)
- [x] Yahoo Finance client: search, quote, fundamentals, price series + TanStack Query config
- [x] Smart caching: 30s/1hr/5min stale times, IndexedDB persistence, fallback chain
- [x] Stock Deep Dive: Header, 52w range pin, Overview tab (ratios, strengths/watchouts)
- [x] AI Chat Panel: Sidebar + full page, Tutor mode, existing LLM providers
- [x] Adaptive Home Dashboard: New user goal selector, returning user 3-panel layout
- [x] Responsive layout: Sidebar (280→72px), mobile tabs, tablet/desktop breakpoints
- [x] Dark mode default, theme toggle, prefers-reduced-motion support

### 🔄 Remaining Phase 1 Tasks
- [ ] 1.11 Stock Deep Dive: Financials tab (interactive statements with YoY%, sparklines)
- [ ] 1.12 Stock Deep Dive: Valuation tab (DCF Builder with assumptions panel + sensitivity table)
- [ ] 1.13 Stock Deep Dive: Risks tab (flag cards with severity, concentration, corporate actions)
- [ ] 1.14 Stock Deep Dive: News tab (dated items with Fact/Commentary/Announcement badges)
- [ ] 1.15 Stock Deep Dive: Learn tab (concept chips → skill tree links with mastery state)
- [ ] 1.16 AI Chat Panel: Analyst mode with function calling tools
- [ ] 1.17 AI Chat Panel: Tool invocations visible (spinner → ✓ done → output preview)
- [ ] 1.18 AI Chat Panel: Citations inline [¹] → hover tooltip (source, date, link)
- [ ] 1.19 AI Chat Panel: Suggested follow-ups dynamic chips
- [ ] 1.20 Command Palette: Go to Page tab with keyboard shortcuts
- [ ] 1.21 Command Palette: Learn Concept tab with skill tree nodes + mastery preview
- [ ] 1.22 Universal Search: Screener.in cached list for better Indian search relevance
- [ ] 1.23 Data Pipeline: Web Worker for heuristics computation (non-blocking UI)
- [ ] 1.24 Data Pipeline: Price Series normalization (monthly 5y + daily 1y + intraday 1d)
- [ ] 1.25 Data Pipeline: Transformers (Raw → LiveStockSnapshot with computed ratios)
- [ ] 1.26 Data Pipeline: Heuristics in Web Worker (strengths/watchouts)

## Phase 2: Learning Platform (Complete ✅)

### Skill Tree Canvas (D3/SVG Canvas)
- [x] 2.1 Skill Tree Canvas: Interactive SVG graph with curved bezier prerequisite lines and zoom/pan grid toggle
- [x] 2.2 Skill Tree Node: Concept circles (60px), icon + title, mastery ring (stroke-dasharray)
- [x] 2.3 Node States: Locked (gray, lock) → Available (outline primary) → Learning (pulse) → Mastered (filled + ring %)
- [x] 2.4 Mastery Levels: Novice (1) → Apprentice (2) → Competent (3) → Proficient (4) → Expert (5)
- [x] 2.5 Prerequisite Edges: Curved paths, animated draw on load, hover highlights chain
- [x] 2.6 Interactions: Click → 5-step applied lesson player, search, filter by track, graph vs grid view toggle
- [x] 2.7 Onboarding: Guided tour ("Click a node to learn", "Rings show mastery", "Lines show prerequisites")
- [x] 2.8 Goal-Based Tracks: 4 tracks, unlock logic, prerequisite edges (visual)
- [x] 2.9 Track Progress: Ring fill = mastery %, tooltip shows XP needed for next level
- [x] 2.10 Track Filtering: Filter by track, search concepts, legend

### Goal-Based Tracks (4 Tracks)
- [x] 2.11 Track: Analyze Any Stock (Valuation Basics → P/E & Multiples → DCF Modeling → Financial Statements → Ratio Analysis → Risk Assessment → Report Writing)
- [x] 2.12 Track: Build Dividend Portfolio (Dividend Basics → Yield & Payout → Dividend Safety → Sector Diversification → Growth vs Yield → Rebalancing → Tax Efficiency)
- [x] 2.13 Track: Read Financial Statements (Income Statement → Balance Sheet → Cash Flow → Notes & Accounting → Quality Checks → Red Flags → Forecasting)
- [x] 2.14 Track: Understand Moats (Pricing Power → Switching Costs → Network Effects → Scale Advantages → Brand → Intangibles → Moat Erosion)

### Lesson Engine (5-Step Player)
- [x] 2.15 Lesson Engine: 5-step player (Concept → Your Stock → Guided Practice → Applied Mission → Mastery Check)
- [x] 2.16 Step 1 - Concept: Plain English + visual analogy + interactive formula + "Why this matters"
- [x] 2.17 Step 2 - Your Stock: Auto-selects recent stock, shows real numbers, link to full page
- [x] 2.18 Step 3 - Guided Practice: Fill-in-blank, MCQ with explanation, slider simulation, hints
- [x] 2.19 Step 4 - Applied Mission: Real stock tasks, AI review, XP award
- [x] 2.20 Step 5 - Mastery Check: 3 questions, 2/3 to level up, adaptive difficulty, ring animation
- [x] 2.21 Interactive Formula Explorer: Change variables, see result in real-time
- [x] 2.22 Slider Simulator: Embedded in lessons + standalone (Price, EPS, D/E, Margin)
- [x] 2.23 Fill-in-blank & MCQ Components: Immediate feedback + hint system
- [x] 2.24 AI Review for Missions: Submit → AI reviews → XP awarded

### Mastery System
- [x] 2.25 Mastery Levels: 5 levels (Novice→Expert), ring animation, XP thresholds
- [x] 2.26 XP System: Lesson (20), Practice (10), Mission (30), Check-pass (50), Quiz (15), Streak (50/100/200)
- [x] 2.27 Level Thresholds: 0→1 (100), 1→2 (250), 2→3 (500), 3→4 (1000), 4→5 (2000)
- [x] 2.28 Streak Calendar: GitHub-style contribution graph (IST), daily streak tracking
- [x] 2.29 Badge System: 12 badges (First Steps, Analyst, Dividend Investor, Statement Reader, Moat Master, Streak 7/30/100, Risk Namer, DCF Builder, Screener, Professor)
- [x] 2.30 XP Timeline: Area chart with level-up milestone markers
- [x] 2.31 Skill Tree Heatmap: Grid of all concepts, color = mastery level
- [x] 2.32 Badge Shelf: Earned (color), unearned (outline + criteria)

### Practice Arena
- [x] 2.33 Practice Arena: 4 scenario types (Find Red Flag, Compare Valuation, Build DCF, Screen for Quality)
- [x] 2.34 Scenario Cards: Real stock situations with guided analysis
- [x] 2.35 Adaptive Difficulty: Matches user's lowest mastery concept in scenario
- [x] 2.36 Daily Streak: 7-day (50 XP), 30-day (100 XP), 100-day (200 XP)
- [x] 2.37 Practice Scenarios: 12 scenarios (Find Red Flag Zomato/Paytm, Compare TCS/INFY, Build DCF Reliance, Screen Quality)

### Progress Dashboard
- [x] 2.38 Skill Tree Heatmap: Grid of all concepts, color = mastery level
- [x] 2.39 XP Timeline: Area chart with level-up milestone markers
- [x] 2.40 Streak Calendar: GitHub-style contribution graph (IST)
- [x] 2.41 Badge Shelf: 12 badges (earned color, unearned outline + criteria)
- [x] 2.42 Saved Analyses: Cards linking to `/research` reports
- [x] 2.43 XP Progress Bar: Animated progress to next level

### AI Tutor Enhancements
- [x] 2.44 Socratic Questioning: "What would happen if margins dropped 2%?"
- [x] 2.45 Practice Generation: Creates problems from stocks user viewed
- [x] 2.46 Gap Detection: Tracks weak concepts → suggests next lesson
- [x] 2.47 Multilingual: English + Hinglish (romanized Hindi), auto-detect or toggle
- [x] 2.48 Adaptive Difficulty: Detects knowledge level from mastery + chat history
- [x] 2.49 Memory: Remembers mastery per concept, preferred analogies, weak areas
- [x] 2.50 Socratic Questioning in Lessons: Integrated into lesson steps

### Content
- [x] 2.51 Content: 25+ lessons (JSON/MDX), 4 tracks, 12 practice scenarios, glossary
- [x] 2.52 Concept Catalog: 25 concepts across Valuation, Financial Statements, Profitability, Leverage & Risk, Growth, Moats, Portfolio

## Phase 3: Analyst Workspace + Polish

### Analyst Mode (Function Calling)
- [ ] 3.1 Tool: search_stocks(query) - Live search with fundamentals preview
- [ ] 3.2 Tool: get_fundamentals(ticker) - Financials, ratios, valuation, profile
- [ ] 3.3 Tool: get_price_history(ticker, period) - Charts, returns, volatility, drawdown
- [ ] 3.4 Tool: screen_stocks(criteria) - Filter by P/E, ROE, debt, growth, sector, market cap
- [ ] 3.4 Tool: compare_stocks(tickers[]) - Side-by-side computed metrics table
- [ ] 3.5 Tool: build_dcf(ticker, assumptions) - DCF model with sensitivity table
- [ ] 3.5 Tool: analyze_sector(sector) - Sector overview, leaders, trends, key metrics
- [ ] 3.6 Tool: generate_report(analysis) - Structured markdown report with citations
- [ ] 3.7 Analyst Workflow: User states goal → AI plans steps → confirms → executes → presents with citations
- [ ] 3.8 Tool Invocations Visible: Expandable steps with spinner → ✓ done → output preview
- [ ] 3.9 Citations: Inline [¹] → hover tooltip (source, date, link)

### Stock Deep Dive (Complete Tabs)
- [ ] 3.10 Financials Tab: Interactive IS/BS/CF (expandable rows, YoY%, sparklines)
- [ ] 3.10 Valuation Tab: DCF Builder (assumptions panel → real-time valuation → sensitivity table → export)
- [ ] 3.11 DCF Builder: Assumptions panel → real-time valuation → sensitivity table → export
- [ ] 3.11 Valuation Tab: Historical P/E percentile chart, peer comparison
- [ ] 3.12 Risks Tab: Flag cards (severity: high/medium/low), concentration, corporate actions
- [ ] 3.13 News Tab: Dated items with Fact/Commentary/Announcement badges, source links
- [ ] 3.14 Learn Tab: Concept badges → skill tree, mastery state, "Practice this on [stock]"

### DCF Builder
- [ ] 3.11 DCF Builder: Assumptions panel (revenue growth, margin, tax rate, WACC, terminal growth, years)
- [ ] 3.12 Real-time Valuation: Updates as assumptions change
- [ ] 3.13 Sensitivity Table: WACC vs Terminal Growth grid
- [ ] 3.14 Export: Copy to clipboard, download CSV/JSON

### RAG System
- [ ] 3.12 Local Vector Index: Transformers.js (all-MiniLM-L6-v2), IndexedDB storage
- [ ] 3.13 Financial Knowledge Base: 20+ concepts, formulas, examples, analogies
- [ ] 3.14 Retrieval: Top-K semantic search, cosine similarity, category filtering
- [ ] 3.15 Context Injection: Auto-inject relevant knowledge into chat context

### Report Generation
- [ ] 3.15 Report Generator: Structured markdown with citations
- [ ] 3.16 Export Formats: Markdown, HTML, PDF, Notion
- [ ] 3.17 Report Sections: Executive Summary → Key Findings → Data Tables → Risks → Sources

### Advanced Charts
- [ ] 3.16 Waterfall Chart: DCF components (Revenue → EBITDA → NOPAT → FCF → Terminal → EV)
- [ ] 3.17 Sankey Diagram: Revenue breakdown (segments, geographies, products)
- [ ] 3.18 Treemap: Portfolio allocation, sector exposure, market cap distribution

### Motion Polish
- [ ] 3.17 Staggered Entrances: 50ms delay per element, spring easing
- [ ] 3.18 Scroll-Driven Charts: IntersectionObserver triggered progressive reveal
- [ ] 3.19 Shared Layout Transitions: Framer Motion layoutId for smooth page transitions
- [ ] 3.20 Mastery Ring Animation: Spring fill from current → target %
- [ ] 3.21 Edge Drawing Animation: Stroke-dashoffset on load, hover highlight
- [ ] 3.22 Chart Progressive Reveal: Path drawing animation on scroll
- [ ] 3.23 Skill Tree Node Entrance: Staggered 50ms delay, easeOut

### Accessibility Audit
- [ ] 3.24 WCAG 2.1 AA: Color contrast (4.5:1), keyboard nav, ARIA, screen readers
- [ ] 3.25 Focus Management: Visible focus rings, logical tab order, skip links
- [ ] 3.26 ARIA Live Regions: Chat messages, loading states, notifications
- [ ] 3.27 Reduced Motion: Disables all non-essential animation
- [ ] 3.28 Color Blind Safe: Patterns + colors for data viz
- [ ] 3.29 Touch Targets: Minimum 44px, proper spacing

### Performance
- [ ] 3.30 Code Splitting: Dynamic imports for heavy components (D3, Charts, Lesson Player)
- [ ] 3.31 Lazy Loading: Images, non-critical components, below-fold content
- [ ] 3.32 Bundle Analysis: Webpack bundle analyzer, tree shaking
- [ ] 3.33 Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1

### Error Boundaries & Resilience
- [ ] 3.34 Error Boundaries: Graceful degradation per component
- [ ] 3.35 Offline Indicator: Visual indicator, cached data access
- [ ] 3.36 Retry UX: Exponential backoff UI, manual retry buttons
- [ ] 3.37 Graceful Degradation: Feature flags for API failures

### Content & Tests
- [ ] 4.1 Content: 25+ lessons (JSON/MDX), 4 tracks, 12 practice scenarios, glossary
- [ ] 4.2 Unit Tests: All new components, hooks, utils (Vitest)
- [ ] 4.3 Component Tests: Skill tree, lesson player, practice arena, chat panel
- [ ] 4.4 Integration Tests: Full user flows (search → learn → practice → chat)
- [ ] 4.5 E2E Tests: Playwright smoke tests (P2)
- [ ] 4.6 Accessibility Tests: axe-core automated + manual audit
- [ ] 4.7 Performance Tests: LCP, INP, CLS measurement

## Summary
- **Phase 1**: ~15 remaining tasks (stock deep dive tabs, AI analyst mode, search enhancements)
- **Phase 2**: ~55 tasks (skill tree, lesson engine, practice, progress, tutor enhancements, content)
- **Phase 3**: ~40 tasks (analyst tools, RAG, reports, advanced charts, motion, a11y, performance, error handling, tests)
- **Total**: ~110 tasks