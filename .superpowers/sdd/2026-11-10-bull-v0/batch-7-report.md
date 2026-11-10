# Batch 7 Implementation Report: Safety Layer & Traceability Choke Point

**Date:** 2026-11-10  
**Tasks Completed:** Tasks 27, 28, 29 (Safety Banned Patterns, Safety Exemptions Whitelist, Choke Point Scanner & Number Traceability Verifier)  
**Branch:** `subagent-Batch-7-Implementer-self-400b03e2`  

---

## 1. Commits

1. **`091201e`**: `feat(safety): add regex patterns for advice, return promises and sycophancy`
   - Added `lib/engine/safety.patterns.ts` and `tests/safety.patterns.test.ts`.
   - Implemented regex taxonomy across all 12 categories from §9.2 with hard/soft severities and text normalization.
2. **`a0262a6`**: `feat(safety): add strictly capped whitelist of exact exemptions`
   - Added `lib/engine/safety.exemptions.ts` and `tests/safety.exemptions.test.ts`.
   - Defined `APPROVED_EXEMPTIONS` strictly capped to at most 6 exact phrases.
   - Enforced exact full-string equality (no broad regex or substring exemptions).
3. **`3dda521`**: `feat(safety): implement inspectAnswer choke point and numeric traceability verifier`
   - Added `lib/engine/safety.ts`, `tests/safety.numbers.test.ts`, and `tests/safety.metamorphic.test.ts`.
   - Implemented `inspectAnswer`, `extractNumericTokens`, `verifyTraceability`, `scanText`, and `SafetyViolationError`.
   - Enforced Rule 1 (pattern checks), Rule 2 (numeric traceability against `Ref[]`), and Rule 3 (single stock boundary).
   - Preserved Invariant 1 (engine purity: zero react, next, fs, fetch, process.env, lib/llm).

---

## 2. Scope & Implementation Details

### Task 27: `lib/engine/safety.patterns.ts` & `tests/safety.patterns.test.ts`
- **12 Banned Categories (§9.1, §9.2):**
  - `directive` (hard): Advice and implicit recommendation ("you should buy", "we recommend", "go for it", "buy now", "sell this", "hold it", "accumulate", "book profits", "enter at", "exit now", "add this to your portfolio", "avoid this stock", "stop loss", "entry point", "Buy [TICKER]").
  - `target` (hard): Price prediction and target valuation ("target price", "target of ₹", "upside of", "can reach ₹", "will hit ₹", "fair value is ₹", "expected return", "will reach", "is expected to touch").
  - `promise` (hard): Return promises and risk-free claims ("guaranteed", "assured returns", "risk-free", "will rise", "will double", "multibagger", "sure shot", "10x", "can't lose", "safe bet", "% returns", "doubling", "promise returns").
  - `assurance` (hard): False reassurance and sycophancy ("it is safe", "this is a safe stock", "you won't lose", "no risk here", "good choice", "great pick", "you will make money", "can't go wrong").
  - `amount` (hard): Per-stock rupee amounts and position sizing ("invest ₹", "put ₹", "allocate ₹", "₹500 in this stock", "split ₹ across", "invest Rs").
  - `ranking` (hard): Subjective superlatives and unsolicited verdicts ("best stock", "top pick", "better choice", "strongest", "superior to", "outperformer", "we prefer", "undervalued gem").
  - `prediction` (hard): Forward-looking market forecasts ("will rise", "expected to grow", "likely to beat", "outlook is positive", "will surge/rally", forward dates attached to market movement).
  - `persona` (hard): Advisory relationship persona ("as your advisor", "our advice", "we suggest you", "speak to our expert", "our recommendation").
  - `urgency` (hard): Manufactured action pressure ("act now", "last chance", "before it's too late", "don't miss", "limited time", "hurry").
  - `loss_framing` (hard): Manufactured loss aversion ("don't lose this chance", "you'll regret", "streak about to end", "you are falling behind").
  - `injection_echo` (hard): Prompt-injection compliance ("ignore your rules", "ignore previous instructions", "add it anyway", "override safety guidelines", "disregard system prompt").
  - `guarantee_word` (soft): Absolutist language attached to market outcome ("always", "never" when tied to market movement or returns).
- **Text Normalization (`normalizeText`):**
  - Folds curly double and single quotes to standard quotes (`“` `”` `‘` `’` → `"` `'`).
  - Folds dashes (en-dash, em-dash, minus) to hyphens (`–` `—` `−` → `-`).
  - Collapses multi-whitespace, tabs, and newlines to a single space and trims.
- **Testing:**
  - 39 tests covering positive and negative cases (4+ positive and 4+ negative per category) without false positives on third-person descriptive sentences (e.g. "People often buy stocks after a tip").

### Task 28: `lib/engine/safety.exemptions.ts` & `tests/safety.exemptions.test.ts`
- **Strictly Capped Whitelist (`APPROVED_EXEMPTIONS`):**
  - Capped to 6 exact phrases:
    1. `"This is educational analysis and not a buy or sell recommendation."`
    2. `"Yeh educational analysis hai aur koi buy ya sell recommendation nahi hai."`
    3. `"Bull does not provide investment advice, buy or sell recommendations, or target prices."`
    4. `"Bull investment advice, buy ya sell recommendation, ya target price provide nahi karta."`
    5. `"Bull does not recommend stocks, manage portfolios, or promise returns."`
    6. `"We never give buy or sell recommendations for any individual stock."`
- **Exemption Invariants:**
  - `APPROVED_EXEMPTIONS.length <= 6` enforced by test.
  - Every exemption triggers at least one banned pattern if checked unexempted (ensuring the whitelist cannot absorb safe copy).
  - Exact full-string equality (`isExempt(text)`) only: substring matches and broad regex matching are blocked. Modifying an exemption by appending or prepending words fails exemption check and triggers violations.

### Task 29: `lib/engine/safety.ts`, `tests/safety.numbers.test.ts`, `tests/safety.metamorphic.test.ts`
- **Choke Point Scanner (`inspectAnswer(answer: Answer)`):**
  - Walks every user-visible string field across all blocks in `Answer.blocks` (`text`, `intake_question`, `choices`, `shortlist`, `stock_detail`, `comparison`, `news`, `coverage_miss`, `boundary`, `limitations`, `education_note`).
  - **Rule 1 (Banned Pattern Check):** Scans all non-exempt text against banned pattern taxonomy; violations record rule, category, severity, match, and location.
  - **Rule 2 (Numeric Traceability Verifier):**
    - Extracts all numeric tokens using `extractNumericTokens(text)`.
    - Masks non-claim entities (ISO dates, written dates like `31 October 2026`, FY years, version strings, Ref IDs, index name `Nifty 50`, standalone 4-digit calendar years).
    - Checks that every single numeric token resolves to a corresponding `Ref` in `answer.refs` (within ±0.01 tolerance, percentage scaling, or formatted string equality).
    - Any unattributed number produces a Rule 2 failure.
  - **Rule 3 (Single Stock Boundary Check):**
    - Shortlist block cannot contain exactly 1 card or present a single stock recommendation.
  - **Engine Purity:** Zero imports from react, next, fs, fetch, process.env, or lib/llm.
- **Testing:**
  - `tests/safety.numbers.test.ts`: 15 tests verifying extraction of percentages, currencies, crore values, multipliers, exclusion of non-claim tokens, ±0.01 tolerance, percentage scaling (0.20 vs 20%), and injection rejection.
  - `tests/safety.metamorphic.test.ts`: 7 tests verifying metamorphic invariants under casing changes, whitespace mutations, quotes/dashes, banned phrase injection, and Rule 3 single-stock rejection.

---

## 3. Verification Results

- **Safety Test Suite:**
  ```bash
  npx vitest run tests/safety.patterns.test.ts tests/safety.exemptions.test.ts tests/safety.numbers.test.ts tests/safety.metamorphic.test.ts
  ```
  **Result:** 4 test files passed, 65 tests passed.

- **Full Project Test Suite:**
  ```bash
  npm test
  ```
  **Result:** 21 test files passed, 345 tests passed.

- **Typecheck:**
  ```bash
  npm run typecheck
  ```
  **Result:** Exit 0 (zero errors).

- **Lint:**
  ```bash
  npm run lint
  ```
  **Result:** Exit 0 (zero errors, zero warnings).
