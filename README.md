# Bull v0 · Stock Discovery & Applied Literacy for First-Time Indian Retail Investors

> **IIIT Hyderabad Applied AI Product Management Capstone Project**  
> Built strictly against the Bull v0 Technical Specification & Architecture Contract (§1–§13).

---

## 🎯 Executive Summary & Problem Space

Retail equity participation in India has surged dramatically past 16 crore demat accounts, yet first-time retail investors face three structural traps:
1. **Unregulated FinFluencer Tipping:** Chasing Telegram/YouTube "multibaggers" and speculative momentum without understanding company balance sheets.
2. **Terminal Overload:** Professional trading platforms (Zerodha Kite, Groww, Screener) present dense metrics, complex financial statements, and candlestick charts without contextual education.
3. **Advisory Compliance Violations:** Generative AI tools hallucinate optimistic price targets, declare speculative "buy" calls, and breach SEBI Research Analyst (RA) and Investment Adviser (IA) regulations.

**Bull v0 solves this** by pioneering an applied-literacy discovery interface with a **mathematically deterministic engine**, **6-pillar safety choke point**, **4-rung numeric provenance audit trail**, and an **applied investing Academy** tailored specifically for the Indian equity market (NSE/BSE).

---

## 🏛️ Core Architectural Invariants

Bull v0 is built around 10 non-negotiable architectural guarantees:

| Invariant | Guarantee | Enforcement Mechanism |
|---|---|---|
| **1. Pure Deterministic Engine** | Engine code in `lib/engine/*` has **zero** dependencies on React, Next.js, `node:fs`, `node:fetch`, `process.env`, or stochastic LLMs. `now` is strictly an input argument. | `tests/architecture.test.ts` scans all AST imports; violates build on non-engine imports. |
| **2. Multi-Factor Scoring** | Shortlists are generated from multi-factor fundamental scoring (Quality, Growth, Valuation, Income, Stability) and profile alignment. Zero black-box rankings. | Deterministic scoring math in `lib/engine/score.ts`. |
| **3. Non-Directive Safety** | Strict prohibition on buy/sell/hold advice, price targets, guaranteed returns, and multibagger claims. | `inspectAnswer` choke point scans all output text against regex corpora before UI emission. |
| **4. Mandatory Education Note** | Every single answer, regardless of route, contains an invariant educational disclaimer in the selected locale. | Automated block structure assertion in engine pipeline. |
| **5. 4-Rung Provenance Traceability** | Every numerical figure displayed traces back to an audited audit trail (Rung 1: Raw filing, Rung 2: Formula, Rung 3: Distribution, Rung 4: Presentation claim). | `refs.ts` and interactive `ProvenanceDrawer` with NSE/BSE filing references. |
| **6. Offline Static Snapshot** | 12 representative Nifty 50 companies across 8+ sectors seeded in `data/snapshot.json` (as of 2026-11-10). Zero runtime third-party API dependencies. | Zod schema validation via `npm run data:check`. |
| **7. Sector Diversity Guardrail** | No single economic sector may occupy more than 2 slots in any 3–5 stock shortlist. | Diversity cap algorithm in `selectShortlist`. |
| **8. Bilingual 1:1 Parity** | Full support for English and Hinglish (natural Romanized Hindi spoken by urban retail investors). Zero Devanagari characters in UI. | `tests/safety.copy.test.ts` validates 100% key parity across `copy.en.ts` and `copy.hi-en.ts`. |
| **9. Applied Literacy Academy** | 8 foundational concepts (C1–C8) integrated directly with real Nifty 50 company metrics and auto-graded checks. | `lib/engine/curriculum.ts` and `components/academy/*`. |
| **10. IST-Aligned Consistency** | Gamification XP, 5 tier levels (L0–L4), 6 badges, and streaks evaluate against midnight Indian Standard Time (UTC+05:30). | `toISTDate` and `calculateStreak` in `lib/engine/xp.ts`. |

---

## 🏗️ Technical Stack

- **Framework:** Next.js 15 (App Router, React 19, Server Components where appropriate)
- **Language:** TypeScript 5 (Strict Mode, 100% type coverage, 0 `any` escapes)
- **Styling:** Tailwind CSS 4 (`@tailwindcss/postcss`, responsive typography, WCAG AA high-contrast tokens, monospaced tabular numbers)
- **Data Visualization:** Recharts (5-year normalized comparative price charts, financial bar charts, margin trends)
- **Data Validation:** Zod (strict recursive validation of snapshot schemas, dated schemas, price series)
- **State Management:** React Context + LocalStorage with SSR hydration safety (`lib/state/*`)
- **Testing:** Vitest 3 + React Testing Library (33 test suites, 684+ unit tests, 100+ adversarial corpus injections)
- **Evaluation Gate:** 10 Golden Cases regression runner (`eval/*`, 0 regressions required)

---

## 📁 Repository Directory Structure

```
├── app/                          # Next.js App Router Pages
│   ├── layout.tsx                # Root layout with BullProvider, Navbar, Footer, DisclaimerBanner
│   ├── page.tsx                  # Home: Interactive discovery chat & seeded universe sidebar
│   ├── shortlist/page.tsx        # Multi-factor shortlist table, factor bars, how-chosen modal
│   ├── stock/[ticker]/page.tsx   # Stock deep-dive: metric grid, financial charts, 4-rung drawer
│   ├── compare/page.tsx          # Side-by-side neutral comparison of two Nifty 50 stocks
│   ├── academy/page.tsx          # Applied Literacy Academy dashboard, XP header, badge shelf
│   ├── academy/[concept]/page.tsx# 4-step concept lesson reader, knowledge checks, missions
│   ├── academy/quiz/page.tsx     # Daily 3-question concept check (+15 XP, IST streak keepalive)
│   ├── progress/page.tsx         # Investor profile preferences tuning & milestone progress
│   └── method/page.tsx           # Methodology disclosure: 4-rung hierarchy, 10 invariants
├── components/                   # Modular React UI Components (Impeccable & Awwwards design bar)
│   ├── academy/                  # ConceptCard, BadgeShelf, StreakTracker, LessonSteps, CheckModal
│   ├── chat/                     # ChatContainer, MessageBubble, StarterPrompts, DisclaimerBanner
│   ├── nav/                      # Sticky glassmorphic Navbar, comprehensive SEBI disclosure Footer
│   ├── shortlist/                # ShortlistTable, RankFactorCard, HowChosen, SectorTag
│   ├── stock/                    # MetricGrid, FinancialChart, PriceChart, ProvenanceDrawer, RiskList
│   └── ui/                       # DataBadge, EducationNote, modal dialogs, buttons
├── content/                      # Bilingual Interface Copy & Glossaries
│   ├── copy.en.ts                # English interface copy dictionary
│   ├── copy.hi-en.ts             # Hinglish (Roman script) interface copy dictionary (1:1 key parity)
│   └── glossary.ts               # Financial glossary definitions & Hinglish pronunciation guides
├── data/                         # Offline Seeded Data Snapshot
│   └── snapshot.json             # 12 audited Nifty 50 companies, sectors, benchmark index, news
├── eval/                         # Golden Evaluation Gate (§12)
│   ├── cases.ts                  # 10 Golden test cases (H1–H5, E1–E3, A1–A2)
│   ├── labels.json               # Expected routes, required block structures, forbidden terms
│   ├── assertions.ts             # Zero-safety-violation, route-match, traceability assertions
│   ├── gate.ts                   # Evaluation test runner & scoring logic
│   ├── report.ts                 # Terminal summary report generator
│   └── run.ts                    # CLI runner for `npm run eval`
├── lib/
│   ├── data/                     # Data schemas, snapshot loader, provenance hierarchy
│   ├── engine/                   # PURE DETERMINISTIC ENGINE (Invariants 1–5, 7–10)
│   │   ├── answer.ts             # Turn intake state machine, routing, and block composer
│   │   ├── curriculum.ts         # 8 concepts, check questions, auto-graded missions
│   │   ├── format.ts             # Indian numbering formatting (Lakh, Crore, ₹, %, dates)
│   │   ├── metrics.ts            # P/E, P/B, ROE, ROCE, debt-to-equity, margins, volatility
│   │   ├── narrative.ts          # Template-driven dynamic natural language explanations
│   │   ├── refs.ts               # 4-rung audited reference generator
│   │   ├── risk.ts               # Risk flag detection & sector concentration guards
│   │   ├── safety.ts             # 6-pillar safety choke point & adversarial scanner
│   │   ├── score.ts              # Multi-factor scoring algorithm & shortlist selector
│   │   └── xp.ts                 # XP rewards, level tiers (L0–L4), IST daily streaks, badges
│   ├── llm/                      # LLM Provider abstraction & 6-pillar verifier
│   └── state/                    # React client state store, events logger, useBull hook
└── tests/                        # Vitest Test Suites (33 files, 684+ tests)
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm 9+

### 2. Installation
```bash
git clone https://github.com/username/bull-v0.git
cd bull-v0
npm install
```

### 3. Running All Quality Gates
Bull enforces 6 strict quality gates before any deployment:
```bash
# Gate 1: Validate static offline snapshot against Zod schemas
npm run data:check

# Gate 2: Full TypeScript compilation check (0 errors)
npm run typecheck

# Gate 3: ESLint static analysis (0 errors, 0 warnings)
npm run lint

# Gate 4: Vitest test suite execution (33 files, 684+ tests)
npm test

# Gate 5: 10 Golden Evaluation Cases Regression Gate (0 regressions)
npm run eval

# Gate 6: Next.js Production Build
npm run build
```

### 4. Development Server
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 📊 Seeded Nifty 50 Universe (12 Companies)

To ensure 100% reproducible testing, Bull v0 ships with an audited static offline snapshot of 12 constituent companies representing 8 distinct sectors:

| Ticker | Company Name | Sector | Sector Model |
|---|---|---|---|
| **TCS** | Tata Consultancy Services Ltd | Information Technology | Non-Financial |
| **INFY** | Infosys Ltd | Information Technology | Non-Financial |
| **HDFCBANK** | HDFC Bank Ltd | Banking & Financials | Financial |
| **ICICIBANK** | ICICI Bank Ltd | Banking & Financials | Financial |
| **RELIANCE** | Reliance Industries Ltd | Energy & Conglomerate | Non-Financial |
| **HINDUNILVR**| Hindustan Unilever Ltd | FMCG | Non-Financial |
| **ITC** | ITC Ltd | FMCG & Diversified | Non-Financial |
| **LT** | Larsen & Toubro Ltd | Infrastructure & Engineering | Non-Financial |
| **BHARTIARTL**| Bharti Airtel Ltd | Telecommunications | Non-Financial |
| **SUNPHARMA** | Sun Pharmaceutical Industries Ltd | Healthcare & Pharma | Non-Financial |
| **TATAMOTORS**| Tata Motors Ltd | Automobiles | Non-Financial |
| **TITAN** | Titan Company Ltd | Consumer Discretionary | Non-Financial |

---

## 🎓 Applied Literacy Academy (Curriculum §8)

The Academy transforms abstract financial terms into applied understanding using live company figures:
- **C1: What is a Share?** — Equity ownership, face value vs market value, net worth.
- **C2: Market Capitalisation** — Outstanding shares $\times$ price, Large vs Mid vs Small-Cap.
- **C3: P/E Ratio & Sector Multiples** — Earnings multiple comparison against sector median.
- **C4: Debt & Solvency** — Debt-to-Equity ($D/E$), interest coverage ratio, non-financial vs banking deposit distinction.
- **C5: Margins & Return on Capital** — Operating margin, Return on Equity ($ROE$), Return on Capital Employed ($ROCE$).
- **C6: Dividends & Cash Flow** — Dividend yield, dividend payout ratio ($DPS / EPS$).
- **C7: Volatility & Drawdown** — Trailing 1Y standard deviation, 3Y peak-to-trough max drawdown.
- **C8: Diversification & Concentration Risk** — Cross-sector allocation, portfolio risk reduction.

---

## 🛡️ SEBI Regulatory Compliance Statement

Bull v0 is an academic and educational capstone project developed at **IIIT Hyderabad**.
- **Not a Registered Investment Adviser:** Bull v0 is **not** registered with the Securities and Exchange Board of India (SEBI) as an Investment Adviser (IA) or Research Analyst (RA).
- **No Directive Advice:** Bull v0 strictly does not provide buy, sell, or hold recommendations, price targets, or expected returns on securities.
- **Educational Only:** All metrics, ratios, financial charts, and shortlist rankings are generated deterministically for financial literacy instruction. Past financial performance is not indicative of future market returns.
