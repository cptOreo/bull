// lib/hooks/use-skill-tree.ts
import { useProgress } from "@/state/use-progress";

export const SKILL_TREE_NODES = [
  // Analyze Any Stock Track
  { id: "valuation-basics", label: "Valuation Basics", track: "analyze", prerequisites: [] as string[], xp: 20 },
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
  { id: "dividend-basics", label: "Dividend Basics", track: "dividend", prerequisites: [] as string[], xp: 20 },
  { id: "yield-payout", label: "Yield & Payout Ratio", track: "dividend", prerequisites: ["dividend-basics"], xp: 30 },
  { id: "dividend-safety", label: "Dividend Safety", track: "dividend", prerequisites: ["yield-payout"], xp: 40 },
  { id: "sector-diversification", label: "Sector Diversification", track: "dividend", prerequisites: ["dividend-safety"], xp: 30 },
  { id: "growth-vs-yield", label: "Growth vs Yield", track: "dividend", prerequisites: ["dividend-safety"], xp: 40 },
  { id: "rebalancing", label: "Portfolio Rebalancing", track: "dividend", prerequisites: ["sector-diversification", "growth-vs-yield"], xp: 40 },
  { id: "tax-efficiency", label: "Tax Efficiency", track: "dividend", prerequisites: ["rebalancing"], xp: 30 },

  // Read Financial Statements Track
  { id: "is-basics", label: "Income Statement Basics", track: "statements", prerequisites: [] as string[], xp: 20 },
  { id: "bs-basics", label: "Balance Sheet Basics", track: "statements", prerequisites: [] as string[], xp: 20 },
  { id: "cf-basics", label: "Cash Flow Basics", track: "statements", prerequisites: [] as string[], xp: 20 },
  { id: "quality-earnings", label: "Quality of Earnings", track: "statements", prerequisites: ["is-basics"], xp: 40 },
  { id: "red-flags", label: "Red Flags in Financials", track: "statements", prerequisites: ["quality-earnings"], xp: 40 },
  { id: "forecasting", label: "Financial Forecasting", track: "statements", prerequisites: ["cf-basics", "quality-earnings"], xp: 50 },

  // Understand Moats Track
  { id: "pricing-power", label: "Pricing Power", track: "moats", prerequisites: [] as string[], xp: 30 },
  { id: "switching-costs", label: "Switching Costs", track: "moats", prerequisites: [] as string[], xp: 30 },
  { id: "network-effects", label: "Network Effects", track: "moats", prerequisites: [] as string[], xp: 30 },
  { id: "scale-advantages", label: "Scale Advantages", track: "moats", prerequisites: [] as string[], xp: 30 },
  { id: "brand-moat", label: "Brand Moat", track: "moats", prerequisites: ["pricing-power"], xp: 40 },
  { id: "intangibles", label: "Intangible Assets", track: "moats", prerequisites: ["brand-moat"], xp: 40 },
  { id: "moat-erosion", label: "Moat Erosion", track: "moats", prerequisites: ["intangibles"], xp: 40 },
];

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
