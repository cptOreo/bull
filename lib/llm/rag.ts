export interface KnowledgeItem {
  id: string;
  text: string;
  category: string;
  keywords: string[];
}

export const FINANCIAL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "pe-ratio",
    category: "valuation",
    keywords: ["pe", "p/e", "price to earnings", "multiple", "valuation", "earnings multiple"],
    text: "P/E (Price-to-Earnings) Ratio = Current Share Price ÷ Earnings per Share (EPS). It reflects how much investors pay per rupee of annual profit. High P/E signals strong growth expectations; low P/E may indicate undervalued stock or low growth.",
  },
  {
    id: "pb-ratio",
    category: "valuation",
    keywords: ["pb", "p/b", "price to book", "book value", "equity value", "net worth"],
    text: "P/B (Price-to-Book) Ratio = Market Price ÷ Book Value per Share. Useful for financial institutions and asset-heavy industries. Under 1.0 indicates trading below net asset value.",
  },
  {
    id: "dcf",
    category: "valuation",
    keywords: ["dcf", "discounted cash flow", "intrinsic value", "wacc", "free cash flow"],
    text: "DCF (Discounted Cash Flow) values a business by projecting future Free Cash Flows (FCF) and discounting them to present value using WACC. Core inputs: revenue growth, operating margin, tax rate, discount rate, and terminal growth.",
  },
  {
    id: "roe",
    category: "profitability",
    keywords: ["roe", "return on equity", "profitability", "shareholder return", "net income"],
    text: "ROE (Return on Equity) = Net Income ÷ Shareholders' Equity. Measures management efficiency in allocating equity capital. Sustained ROE > 15-20% indicates competitive strength.",
  },
  {
    id: "roce",
    category: "profitability",
    keywords: ["roce", "return on capital employed", "ebit", "capital efficiency"],
    text: "ROCE = EBIT ÷ Capital Employed (Total Assets - Current Liabilities). Measures return on both debt and equity. Essential for evaluating capital-intensive businesses.",
  },
  {
    id: "debt-equity",
    category: "leverage",
    keywords: ["debt", "leverage", "solvency", "debt to equity", "borrowing"],
    text: "Debt-to-Equity Ratio = Total Debt ÷ Shareholders' Equity. Ratios below 0.5 suggest conservative leverage; above 1.5 indicate high interest risk, except for banking/financial firms.",
  },
  {
    id: "operating-margin",
    category: "profitability",
    keywords: ["operating margin", "ebitda", "ebitda margin", "operating profit", "margins"],
    text: "Operating Margin = Operating Profit (EBITDA or EBIT) ÷ Total Revenue. Shows the percentage of revenue remaining after covering core variable operational expenses.",
  },
  {
    id: "dividend-yield",
    category: "income",
    keywords: ["dividend", "dividend yield", "payout", "passive income"],
    text: "Dividend Yield = Annual Dividend per Share ÷ Share Price. Sustainable yields are supported by low payout ratios (<60%) and steady free cash flow.",
  },
  {
    id: "moats",
    category: "competitive-advantage",
    keywords: ["moat", "competitive advantage", "pricing power", "brand", "switching cost"],
    text: "Economic Moats protect a company's profit margins from competition. Common moats: pricing power, strong brand recognition, high customer switching costs, network effects, and low-cost scale.",
  },
  {
    id: "cash-flow",
    category: "cash-flow",
    keywords: ["cash flow", "fcf", "free cash flow", "operating cash flow", "cfo"],
    text: "Operating Cash Flow reflects actual cash collected from core business operations. Divergence between reported accounting net profit and negative cash flow is an early warning flag.",
  },
];

function scoreRelevance(query: string, item: KnowledgeItem): number {
  const queryTokens = query.toLowerCase().split(/[\s,?.!/\\-]+/).filter(Boolean);
  if (queryTokens.length === 0) return 0;

  let score = 0;
  const itemText = (item.text + " " + item.category + " " + item.keywords.join(" ")).toLowerCase();

  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (item.keywords.some((k) => k.includes(token) || token.includes(k))) {
      score += 3;
    } else if (itemText.includes(token)) {
      score += 1;
    }
  }

  return score / queryTokens.length;
}

export async function retrieveRelevantKnowledge(
  query: string,
  topK = 3
): Promise<Array<{ text: string; category: string; score: number }>> {
  const scored = FINANCIAL_KNOWLEDGE.map((item) => ({
    text: item.text,
    category: item.category,
    score: scoreRelevance(query, item),
  }));

  return scored
    .filter((r) => r.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function addKnowledge(id: string, text: string, category: string): Promise<void> {
  const existing = FINANCIAL_KNOWLEDGE.find((k) => k.id === id);
  if (existing) {
    existing.text = text;
    existing.category = category;
  } else {
    FINANCIAL_KNOWLEDGE.push({
      id,
      text,
      category,
      keywords: text.toLowerCase().split(/\s+/).slice(0, 5),
    });
  }
}
