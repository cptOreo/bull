# Working notes — Team 9 web app research

## Source document
`Team9_activity-1.pdf` — "Stock Discovery and Research for First-Time Investors", AI for Product Managers, IIIT Hyderabad, capstone phase 1 (activities 1–4). Team 9 "Stock-holm Syndrome": Divijh Mangtani, Rashmi Netam, Sree Lasya Muvva, Dhavla Ravi.

## Product summary (from doc)
- v0: Nifty 50 only. Profile intake → shortlist of 3–5 stocks with reasons + risks; per-stock view of key ratios, recent news, 5-year history vs Nifty 50; English + Hinglish; chat-first.
- Multi-agent: orchestrator, profile, research, news, history, shortlist, safety check.
- Hard rules: numbers computed in code and dated; news with source + date; no buy/sell/hold, target prices, return promises, or per-stock amounts; show what data doesn't show; no advice.
- Success metric: 4 of 5 test users can explain why each shortlisted stock fits them and name one risk. Guardrail: zero advice language on golden set.
- Golden dataset v0: 10 pairs (5 happy, 3 edge, 2 adversarial); rubric 3 criteria (grounded/current, fits user/clear, safe/in bounds); ship gate: criteria 1 & 3 pass all, criterion 2 avg ≥1.5 with no 0 on happy path.
- Open in doc: LLMs, free data sources, whether first screen stays rule-based, chat vs feed.

## Session constraints (user answers)
- Deliverable: research-backed build plan → research data sources/stack/competitors/constraints → spec + phased implementation plan for working v0 web app.
- Build context: long-term product after the course (plan for auth, cost controls, compliance, deployment from the start).
- Team: 4 PM students, mixed coding ability, no stack preference (research recommends).
- Budget: zero — free tiers only.
- Data freshness: EOD / dated data acceptable; every figure dated; stale data flagged.

## Confirmed findings (to verify/expand)
- SEBI circular May 2026 (May 9) "Norms for sharing and usage of price data for educational purposes": uniform 30-day lag for sharing AND usage of market price data for investor education/awareness, effective 1 July 2026; replaces 1-day sharing lag (May 2024) and 3-month usage lag (Jan 2025). NISM simulation lab exception. Source: sebi.gov.in circular 101293; Livemint; ET.
  - Implication: if positioned as investor education, prices shown must be ≥30 days old. Need to read exact scope (who is covered: educational institutions, trainers, finfluencers, platforms?).
- SEBI circular details (TaxGuru summary; CDSL copy of circular):
  - Circular No. HO/47/17/12(11)2025-MRD-POD3/I/11107/2026 dated 08 May 2026. Modifies 24 May 2024 and 29 Jan 2025 circulars. Effective 01 Jul 2026.
  - Market price data may be shared for investor education/awareness with a 30-day lag. NISM simulation lab exception: 1-day lag.
  - MIIs/intermediaries sharing data must have legal agreements with safeguards + audit trail to prevent misuse for advisory/trading.
  - "Education" = not giving investment advice, not recommending securities, not predicting prices.
  - Persons engaged solely in education must NOT use market price data of the preceding 30 days to speak/display/indicate any security name or code name, future price, advice or recommendation. Prohibited examples: "Buy XYZ now, target ₹500", "This stock will rise tomorrow", showing live charts while recommending.
  - Source URLs: sebi.gov.in circular page (101293); taxguru.in summary; CDSL PDF DP-321.
- Groww GR-1 (primary, groww.in/updates/gr-1-ai-investing-assistant-groww, 23 Oct 2026):
  - AI investing assistant, beta, opt-in. Ask GR-1 conversational research; GR-1 Insights on stock pages (pre-generated cards, live for 750 stocks); MF Prime fund reasoning.
  - Uses actual holdings, watchlists, positions, live market data; plain-language explanations; can set alerts/draft order review cards; never executes orders automatically.
  - Implication: incumbent has distribution + live data + portfolio context. Our differentiation must be goal-fit discovery for beginners, cross-broker, no-advice trust, and Hinglish.
- SEBI Jan 2025 circular (SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2025/11 dated 29 Jan 2025): association with unregistered persons; education carve-out previously barred use of market price data of preceding 3 months to name securities. Replaced by 30-day rule from 1 Jul 2026.
