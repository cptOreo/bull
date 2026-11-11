export interface LessonFormulaVariable {
  name: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  description: string;
}

export interface LessonQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
}

export interface LessonData {
  id: string;
  track: "analyze" | "dividend" | "statements" | "moats";
  title: string;
  tagline: string;
  plainEnglish: string;
  mentalModel: {
    title: string;
    description: string;
  };
  whyItMatters: string;
  formula: {
    expression: string;
    variables: LessonFormulaVariable[];
    compute: (vals: Record<string, number>) => { value: number; unit: string; interpretation: string };
  };
  defaultStock: {
    ticker: string;
    name: string;
    metricLabel: string;
    metricValue: string;
    takeaway: string;
  };
  practiceQuestions: LessonQuestion[];
  sliderSimulator: {
    title: string;
    description: string;
    inputs: Array<{ key: string; label: string; min: number; max: number; step: number; defaultValue: number; unit: string }>;
    evaluate: (vals: Record<string, number>) => { resultLabel: string; resultValue: string; zone: "bargain" | "fair" | "growth" | "speculative" | "healthy" | "warning"; verdict: string };
  };
  mission: {
    prompt: string;
    targetStock: string;
    starterHint: string;
    xp: number;
    sampleAnswer: string;
  };
  masteryCheck: LessonQuestion[];
}

export const LESSONS_DATABASE: Record<string, LessonData> = {
  "valuation-basics": {
    id: "valuation-basics",
    track: "analyze",
    title: "Valuation Basics",
    tagline: "Price is what you pay; value is what you get.",
    plainEnglish: "Valuation is figuring out what an entire business is worth compared to the market price asked for its shares today. A company can report record sales, but if its stock trades at fifty years of future profits, buying it can still deliver poor long-term returns.",
    mentalModel: {
      title: "The Residential Apartment Test",
      description: "If an apartment rents for ₹50,000 every month (₹6 lakh a year), paying ₹1 crore means you earn a 6% cash rental yield. If the seller demands ₹6 crore for that exact same apartment, your yield drops to 1%. The property is unchanged, but the price turns an asset into an expensive gamble."
    },
    whyItMatters: "Paying any price regardless of valuation leaves zero margin of safety. When earnings falter, overvalued stocks face severe multiple compression.",
    formula: {
      expression: "Earnings Yield (%) = (Annual Profit per Share ÷ Share Price) × 100",
      variables: [
        { name: "Share Price", symbol: "P", min: 50, max: 5000, step: 50, defaultValue: 1000, unit: "₹", description: "Current price per share in the market" },
        { name: "Earnings per Share", symbol: "EPS", min: 5, max: 250, step: 5, defaultValue: 50, unit: "₹", description: "Net profit attributable to each share over the past year" },
      ],
      compute: (v) => {
        const yieldPct = (v.EPS / (v.P || 1)) * 100;
        const pe = v.P / (v.EPS || 1);
        return {
          value: Number(yieldPct.toFixed(2)),
          unit: "%",
          interpretation: `At ₹${v.P} per share earning ₹${v.EPS}, your earnings yield is ${yieldPct.toFixed(1)}% (P/E of ${pe.toFixed(1)}x). Compare this to the 10-year Indian Government Bond yield of 6.8%.`
        };
      }
    },
    defaultStock: {
      ticker: "TATAMOTORS.NS",
      name: "Tata Motors Limited",
      metricLabel: "Price vs Free Cash Flow",
      metricValue: "Turnaround multiple",
      takeaway: "Tata Motors recovered from heavy JLR debt to strong positive free cash flows, causing its multiple to normalize as profitability stabilized."
    },
    practiceQuestions: [
      {
        question: "A company earns ₹20 profit per share. Its stock trades at ₹400. What is the earnings yield?",
        options: ["2.5%", "5.0%", "10.0%", "20.0%"],
        correct: 1,
        explanation: "Earnings yield = (EPS ÷ Price) × 100 = (20 ÷ 400) × 100 = 5.0%. This corresponds to a 20x P/E ratio.",
        hint: "Divide the earnings per share (₹20) by the price per share (₹400) and multiply by 100."
      },
      {
        question: "Why is a high earnings yield (e.g. 12%) not always a safe investment?",
        options: [
          "Because high earnings yield is illegal under SEBI rules",
          "Because the underlying earnings may be peak cyclical or about to collapse",
          "Because government bonds always pay more than 12%",
          "Because dividend taxes automatically double on cheap stocks"
        ],
        correct: 1,
        explanation: "A high earnings yield looks cheap on trailing numbers, but if industry conditions deteriorate or debt burdens rise, future profits can fall sharply (a classic value trap).",
        hint: "Consider what happens if trailing earnings were an outlier peak in a commodity cycle."
      }
    ],
    sliderSimulator: {
      title: "Earnings Yield vs Government Bond Benchmark",
      description: "Adjust share price and EPS to see how the stock compares to the 6.8% risk-free bond yield.",
      inputs: [
        { key: "price", label: "Share Price (₹)", min: 100, max: 3000, step: 50, defaultValue: 800, unit: "₹" },
        { key: "eps", label: "EPS (₹)", min: 10, max: 150, step: 5, defaultValue: 50, unit: "₹" }
      ],
      evaluate: (vals) => {
        const yieldVal = (vals.eps / vals.price) * 100;
        const pe = vals.price / vals.eps;
        if (yieldVal >= 8) {
          return { resultLabel: `${yieldVal.toFixed(1)}% yield (${pe.toFixed(1)}x P/E)`, resultValue: "Bargain Cushion", zone: "bargain", verdict: "Offers an equity risk premium well above sovereign government debt (6.8%)." };
        } else if (yieldVal >= 4.5) {
          return { resultLabel: `${yieldVal.toFixed(1)}% yield (${pe.toFixed(1)}x P/E)`, resultValue: "Fair Zone", zone: "fair", verdict: "Balanced multiple for a business with steady mid-teens return on capital." };
        } else {
          return { resultLabel: `${yieldVal.toFixed(1)}% yield (${pe.toFixed(1)}x P/E)`, resultValue: "Growth Premium", zone: "speculative", verdict: "Priced for aggressive future growth. Any deceleration will trigger multiple contraction." };
        }
      }
    },
    mission: {
      prompt: "Inspect Tata Motors (TATAMOTORS.NS). Review its current price and EPS. Calculate its earnings yield and state whether the market is treating it as a cyclical car manufacturer or a high-margin brand.",
      targetStock: "TATAMOTORS.NS",
      starterHint: "Check the P/E ratio on the stock card. Take 100 divided by that P/E to find the earnings yield.",
      xp: 30,
      sampleAnswer: "Tata Motors trades around 8x to 10x trailing earnings, giving an earnings yield of 10% to 12.5%. This shows the market discounts cyclical risk in global automotive demand despite strong JLR recovery."
    },
    masteryCheck: [
      {
        question: "If Company A trades at ₹500 earning ₹50, and Company B trades at ₹1,000 earning ₹50, which stock provides the higher earnings yield?",
        options: ["Company A (10%)", "Company B (5%)", "Both are equal because EPS is ₹50", "Cannot be determined without dividend information"],
        correct: 0,
        explanation: "Company A gives 50/500 = 10% yield. Company B gives 50/1000 = 5% yield. You pay half as much per rupee of profit for Company A."
      },
      {
        question: "What is the primary danger of assuming trailing earnings will continue indefinitely?",
        options: ["Accounting standards prevent companies from reporting two profitable years in a row", "Cyclical booms, one-off asset sales, or rising interest costs can erode future net profit", "Stock exchanges delist companies that grow earnings faster than 15%", "Trailing earnings include future forecasts by default"],
        correct: 1,
        explanation: "Trailing net profit includes historical conditions that may not recur, especially in cyclical industries like commodities, steel, and capital goods."
      },
      {
        question: "How does the 10-year Indian Government Bond yield (approx 6.8% to 7.1%) act as a hurdle rate for stock valuation?",
        options: ["Stocks are legally required to pay dividends matching the bond yield", "Equities carry business risk, so rational investors demand an earnings yield premium above the risk-free rate", "Government bonds set the price cap for all NSE and BSE transactions", "Brokers charge higher fees when bond yields rise"],
        correct: 1,
        explanation: "Because government bonds are sovereign and risk-free, stocks must compensate investors with either a higher initial earnings yield or future growth."
      }
    ]
  },

  "pe-ratio": {
    id: "pe-ratio",
    track: "analyze",
    title: "P/E Ratio",
    tagline: "How many years of current profit you are paying upfront.",
    plainEnglish: "The Price-to-Earnings ratio divides the share price by the annual earnings per share. A P/E of 25x means you pay ₹25 for every ₹1 of annual profit the business generates. It reflects market expectations of future growth and durability.",
    mentalModel: {
      title: "The Kirana Cash Register",
      description: "A neighbourhood store clears ₹5 lakh in clean profit every year. If the owner offers to sell the store to you for ₹50 lakh, the deal is priced at 10x earnings. If they ask for ₹5 crore (100x), you would need a century of flat profits just to recover your investment."
    },
    whyItMatters: "High P/E stocks require rapid, sustained growth to justify their valuation. Low P/E stocks can be bargains or struggling businesses facing disruption.",
    formula: {
      expression: "P/E Ratio = Share Price ÷ Earnings per Share (EPS)",
      variables: [
        { name: "Share Price", symbol: "P", min: 10, max: 4000, step: 10, defaultValue: 500, unit: "₹", description: "Current price per share" },
        { name: "Earnings per Share", symbol: "EPS", min: 1, max: 200, step: 1, defaultValue: 20, unit: "₹", description: "Trailing twelve-month net profit per share" },
      ],
      compute: (v) => {
        const pe = v.P / (v.EPS || 1);
        const payback = pe.toFixed(1);
        return {
          value: Number(pe.toFixed(1)),
          unit: "x",
          interpretation: `At ₹${v.P} with ₹${v.EPS} EPS, the P/E is ${pe.toFixed(1)}x. If earnings stay flat, it takes ${payback} years of profits to cover the purchase price.`
        };
      }
    },
    defaultStock: {
      ticker: "ZOMATO.NS",
      name: "Zomato Limited",
      metricLabel: "Forward vs Trailing Multiple",
      metricValue: "Growth Multiple",
      takeaway: "Zomato trades at an elevated trailing P/E because quick commerce (Blinkit) is in high-growth investment phase with profit margins expanding."
    },
    practiceQuestions: [
      {
        question: "Stock X trades at ₹600 and reported EPS of ₹24. What is its P/E ratio?",
        options: ["15x", "20x", "25x", "30x"],
        correct: 2,
        explanation: "P/E = ₹600 ÷ ₹24 = 25x. You are paying 25 rupees per rupee of profit.",
        hint: "Divide ₹600 by ₹24."
      },
      {
        question: "Why is comparing Zomato's P/E to Tata Steel's P/E misleading?",
        options: [
          "Steel companies use dollars while tech companies use rupees",
          "Capital intensity, profit margins, growth rates, and economic cycles differ fundamentally across sectors",
          "SEBI prohibits cross-sector comparison charts",
          "Tata Steel does not have any shares outstanding"
        ],
        correct: 1,
        explanation: "P/E ratios must be benchmarked against peers in the same industry. Asset-heavy cyclical businesses naturally trade at lower multiples than high-margin scalable platforms.",
        hint: "Think about the capital required to build a blast furnace versus deploying software."
      }
    ],
    sliderSimulator: {
      title: "P/E Valuation Zone Inspector",
      description: "Test how price swings and EPS changes move a stock between bargain, fair value, and speculative territory.",
      inputs: [
        { key: "price", label: "Share Price (₹)", min: 50, max: 2500, step: 25, defaultValue: 600, unit: "₹" },
        { key: "eps", label: "EPS (₹)", min: 5, max: 150, step: 5, defaultValue: 25, unit: "₹" }
      ],
      evaluate: (vals) => {
        const pe = vals.price / vals.eps;
        if (pe < 15) {
          return { resultLabel: `${pe.toFixed(1)}x P/E`, resultValue: "Value / Mature", zone: "bargain", verdict: "Trades at a modest multiple. Verify debt and sector growth to avoid value traps." };
        } else if (pe <= 30) {
          return { resultLabel: `${pe.toFixed(1)}x P/E`, resultValue: "Market Average", zone: "fair", verdict: "Standard multiple for profitable compounders with double-digit return on capital." };
        } else if (pe <= 60) {
          return { resultLabel: `${pe.toFixed(1)}x P/E`, resultValue: "Growth Premium", zone: "growth", verdict: "Requires 20%+ annual profit growth over several years to support this price." };
        } else {
          return { resultLabel: `${pe.toFixed(1)}x P/E`, resultValue: "Speculative Multiple", zone: "speculative", verdict: "Extreme optimism priced in. Any quarterly margin slip can lead to sharp drawdowns." };
        }
      }
    },
    mission: {
      prompt: "Find the current P/E of Infosys (INFY.NS) vs TCS (TCS.NS). Identify which company trades at a discount and whether that gap is justified by recent revenue growth.",
      targetStock: "INFY.NS",
      starterHint: "Open the comparison page or inspect both stocks on the dissector tab.",
      xp: 30,
      sampleAnswer: "TCS trades near 28x while Infosys trades near 24x. The 4-multiple discount on Infosys reflects slightly higher executive turnover and client concentration in banking discretionary spend."
    },
    masteryCheck: [
      {
        question: "If a company has negative earnings (losses), how is the P/E ratio reported?",
        options: ["As a negative number like -15x, which implies a bargain", "Reported as Not Meaningful (N/A or negative) because losses cannot value a positive multiple", "Calculated by adding the share price to total debt", "Set to zero by exchange clearing houses"],
        correct: 1,
        explanation: "A negative P/E is meaningless for standard valuation multiples; analysts switch to Price-to-Sales (P/S) or EV/EBITDA."
      },
      {
        question: "What is the relationship between P/E ratio and earnings yield?",
        options: ["Earnings Yield = P/E × 100", "Earnings Yield = 1 ÷ P/E", "Earnings Yield = P/E ÷ Market Cap", "They have no mathematical connection"],
        correct: 1,
        explanation: "Earnings yield is the inverse of the P/E ratio (1 / PE). A 20x P/E equates to a 5% earnings yield (1/20 = 0.05)."
      },
      {
        question: "When a cyclical commodity producer reports its lowest P/E ratio in a decade (e.g. 4x), what usually happens next?",
        options: ["The company is guaranteed to double in market value", "Earnings are at the cyclical peak and profits may soon decline as product prices normalize", "The company will be acquired by the government", "Its dividend yield drops to zero"],
        correct: 1,
        explanation: "In cyclical industries, peak profits produce artificially low trailing P/E ratios right before commodity prices decline."
      }
    ]
  },

  "pb-ratio": {
    id: "pb-ratio",
    track: "analyze",
    title: "P/B Ratio & Book Value",
    tagline: "Comparing market price to the net accounting net worth.",
    plainEnglish: "The Price-to-Book ratio compares a company's market price to its net assets (total assets minus total liabilities). For financial institutions like banks and NBFCs, book value is the primary valuation anchor because their balance sheets consist mainly of liquid loans and cash.",
    mentalModel: {
      title: "The Bank Vault Balance",
      description: "If a bank has ₹10,000 crore in borrower loans and cash, and owes depositors ₹8,500 crore, its net worth (book value) is ₹1,500 crore. If the stock trades at ₹3,000 crore, its P/B is 2.0x. You are paying twice the net liquidation equity for management's lending ability."
    },
    whyItMatters: "P/B is essential for banks, insurance firms, and asset-heavy infrastructure, but misleading for asset-light software firms whose primary assets (code, brand) are expensed.",
    formula: {
      expression: "P/B Ratio = Share Price ÷ Book Value per Share (BVPS)",
      variables: [
        { name: "Share Price", symbol: "P", min: 50, max: 3000, step: 25, defaultValue: 1500, unit: "₹", description: "Current market share price" },
        { name: "Book Value per Share", symbol: "BVPS", min: 25, max: 1000, step: 25, defaultValue: 600, unit: "₹", description: "Net assets divided by total shares" },
      ],
      compute: (v) => {
        const pb = v.P / (v.BVPS || 1);
        return {
          value: Number(pb.toFixed(2)),
          unit: "x",
          interpretation: `Trading at ${pb.toFixed(2)}x book value. For high-ROE banks (>15%), a 2x-3x P/B is common; for capital-diluting lenders, below 1x signals credit risk.`
        };
      }
    },
    defaultStock: {
      ticker: "HDFCBANK.NS",
      name: "HDFC Bank Limited",
      metricLabel: "Price to Adjusted Book Value",
      metricValue: "Quality Bank Multiple",
      takeaway: "HDFC Bank historically commanded 3.0x to 4.0x book value due to low non-performing assets and disciplined credit underwriting."
    },
    practiceQuestions: [
      {
        question: "A bank has ₹500 book value per share and trades at ₹1,250. What is its P/B ratio?",
        options: ["1.5x", "2.0x", "2.5x", "3.0x"],
        correct: 2,
        explanation: "P/B = 1250 ÷ 500 = 2.5x book value.",
        hint: "Divide the market price (₹1250) by book value per share (₹500)."
      },
      {
        question: "Why is P/B ratio poor for assessing software companies like Infosys or TCS?",
        options: [
          "Software companies do not file balance sheets",
          "Software companies have minimal factories or machinery; their value lies in talent, IP, and contracts which do not appear as physical book value",
          "SEBI requires P/B to be zero for IT companies",
          "Banks own all software patents"
        ],
        correct: 1,
        explanation: "Asset-light tech companies generate high profits from minimal physical capital, giving them deceptively high P/B ratios (e.g. 10x-15x) that do not signal overvaluation."
      }
    ],
    sliderSimulator: {
      title: "Bank Valuation: P/B vs ROE Relationship",
      description: "A bank's fair P/B ratio is determined by its Return on Equity (ROE). Higher ROE justifies higher P/B.",
      inputs: [
        { key: "pb", label: "Price-to-Book (x)", min: 0.5, max: 4.5, step: 0.1, defaultValue: 2.2, unit: "x" },
        { key: "roe", label: "Return on Equity (ROE %)", min: 5, max: 25, step: 1, defaultValue: 16, unit: "%" }
      ],
      evaluate: (vals) => {
        const justifiedPB = vals.roe / 8; // rule of thumb: 8% cost of equity
        if (vals.pb > justifiedPB * 1.3) {
          return { resultLabel: `${vals.pb.toFixed(1)}x P/B at ${vals.roe}% ROE`, resultValue: "Expensive for Given ROE", zone: "warning", verdict: "The price assumes substantial ROE expansion. If credit provisions rise, multiples contract." };
        } else if (vals.pb < justifiedPB * 0.8) {
          return { resultLabel: `${vals.pb.toFixed(1)}x P/B at ${vals.roe}% ROE`, resultValue: "Attractive Bank Value", zone: "bargain", verdict: "Trading at an appealing valuation relative to the equity returns generated on the loan book." };
        } else {
          return { resultLabel: `${vals.pb.toFixed(1)}x P/B at ${vals.roe}% ROE`, resultValue: "Fairly Valued", zone: "fair", verdict: "Multiple matches the underlying return on equity generated." };
        }
      }
    },
    mission: {
      prompt: "Look up HDFC Bank (HDFCBANK.NS) and compare its current P/B ratio with public sector banks like State Bank of India (SBIN.NS). Note the valuation divergence.",
      targetStock: "HDFCBANK.NS",
      starterHint: "State Bank of India typically trades between 1.0x and 1.6x book, while top private banks command higher multiples.",
      xp: 30,
      sampleAnswer: "HDFC Bank trades near 2.6x book value while SBI trades near 1.4x. The gap reflects HDFC Bank's historical underwriting discipline, lower NPA volatility, and private market premium."
    },
    masteryCheck: [
      {
        question: "When a public sector bank trades at 0.6x book value, what is the market pricing in?",
        options: ["An immediate cash payout of the remaining 40% to shareholders", "High risk of bad loans (NPAs) that could wipe out reported equity upon recognition", "Guaranteed profit doubling next quarter", "Stock split approval by the regulator"],
        correct: 1,
        explanation: "Stocks trading below book value (P/B < 1.0) often indicate the market believes reported assets are overstated or vulnerable to loan write-offs."
      },
      {
        question: "What items constitute a company's Book Value of Equity?",
        options: ["Total revenue plus market capitalization", "Total assets minus total liabilities (including debt and payables)", "Total dividends paid over the past five years", "Only physical cash in bank accounts"],
        correct: 1,
        explanation: "Book value is Net Worth: all recorded assets minus all claims, debt, and liabilities."
      },
      {
        question: "Why does Warren Buffett pay close attention to Return on Equity (ROE) alongside P/B?",
        options: ["Because high ROE allows a company to grow book value rapidly without requiring external equity dilution", "Because P/B cannot be calculated without ROE", "Because ROE is mandated by SEC filings", "Because ROE determines tax brackets"],
        correct: 0,
        explanation: "A company compounding equity at 20% ROE doubles its book value every 3.6 years, justifying a higher initial P/B multiple."
      }
    ]
  },

  "dcf-modeling": {
    id: "dcf-modeling",
    track: "analyze",
    title: "DCF Modeling",
    tagline: "Valuing a company as the sum of all future cash it will ever generate, discounted to today.",
    plainEnglish: "Discounted Cash Flow (DCF) modeling projects future free cash flows over five to ten years and discounts them back to present value using a hurdle rate (WACC). Because a rupee received ten years from now is worth less than a rupee in hand today, discounting adjusts for inflation, opportunity cost, and risk.",
    mentalModel: {
      title: "The Gold Mine Concession",
      description: "Imagine purchasing a mine guaranteed to produce 100 grams of gold every year for five years. Even if the total yield is 500 grams, you wouldn't pay for 500 grams upfront today. You would demand a discount to cover inflation, risk, and the fact that you could have earned safe interest elsewhere."
    },
    whyItMatters: "DCF forces investors to state their explicit assumptions about growth, profit margins, and capital reinvestment rather than relying on arbitrary peer multiples.",
    formula: {
      expression: "Present Value (PV) = Cash Flow ÷ (1 + Discount Rate)^Years",
      variables: [
        { name: "Year 5 Free Cash Flow", symbol: "FCF", min: 50, max: 2000, step: 50, defaultValue: 500, unit: "Cr", description: "Projected annual cash available to owners in Year 5" },
        { name: "Discount Rate (WACC)", symbol: "r", min: 8, max: 18, step: 0.5, defaultValue: 11, unit: "%", description: "Hurdle rate reflecting cost of capital and business risk" },
      ],
      compute: (v) => {
        const rate = v.r / 100;
        const pv = v.FCF / Math.pow(1 + rate, 5);
        return {
          value: Number(pv.toFixed(1)),
          unit: "Cr",
          interpretation: `₹${v.FCF} Cr received 5 years out is worth ₹${pv.toFixed(1)} Cr today at an ${v.r}% hurdle rate. The higher the risk, the lower the present value.`
        };
      }
    },
    defaultStock: {
      ticker: "RELIANCE.NS",
      name: "Reliance Industries Limited",
      metricLabel: "Free Cash Flow Transition",
      metricValue: "Capex to Cash",
      takeaway: "Reliance spent over ₹5 lakh crore building 4G/5G networks and retail infrastructure; as major capex moderates, free cash flow generation rises."
    },
    practiceQuestions: [
      {
        question: "If a company generates ₹100 crore in Free Cash Flow next year and your discount rate is 10%, what is its present value?",
        options: ["₹80.0 Cr", "₹90.9 Cr", "₹100.0 Cr", "₹110.0 Cr"],
        correct: 1,
        explanation: "PV = 100 ÷ (1 + 0.10)^1 = 100 ÷ 1.10 = ₹90.91 crore.",
        hint: "Divide 100 by 1.10."
      },
      {
        question: "What is the single biggest weakness of a DCF valuation model?",
        options: [
          "It uses computers to calculate fractions",
          "Small changes in input assumptions (like terminal growth rate or WACC) produce massive swings in the calculated fair value",
          "SEBI bans DCF models for retail investors",
          "DCF only works on unprofitable startups"
        ],
        correct: 1,
        explanation: "DCF models are sensitive to inputs: moving WACC from 10% to 12% can drop calculated intrinsic value by 30% to 40%."
      }
    ],
    sliderSimulator: {
      title: "DCF Sensitivity Simulator",
      description: "Experiment with growth and discount rate to see how intrinsic value shifts.",
      inputs: [
        { key: "growth", label: "5-Yr Cash Flow Growth (%)", min: 5, max: 30, step: 1, defaultValue: 14, unit: "%" },
        { key: "wacc", label: "Discount Rate / WACC (%)", min: 8, max: 16, step: 0.5, defaultValue: 11, unit: "%" },
        { key: "terminal", label: "Terminal Growth (%)", min: 2, max: 6, step: 0.5, defaultValue: 4, unit: "%" }
      ],
      evaluate: (vals) => {
        const spread = vals.wacc - vals.terminal;
        if (spread <= 3) {
          return { resultLabel: "Warning: Narrow Spread", resultValue: "Terminal Value Distortion", zone: "warning", verdict: "Discount rate too close to terminal growth rate; produces unrealistic infinite terminal values." };
        }
        const impliedMultiple = ((1 + vals.growth / 100) / (spread / 100)) * 1.5;
        return {
          resultLabel: `Intrinsic Value Multiple: ${impliedMultiple.toFixed(1)}x`,
          resultValue: impliedMultiple > 30 ? "High Growth Priced" : "Conservative Valuation",
          zone: impliedMultiple > 30 ? "growth" : "fair",
          verdict: `At ${vals.growth}% growth and ${vals.wacc}% hurdle rate, the model demands disciplined operational execution.`
        };
      }
    },
    mission: {
      prompt: "Open the DCF Builder practice scenario. Run a DCF for Reliance Industries with 12% growth and 11% WACC. Record the implied equity value per share.",
      targetStock: "RELIANCE.NS",
      starterHint: "Head to Practice Arena > Build a DCF to adjust assumptions and inspect the 5-year FCF schedule.",
      xp: 50,
      sampleAnswer: "At 12% operating cash flow growth, 11% WACC, and 4% terminal growth, Reliance yields an intrinsic value near ₹3,100/share, providing an 8-12% margin of safety against current prices."
    },
    masteryCheck: [
      {
        question: "Why is Free Cash Flow used in DCF rather than Net Accounting Profit?",
        options: ["Free Cash Flow is always higher than Net Profit", "Net Profit can be inflated by credit sales (receivables) and delayed payables, while Free Cash Flow represents actual cash in the bank after capital expenditures", "Accountants do not calculate Net Profit in India", "Free Cash Flow includes future loans"],
        correct: 1,
        explanation: "A business can report positive net accounting income while running out of real cash due to working capital expansion and mandatory factory reinvestment."
      },
      {
        question: "What is Terminal Value in a 5-year DCF model?",
        options: ["The liquidation price of the office furniture", "The estimated value of all cash flows beyond Year 5 into perpetuity", "The tax penalty paid when selling shares", "The commission charged by stock exchanges"],
        correct: 1,
        explanation: "Most established companies operate for decades; Terminal Value captures the value of all cash flows generated after the explicit forecast period."
      },
      {
        question: "If interest rates rise economy-wide, how does it affect a DCF model's valuation?",
        options: ["Intrinsic value increases because money is worth more", "The hurdle rate (WACC) rises, which discounts future cash flows more aggressively and lowers present intrinsic value", "It has zero impact on DCF models", "Stock splits occur automatically"],
        correct: 1,
        explanation: "Higher risk-free rates elevate WACC, reducing the present value of future earnings."
      }
    ]
  },

  "dividend-basics": {
    id: "dividend-basics",
    track: "dividend",
    title: "Dividend Basics & Cashflow",
    tagline: "Real cash returned directly to your bank account from business operations.",
    plainEnglish: "A dividend is cash distributed by a company to its shareholders out of accumulated profits. When a business generates more cash than it can productively reinvest at attractive returns, returning that capital through regular dividends provides direct cash flow to owners.",
    mentalModel: {
      title: "The Commercial Orchard",
      description: "Owning shares is like owning mango trees. Capital gains are what other buyers offer to pay for your orchard. Dividends are the harvested fruit delivered to your doorstep every season that you can consume or sell without parting with a single tree."
    },
    whyItMatters: "Dividends cannot be faked with accounting tricks; they require genuine cash in bank accounts. High steady dividends also enforce capital discipline on management.",
    formula: {
      expression: "Dividend Yield (%) = (Annual Dividend per Share ÷ Share Price) × 100",
      variables: [
        { name: "Share Price", symbol: "P", min: 100, max: 2000, step: 25, defaultValue: 450, unit: "₹", description: "Current market share price" },
        { name: "Annual Dividend", symbol: "DPS", min: 2, max: 100, step: 1, defaultValue: 18, unit: "₹", description: "Total dividends paid per share in the last 12 months" },
      ],
      compute: (v) => {
        const yieldVal = (v.DPS / (v.P || 1)) * 100;
        return {
          value: Number(yieldVal.toFixed(2)),
          unit: "%",
          interpretation: `Dividend yield is ${yieldVal.toFixed(2)}%. For an investor holding 1,000 shares (₹${(v.P * 1000).toLocaleString()}), this generates ₹${(v.DPS * 1000).toLocaleString()} in direct cash payouts annually.`
        };
      }
    },
    defaultStock: {
      ticker: "ITC.NS",
      name: "ITC Limited",
      metricLabel: "Dividend Yield & Payout",
      metricValue: "Cash Cow Payout",
      takeaway: "ITC generates substantial free cash flow from its tobacco division and returns over 70% of profits as dividends while funding FMCG expansion."
    },
    practiceQuestions: [
      {
        question: "Stock Y trades at ₹400 and paid ₹16 in dividends this year. What is its dividend yield?",
        options: ["2.0%", "4.0%", "6.0%", "8.0%"],
        correct: 1,
        explanation: "Dividend yield = (₹16 ÷ ₹400) × 100 = 4.0%.",
        hint: "Divide 16 by 400 and multiply by 100."
      },
      {
        question: "What is an Ex-Dividend Date?",
        options: [
          "The date the company cancels its dividend program",
          "The cutoff date: an investor must own the stock before this date to receive the declared payout",
          "The date dividend tax must be paid to the income tax department",
          "The annual meeting where the CEO speaks"
        ],
        correct: 1,
        explanation: "If you purchase shares on or after the ex-dividend date, the previous owner receives the dividend payment."
      }
    ],
    sliderSimulator: {
      title: "Dividend Yield vs Payout Ratio Health",
      description: "High yields can be a warning sign if the payout ratio exceeds 100% of earnings.",
      inputs: [
        { key: "yield", label: "Dividend Yield (%)", min: 1, max: 12, step: 0.5, defaultValue: 4.5, unit: "%" },
        { key: "payout", label: "Payout Ratio (% of Profit)", min: 10, max: 130, step: 5, defaultValue: 60, unit: "%" }
      ],
      evaluate: (vals) => {
        if (vals.payout > 100) {
          return { resultLabel: `${vals.yield}% Yield at ${vals.payout}% Payout`, resultValue: "Dividend Trap Warning", zone: "warning", verdict: "The company is paying out more than it earns. The dividend is unsustainable and likely to be cut." };
        } else if (vals.payout >= 40 && vals.payout <= 75) {
          return { resultLabel: `${vals.yield}% Yield at ${vals.payout}% Payout`, resultValue: "Healthy & Sustainable", zone: "healthy", verdict: "Balanced payout ratio: shareholders receive cash while management retains earnings for reinvestment." };
        } else {
          return { resultLabel: `${vals.yield}% Yield at ${vals.payout}% Payout`, resultValue: "Conservative Payout", zone: "fair", verdict: "Low payout ratio indicates room for future dividend growth or heavy reinvestment into operations." };
        }
      }
    },
    mission: {
      prompt: "Inspect ITC (ITC.NS) on the live stock dissector. Compare its dividend yield to the Nifty 50 average (approx 1.2%). Explain why a mature FMCG/tobacco firm has a higher yield than a tech firm.",
      targetStock: "ITC.NS",
      starterHint: "Check the dividend yield and cash flow tabs on ITC's stock page.",
      xp: 30,
      sampleAnswer: "ITC offers a 3.5% - 4% yield, well above Nifty's 1.2%, because its core cigarette business produces steady cash with low additional factory capex needs, allowing generous shareholder distributions."
    },
    masteryCheck: [
      {
        question: "If a company has a 9% dividend yield while its stock price has dropped 50% in six months, what should you verify first?",
        options: ["Celebrate because dividends are guaranteed by the exchange", "Verify if the trailing dividend was paid before business troubles began and whether earnings can support future payouts (dividend trap check)", "Double your position without checking financial statements", "Report the stock to SEBI for paying too much"],
        correct: 1,
        explanation: "Dividend yield is backward-looking. A collapsing share price creates an artificially high trailing yield right before the board slashes the dividend."
      },
      {
        question: "How are dividends taxed for Indian retail investors under the current tax code?",
        options: ["Completely tax-free up to ₹10 crore", "Taxed at the investor's applicable personal income tax slab rate (with 10% TDS withheld on payouts exceeding ₹5,000)", "Flat 5% tax deducted at source with no reporting required", "Only foreign investors pay tax on Indian dividends"],
        correct: 1,
        explanation: "Dividends in India are added to taxable income and taxed at individual slab rates, making dividend growth strategy considerations personal."
      },
      {
        question: "What is the Dividend Payout Ratio?",
        options: ["The number of days between dividend announcement and payment", "Total dividends paid divided by net profit", "Share price divided by dividend per share", "Total shares divided by dividend amount"],
        correct: 1,
        explanation: "Payout ratio measures what proportion of net income is distributed to shareholders rather than retained for growth."
      }
    ]
  },

  "pricing-power": {
    id: "pricing-power",
    track: "moats",
    title: "Pricing Power & Economic Moats",
    tagline: "The single most important decision in evaluating a business.",
    plainEnglish: "Warren Buffett defined pricing power as the ability of a business to raise prices when inflation strikes without losing volume or market share to competitors. If you need a prayer session before raising prices by 10%, you have a commodity, not an economic moat.",
    mentalModel: {
      title: "The School Canteen vs The Railway Platform",
      description: "If you run the sole tea stall inside an isolated railway station where trains stop for five minutes, passengers gladly pay ₹25 per cup because no alternative exists. If you sell tea on a street corner with five identical stalls, raising prices by ₹2 drives customers directly to your neighbour."
    },
    whyItMatters: "Businesses with pricing power protect their return on capital during high inflation, while commodity producers see margins compressed by rising input costs.",
    formula: {
      expression: "Gross Margin (%) = ((Revenue - Cost of Goods Sold) ÷ Revenue) × 100",
      variables: [
        { name: "Revenue per Unit", symbol: "Rev", min: 50, max: 500, step: 10, defaultValue: 200, unit: "₹", description: "Selling price per unit of goods or services" },
        { name: "Cost of Goods (COGS)", symbol: "COGS", min: 20, max: 400, step: 10, defaultValue: 80, unit: "₹", description: "Direct materials and manufacturing cost per unit" },
      ],
      compute: (v) => {
        const grossMargin = ((v.Rev - v.COGS) / (v.Rev || 1)) * 100;
        return {
          value: Number(grossMargin.toFixed(1)),
          unit: "%",
          interpretation: `Gross profit margin is ${grossMargin.toFixed(1)}%. Companies with gross margins above 50% generally possess proprietary formulation, branding, or patents that deter cheap copies.`
        };
      }
    },
    defaultStock: {
      ticker: "TITAN.NS",
      name: "Titan Company Limited",
      metricLabel: "Gross Margin & Tanishq Moat",
      metricValue: "Consumer Trust Premium",
      takeaway: "Titan converted unorganized jewellery buying into trusted retail through Tanishq, allowing it to charge 15% to 25% making charges that competitors cannot match."
    },
    practiceQuestions: [
      {
        question: "When raw material costs increase by 10%, which company performs best?",
        options: [
          "A steel manufacturer with 5% operating margin selling standardized rebar",
          "A branded consumer goods company with strong pricing power that raises shelf prices by 10% without losing customer volume",
          "A small airline carrying high debt",
          "A textile export firm with fixed price contracts"
        ],
        correct: 1,
        explanation: "Branded companies with pricing power pass inflation directly to end consumers, safeguarding operating profit margins.",
        hint: "Look for the company with consumer loyalty that can raise prices without friction."
      },
      {
        question: "Why does high Return on Capital Employed (ROCE > 25%) attract intense competition?",
        options: [
          "Because high profits act as a beacon attracting outside entrepreneurs and capital seeking the same high returns",
          "Because stock exchanges mandate equal ROCE across all sectors",
          "Because taxes increase by 1% for every point of ROCE above 20%",
          "Because banks stop lending to high-ROCE firms"
        ],
        correct: 0,
        explanation: "Supernormal profits invite imitators. Only companies protected by a durable economic moat (brand, switching costs, network effects) sustain high ROCE over decades."
      }
    ],
    sliderSimulator: {
      title: "Inflation Stress Test: Margin Resilience",
      description: "Test how a 15% surge in input costs affects high-margin vs low-margin companies.",
      inputs: [
        { key: "initialMargin", label: "Initial Operating Margin (%)", min: 4, max: 35, step: 1, defaultValue: 22, unit: "%" },
        { key: "priceHike", label: "Price Increase Passed On (%)", min: 0, max: 15, step: 1, defaultValue: 10, unit: "%" }
      ],
      evaluate: (vals) => {
        const costInflation = 15;
        const netImpact = vals.priceHike - (costInflation * (1 - vals.initialMargin / 100));
        const finalMargin = Math.max(0, vals.initialMargin + netImpact * 0.7);
        if (finalMargin >= 18) {
          return { resultLabel: `${finalMargin.toFixed(1)}% Post-Inflation Margin`, resultValue: "Moat Intact", zone: "healthy", verdict: "Strong pricing power successfully defended corporate cash generation against inflation." };
        } else if (finalMargin >= 8) {
          return { resultLabel: `${finalMargin.toFixed(1)}% Post-Inflation Margin`, resultValue: "Partial Absorption", zone: "fair", verdict: "Margins took a moderate hit, but the business remains comfortably profitable." };
        } else {
          return { resultLabel: `${finalMargin.toFixed(1)}% Post-Inflation Margin`, resultValue: "Erosion Danger", zone: "warning", verdict: "Inability to pass on input costs threatens profitability and dividend safety." };
        }
      }
    },
    mission: {
      prompt: "Inspect Titan (TITAN.NS) or Asian Paints (ASIANPAINT.NS). Look at their 5-year operating margin stability. Explain how distribution network and brand establish an economic moat.",
      targetStock: "TITAN.NS",
      starterHint: "Examine whether operating margins stayed above 10-15% even during commodity volatility.",
      xp: 30,
      sampleAnswer: "Titan maintains 11-13% operating margins across gold price spikes because Tanishq's brand trust and 20%+ making charges protect gross spreads against raw gold price movements."
    },
    masteryCheck: [
      {
        question: "What did Charlie Munger call an economic moat that becomes stronger as the company gets larger?",
        options: ["Dilution effect", "Economies of scale and network effects", "Statutory tax monopoly", "Inventory backlogging"],
        correct: 1,
        explanation: "Scale advantages allow large operators to negotiate lower supply costs, amortize software/R&D over millions of users, and outspend smaller competitors on distribution."
      },
      {
        question: "Which of the following is a classic example of High Switching Costs?",
        options: [
          "Switching from Pepsi to Coca-Cola at a restaurant",
          "A major bank switching its core banking enterprise software (e.g. Finacle or SAP) to a new untested vendor",
          "Buying groceries at a new local supermarket",
          "Switching petrol pumps on the highway"
        ],
        correct: 1,
        explanation: "Replacing enterprise software involves massive operational disruption, retraining thousands of employees, and financial risk, leading clients to remain with the incumbent."
      },
      {
        question: "Why is a patented drug a temporary moat rather than a permanent one?",
        options: ["Patents expire after a statutory period (typically 20 years), opening the product to generic competition and severe price drops", "Governments confiscate drug patents annually", "Doctors prefer unpatented medicines", "Chemicals change formula every decade"],
        correct: 0,
        explanation: "Patent expirations lead to immediate generic entry, collapsing pricing power unless the firm invents new proprietary molecules."
      }
    ]
  },

  "red-flags": {
    id: "red-flags",
    track: "statements",
    title: "Red Flags in Financial Statements",
    tagline: "Spotting aggressive accounting and balance sheet landmines before they detonate.",
    plainEnglish: "Companies rarely collapse overnight without leaving forensic clues in their financial filings. Disconnects between reported accounting profit and real cash from operations, sudden spikes in trade receivables, related-party transactions, and promoter share pledges are warning signs.",
    mentalModel: {
      title: "The Cashbox vs The Ledger",
      description: "A merchant writes down ₹10 lakh in sales in their notebook and celebrates. But when you open their cash register, only ₹1 lakh is in cash, while ₹9 lakh is IOUs from distant relatives with poor credit. The accounting book says 'profitable', but the bank account says 'insolvent'."
    },
    whyItMatters: "Avoiding severe corporate governance losers preserves your portfolio capital more reliably than picking occasional high-flyers.",
    formula: {
      expression: "Cash Flow Conversion (%) = (Operating Cash Flow ÷ Net Profit) × 100",
      variables: [
        { name: "Net Accounting Profit (PAT)", symbol: "PAT", min: 10, max: 1000, step: 25, defaultValue: 200, unit: "Cr", description: "Reported net profit on the income statement" },
        { name: "Operating Cash Flow (OCF)", symbol: "OCF", min: -100, max: 1000, step: 25, defaultValue: 60, unit: "Cr", description: "Actual cash collected from core operating activities" },
      ],
      compute: (v) => {
        const conversion = (v.OCF / (v.PAT || 1)) * 100;
        return {
          value: Number(conversion.toFixed(1)),
          unit: "%",
          interpretation: conversion < 50
            ? `Warning: Only ${conversion.toFixed(1)}% of reported profits converted into real cash. Uncollected receivables or unsold inventory may be distorting numbers.`
            : `Healthy: ${conversion.toFixed(1)}% cash conversion indicates clean cash earnings matching accounting figures.`
        };
      }
    },
    defaultStock: {
      ticker: "PAYTM.NS",
      name: "One97 Communications (Paytm)",
      metricLabel: "Cash Burn & Regulatory Scrutiny",
      metricValue: "Governance & Capital",
      takeaway: "Paytm experienced sharp stock corrections when regulatory action on Paytm Payments Bank impacted core payment volumes and operating stability."
    },
    practiceQuestions: [
      {
        question: "A company reports ₹500 crore in Net Profit, but its Operating Cash Flow is NEGATIVE ₹120 crore. What is the most likely cause?",
        options: [
          "The accounting department forgot to turn on their computer",
          "Sales are booked on paper (aggressive revenue recognition) but customers have not paid in cash, causing trade receivables to balloon",
          "The company paid too many taxes in advance",
          "Negative cash flow is required for stock splits"
        ],
        correct: 1,
        explanation: "A chronic divergence between positive accounting profit and negative operating cash flow is a major forensic warning sign of uncollected credit sales or unsold inventory."
      },
      {
        question: "What does high Promoter Pledging (>30%) indicate?",
        options: [
          "The company has pledged loyalty to the stock exchange",
          "Company founders have borrowed personal loans against their company shares; if share prices fall, lenders will sell those pledged shares automatically, causing panic crashes",
          "The company is debt-free",
          "Foreign investors are buying the stock"
        ],
        correct: 1,
        explanation: "Pledged shares create margin call vulnerability: a falling price triggers forced liquidation by lenders."
      }
    ],
    sliderSimulator: {
      title: "Forensic Divergence Detector",
      description: "Compare Revenue growth with Receivables growth to spot artificial sales puffing.",
      inputs: [
        { key: "revGrowth", label: "Sales Growth Rate (%)", min: 0, max: 50, step: 2, defaultValue: 15, unit: "%" },
        { key: "recGrowth", label: "Receivables (Debtor) Growth (%)", min: 0, max: 80, step: 5, defaultValue: 45, unit: "%" }
      ],
      evaluate: (vals) => {
        const gap = vals.recGrowth - vals.revGrowth;
        if (gap >= 25) {
          return { resultLabel: `Receivables outgrowing sales by +${gap}%`, resultValue: "Severe Red Flag", zone: "warning", verdict: "Sales are being achieved by extending unsustainable customer credit terms. Watch for upcoming bad debt write-offs." };
        } else if (gap >= 10) {
          return { resultLabel: `Receivables outgrowing sales by +${gap}%`, resultValue: "Moderate Watchout", zone: "fair", verdict: "Collections are slowing down. Check days sales outstanding (DSO) in annual report." };
        } else {
          return { resultLabel: `Healthy alignment (Gap: ${gap}%)`, resultValue: "Clean Working Capital", zone: "healthy", verdict: "Cash collections are keeping pace with reported top-line revenue expansion." };
        }
      }
    },
    mission: {
      prompt: "Open the 'Find Red Flags' practice arena. Inspect the sample financials for Zomato / Paytm. Identify two key watchouts and submit your findings.",
      targetStock: "PAYTM.NS",
      starterHint: "Check the Practice Arena tab and look at the operating cash flow history.",
      xp: 30,
      sampleAnswer: "Key red flags identified: 1) Negative operating cash flow over multiple fiscal years during expansion; 2) Heavy dependency on regulatory licensing for payments bank operations."
    },
    masteryCheck: [
      {
        question: "What is an auditor qualification or 'Qualified Opinion' on an annual report?",
        options: ["A certificate proving the auditor has a PhD", "A formal statement where the independent auditor flags disagreement with management over accounting policies or missing documentation", "An award given to the top 10 companies on BSE", "Approval to list shares on NASDAQ"],
        correct: 1,
        explanation: "A qualified audit opinion or sudden auditor resignation before the annual report is a critical governance alert."
      },
      {
        question: "Why are frequent Related Party Transactions (RPTs) scrutinized by disciplined investors?",
        options: ["Because family members cannot buy shares", "Because controlling promoters can siphoned corporate cash into privately owned shell entities at non-market prices", "Because RPTs are banned by the United Nations", "Because RPTs automatically double dividend taxes"],
        correct: 1,
        explanation: "RPTs can be used to shift profits, loans, and assets out of the listed entity to private promoter companies at shareholder expense."
      },
      {
        question: "If a company constantly capitalizes normal operating expenses into 'Intangibles / Other Assets' on the balance sheet, what is the effect on the Income Statement?",
        options: ["Operating profit appears artificially inflated in the current year because expenses are hidden on the balance sheet instead of deducted from revenue", "Reported revenue doubles", "Taxes become zero", "The stock is suspended from trading"],
        correct: 0,
        explanation: "Capitalizing routine expenses defers the cost into the future, making current year profits look deceptively strong."
      }
    ]
  }
};

export function getLesson(conceptId: string): LessonData {
  return LESSONS_DATABASE[conceptId] || LESSONS_DATABASE["valuation-basics"];
}

// Additional concepts across the 4 tracks
const ADDITIONAL_LESSONS: Record<string, Partial<LessonData>> = {
  "ev-ebitda": {
    track: "analyze",
    title: "EV/EBITDA Multiple",
    tagline: "Valuing an entire business regardless of capital structure.",
    plainEnglish: "Enterprise Value to EBITDA compares total company value (equity plus net debt) against cash operating earnings before interest, taxes, and depreciation. It allows fair comparison across companies with differing debt levels.",
    mentalModel: {
      title: "Buying a House with a Mortgage",
      description: "If a house is on sale for ₹80 lakh equity, but has a ₹20 lakh outstanding bank loan attached that you must take over, the true enterprise cost is ₹1 crore. EV/EBITDA looks at the full ₹1 crore cost against the home's total rental power."
    },
    whyItMatters: "P/E can look deceptively low if a company has huge debt that boosts EPS during good times. EV/EBITDA catches the debt burden.",
    formula: {
      expression: "EV/EBITDA = (Market Cap + Total Debt - Cash) ÷ EBITDA",
      variables: [
        { name: "Market Cap", symbol: "MCAP", min: 100, max: 5000, step: 100, defaultValue: 1200, unit: "Cr", description: "Value of equity" },
        { name: "Net Debt", symbol: "Debt", min: -200, max: 2000, step: 50, defaultValue: 300, unit: "Cr", description: "Debt minus cash" },
        { name: "EBITDA", symbol: "EBITDA", min: 50, max: 500, step: 25, defaultValue: 150, unit: "Cr", description: "Operating earnings" },
      ],
      compute: (v) => {
        const ev = v.MCAP + v.Debt;
        const ratio = ev / (v.EBITDA || 1);
        return { value: Number(ratio.toFixed(1)), unit: "x", interpretation: `EV is ₹${ev} Cr. Trading at ${ratio.toFixed(1)}x EBITDA.` };
      }
    },
    defaultStock: {
      ticker: "TATASTEEL.NS",
      name: "Tata Steel Limited",
      metricLabel: "Capital Intensity",
      metricValue: "Cyclical EV",
      takeaway: "In steel, debt levels are substantial; EV/EBITDA gives a clearer valuation picture than P/E."
    },
    practiceQuestions: [
      {
        question: "Why do analysts use EV instead of Market Cap when comparing capital-intensive companies?",
        options: ["Market Cap ignores debt obligations that the buyer effectively acquires", "EV is mandated by stock exchanges", "EBITDA is calculated only in US dollars", "Debt has no financial impact"],
        correct: 0,
        explanation: "Enterprise value includes net debt, ensuring that heavily leveraged firms are not mistakenly considered cheap."
      }
    ],
    mission: {
      prompt: "Compare Tata Steel (TATASTEEL.NS) with JSW Steel. Check EV/EBITDA vs P/E.",
      targetStock: "TATASTEEL.NS",
      starterHint: "Observe how debt shifts total enterprise value.",
      xp: 40,
      sampleAnswer: "Tata Steel's EV/EBITDA around 6x-8x reflects cyclicality and UK plant restructuring capex."
    },
    masteryCheck: [
      {
        question: "What does EBITDA stand for?",
        options: ["Earnings Before Interest, Taxes, Depreciation, and Amortization", "Equity Valuation Before Income, Tariffs, and Debts", "Earnings Based on Inflation, Taxes, and Dividends", "Estimated Balance of Total Debt and Assets"],
        correct: 0,
        explanation: "EBITDA measures pure operational cash generation before non-cash depreciation and financing structure decisions."
      }
    ]
  },
  "financial-statements": {
    track: "analyze",
    title: "Financial Statements Overview",
    tagline: "The three interconnected lenses of corporate reality.",
    plainEnglish: "Every company communicates its economic health through three linked reports: the Income Statement (profitability over time), the Balance Sheet (assets and liabilities at a moment in time), and the Cash Flow Statement (real cash movement).",
    mentalModel: {
      title: "The Athlete's Report Card",
      description: "The income statement is your scoreboard (points scored), the balance sheet is your physical conditioning (muscles vs injuries), and cash flow is your oxygen tank (you can score points, but run out of oxygen and you collapse)."
    },
    whyItMatters: "Analyzing one statement in isolation leads to fatal blind spots. Profits without cash flow indicate poor receivables; growth without healthy balance sheets creates debt crises.",
    formula: {
      expression: "Assets = Liabilities + Shareholders' Equity",
      variables: [
        { name: "Total Liabilities", symbol: "L", min: 100, max: 2000, step: 50, defaultValue: 400, unit: "Cr", description: "Obligations to creditors" },
        { name: "Equity", symbol: "E", min: 100, max: 2000, step: 50, defaultValue: 600, unit: "Cr", description: "Net worth belonging to owners" },
      ],
      compute: (v) => {
        const total = v.L + v.E;
        return { value: total, unit: "Cr", interpretation: `Total Assets equal ₹${total} Cr, financed by ₹${v.L} Cr in liabilities and ₹${v.E} Cr in equity.` };
      }
    },
    defaultStock: {
      ticker: "INFY.NS",
      name: "Infosys Limited",
      metricLabel: "Clean Balance Sheet",
      metricValue: "Zero Debt",
      takeaway: "Infosys maintains a virtually debt-free balance sheet with high cash reserves, shielding it from credit cycles."
    },
    practiceQuestions: [
      {
        question: "If a company has ₹1,000 crore in assets and ₹300 crore in liabilities, what is its equity?",
        options: ["₹300 Cr", "₹700 Cr", "₹1,300 Cr", "₹1,000 Cr"],
        correct: 1,
        explanation: "Equity = Assets - Liabilities = 1000 - 300 = ₹700 crore."
      }
    ],
    mission: {
      prompt: "Review Infosys's balance sheet on the stock tab. Verify that cash and short-term investments exceed total borrowings.",
      targetStock: "INFY.NS",
      starterHint: "Look at the Balance Sheet card under the stock overview.",
      xp: 40,
      sampleAnswer: "Infosys holds over ₹15,000 crore in cash and equivalents with near-zero long-term debt, providing an impregnable liquidity cushion."
    },
    masteryCheck: [
      {
        question: "Which financial statement shows the actual physical movement of bank cash?",
        options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Auditor's certificate"],
        correct: 2,
        explanation: "The Cash Flow Statement traces real receipts and disbursements, stripping away accounting accruals."
      }
    ]
  },
  "income-statement": {
    track: "analyze",
    title: "Income Statement",
    tagline: "Tracking top-line revenue down to bottom-line net profit.",
    plainEnglish: "The income statement reveals a company's revenue and operating costs over a quarter or fiscal year. It shows how efficiently management converts gross sales into operating profit (EBIT) and net profit (PAT).",
    mentalModel: {
      title: "The Waterfall of Earnings",
      description: "Revenue pours in at the top. Raw material costs take a slice, employee salaries take another, interest to lenders and taxes to the government take theirs. What remains in the pool at the bottom is net profit for shareholders."
    },
    whyItMatters: "Understanding margin expansion tells you whether a business is scaling profitably or buying growth through unsustainable discounts.",
    formula: {
      expression: "Net Profit Margin (%) = (Net Profit ÷ Total Revenue) × 100",
      variables: [
        { name: "Revenue", symbol: "Rev", min: 500, max: 10000, step: 250, defaultValue: 2000, unit: "Cr", description: "Top-line sales" },
        { name: "Net Profit", symbol: "PAT", min: 10, max: 1500, step: 25, defaultValue: 300, unit: "Cr", description: "Bottom-line profit" },
      ],
      compute: (v) => {
        const margin = (v.PAT / (v.Rev || 1)) * 100;
        return { value: Number(margin.toFixed(1)), unit: "%", interpretation: `Net profit margin is ${margin.toFixed(1)}%. Every ₹100 in sales leaves ₹${margin.toFixed(1)} in bottom-line profit.` };
      }
    },
    defaultStock: {
      ticker: "TCS.NS",
      name: "Tata Consultancy Services",
      metricLabel: "Operating Margin Benchmark",
      metricValue: "24-26% EBIT Margin",
      takeaway: "TCS consistently converts industry-leading gross revenue into 24-26% operating profit margins through high utilization and delivery scale."
    },
    practiceQuestions: [
      {
        question: "What does Operating Profit (EBIT) measure?",
        options: ["Sales after taxes", "Profits from core business operations before financing costs and taxes", "Total dividends paid to promoters", "Revenue from mutual fund investments"],
        correct: 1,
        explanation: "EBIT shows how profitable the fundamental business is before capital structure (debt vs equity) and corporate tax rates come into play."
      }
    ],
    mission: {
      prompt: "Look at TCS's operating profit margins over the last 3 years. Note whether margins remained steady above 24%.",
      targetStock: "TCS.NS",
      starterHint: "Check the Overview tab for TCS on the dissector.",
      xp: 30,
      sampleAnswer: "TCS has maintained operating margins between 24% and 26% across cycles, proving its software delivery efficiency."
    },
    masteryCheck: [
      {
        question: "Why can revenue growth without margin growth be dangerous?",
        options: ["Because the company might be selling products below cost to buy volume", "Because revenue growth is taxed at 50%", "Because exchanges cap sales growth at 20%", "Because suppliers refuse discounts"],
        correct: 0,
        explanation: "Unprofitable growth consumes working capital; if margins collapse, larger sales volumes simply accelerate cash burn."
      }
    ]
  },
  "balance-sheet": {
    track: "analyze",
    title: "Balance Sheet Health",
    tagline: "Assessing assets, liabilities, and staying power.",
    plainEnglish: "The balance sheet is a snapshot of financial fortitude. It details what the firm owns (factories, inventory, receivables, cash) and what it owes (bank debt, vendor payables). A conservative balance sheet guarantees survival during deep recessions.",
    mentalModel: {
      title: "The Fortress Foundation",
      description: "A tall skyscraper cannot survive on soil without deep pilings. A company with massive debt is vulnerable when interest rates rise or revenues contract. A company with net cash can withstand prolonged economic storms."
    },
    whyItMatters: "Companies with high debt-to-equity ratios face bankruptcy risk if cash flow hits a temporary snag.",
    formula: {
      expression: "Debt-to-Equity (D/E) = Total Debt ÷ Total Shareholders' Equity",
      variables: [
        { name: "Total Debt", symbol: "D", min: 0, max: 2000, step: 50, defaultValue: 300, unit: "Cr", description: "Short and long term borrowings" },
        { name: "Shareholders Equity", symbol: "E", min: 100, max: 2000, step: 50, defaultValue: 600, unit: "Cr", description: "Net worth" },
      ],
      compute: (v) => {
        const de = v.D / (v.E || 1);
        return { value: Number(de.toFixed(2)), unit: "x", interpretation: `D/E is ${de.toFixed(2)}x. Below 0.5x is conservative; above 1.5x signals leverage risk in cyclical sectors.` };
      }
    },
    defaultStock: {
      ticker: "ASIANPAINT.NS",
      name: "Asian Paints Limited",
      metricLabel: "Leverage Health",
      metricValue: "Low Debt",
      takeaway: "Asian Paints funds nearly all its new automated paint plants from internal cash flows rather than bank borrowings."
    },
    practiceQuestions: [
      {
        question: "A company has ₹400 crore debt and ₹800 crore equity. What is its D/E ratio?",
        options: ["0.25x", "0.50x", "1.00x", "2.00x"],
        correct: 1,
        explanation: "D/E = 400 ÷ 800 = 0.50x."
      }
    ],
    mission: {
      prompt: "Check Asian Paints' D/E ratio. Explain why low debt gives it an advantage against aggressive new competitors like Birla Opus.",
      targetStock: "ASIANPAINT.NS",
      starterHint: "Observe how low interest costs protect operating margins.",
      xp: 30,
      sampleAnswer: "With minimal debt and negligible interest expense, Asian Paints can defend dealership margins without financial distress during price wars."
    },
    masteryCheck: [
      {
        question: "What is the Current Ratio?",
        options: ["Current Assets divided by Current Liabilities", "Total Debt divided by Profit", "Share price divided by sales", "Stock volume divided by daily average"],
        correct: 0,
        explanation: "Current ratio tests short-term liquidity: can the firm cover obligations due within 12 months with short-term assets?"
      }
    ]
  },
  "cash-flow": {
    track: "analyze",
    title: "Cash Flow Statement",
    tagline: "Follow the cash: the antidote to accounting illusions.",
    plainEnglish: "The cash flow statement reconciles net profit with actual bank balance movements across Operating, Investing, and Financing activities. Free Cash Flow (Operating Cash minus Capital Expenditures) is what owners can take home.",
    mentalModel: {
      title: "The River vs The Mirage",
      description: "Net profit is an opinion of accountants following rules; cash flow is a hard fact confirmed by the bank balance. You cannot pay salaries or dividends with accounting entries."
    },
    whyItMatters: "High reported profits with negative operating cash flows indicate uncollected receivables or unsold inventory.",
    formula: {
      expression: "Free Cash Flow (FCF) = Cash from Operations - Capital Expenditures",
      variables: [
        { name: "Cash from Operations", symbol: "CFO", min: 100, max: 3000, step: 50, defaultValue: 1200, unit: "Cr", description: "Operational cash generation" },
        { name: "Capital Expenditure (Capex)", symbol: "Capex", min: 50, max: 2000, step: 50, defaultValue: 400, unit: "Cr", description: "Reinvestment in plants & equipment" },
      ],
      compute: (v) => {
        const fcf = v.CFO - v.Capex;
        return { value: fcf, unit: "Cr", interpretation: `Free Cash Flow is ₹${fcf} Cr. This cash can fund dividends, debt reduction, or acquisitions.` };
      }
    },
    defaultStock: {
      ticker: "ITC.NS",
      name: "ITC Limited",
      metricLabel: "Cash Conversion Machine",
      metricValue: "High FCF/PAT",
      takeaway: "ITC converts over 90% of reported profits into real free cash flow every single year."
    },
    practiceQuestions: [
      {
        question: "If CFO is ₹800 Cr and Capex is ₹300 Cr, what is the Free Cash Flow?",
        options: ["₹300 Cr", "₹500 Cr", "₹800 Cr", "₹1,100 Cr"],
        correct: 1,
        explanation: "FCF = 800 - 300 = ₹500 crore."
      }
    ],
    mission: {
      prompt: "Inspect ITC's cash flow numbers. Calculate how much Free Cash Flow it produced compared to dividends paid.",
      targetStock: "ITC.NS",
      starterHint: "Check the Financials tab on ITC.",
      xp: 30,
      sampleAnswer: "ITC's FCF generation comfortably covers its dividend distributions with surplus capital for hotel and FMCG expansion."
    },
    masteryCheck: [
      {
        question: "What does sustained negative Free Cash Flow mean for a mature company?",
        options: ["The company is very generous to employees", "The company must continuously issue new equity or take on debt to fund ongoing operations and capex", "Taxes are eliminated by law", "Stock splits will occur"],
        correct: 1,
        explanation: "Without positive FCF, a business consumes outside capital to stay afloat."
      }
    ]
  },
  "ratio-analysis": {
    track: "analyze",
    title: "Ratio Analysis & ROE",
    tagline: "Measuring capital efficiency and management execution.",
    plainEnglish: "Ratio analysis connects income statement profits with balance sheet capital. Return on Equity (ROE) and Return on Capital Employed (ROCE) reveal how much profit management generates per rupee of capital invested.",
    mentalModel: {
      title: "The Delivery Scooter Fleet",
      description: "If Operator A buys 10 scooters for ₹10 lakh and clears ₹2.5 lakh profit (25% return), while Operator B spends ₹20 lakh for the same ₹2.5 lakh profit (12.5% return), Operator A has double the capital efficiency."
    },
    whyItMatters: "Great companies reinvest profits at high rates of return, compounding shareholder value over decades without dilution.",
    formula: {
      expression: "Return on Equity (ROE %) = (Net Profit ÷ Shareholders' Equity) × 100",
      variables: [
        { name: "Net Profit", symbol: "PAT", min: 10, max: 1000, step: 25, defaultValue: 150, unit: "Cr", description: "Annual earnings" },
        { name: "Shareholders Equity", symbol: "E", min: 100, max: 3000, step: 50, defaultValue: 750, unit: "Cr", description: "Equity net worth" },
      ],
      compute: (v) => {
        const roe = (v.PAT / (v.E || 1)) * 100;
        return { value: Number(roe.toFixed(1)), unit: "%", interpretation: `ROE is ${roe.toFixed(1)}%. Superior compounders generally exceed 15-20% sustained ROE.` };
      }
    },
    defaultStock: {
      ticker: "TCS.NS",
      name: "Tata Consultancy Services",
      metricLabel: "Capital Efficiency",
      metricValue: "ROE > 40%",
      takeaway: "TCS earns exceptional return on equity because software consulting requires minimal physical equipment and receivables are collected swiftly."
    },
    practiceQuestions: [
      {
        question: "What is the DuPont decomposition of ROE?",
        options: ["Net Margin × Asset Turnover × Financial Leverage", "Price × EPS × Dividends", "Sales ÷ Debt ÷ Cash", "Assets ÷ Liabilities × 100"],
        correct: 0,
        explanation: "DuPont breaks ROE into operating efficiency (margin), asset productivity (turnover), and capital structure (leverage)."
      }
    ],
    mission: {
      prompt: "Look at TCS's ROE vs a capital-heavy manufacturer. Note how asset-light businesses generate higher returns on capital.",
      targetStock: "TCS.NS",
      starterHint: "Observe TCS's balance sheet size compared to its profit.",
      xp: 40,
      sampleAnswer: "TCS delivers over 40% ROE because its primary assets are human capital and intellectual processes rather than steel mills."
    },
    masteryCheck: [
      {
        question: "Why should investors be cautious of high ROE driven entirely by high financial leverage?",
        options: ["High debt boosts ROE on paper during booms, but magnifies losses and bankruptcy risk in downturns", "Debt is illegal under SEBI guidelines", "High debt lowers stock trading volume", "Leverage has no impact on ROE"],
        correct: 0,
        explanation: "A company can manufacture a 30% ROE with 90% debt, but it creates fatal vulnerability if revenue drops 10%."
      }
    ]
  },
  "risk-assessment": {
    track: "analyze",
    title: "Risk Assessment",
    tagline: "Rule No. 1: Never lose capital. Rule No. 2: Never forget Rule No. 1.",
    plainEnglish: "Risk in fundamental investing is not daily price volatility; it is the probability of permanent loss of capital. Key risks include customer concentration, debt traps, technological obsolescence, and regulatory intervention.",
    mentalModel: {
      title: "The Single-Customer Subcontractor",
      description: "If your factory sells 80% of its output to a single carmaker, you do not own an independent business—you are an outsourced division at their mercy. If they demand a 15% discount, you have no choice but to accept."
    },
    whyItMatters: "Understanding risk allows you to size positions appropriately and avoid catastrophe.",
    formula: {
      expression: "Interest Coverage Ratio = Operating Profit (EBIT) ÷ Annual Interest Expense",
      variables: [
        { name: "Operating Profit (EBIT)", symbol: "EBIT", min: 10, max: 1000, step: 25, defaultValue: 300, unit: "Cr", description: "Operating earnings" },
        { name: "Interest Expense", symbol: "Int", min: 5, max: 200, step: 5, defaultValue: 50, unit: "Cr", description: "Debt service costs" },
      ],
      compute: (v) => {
        const cov = v.EBIT / (v.Int || 1);
        return { value: Number(cov.toFixed(1)), unit: "x", interpretation: `Interest coverage is ${cov.toFixed(1)}x. Coverage below 2.5x indicates financial distress risk during an economic slowdown.` };
      }
    },
    defaultStock: {
      ticker: "ZOMATO.NS",
      name: "Zomato Limited",
      metricLabel: "Operational & Competitive Risk",
      metricValue: "Duopoly Dynamics",
      takeaway: "Zomato faces fierce competition with Swiggy and Zepto in quick commerce, requiring continuous delivery network capex."
    },
    practiceQuestions: [
      {
        question: "Which of the following represents permanent capital risk rather than market volatility?",
        options: [
          "A stock drops 5% following a general market dip",
          "A major fraud is discovered in reported inventory, wiping out company equity",
          "A stock trades flat for two weeks",
          "Trading volume drops during holiday season"
        ],
        correct: 1,
        explanation: "Fraud, unserviceable debt, or obsolete products permanently destroy business equity value."
      }
    ],
    mission: {
      prompt: "Review Zomato's risk factors on the stock page. Identify whether competitive rivalry or regulatory food delivery rules pose the larger medium-term risk.",
      targetStock: "ZOMATO.NS",
      starterHint: "Check the Watchouts section on the Zomato page.",
      xp: 40,
      sampleAnswer: "Quick commerce dark store expansion costs and gig worker minimum wage regulations represent the two primary margin sensitivities."
    },
    masteryCheck: [
      {
        question: "What is an acceptable interest coverage ratio for a stable manufacturing business?",
        options: ["Less than 0.5x", "Between 1.0x and 1.5x", "At least 3.0x to 4.0x or higher", "Interest coverage does not matter if stock price is rising"],
        correct: 2,
        explanation: "Coverage above 3-4x provides a healthy margin of safety if sales drop during a recession."
      }
    ]
  },
  "report-writing": {
    track: "analyze",
    title: "Research Report Writing",
    tagline: "Synthesizing thesis, valuation, and risks into clear analysis.",
    plainEnglish: "A professional investment thesis synthesizes business quality, competitive advantages, valuation margin of safety, and clear invalidation criteria. It documents why you own a business and under what specific conditions you would exit.",
    mentalModel: {
      title: "The Pilot's Flight Plan",
      description: "A pilot does not decide where to fly mid-air during turbulence. They file a comprehensive flight plan before takeoff with designated emergency alternate airports. An investment report is your objective guide when market volatility tests your conviction."
    },
    whyItMatters: "Writing down your explicit assumptions prevents emotional decision-making during market crashes.",
    formula: {
      expression: "Margin of Safety (%) = ((Intrinsic Value - Current Price) ÷ Intrinsic Value) × 100",
      variables: [
        { name: "Intrinsic Value", symbol: "IV", min: 100, max: 2000, step: 50, defaultValue: 1000, unit: "₹", description: "Estimated fair value" },
        { name: "Current Price", symbol: "P", min: 50, max: 2000, step: 50, defaultValue: 750, unit: "₹", description: "Market price" },
      ],
      compute: (v) => {
        const mos = ((v.IV - v.P) / (v.IV || 1)) * 100;
        return { value: Number(mos.toFixed(1)), unit: "%", interpretation: `Margin of Safety is ${mos.toFixed(1)}%. Benjamin Graham recommended at least 20-30% cushion for fundamental security.` };
      }
    },
    defaultStock: {
      ticker: "RELIANCE.NS",
      name: "Reliance Industries",
      metricLabel: "Sum of the Parts (SOTP)",
      metricValue: "Conglomerate Valuation",
      takeaway: "Valuing Reliance requires an SOTP analysis combining O2C cash flows with separate valuations for Jio Infocomm and Reliance Retail."
    },
    practiceQuestions: [
      {
        question: "What is an 'Invalidation Thesis' in an equity research report?",
        options: [
          "A clause that makes the report illegal",
          "Specific measurable conditions (like debt rising above 1.5x or market share dropping 5%) that prove your investment premise was wrong",
          "The signature of the broker",
          "The date the stock was founded"
        ],
        correct: 1,
        explanation: "Defining your exit criteria in advance prevents anchoring to a deteriorating company."
      }
    ],
    mission: {
      prompt: "Open the Research tab and generate a structured research outline for Reliance or Tata Motors with thesis, valuation, and risks.",
      targetStock: "RELIANCE.NS",
      starterHint: "Visit /research to view or draft reports.",
      xp: 50,
      sampleAnswer: "Report outline: 1) Business Overview; 2) Retail & Telecom Moat; 3) DCF & Multiples Valuation; 4) Key Risks (O2C refining margin collapse, delay in retail IPO); 5) Thesis Invalidation Triggers."
    },
    masteryCheck: [
      {
        question: "Why should an investment report always document bear-case risks upfront?",
        options: ["Because optimistic confirmation bias is the number one cause of holding bad investments into severe declines", "SEBI requires reports to be negative", "Bear cases make reports longer", "Brokerages only trade falling stocks"],
        correct: 0,
        explanation: "Objectively documenting failure points immunizes the investor against panic or stubborn denial."
      }
    ]
  }
};

// Merge additional concepts into the lessons catalog
for (const [id, data] of Object.entries(ADDITIONAL_LESSONS)) {
  if (!LESSONS_DATABASE[id]) {
    LESSONS_DATABASE[id] = {
      id,
      track: (data.track || "analyze") as "analyze" | "dividend" | "statements" | "moats",
      title: data.title || id,
      tagline: data.tagline || "Key investment concept.",
      plainEnglish: data.plainEnglish || "Essential financial foundation for long-term equity analysis.",
      mentalModel: data.mentalModel || { title: "Everyday Comparison", description: "Comparing market mechanics with everyday commercial transactions." },
      whyItMatters: data.whyItMatters || "Crucial for understanding risk and return.",
      formula: data.formula || {
        expression: "Ratio = Metric A ÷ Metric B",
        variables: [
          { name: "Metric A", symbol: "A", min: 10, max: 100, step: 5, defaultValue: 50, unit: "₹", description: "Numerator" },
          { name: "Metric B", symbol: "B", min: 1, max: 20, step: 1, defaultValue: 5, unit: "₹", description: "Denominator" },
        ],
        compute: (v) => ({ value: Number((v.A / (v.B || 1)).toFixed(1)), unit: "x", interpretation: `Calculated multiple of ${(v.A / (v.B || 1)).toFixed(1)}x.` })
      },
      defaultStock: data.defaultStock || {
        ticker: "TCS.NS",
        name: "Tata Consultancy Services",
        metricLabel: "Core Multiple",
        metricValue: "Standard",
        takeaway: "Exemplifies consistent return on capital."
      },
      practiceQuestions: data.practiceQuestions || [
        { question: `What is the core takeaway of ${data.title || id}?`, options: ["Sound capital allocation", "Daily market timing", "Speculative leverage", "Ignoring financials"], correct: 0, explanation: "Long-term compounding requires sound capital allocation." }
      ],
      sliderSimulator: data.sliderSimulator || {
        title: "Sensitivity Simulator",
        description: "Test how adjustments change the outcome.",
        inputs: [{ key: "val", label: "Metric Value", min: 1, max: 50, step: 1, defaultValue: 15, unit: "x" }],
        evaluate: (vals) => ({ resultLabel: `${vals.val}x`, resultValue: "Standard Zone", zone: "fair", verdict: "Normal operating multiple." })
      },
      mission: data.mission || {
        prompt: `Analyze how ${data.title || id} applies to a leading Indian enterprise.`,
        targetStock: "TCS.NS",
        starterHint: "Review fundamentals on the stock dissector.",
        xp: 30,
        sampleAnswer: "Applies directly to assessing balance sheet quality and compounding durability."
      },
      masteryCheck: data.masteryCheck || [
        { question: `Why is understanding ${data.title || id} fundamental?`, options: ["Protects capital and identifies value", "Guarantees double-digit returns overnight", "Eliminates tax obligations", "Replaces annual reports"], correct: 0, explanation: "Fundamental understanding protects capital across market cycles." }
      ]
    };
  }
}
