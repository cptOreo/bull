import { snapshot as defaultSnapshot } from "@/lib/data/snapshot";
import type { Snapshot, Stock } from "@/lib/data/schema";
import type {
  CheckItem,
  ConceptId,
  LearningEvent,
  MasteryState,
  Mission,
} from "./types";

export type ConceptDefinition = {
  id: ConceptId;
  title: string;
  summary: string;
  unlockCondition: string;
  unlockHint: string;
  step1Idea: string;
  step2OnStockTemplate: string;
  step3WhatItDoesNotTellYou: string;
  workedExample: string;
  serves: string;
};

export const CONCEPTS: ConceptDefinition[] = [
  {
    id: "C1",
    title: "A share is part ownership",
    summary: "Every share represents a fractional piece of a real company, not a lottery ticket.",
    unlockCondition: "First stock page opened",
    unlockHint: "Open any stock page to learn how shares represent company ownership.",
    step1Idea:
      "A stock or share represents fractional ownership of an operating business. When you buy one share, you become a co-owner entitled to your proportion of company profits, assets, and cash flows.",
    step2OnStockTemplate:
      "The company has {shareCountCr} crore shares. At ₹{price}, its total market value is about ₹{marketCapCr} crore.",
    step3WhatItDoesNotTellYou:
      "Share count alone does not dictate business quality or future growth prospects.",
    workedExample:
      "The company has 412 crore shares. At ₹1,480, its market value is about ₹6.1 lakh crore.",
    serves: "Ownership misconception; A2",
  },
  {
    id: "C2",
    title: "Price, market cap and what moves a price",
    summary: "Market cap equals share price times total shares; price moves reflect changing supply and demand.",
    unlockCondition: "First chart viewed",
    unlockHint: "View a price chart for any company to explore how market valuation fluctuates over time.",
    step1Idea:
      "Market capitalisation is the total market value of all company shares combined. When the share price moves while the total share count remains unchanged, the company's entire market valuation moves by the exact same proportion.",
    step2OnStockTemplate:
      "The price moved from ₹{startPrice} to ₹{endPrice} over five years. Market cap moved by the same factor because the share count was steady.",
    step3WhatItDoesNotTellYou:
      "A rising share price does not guarantee that underlying business earnings have grown at the same rate.",
    workedExample:
      "The price moved from ₹1,210 to ₹1,480 over five years. Market cap moved by the same factor because the share count did not change.",
    serves: "H2",
  },
  {
    id: "C3",
    title: "P/E and why the sector matters",
    summary: "Price-to-Earnings tells you how much investors pay per rupee of profit, which varies by industry.",
    unlockCondition: "First shortlist generated",
    unlockHint: "Generate your first shortlist to compare valuations across industry sectors.",
    step1Idea:
      "The Price-to-Earnings (P/E) ratio compares what you pay per share to the annual profit per share (EPS). Comparing P/E is only meaningful against peer companies operating in the same industry with similar business economics.",
    step2OnStockTemplate:
      "At ₹{price} and EPS of ₹{eps}, P/E is {pe}. The sector median is {sectorMedianPe}.",
    step3WhatItDoesNotTellYou:
      "A low P/E can indicate an undervalued business, but can also signal declining future earnings or fundamental risks.",
    workedExample:
      "At ₹1,480 and FY2026 EPS of ₹58.4, P/E is 25.3. The sector median is 22.1.",
    serves: "H1, H5",
  },
  {
    id: "C4",
    title: "Debt: debt-to-equity and interest cover",
    summary: "Debt magnifies business gains but increases solvency risk during difficult years.",
    unlockCondition: "Opening a stock with D/E of 0.3 or more, or any bank or NBFC",
    unlockHint: "Open a company with meaningful debt or a bank to see how financial leverage is measured.",
    step1Idea:
      "Debt-to-Equity (D/E) measures borrowed money relative to shareholders' capital. Interest cover indicates how many times operating earnings cover mandatory annual interest obligations.",
    step2OnStockTemplate:
      "Total debt is ₹{debtCr} crore and net worth is ₹{netWorthCr} crore, giving a D/E of {deRatio}. Interest cover is {interestCover} times.",
    step3WhatItDoesNotTellYou:
      "Low debt does not prevent operational missteps or technological disruption from shrinking sales.",
    workedExample:
      "Debt is ₹18,300 crore and net worth is ₹61,000 crore, so D/E is 0.30. Interest cover is 7.2 times.",
    serves: "H4",
  },
  {
    id: "C5",
    title: "Comparison: Margins, ROE and ROCE",
    summary: "Profitability ratios evaluate how efficiently management turns capital and sales into net profit.",
    unlockCondition: "Opening a comparison or stock page",
    unlockHint: "Compare two companies to inspect how operating margins and returns on equity differ.",
    step1Idea:
      "Return on Equity (ROE) shows the net profit generated for every rupee of shareholders' equity. Operating margins indicate how much profit remains from each rupee of revenue after paying production and overhead expenses.",
    step2OnStockTemplate:
      "Profit after tax is ₹{patCr} crore on net worth of ₹{netWorthCr} crore, giving an ROE of {roePct}%.",
    step3WhatItDoesNotTellYou:
      "High ROE can be artificially boosted by heavy borrowing rather than superior operational efficiency.",
    workedExample:
      "Profit after tax is ₹24,700 crore on net worth of ₹92,000 crore, so ROE is 26.8%.",
    serves: "H1, H5",
  },
  {
    id: "C6",
    title: "Dividends and payout",
    summary: "Dividends are cash returns distributed to shareholders out of corporate earnings.",
    unlockCondition: "Opening a stock with a dividend yield above zero",
    unlockHint: "Open any dividend-paying company to see how dividend yield and cash payouts are calculated.",
    step1Idea:
      "Dividend yield is the annual cash dividend per share expressed as a percentage of current share price. Payout ratio shows what proportion of annual profits is distributed to shareholders versus retained in the business.",
    step2OnStockTemplate:
      "Dividend per share was ₹{dps} and the market price was ₹{price}, producing a dividend yield of {yieldPct}%.",
    step3WhatItDoesNotTellYou:
      "Dividends are discretionary and can be cut by the board of directors if company fortunes reverse.",
    workedExample:
      "Dividend per share was ₹21 and the price was ₹1,480, so the yield is 1.4%.",
    serves: "H5",
  },
  {
    id: "C7",
    title: "Reading a five-year chart, including drawdown and corporate actions",
    summary: "Historical charts illustrate past market cycles, maximum drawdowns, and structural corporate changes.",
    unlockCondition: "Viewing a chart on a stock whose five-year drawdown is deeper than 20%",
    unlockHint: "Inspect a five-year chart on a cyclical or volatile stock to examine peak-to-trough drawdowns.",
    step1Idea:
      "Maximum drawdown measures the largest percentage decline from a previous peak to a subsequent trough before a new peak is reached. Major corporate actions (splits, demergers) require segmented charts so artificial price drops are not mistaken for real losses.",
    step2OnStockTemplate:
      "The stock experienced a maximum drawdown of {maxDrawdownPct}% across historical market pullbacks.",
    step3WhatItDoesNotTellYou:
      "Past volatility and historical recoveries do not guarantee similar resilience in future downturns.",
    workedExample:
      "The price fell 38% from its 2021 peak to its 2022 low before recovering.",
    serves: "H3, E2, success metric",
  },
  {
    id: "C8",
    title: "Diversification and concentration",
    summary: "Spreading capital across multiple sectors limits damage when one industry encounters headwinds.",
    unlockCondition: "Shortlist generated with at least two sectors",
    unlockHint: "Generate a shortlist with multiple sectors to learn how sector caps defend against concentration risk.",
    step1Idea:
      "Holding stocks across different economic sectors protects an overall portfolio from industry-specific shocks. Capping exposure to any single sector ensures no lone regulatory or economic event imperils your capital.",
    step2OnStockTemplate:
      "{differentSectorsCount} of your {totalPicks} picks are in distinct sectors; your largest sector represents {largestSectorPct}% of the list.",
    step3WhatItDoesNotTellYou:
      "Diversification reduces idiosyncratic sector risk, but does not eliminate broader macroeconomic market pullbacks.",
    workedExample:
      "Four of your five picks are in different sectors; one sector is 40% of the list.",
    serves: "A1, success metric",
  },
];

export const CONCEPT_CHECKS: CheckItem[] = [
  // C1: A share is part ownership
  {
    id: "c1_check_1",
    conceptId: "C1",
    question: "If you buy 100 shares of a company with 10 crore total shares, what do you own?",
    options: [
      "A debt note that the company must pay back with interest",
      "A proportional 1-in-a-million ownership stake in the company's net assets and earnings",
      "A guaranteed claim to receive daily dividends from company sales",
    ],
    correctIndex: 1,
    explanation:
      "Shares represent fractional equity ownership in the business, not a loan or guaranteed payment.",
  },
  {
    id: "c1_check_2",
    conceptId: "C1",
    question:
      "A company doubles its share price from ₹500 to ₹1,000 without issuing new shares. What happened to its market capitalisation?",
    options: [
      "Market capitalisation doubled because market cap is share price multiplied by total shares",
      "Market capitalisation stayed unchanged because total shares remained constant",
      "Market capitalisation halved because higher price makes each share harder to buy",
    ],
    correctIndex: 0,
    explanation:
      "Market capitalisation equals total shares times price per share, so doubling the price doubles market cap if shares stay constant.",
  },
  {
    id: "c1_check_3",
    conceptId: "C1",
    question:
      "Company A has a share price of ₹2,500 and 1 crore shares. Company B has a share price of ₹50 and 100 crore shares. Which company has a larger market value?",
    options: [
      "Company A, because ₹2,500 is much higher than ₹50",
      "Company B, because ₹50 × 100 crore (₹5,000 crore) is greater than ₹2,500 × 1 crore (₹2,500 crore)",
      "They are equal because share prices always balance out total shares",
    ],
    correctIndex: 1,
    explanation:
      "Company size is measured by market cap (shares × price), not share price alone.",
  },
  {
    id: "c1_check_4",
    conceptId: "C1",
    question:
      "When a company issues new shares to fund an acquisition, what happens to existing shareholders if profit does not grow?",
    options: [
      "Their percentage ownership in the company is diluted across more total shares",
      "Their share price automatically doubles to compensate them",
      "Nothing changes because new shares are kept in reserve by the exchange",
    ],
    correctIndex: 0,
    explanation:
      "Issuing new shares expands the total share count, diluting the percentage of ownership held by existing shareholders.",
  },

  // C2: Price, market cap and what moves a price
  {
    id: "c2_check_1",
    conceptId: "C2",
    question:
      "Why can two companies with the same ₹1,000 share price have completely different total company valuations?",
    options: [
      "Because share price alone ignores how many total shares each company has issued",
      "Because brokers charge different commission rates for different industries",
      "Because market price is fixed by regulators while valuation floats",
    ],
    correctIndex: 0,
    explanation:
      "Total value (market cap) is share count multiplied by share price; share price alone says nothing about company size.",
  },
  {
    id: "c2_check_2",
    conceptId: "C2",
    question:
      "If a company executes a 2-for-1 stock split, doubling the number of shares, what is the expected immediate effect on share price (all else equal)?",
    options: [
      "The share price doubles because there are twice as many shares",
      "The share price halves because the company value is split across twice as many shares",
      "The share price stays the same and total market value doubles instantly",
    ],
    correctIndex: 1,
    explanation:
      "A stock split divides the existing business into more pieces without creating new value, so price per share adjusts proportionately.",
  },
  {
    id: "c2_check_3",
    conceptId: "C2",
    question:
      "Which factor directly increases a company's market capitalisation without any change in fundamental earnings?",
    options: [
      "Buyers bidding up the market price per share on the stock exchange",
      "An increase in depreciation charged on company equipment",
      "The company paying out cash dividends to bank accounts",
    ],
    correctIndex: 0,
    explanation:
      "Market cap is market price multiplied by shares; when market participants pay higher prices, market cap expands.",
  },
  {
    id: "c2_check_4",
    conceptId: "C2",
    question:
      "If Company X's share count remains 10 crore and the price drops from ₹400 to ₹300, how did market cap change?",
    options: [
      "Market cap fell from ₹4,000 crore to ₹3,000 crore",
      "Market cap increased by ₹1,000 crore due to higher trading volume",
      "Market cap cannot be calculated without next year's sales projection",
    ],
    correctIndex: 0,
    explanation:
      "With 10 crore shares, 10 × ₹400 = ₹4,000 crore drops to 10 × ₹300 = ₹3,000 crore.",
  },

  // C3: P/E and why the sector matters
  {
    id: "c3_check_1",
    conceptId: "C3",
    question: "What does a Price-to-Earnings (P/E) ratio of 25 mean?",
    options: [
      "Investors are paying ₹25 for every ₹1 of annual earnings per share",
      "The company will pay a guaranteed ₹25 dividend per share this year",
      "The share price is guaranteed to increase by 25% over the next 12 months",
    ],
    correctIndex: 0,
    explanation:
      "P/E expresses the current share price as a multiple of annual earnings per share (EPS).",
  },
  {
    id: "c3_check_2",
    conceptId: "C3",
    question:
      "Why is it misleading to directly compare the P/E of a fast-growing IT software company with a capital-intensive power utility?",
    options: [
      "Different sectors have different capital requirements, growth rates, and margins that justify different valuation multiples",
      "Power utilities are illegal to evaluate using earnings multiples",
      "IT companies do not report earnings per share under Indian accounting rules",
    ],
    correctIndex: 0,
    explanation:
      "Business models, reinvestment needs, and structural growth vary dramatically by sector, making cross-sector P/E comparison unreliable.",
  },
  {
    id: "c3_check_3",
    conceptId: "C3",
    question:
      "If a company has a share price of ₹600 and trailing twelve months EPS of ₹30, what is its P/E ratio?",
    options: ["15", "20", "18,000"],
    correctIndex: 1,
    explanation: "P/E is Price divided by EPS: ₹600 / ₹30 = 20.",
  },
  {
    id: "c3_check_4",
    conceptId: "C3",
    question:
      "A stock has a P/E of 12 while its industry median P/E is 30. Does this definitely mean the stock is a bargain?",
    options: [
      "Yes, a lower P/E always guarantees superior future investment returns",
      "No, a low P/E can also reflect poor asset quality, falling earnings, or governance risks",
      "Yes, because any stock below industry median is subsidized by the exchange",
    ],
    correctIndex: 1,
    explanation:
      "A low P/E may reflect justifiable market skepticism about future earnings durability or business distress ('value trap').",
  },

  // C4: Debt: debt-to-equity and interest cover
  {
    id: "c4_check_1",
    conceptId: "C4",
    question: "What does a Debt-to-Equity (D/E) ratio of 0.50 indicate?",
    options: [
      "The company has ₹0.50 of debt for every ₹1.00 of shareholder net worth",
      "Half of the company's daily sales are confiscated by lenders",
      "The company's stock price will fall by 50% if interest rates rise",
    ],
    correctIndex: 0,
    explanation:
      "D/E measures total debt relative to shareholder equity (net worth).",
  },
  {
    id: "c4_check_2",
    conceptId: "C4",
    question: "What does an interest coverage ratio of 6.0 times indicate?",
    options: [
      "Operating profit (EBIT) is 6 times larger than annual interest expense",
      "The company pays interest 6 times every calendar quarter",
      "Lenders can seize 60% of company shares upon default",
    ],
    correctIndex: 0,
    explanation:
      "Interest coverage (EBIT / Interest Expense) shows how many times operating profit covers annual interest payments.",
  },
  {
    id: "c4_check_3",
    conceptId: "C4",
    question:
      "Why is standard D/E calculated differently or omitted for commercial banks and NBFCs?",
    options: [
      "Taking deposits and borrowing to lend is the core business of financial firms, so normal non-financial debt ratios do not apply",
      "Financial institutions are exempt from publishing financial statements in India",
      "Banks carry zero liability because customer deposits are legally equity",
    ],
    correctIndex: 0,
    explanation:
      "Financial institutions use leverage as their primary operating model; their financial health is assessed via capital adequacy (CRAR) and NPA metrics.",
  },
  {
    id: "c4_check_4",
    conceptId: "C4",
    question:
      "Company A has operating profit of ₹100 crore and interest expense of ₹50 crore (interest cover = 2x). If profit drops 60% to ₹40 crore, what happens?",
    options: [
      "Operating profit (₹40 crore) is now less than interest owed (₹50 crore), indicating financial stress",
      "Interest payments automatically drop by 60% to match operating profit",
      "The company's lenders must convert all debt to equity immediately",
    ],
    correctIndex: 0,
    explanation:
      "Interest payments are fixed contractual obligations; a thin interest cover leaves little cushion if profits drop.",
  },

  // C5: Comparison: Margins, ROE and ROCE
  {
    id: "c5_check_1",
    conceptId: "C5",
    question: "What does Return on Equity (ROE) measure?",
    options: [
      "How efficiently a company generates net income from each rupee of shareholders' equity",
      "The percentage change in the company's share price over the past year",
      "The exact annual dividend percentage deposited into investor accounts",
    ],
    correctIndex: 0,
    explanation:
      "ROE is Profit After Tax divided by Shareholders' Net Worth, showing profitability per unit of equity.",
  },
  {
    id: "c5_check_2",
    conceptId: "C5",
    question:
      "If Company P has ₹200 crore PAT on ₹1,000 crore net worth, what is its ROE?",
    options: ["10%", "20%", "50%"],
    correctIndex: 1,
    explanation: "ROE = (₹200 crore / ₹1,000 crore) × 100 = 20%.",
  },
  {
    id: "c5_check_3",
    conceptId: "C5",
    question:
      "Why might an analyst check Return on Capital Employed (ROCE) alongside ROE for debt-heavy businesses?",
    options: [
      "High debt can artificially inflate ROE while ROCE evaluates returns on all capital (debt plus equity)",
      "ROCE is only calculated when a company makes negative net profits",
      "ROE is strictly for software firms while ROCE is strictly for retailers",
    ],
    correctIndex: 0,
    explanation:
      "Financial leverage boosts ROE by reducing the equity base; ROCE measures how effectively total operating capital is deployed.",
  },
  {
    id: "c5_check_4",
    conceptId: "C5",
    question:
      "When comparing two firms in the same industry, Company X has a 22% operating margin and Company Y has a 7% operating margin. What does this show?",
    options: [
      "Company X retains 22 paise of operating profit per rupee of revenue, showing greater pricing power or cost efficiency",
      "Company Y is safer because thin margins protect against tax inspections",
      "Margins cannot be compared between firms selling similar goods",
    ],
    correctIndex: 0,
    explanation:
      "Operating margin (Operating Profit / Revenue) reflects pricing power, scale, and operational cost control.",
  },

  // C6: Dividends and payout
  {
    id: "c6_check_1",
    conceptId: "C6",
    question: "What is dividend yield?",
    options: [
      "Annual dividend per share divided by current share price, expressed as a percentage",
      "The total profit retained by the company for building factories",
      "The capital gain earned when selling shares on the stock exchange",
    ],
    correctIndex: 0,
    explanation:
      "Dividend yield represents the cash return on current share price from declared dividends.",
  },
  {
    id: "c6_check_2",
    conceptId: "C6",
    question:
      "A stock trades at ₹500 and pays an annual dividend of ₹15 per share. What is its dividend yield?",
    options: ["1.5%", "3.0%", "7.5%"],
    correctIndex: 1,
    explanation: "Dividend yield = (₹15 / ₹500) × 100 = 3.0%.",
  },
  {
    id: "c6_check_3",
    conceptId: "C6",
    question: "What does a dividend payout ratio of 40% signify?",
    options: [
      "The company distributes 40% of its net profit as dividends and retains 60% for operations or growth",
      "The share price is guaranteed to increase by 40% each year",
      "Tax authorities deduct 40% of dividend income at source",
    ],
    correctIndex: 0,
    explanation:
      "Payout ratio is total dividends divided by net income, showing how much profit is returned to shareholders versus retained.",
  },
  {
    id: "c6_check_4",
    conceptId: "C6",
    question:
      "Can a company legally reduce or eliminate its dividend next year if business conditions deteriorate?",
    options: [
      "Yes, dividends are discretionary payments declared by the board of directors, not fixed obligations",
      "No, once declared, companies are legally forced to maintain the same dividend forever",
      "Only if the company pays a mandatory fee to the central bank",
    ],
    correctIndex: 0,
    explanation:
      "Dividends are not guaranteed contractual debts; directors adjust dividends according to financial performance and capital needs.",
  },

  // C7: Drawdowns & volatility
  {
    id: "c7_check_1",
    conceptId: "C7",
    question:
      "What does a maximum drawdown of 35% on a five-year chart mean?",
    options: [
      "The largest percentage decline from a historical peak to subsequent trough before a new peak was achieved was 35%",
      "The stock dropped 35% on every single trading day over five years",
      "The stock is guaranteed to recover 35% from today's closing price",
    ],
    correctIndex: 0,
    explanation:
      "Maximum drawdown measures the steepest peak-to-trough drop an investor could have experienced in that period.",
  },
  {
    id: "c7_check_2",
    conceptId: "C7",
    question:
      "Why does Bull v0 split chart segments around major corporate actions like demergers or massive bonus issues?",
    options: [
      "To prevent unadjusted artificial price drops from being mistaken for real business crashes",
      "To reduce the file size of the chart graphic on mobile devices",
      "Because SEBI forbids continuous chart lines longer than 18 months",
    ],
    correctIndex: 0,
    explanation:
      "Structural corporate restructuring alters share count and capital structure; unadjusted charts distort historical comparisons.",
  },
  {
    id: "c7_check_3",
    conceptId: "C7",
    question:
      "If Stock A has an annualized volatility of 32% and Stock B has 14%, what does this describe about price swings?",
    options: [
      "Stock A has historically experienced substantially wider price fluctuations than Stock B",
      "Stock A guarantees more than double the long-term profits of Stock B",
      "Stock B is an unlisted shell company with no trading activity",
    ],
    correctIndex: 0,
    explanation:
      "Volatility measures the dispersion and magnitude of day-to-day or month-to-month price movements.",
  },
  {
    id: "c7_check_4",
    conceptId: "C7",
    question:
      "A stock hit a peak of ₹1,000, fell to ₹600, and later rallied back to ₹900. What was its drawdown from that peak?",
    options: ["40%", "10%", "60%"],
    correctIndex: 0,
    explanation:
      "Drawdown from ₹1,000 to ₹600 is (1,000 - 600) / 1,000 = 400 / 1,000 = 40%.",
  },

  // C8: Diversification & sector risk
  {
    id: "c8_check_1",
    conceptId: "C8",
    question:
      "Why does holding stocks across different industry sectors reduce portfolio risk?",
    options: [
      "Adverse events impacting one specific sector (like oil prices or regulatory tariffs) do not impact all sectors equally",
      "Diversification makes all stocks immune to broader market downturns",
      "Brokerage apps waive all maintenance fees when 5 sectors are held",
    ],
    correctIndex: 0,
    explanation:
      "Sector diversification mitigates idiosyncratic, industry-specific risks by spreading exposure across uncorrelated revenue drivers.",
  },
  {
    id: "c8_check_2",
    conceptId: "C8",
    question:
      "If an investor holds 5 stocks and 3 of them are in the Banking sector, what is the banking sector concentration?",
    options: ["60%", "30%", "20%"],
    correctIndex: 0,
    explanation:
      "3 out of 5 equals 3 / 5 = 60% sector concentration.",
  },
  {
    id: "c8_check_3",
    conceptId: "C8",
    question:
      "A friend tells you: 'Put all your savings into this single penny stock to double your money in two weeks.' What is the prudent assessment?",
    options: [
      "Concentrating in a single speculative stock creates severe capital loss risk with no safety margin",
      "Follow the tip immediately because short-term doubling is common and risk-free",
      "Borrow money to double the position size",
    ],
    correctIndex: 0,
    explanation:
      "No-FOMO principle: High return promises without risk disclosure are speculative; high concentration amplifies permanent loss risk.",
  },
  {
    id: "c8_check_4",
    conceptId: "C8",
    question:
      "Why does Bull v0 cap shortlisted stocks at a maximum of two companies per sector?",
    options: [
      "To enforce structural sector diversity and prevent concentration risk in beginner portfolios",
      "Because Indian stock exchanges only allow two companies per sector to be listed",
      "To keep the total app download size under 5 megabytes",
    ],
    correctIndex: 0,
    explanation:
      "Capping picks per sector prevents accidental over-concentration in one industry group.",
  },
];

export const MISSIONS: Mission[] = [
  {
    conceptId: "C1",
    prompt: "Given market cap and share count, compute price per share",
    expectedValue: 1480,
    tolerancePct: 1.0,
    unit: "INR",
    formulaNote: "Price = Market Cap / Share Count",
  },
  {
    conceptId: "C2",
    prompt:
      "Given two prices and unchanged share count, decide whether market cap rose, fell or cannot be told",
    expectedValue: "rose",
    unit: "category",
    formulaNote: "Market cap moves in the same direction as price when share count is unchanged",
  },
  {
    conceptId: "C3",
    prompt: "Given price and EPS, compute P/E",
    expectedValue: 25.3,
    toleranceAbsolute: 0.1,
    unit: "times",
    formulaNote: "P/E = Price / Earnings Per Share",
  },
  {
    conceptId: "C4",
    prompt: "Given total debt and net worth, compute D/E",
    expectedValue: 0.3,
    toleranceAbsolute: 0.02,
    unit: "ratio",
    formulaNote: "D/E = Total Debt / Net Worth",
  },
  {
    conceptId: "C5",
    prompt: "Given PAT and net worth, compute ROE",
    expectedValue: 26.8,
    toleranceAbsolute: 0.5,
    unit: "%",
    formulaNote: "ROE = (Profit After Tax / Net Worth) * 100",
  },
  {
    conceptId: "C6",
    prompt: "Given DPS and price, compute yield",
    expectedValue: 1.4,
    toleranceAbsolute: 0.1,
    unit: "%",
    formulaNote: "Dividend Yield = (Dividend Per Share / Price) * 100",
  },
  {
    conceptId: "C7",
    prompt: "Read the chart and enter the maximum drawdown",
    expectedValue: 38.0,
    toleranceAbsolute: 3.0,
    unit: "%",
    formulaNote: "Max Drawdown = ((Peak - Trough) / Peak) * 100",
  },
  {
    conceptId: "C8",
    prompt: "Given the shortlist's sector counts, compute the largest sector share",
    expectedValue: 40.0,
    toleranceAbsolute: 2.0,
    unit: "%",
    formulaNote: "Largest Sector Share = (Max Sector Count / Total Picks) * 100",
  },
];

const MISSIONS_BY_CONCEPT = new Map<ConceptId, Mission>(
  MISSIONS.map((m) => [m.conceptId, m]),
);

export function getChecksForConcept(conceptId: ConceptId): CheckItem[] {
  return CONCEPT_CHECKS.filter((item) => item.conceptId === conceptId);
}

export function getMissionForConcept(conceptId: ConceptId): Mission {
  const m = MISSIONS_BY_CONCEPT.get(conceptId);
  if (!m) {
    throw new Error(`Unknown concept id: ${conceptId}`);
  }
  return m;
}

/** Evaluates stock-specific unlock criteria against the snapshot. */
function checkStockCriteria(stock: Stock): {
  hasDebt: boolean;
  hasDividend: boolean;
  hasDrawdown: boolean;
} {
  const annual = stock.financials.annual.value;
  const latestFY = annual && annual.length > 0 ? annual[annual.length - 1] : null;

  // C4: D/E >= 0.3 or bank/financial
  const isBank =
    stock.sectorModel === "financial" || stock.sectorId === "financial";
  let hasDebt = isBank;
  if (!hasDebt && latestFY && latestFY.netWorthCr > 0) {
    const de = latestFY.totalDebtCr / latestFY.netWorthCr;
    if (de >= 0.3) hasDebt = true;
  }

  // C6: DPS > 0
  const hasDividend = latestFY ? latestFY.dpsInr > 0 : false;

  // C7: Drawdown > 20%
  let hasDrawdown = false;
  const points = stock.prices.value?.points ?? [];
  if (points.length > 0) {
    let peak = points[0].close;
    let maxDd = 0;
    for (const pt of points) {
      if (pt.close > peak) peak = pt.close;
      if (peak > 0) {
        const dd = (peak - pt.close) / peak;
        if (dd > maxDd) maxDd = dd;
      }
    }
    if (maxDd > 0.2) {
      hasDrawdown = true;
    }
  }

  return { hasDebt, hasDividend, hasDrawdown };
}

export function evaluateUnlocks(
  events: LearningEvent[],
  snap?: Snapshot,
): Record<ConceptId, boolean> {
  const currentSnapshot = snap ?? defaultSnapshot;
  const stocksByTicker = new Map<string, Stock>(
    currentSnapshot.stocks.map((s) => [s.ticker, s]),
  );

  const unlocks: Record<ConceptId, boolean> = {
    C1: false,
    C2: false,
    C3: false,
    C4: false,
    C5: false,
    C6: false,
    C7: false,
    C8: false,
  };

  for (const e of events) {
    // Explicit concept markers
    if (e.conceptId && e.conceptId in unlocks) {
      unlocks[e.conceptId] = true;
    }

    if (e.type === "stock_viewed") {
      unlocks.C1 = true;
      if (e.ticker) {
        const stock = stocksByTicker.get(e.ticker);
        if (stock) {
          const { hasDebt, hasDividend, hasDrawdown } = checkStockCriteria(stock);
          if (hasDebt) unlocks.C4 = true;
          if (hasDividend) unlocks.C6 = true;
          if (hasDrawdown) unlocks.C7 = true;
        }
      }
      if (e.data) {
        if (typeof e.data.debtToEquity === "number" && e.data.debtToEquity >= 0.3) unlocks.C4 = true;
        if (e.data.isBank === true) unlocks.C4 = true;
        if (typeof e.data.dps === "number" && e.data.dps > 0) unlocks.C6 = true;
        if (typeof e.data.drawdown === "number" && e.data.drawdown > 20) unlocks.C7 = true;
      }
    }

    if (e.type === "chart_viewed") {
      unlocks.C2 = true;
      if (e.ticker) {
        const stock = stocksByTicker.get(e.ticker);
        if (stock) {
          const { hasDrawdown } = checkStockCriteria(stock);
          if (hasDrawdown) unlocks.C7 = true;
        }
      }
      if (e.data && typeof e.data.drawdown === "number" && e.data.drawdown > 20) {
        unlocks.C7 = true;
      }
    }

    if (e.type === "shortlist_generated") {
      unlocks.C3 = true;
      const sectorCount =
        (typeof e.data?.sectorCount === "number" && e.data.sectorCount) ||
        (typeof e.data?.sectors === "number" && e.data.sectors) ||
        (Array.isArray(e.data?.sectors) && e.data.sectors.length);
      // If explicit sector count is provided, check if >= 2. If not specified, default shortlist has multiple sectors
      if (sectorCount === false || sectorCount === undefined || sectorCount >= 2) {
        unlocks.C8 = true;
      }
    }

    if (e.type === "comparison_viewed") {
      unlocks.C5 = true;
    }
  }

  return unlocks;
}

export function isConceptUnlocked(
  conceptId: ConceptId,
  events: LearningEvent[],
  snap?: Snapshot,
): boolean {
  const unlocks = evaluateUnlocks(events, snap);
  return Boolean(unlocks[conceptId]);
}

export type ConceptStateOptions = {
  snapshot?: Snapshot;
  shortlistedTickers?: string[];
};

const MASTERY_RANK: Record<MasteryState, number> = {
  locked: 0,
  seen: 1,
  practised: 2,
  applied: 3,
  mastered: 4,
};

export function getConceptState(
  conceptId: ConceptId,
  events: LearningEvent[],
  options?: ConceptStateOptions | string[],
): MasteryState {
  const opts: ConceptStateOptions = Array.isArray(options)
    ? { shortlistedTickers: options }
    : (options ?? {});

  const unlocked = isConceptUnlocked(conceptId, events, opts.snapshot);
  if (!unlocked) {
    return "locked";
  }

  // Count correct check items (distinct by itemId, or distinct events)
  const correctCheckEvents = events.filter(
    (e) => e.type === "check_answered_correct" && e.conceptId === conceptId,
  );

  const distinctItemIds = new Set<string>();
  let distinctCheckCount = 0;
  for (const ce of correctCheckEvents) {
    if (ce.itemId) {
      distinctItemIds.add(ce.itemId);
    }
  }
  distinctCheckCount =
    distinctItemIds.size > 0 ? distinctItemIds.size : correctCheckEvents.length;

  const hasAtLeastOneCorrectCheck = distinctCheckCount >= 1;
  const hasAtLeastTwoCorrectChecks = distinctCheckCount >= 2;

  // Check mission passed on shortlisted stock (or shortlist itself for C8)
  const missionPassedEvents = events.filter(
    (e) => e.type === "mission_passed" && e.conceptId === conceptId,
  );

  let missionPassedOnShortlist = false;
  if (missionPassedEvents.length > 0) {
    if (!opts.shortlistedTickers || opts.shortlistedTickers.length === 0) {
      missionPassedOnShortlist = true;
    } else if (conceptId === "C8") {
      missionPassedOnShortlist = true;
    } else {
      const allowed = new Set(opts.shortlistedTickers);
      missionPassedOnShortlist = missionPassedEvents.some(
        (m) => (m.ticker && allowed.has(m.ticker)) || !m.ticker,
      );
    }
  }

  let state: MasteryState = "seen";
  if (hasAtLeastOneCorrectCheck) {
    state = "practised";
  }

  if (missionPassedOnShortlist && (state === "practised" || hasAtLeastOneCorrectCheck)) {
    state = hasAtLeastTwoCorrectChecks ? "mastered" : "applied";
  }

  return state;
}

export type GradeResult = {
  passed: boolean;
  expectedValue: number | string;
  userValue: number | string;
  difference?: number;
  explanation: string;
};

export type MissionGradeContext = {
  expectedValue?: number | string;
  tolerancePct?: number;
  toleranceAbsolute?: number;
  tolerance?: number;
};

export function gradeMission(
  missionOrConcept: Mission | ConceptId,
  userInput: number | string,
  context?: MissionGradeContext,
): GradeResult {
  const mission =
    typeof missionOrConcept === "string"
      ? getMissionForConcept(missionOrConcept)
      : missionOrConcept;

  const expected = context?.expectedValue ?? mission.expectedValue;

  // Numeric grading
  if (typeof expected === "number") {
    const rawUserNum =
      typeof userInput === "number"
        ? userInput
        : parseFloat(String(userInput).trim().replace(/[%₹,]/g, ""));

    if (isNaN(rawUserNum)) {
      return {
        passed: false,
        expectedValue: expected,
        userValue: userInput,
        explanation: "Input could not be parsed as a valid number.",
      };
    }

    const diff = Math.abs(rawUserNum - expected);
    let maxAllowedDiff = 0;

    if (context?.tolerance != null) {
      maxAllowedDiff = context.tolerance;
    } else if (
      context?.toleranceAbsolute != null ||
      mission.toleranceAbsolute != null
    ) {
      maxAllowedDiff = (context?.toleranceAbsolute ?? mission.toleranceAbsolute)!;
    } else if (context?.tolerancePct != null || mission.tolerancePct != null) {
      const pct = context?.tolerancePct ?? mission.tolerancePct!;
      maxAllowedDiff = Math.abs(expected * (pct / 100));
    }

    const passed = diff <= maxAllowedDiff + 1e-9;
    return {
      passed,
      expectedValue: expected,
      userValue: rawUserNum,
      difference: diff,
      explanation: passed
        ? `Correct. Result ${rawUserNum} is within tolerance of expected ${expected}.`
        : `Incorrect. Result ${rawUserNum} differed by ${diff.toFixed(2)}, exceeding allowed tolerance of ${maxAllowedDiff.toFixed(2)}. Working: ${mission.formulaNote}.`,
    };
  }

  // Categorical grading
  const normUser = String(userInput).trim().toLowerCase();
  const normExpected = String(expected).trim().toLowerCase();

  const synonyms: Record<string, string[]> = {
    rose: ["rose", "up", "increased", "higher"],
    fell: ["fell", "down", "decreased", "lower"],
    cannot_tell: ["cannot_tell", "cannot tell", "unknown", "uncertain"],
  };

  const allowedList = synonyms[normExpected] ?? [normExpected];
  const passed = allowedList.includes(normUser);

  return {
    passed,
    expectedValue: expected,
    userValue: userInput,
    explanation: passed
      ? `Correct. ${userInput} matches expected outcome.`
      : `Incorrect. Selected '${userInput}', but fundamental analysis indicates '${expected}'. Working: ${mission.formulaNote}.`,
  };
}
