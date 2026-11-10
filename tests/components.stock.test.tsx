import { describe, expect, it, vi, beforeAll } from "vitest";
import React from "react";
import { render } from "@testing-library/react"
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { StockHeader } from "@/components/stock/stock-header";
import { Limitations } from "@/components/stock/limitations";
import { RiskBadge } from "@/components/stock/risk-badge";
import { RiskList } from "@/components/stock/risk-list";
import { RiskCheck } from "@/components/stock/risk-check";
import { MetricGrid } from "@/components/stock/metric-grid";
import { RatioGrid } from "@/components/stock/ratio-grid";
import { PriceChart } from "@/components/stock/price-chart";
import { FinancialChart } from "@/components/stock/financial-chart";
import { ProvenanceDrawer, type MetricProvenanceDetails } from "@/components/stock/provenance-drawer";
import { NewsList } from "@/components/stock/news-list";
import type { RiskFlag } from "@/lib/engine/types";
import type { FinancialYear } from "@/lib/data/schema";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("Stock Details Components", () => {
  describe("StockHeader", () => {
    it("renders stock title, prices with Indian formatting, and one-session move", () => {
      render(
        <StockHeader
          ticker="TCS"
          name="Tata Consultancy Services"
          sector="Information Technology"
          sectorId="it"
          latestClose={4150.25}
          oneSessionMovePct={1.4}
          marketCapCr={1524300}
          asOf="2026-11-10"
        />
      );

      expect(screen.getByText("Tata Consultancy Services")).toBeInTheDocument();
      expect(screen.getByText("TCS")).toBeInTheDocument();
      expect(screen.getByText("₹4,150.25")).toBeInTheDocument();
      expect(screen.getByText(/15,24,300 Cr/)).toBeInTheDocument();
      expect(screen.getByText(/▲ \+1.4%/)).toBeInTheDocument();
    });

    it("displays warning banners when tails or monthly series are expired", () => {
      const { rerender } = render(
        <StockHeader
          ticker="TCS"
          name="TCS"
          sector="IT"
          latestClose={4150}
          oneSessionMovePct={-0.5}
          asOf="2026-11-10"
          isTailExpired={true}
        />
      );
      expect(screen.getByText(/Recent daily price tail expired/i)).toBeInTheDocument();

      rerender(
        <StockHeader
          ticker="TCS"
          name="TCS"
          sector="IT"
          latestClose={4150}
          oneSessionMovePct={-0.5}
          asOf="2026-11-10"
          isMonthlyExpired={true}
        />
      );
      expect(screen.getByText(/Monthly series expired/i)).toBeInTheDocument();
    });
  });

  describe("Limitations", () => {
    it("displays data limitations and education disclaimer", () => {
      render(<Limitations ticker="TCS" />);
      expect(screen.getByRole("region")).toBeInTheDocument();
      expect(screen.getByText(/What this data does not show for TCS/i)).toBeInTheDocument();
      expect(screen.getByText(/Bull is an educational research tool/i)).toBeInTheDocument();
    });
  });

  describe("RiskBadge & RiskList", () => {
    it("renders risk badge with tooltip interaction", () => {
      render(
        <RiskBadge
          label="High Debt"
          severity="high"
          sentence="Debt-to-equity ratio exceeds 2.0x."
        />
      );

      const btn = screen.getByRole("button", { name: /High Debt/i });
      expect(btn).toBeInTheDocument();

      fireEvent.mouseEnter(btn);
      expect(screen.getByRole("tooltip")).toHaveTextContent("Debt-to-equity ratio exceeds 2.0x.");
    });

    it("renders sorted risk list and handles empty state", () => {
      const flags: RiskFlag[] = [
        {
          id: "high_volatility",
          label: "High Volatility",
          severity: "medium",
          sentence: "Annualized price volatility is 34%.",
        },
        {
          id: "high_debt",
          label: "High Debt",
          severity: "high",
          sentence: "Debt-to-equity ratio is 2.5x.",
        },
      ];

      const { rerender } = render(<RiskList flags={flags} ticker="TATASTEEL" />);
      const badges = screen.getAllByRole("button");
      // High should precede medium
      expect(badges[0]).toHaveTextContent("High Debt");
      expect(badges[1]).toHaveTextContent("High Volatility");

      rerender(<RiskList flags={[]} ticker="TCS" />);
      expect(screen.getByText(/No elevated risk flags identified/i)).toBeInTheDocument();
    });
  });

  describe("RiskCheck", () => {
    it("renders 4-option check and provides immediate feedback on selection", () => {
      const onAnswer = vi.fn();
      const flags: RiskFlag[] = [
        {
          id: "high_debt",
          label: "Elevated Debt",
          severity: "high",
          sentence: "Debt levels are elevated relative to equity.",
        },
      ];

      render(<RiskCheck ticker="VEDL" flags={flags} onAnswer={onAnswer} />);

      expect(screen.getByText(/Identify the primary risk factor for VEDL/i)).toBeInTheDocument();

      // Find the button with Elevated Debt
      const correctBtn = screen.getByRole("button", { name: /Elevated Debt/i });
      fireEvent.click(correctBtn);

      expect(onAnswer).toHaveBeenCalledWith(true);
      expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
    });
  });

  describe("MetricGrid", () => {
    it("renders 4 categories and bank deposit disclaimer", () => {
      const onSelect = vi.fn();
      const { rerender } = render(
        <MetricGrid
          ticker="TCS"
          values={{
            pe: 31.4,
            pb: 12.5,
            roePct: 48.2,
            rocePct: 56.4,
            operatingMarginPct: 24.5,
            debtToEquity: 0.05,
            interestCoverTimes: 45.2,
            revenueCagrPct: 12.8,
            patCagrPct: 10.4,
            volatilityPct: 15.2,
            maxDrawdownPct: -18.4,
          }}
          onSelectMetric={onSelect}
        />
      );

      // Verify 4 categories
      expect(screen.getByText(/1\. Valuation/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Profitability & Returns/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Balance Sheet & Solvency/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Growth & Volatility/i)).toBeInTheDocument();

      // Verify trigger
      const triggers = screen.getAllByRole("button", { name: /Inspect audit trail/i });
      fireEvent.click(triggers[0]);
      expect(onSelect).toHaveBeenCalled();

      // Rerender for bank
      rerender(
        <MetricGrid
          ticker="HDFCBANK"
          sectorModel="financial"
          values={{ pe: 18.2, roePct: 16.5 }}
        />
      );
      expect(screen.getByText(/Customer deposits are primary liabilities, not debt/i)).toBeInTheDocument();
    });
  });

  describe("RatioGrid", () => {
    it("renders at least 8 investment ratios with plain meanings", () => {
      render(<RatioGrid asOfDefault="2026-11-10" />);
      expect(screen.getByText("Price to Earnings (P/E)")).toBeInTheDocument();
      expect(screen.getByText("Price to Book (P/B)")).toBeInTheDocument();
      expect(screen.getByText("Return on Equity (ROE)")).toBeInTheDocument();
      expect(screen.getByText("Return on Capital Employed (ROCE)")).toBeInTheDocument();
      expect(screen.getByText("Operating Margin")).toBeInTheDocument();
      expect(screen.getByText("Debt to Equity (D/E)")).toBeInTheDocument();
      expect(screen.getByText("Interest Coverage")).toBeInTheDocument();
      expect(screen.getByText("Revenue 3Y CAGR")).toBeInTheDocument();
      expect(screen.getByText("PAT 3Y CAGR")).toBeInTheDocument();
    });
  });

  describe("PriceChart", () => {
    it("renders price chart and accessible table fallback", async () => {
      render(
        <PriceChart
          ticker="TCS"
          fiveYearReturnPct={85.4}
          indexReturnPct={62.1}
          segments={[
            {
              corporateActionLabel: "1:1 Bonus Issue (2024-06)",
              points: [
                { date: "2022-01-01", stockIndexed: 100, indexIndexed: 100 },
                { date: "2024-06-01", stockIndexed: 145, indexIndexed: 130 },
                { date: "2026-11-01", stockIndexed: 185.4, indexIndexed: 162.1 },
              ],
            },
          ]}
        />
      );

      expect(screen.getByText(/5-Year Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Corporate Action Break: 1:1 Bonus Issue/i)).toBeInTheDocument();
      expect(screen.getByText(/View price data table/i)).toBeInTheDocument();
    });
  });

  describe("FinancialChart", () => {
    const mockFinancials: FinancialYear[] = [
      {
        fy: "FY2024",
        periodEnd: "2024-03-31",
        sourceId: "src_bse",
        revenueCr: 240000,
        ebitdaCr: 65000,
        ebitCr: 60000,
        patCr: 45000,
        epsInr: 120,
        dpsInr: 75,
        netWorthCr: 90000,
        totalDebtCr: 0,
        interestExpenseCr: 800,
        operatingCashFlowCr: 44000,
        sharesOutstandingCr: 360,
      },
      {
        fy: "FY2025",
        periodEnd: "2025-03-31",
        sourceId: "src_bse",
        revenueCr: 265000,
        ebitdaCr: 72000,
        ebitCr: 67000,
        patCr: 50000,
        epsInr: 135,
        dpsInr: 85,
        netWorthCr: 98000,
        totalDebtCr: 0,
        interestExpenseCr: 850,
        operatingCashFlowCr: 48000,
        sharesOutstandingCr: 360,
      },
    ];

    it("renders dual bar chart and switches to margin trend", async () => {
      render(<FinancialChart ticker="TCS" financials={mockFinancials} />);

      expect(screen.getByText(/Multi-Year Financial Trends/i)).toBeInTheDocument();

      // Switch view
      const marginBtn = screen.getByRole("button", { name: /Operating & Net Margins/i });
      fireEvent.click(marginBtn);

      expect(screen.getByText(/Operating & Net Margins/i)).toBeInTheDocument();
      expect(screen.getByText(/View tabular statement data/i)).toBeInTheDocument();
    });
  });

  describe("ProvenanceDrawer (4-Rung Audit Trail)", () => {
    const mockDetails: MetricProvenanceDetails = {
      id: "TCS:roe",
      name: "Return on Equity (ROE)",
      value: "48.2%",
      rung1: {
        document: "Annual Report FY26 & BSE Filing",
        source: "BSE India / Screener.in",
        pageOrNote: "Consolidated P&L Note 24, p. 142",
        timestamp: "2026-11-10T06:00:00Z",
        sourceUrl: "https://bseindia.com/filing",
      },
      rung2: {
        formula: "Net Profit ₹45,908 Cr / Shareholder Equity ₹95,245 Cr = 48.2%",
        inputs: [
          { label: "Net Profit (PAT)", value: "₹45,908 Cr" },
          { label: "Shareholder Equity", value: "₹95,245 Cr" },
        ],
      },
      rung3: {
        percentile: 96,
        sampleSize: 50,
        universeName: "Nifty 50",
        interpretation: "Highest decile capital efficiency in large-cap universe",
      },
      rung4: {
        claimText: "TCS consistently generates superior returns on shareholder funds.",
        context: "Shortlist Reason #1",
      },
    };

    it("renders all 4 rungs of audit trail and handles ESC key dismiss", () => {
      const onClose = vi.fn();
      render(<ProvenanceDrawer isOpen={true} onClose={onClose} details={mockDetails} />);

      // Verify all 4 rungs
      expect(screen.getByText(/Rung 1 · Source Document/i)).toBeInTheDocument();
      expect(screen.getByText("Consolidated P&L Note 24, p. 142")).toBeInTheDocument();

      expect(screen.getByText(/Rung 2 · Raw Values & Formula/i)).toBeInTheDocument();
      expect(screen.getByText(/Net Profit ₹45,908 Cr \/ Shareholder Equity ₹95,245 Cr = 48.2%/i)).toBeInTheDocument();

      expect(screen.getByText(/Rung 3 · Universe Ranking/i)).toBeInTheDocument();
      expect(screen.getByText("96th")).toBeInTheDocument();

      expect(screen.getByText(/Rung 4 · UI Narrative Claim/i)).toBeInTheDocument();
      expect(screen.getByText(/TCS consistently generates superior returns/i)).toBeInTheDocument();

      // Test ESC key dismiss
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("NewsList", () => {
    it("renders dated news items with fact and commentary badges", () => {
      render(
        <NewsList
          ticker="TCS"
          items={[
            {
              headline: "TCS Signs 10-Year Digital Transformation Pact with Major European Insurer",
              summary: "The multi-million pound engagement will modernize core claims processing platforms.",
              sourceName: "Livemint",
              publishedAt: "2026-10-15T09:00:00Z",
              kind: "announcement",
              sourceUrl: "https://example.com/tcs-deal",
            },
            {
              headline: "IT Sector Margin Outlook: Wage Hikes Balanced by Operational Efficiencies",
              summary: "Analysts highlight utilization improvements and AI automation cost savings.",
              sourceName: "Economic Times",
              publishedAt: "2026-10-20T11:00:00Z",
              kind: "commentary",
              sourceUrl: null,
            },
          ]}
        />
      );

      expect(screen.getByText("Announcement")).toBeInTheDocument();
      expect(screen.getByText("Commentary")).toBeInTheDocument();
      expect(screen.getByText(/TCS Signs 10-Year Digital Transformation Pact/i)).toBeInTheDocument();
      expect(screen.getByText(/Read full source report/i)).toBeInTheDocument();
    });
  });
});
