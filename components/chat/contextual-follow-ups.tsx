"use client";

import * as React from "react";

interface ContextualFollowUpsProps {
  mode: "tutor" | "analyst";
  stock?: string;
  concept?: string;
  onSelect: (prompt: string) => void;
  context?: string;
}

export function ContextualFollowUps({ 
  mode, 
  stock, 
  concept, 
  onSelect, 
  context 
}: ContextualFollowUpsProps) {
  let suggestions: string[] = [];
  
  if (mode === "tutor") {
    if (concept && (concept in {
      "pe-ratio": true,
      "dcf-modeling": true,
      "financial-statements": true,
      "dividend-safety": true,
      "pricing-power": true,
    })) {
      const tutorFollowUps: Record<string, string[]> = {
        "pe-ratio": [
          "What's a good P/E for growth stocks?",
          "How does P/E differ from PEG ratio?",
          "Explain forward vs trailing P/E",
        ],
        "dcf-modeling": [
          "What WACC should I use for Indian stocks?",
          "How sensitive is DCF to terminal growth?",
          "Walk me through a DCF example",
        ],
        "financial-statements": [
          "What's the difference between EBIT and EBITDA?",
          "How to spot red flags in cash flow?",
          "Explain free cash flow vs net income",
        ],
        "dividend-safety": [
          "What payout ratio is sustainable?",
          "How to check dividend coverage",
          "Explain dividend growth vs yield",
        ],
        "pricing-power": [
          "How to measure pricing power?",
          "Examples of Indian companies with pricing power",
          "Switching costs vs network effects",
        ],
      };
      suggestions = tutorFollowUps[concept] || [
        "Explain P/E ratio with a kirana store analogy",
        "What is DCF modeling?",
        "How to read a balance sheet?",
        "What are economic moats?",
      ];
    } else {
      suggestions = [
        "Explain P/E ratio with a kirana store analogy",
        "What is DCF modeling?",
        "How to read a balance sheet?",
        "What are economic moats?",
      ];
    }
  } else {
    if (stock) {
      suggestions = [
        "Show me the DCF for this stock",
        "Compare with sector peers",
        "What are the key risks?",
        "Build a bear/base/bull case",
      ];
    } else if (context?.includes("sector")) {
      suggestions = [
        "Show sector leaders by ROE",
        "Screen for undervalued stocks in sector",
        "Sector valuation vs historical",
      ];
    } else {
      suggestions = [
        "Screen for high ROE, low debt stocks under 20x P/E",
        "Build a DCF model for Reliance",
        "Compare TCS vs Infosys on ROE and valuation",
        "Analyze Zomato's cash flow red flags",
      ];
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Suggested follow-ups">
      {suggestions.slice(0, 4).map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-medium hover:bg-accent/50 transition-colors cursor-pointer"
          role="listitem"
        >
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary">
            <span className="h-3.5 w-3.5">✨</span>
          </span>
          <span className="truncate max-w-[200px]">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}