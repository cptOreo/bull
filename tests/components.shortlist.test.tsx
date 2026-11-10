import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectorTag, getSectorTheme } from "@/components/shortlist/sector-tag";
import { ShortlistTable, type ShortlistTableRow } from "@/components/shortlist/shortlist-table";
import { RankFactorCard } from "@/components/shortlist/rank-factor-card";
import { FactorBars } from "@/components/shortlist/factor-bars";
import { HowChosen } from "@/components/shortlist/how-chosen";
import { ShortlistCard } from "@/components/shortlist/shortlist-card";
import type { FactorBar } from "@/lib/engine/types";

describe("Shortlist Components", () => {
  describe("SectorTag", () => {
    it("renders sector name and applies distinct theme colors", () => {
      render(<SectorTag sector="Information Technology" id="it" />);
      const tag = screen.getByRole("status");
      expect(tag).toHaveTextContent("Information Technology");
      expect(tag.className).toContain("text-blue-700");

      const finTheme = getSectorTheme("financial");
      expect(finTheme.text).toContain("emerald");

      const autoTheme = getSectorTheme("automobile");
      expect(autoTheme.text).toContain("amber");

      const pharmaTheme = getSectorTheme("pharma");
      expect(pharmaTheme.text).toContain("purple");

      const fmcgTheme = getSectorTheme("fmcg");
      expect(fmcgTheme.text).toContain("rose");

      const energyTheme = getSectorTheme("energy");
      expect(energyTheme.text).toContain("orange");
    });

    it("supports sm and md sizes", () => {
      const { rerender } = render(<SectorTag sector="IT" size="sm" />);
      expect(screen.getByRole("status").className).toContain("text-[11px]");

      rerender(<SectorTag sector="IT" size="md" />);
      expect(screen.getByRole("status").className).toContain("text-xs");
    });
  });

  describe("ShortlistTable", () => {
    const mockStocks: ShortlistTableRow[] = [
      {
        rank: 1,
        ticker: "TCS",
        name: "Tata Consultancy Services Ltd",
        sector: "Information Technology",
        sectorId: "it",
        keyDrivers: [
          "Consistent ROE above 35%",
          "Zero long-term debt balance sheet",
          "High cash flow conversion",
        ],
        riskLevel: "low",
        riskSentence: "Global IT discretionary spending headwinds.",
      },
      {
        rank: 2,
        ticker: "HDFCBANK",
        name: "HDFC Bank Ltd",
        sector: "Financial Services",
        sectorId: "financial",
        keyDrivers: [
          "Market leadership in private banking",
          "Strong capital adequacy ratio",
          "Granular retail deposit franchise",
        ],
        riskLevel: "medium",
        riskSentence: "Post-merger NIM compression and deposit growth lag.",
      },
      {
        rank: 3,
        ticker: "INFY",
        name: "Infosys Ltd",
        sector: "Information Technology",
        sectorId: "it",
        keyDrivers: [
          "Strong digital revenue contribution",
          "Robust dividend payout track record",
          "Conservative capital allocation",
        ],
        riskLevel: "low",
        riskSentence: "High attrition and client concentration in BFSI.",
      },
    ];

    it("renders ranked shortlist table and dynamic diversity rule indicator", () => {
      const onDetails = vi.fn();
      const onCompare = vi.fn();

      render(
        <ShortlistTable
          stocks={mockStocks}
          onViewDetails={onDetails}
          onCompare={onCompare}
        />
      );

      // Verify diversity rule indicator
      expect(
        screen.getByText(/Max 2 per sector enforced: 2 Information Technology, 1 Financial Services/i)
      ).toBeInTheDocument();

      // Verify rank numbers
      expect(screen.getAllByText("#1")[0]).toBeInTheDocument();
      expect(screen.getAllByText("#2")[0]).toBeInTheDocument();
      expect(screen.getAllByText("#3")[0]).toBeInTheDocument();

      // Verify company names & tickers
      expect(screen.getAllByText("Tata Consultancy Services Ltd")[0]).toBeInTheDocument();
      expect(screen.getAllByText("TCS")[0]).toBeInTheDocument();

      // Verify 3 key drivers rendered
      expect(screen.getAllByText("Consistent ROE above 35%")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Zero long-term debt balance sheet")[0]).toBeInTheDocument();

      // Verify action callbacks
      const detailButtons = screen.getAllByRole("button", { name: "Details" });
      fireEvent.click(detailButtons[0]);
      expect(onDetails).toHaveBeenCalledWith("TCS");

      const compareButtons = screen.getAllByRole("button", { name: "Compare" });
      fireEvent.click(compareButtons[0]);
      expect(onCompare).toHaveBeenCalledWith("TCS");
    });

    it("renders empty state when no stocks qualify", () => {
      render(<ShortlistTable stocks={[]} />);
      expect(
        screen.getByText(/No stocks currently clear the qualification criteria/i)
      ).toBeInTheDocument();
    });
  });

  describe("RankFactorCard (Invariant 2)", () => {
    it("displays factor breakdown without a misleading composite single grade", () => {
      render(<RankFactorCard ticker="TCS" name="Tata Consultancy Services" />);

      // Verify invariant: Displays multi-factor breakdown
      expect(screen.getByText(/Financial Quality/i)).toBeInTheDocument();
      expect(screen.getByText(/Valuation & Margin of Safety/i)).toBeInTheDocument();
      expect(screen.getByText(/Risk & Resilience/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile Alignment/i)).toBeInTheDocument();

      // Verify invariant badge: No single composite grade
      expect(screen.getByText(/No single composite grade/i)).toBeInTheDocument();
      expect(screen.getByText(/Invariant 2 Enforced/i)).toBeInTheDocument();

      // Invariant verification: Ensure no fake grade like "Grade A" or "Rank 1 Pick" or "Score: 95/100"
      expect(screen.queryByText(/Grade A/i)).toBeNull();
      expect(screen.queryByText(/Top Pick/i)).toBeNull();
    });
  });

  describe("FactorBars", () => {
    it("renders factor bars with scores and weights", () => {
      const bars: FactorBar[] = [
        { factor: "quality", label: "Financial Quality", score: 0.85, weight: 0.35 },
        { factor: "valuation", label: "Valuation", score: 0.70, weight: 0.25 },
        { factor: "stability", label: "Stability", score: 0.90, weight: 0.20 },
      ];

      render(<FactorBars factorBars={bars} />);
      expect(screen.getByText("Financial Quality")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("Weight: 35%")).toBeInTheDocument();
    });
  });

  describe("HowChosen", () => {
    it("expands and displays weights, diversity cap, and threshold", () => {
      render(<HowChosen />);
      const expandBtn = screen.getByRole("button", { name: /how these companies were chosen/i });
      fireEvent.click(expandBtn);

      expect(screen.getByText(/Max 2 companies per sector enforced/i)).toBeInTheDocument();
      expect(screen.getByText(/Minimum composite threshold: 40%/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile-derived Factor Weights/i)).toBeInTheDocument();
    });
  });

  describe("ShortlistCard", () => {
    it("renders company card with 2 reasons, 1 mandatory risk sentence, and links", () => {
      const bars: FactorBar[] = [
        { factor: "quality", label: "Quality", score: 0.88, weight: 0.4 },
        { factor: "valuation", label: "Valuation", score: 0.65, weight: 0.3 },
      ];

      render(
        <ShortlistCard
          ticker="INFY"
          name="Infosys Ltd"
          sectorName="Information Technology"
          businessDescription="Global leader in next-generation digital services and consulting."
          reasons={[
            "Industry leading return on equity of 31.8%",
            "Debt-free pristine balance sheet with robust cash reserves",
          ]}
          riskSentence="Dependence on North American enterprise tech spending."
          factorBars={bars}
          asOf="2026-11-10"
        />
      );

      expect(screen.getByText("Infosys Ltd")).toBeInTheDocument();
      expect(screen.getByText("INFY")).toBeInTheDocument();
      expect(screen.getByText("Industry leading return on equity of 31.8%")).toBeInTheDocument();
      expect(screen.getByText("Debt-free pristine balance sheet with robust cash reserves")).toBeInTheDocument();
      expect(screen.getByText("Dependence on North American enterprise tech spending.")).toBeInTheDocument();
      expect(screen.getByText(/See details/i)).toBeInTheDocument();
      expect(screen.getByText(/Learn the ratio/i)).toBeInTheDocument();

      // Invariant: No composite score
      expect(screen.queryByText(/Overall Score/i)).toBeNull();
    });
  });
});
