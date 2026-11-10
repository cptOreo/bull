import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react"
import { screen, fireEvent, waitFor } from "@testing-library/dom";

import {
  CurriculumTracks,
  CURRICULUM_TRACKS,
} from "@/components/learn/curriculum-tracks";
import {
  RatioSimulator,
  SIMULATOR_PRESETS,
} from "@/components/learn/ratio-simulator";
import {
  StockDissector,
  POPULAR_DISSECTION_PILLS,
} from "@/components/learn/stock-dissector";
import type { LiveStockSnapshot, StockSearchResult } from "@/lib/data/live";

describe("Educational Learning Components (Bull)", () => {
  // --------------------------------------------------------------------------
  // Component 1: CurriculumTracks
  // --------------------------------------------------------------------------
  describe("CurriculumTracks", () => {
    it("renders all 4 foundation interactive tracks with accessible tabs", () => {
      render(<CurriculumTracks />);

      // Verify all 4 tabs exist
      expect(screen.getByRole("tab", { name: /The Owner's Mindset/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /The Kirana Valuation Model/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Balance Sheet X-Ray/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Economic Moats & Pricing Power/i })).toBeInTheDocument();

      // Check default active track (Owner's Mindset)
      expect(screen.getByRole("tab", { name: /The Owner's Mindset/i })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText(/The 100-Flat Apartment Complex/i)).toBeInTheDocument();
      expect(
        screen.getByText(/1 Share = 1 Fractional Deed of All Assets, Working Capital & Future Cash Flows/i),
      ).toBeInTheDocument();
    });

    it("switches active track when tab is clicked", () => {
      render(<CurriculumTracks />);

      // Click "The Kirana Valuation Model" tab
      const kiranaTab = screen.getByRole("tab", { name: /The Kirana Valuation Model/i });
      fireEvent.click(kiranaTab);

      expect(kiranaTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText(/The Corner Kirana Counter/i)).toBeInTheDocument();
      expect(screen.getByText(/P\/E Ratio = Purchase Price ÷ Annual Profit/i)).toBeInTheDocument();
    });

    it("evaluates check question: displays error on wrong answer and success on correct answer", () => {
      render(<CurriculumTracks />);

      // Active track is Owner's Mindset. Correct index is 1 (Option B).
      const options = screen.getAllByRole("radio");
      expect(options).toHaveLength(3);

      // Select wrong answer (Option A)
      fireEvent.click(options[0]);
      expect(options[0]).toHaveAttribute("aria-checked", "true");

      // Submit check
      const checkBtn = screen.getByRole("button", { name: /Check Answer/i });
      fireEvent.click(checkBtn);

      // Verify incorrect feedback
      expect(screen.getByText(/Not Quite Right/i)).toBeInTheDocument();

      // Click "Try Again"
      const tryAgainBtn = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(tryAgainBtn);

      // Now select correct answer (Option B)
      const freshOptions = screen.getAllByRole("radio");
      fireEvent.click(freshOptions[1]);
      fireEvent.click(screen.getByRole("button", { name: /Check Answer/i }));

      // Verify correct feedback
      expect(screen.getByText(/Correct Analysis/i)).toBeInTheDocument();
      expect(screen.getByText(CURRICULUM_TRACKS[0].check.explanation)).toBeInTheDocument();
    });

    it("triggers onAskTutor callback with contextual prompt", () => {
      const handleAskTutor = vi.fn();
      render(<CurriculumTracks onAskTutor={handleAskTutor} />);

      const tutorBtn = screen.getByRole("button", { name: /Ask AI Tutor about this track/i });
      fireEvent.click(tutorBtn);

      expect(handleAskTutor).toHaveBeenCalledWith(CURRICULUM_TRACKS[0].tutorPrompt);
    });
  });

  // --------------------------------------------------------------------------
  // Component 2: RatioSimulator
  // --------------------------------------------------------------------------
  describe("RatioSimulator", () => {
    it("renders sliders, calculated P/E ratio, and valuation zone", () => {
      render(
        <RatioSimulator
          initialValues={{
            price: 1000,
            eps: 50,
            debtToEquity: 0.2,
            netMargin: 15,
          }}
        />
      );

      // Verify calculated P/E = 1000 / 50 = 20.0x
      expect(screen.getByTestId("calculated-pe")).toHaveTextContent("20.0x");
      // Earnings yield = (50 / 1000) * 100 = 5.00%
      expect(screen.getByTestId("calculated-yield")).toHaveTextContent("5.00%");

      // Valuation Zone for 20x is "Reasonable"
      expect(screen.getByTestId("valuation-zone-badge")).toHaveTextContent(/Reasonable/i);

      // Solvency for 0.2x is "Conservative"
      expect(screen.getByTestId("solvency-badge")).toHaveTextContent(/Conservative/i);

      // Check dynamic explanation text
      expect(screen.getByTestId("explanation-card")).toHaveTextContent(
        "At a P/E of 20.0x, you are paying ₹20.0 for every ₹1 of annual profit",
      );
    });

    it("updates calculated P/E and zones dynamically when sliders change", () => {
      render(
        <RatioSimulator
          initialValues={{
            price: 1000,
            eps: 50,
            debtToEquity: 0.2,
            netMargin: 15,
          }}
        />
      );

      // Change Share Price to 3000
      const priceSlider = screen.getByLabelText("Share Price");
      fireEvent.change(priceSlider, { target: { value: "3000" } });

      // Change EPS to 30 => P/E = 3000 / 30 = 100.0x (Extreme Speculation)
      const epsSlider = screen.getByLabelText("Earnings Per Share");
      fireEvent.change(epsSlider, { target: { value: "30" } });

      expect(screen.getByTestId("calculated-pe")).toHaveTextContent("100.0x");
      expect(screen.getByTestId("valuation-zone-badge")).toHaveTextContent(/Extreme Speculation/i);

      // Change Debt-to-Equity to 2.5x => Leveraged
      const debtSlider = screen.getByLabelText("Debt to Equity Multiple");
      fireEvent.change(debtSlider, { target: { value: "2.5" } });
      expect(screen.getByTestId("solvency-badge")).toHaveTextContent(/Highly Leveraged/i);
    });

    it("loads presets accurately on click", () => {
      render(<RatioSimulator />);

      // Click "Steady FMCG Giant" preset
      const fmcgPresetBtn = screen.getByRole("button", { name: /Steady FMCG Giant/i });
      fireEvent.click(fmcgPresetBtn);

      const fmcg = SIMULATOR_PRESETS[0];
      // P/E = 2500 / 65 = 38.5x
      const expectedPe = (fmcg.price / fmcg.eps).toFixed(1);
      expect(screen.getByTestId("calculated-pe")).toHaveTextContent(`${expectedPe}x`);
      expect(screen.getByTestId("value-price")).toHaveTextContent("₹2,500");
      expect(screen.getByTestId("value-eps")).toHaveTextContent("₹65");
      expect(screen.getByTestId("value-debt")).toHaveTextContent("0.05x");
      expect(screen.getByTestId("value-margin")).toHaveTextContent("22%");

      // Click "Debt-Strained Cyclical"
      const cyclicalBtn = screen.getByRole("button", { name: /Debt-Strained Cyclical/i });
      fireEvent.click(cyclicalBtn);

      expect(screen.getByTestId("value-debt")).toHaveTextContent("2.80x");
      expect(screen.getByTestId("solvency-badge")).toHaveTextContent(/Highly Leveraged/i);
    });

    it("triggers onAskTutor with contextual scenario prompt", () => {
      const handleAskTutor = vi.fn();
      render(
        <RatioSimulator
          onAskTutor={handleAskTutor}
          initialValues={{ price: 1000, eps: 50, debtToEquity: 0.3, netMargin: 12 }}
        />
      );

      const tutorBtn = screen.getByRole("button", { name: /Ask AI Tutor about this scenario/i });
      fireEvent.click(tutorBtn);

      expect(handleAskTutor).toHaveBeenCalled();
      expect(handleAskTutor.mock.calls[0][0]).toContain("Analyze a stock scenario with Share Price ₹1000");
      expect(handleAskTutor.mock.calls[0][0]).toContain("P/E 20.0x");
    });
  });

  // --------------------------------------------------------------------------
  // Component 3: StockDissector
  // --------------------------------------------------------------------------
  describe("StockDissector", () => {
    const mockQuote: LiveStockSnapshot = {
      ticker: "TCS.NS",
      name: "Tata Consultancy Services Limited",
      price: 4120.5,
      currency: "INR",
      change: 45.2,
      changePercent: 1.11,
      dayHigh: 4150.0,
      dayLow: 4095.0,
      fiftyTwoWeekHigh: 4590.0,
      fiftyTwoWeekLow: 3310.0,
      marketCap: 14900000000000,
      marketCapFormatted: "₹14.90L Cr",
      peRatio: 29.4,
      dividendYield: 1.85,
      sector: "Information Technology",
      industry: "Enterprise Software Services",
      summary: "India's premier IT exporter delivering enterprise digital systems globally.",
      strengths: [
        "Industry-best operating margins (>24%) with zero debt burden",
        "Predictable cash return policy distributing roughly 80% of net profits",
      ],
      watchouts: [
        "Discretionary tech budgets abroad remain sensitive to macroeconomic slowdowns",
        "Large revenue base makes double-digit annual percentage growth tougher",
      ],
      asOf: "2026-11-10",
    };

    it("renders stock header, price, 52W range pin, and key metrics", async () => {
      const mockFetchQuote = vi.fn().mockResolvedValue(mockQuote);

      render(
        <StockDissector
          initialTicker="TCS"
          fetchQuote={mockFetchQuote}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("TCS.NS")).toBeInTheDocument();
      });

      // Verify all popular pills are rendered
      for (const pill of POPULAR_DISSECTION_PILLS) {
        expect(screen.getByRole("button", { name: pill.label })).toBeInTheDocument();
      }

      expect(screen.getByText("Tata Consultancy Services Limited")).toBeInTheDocument();
      expect(screen.getByTestId("metric-market-cap")).toHaveTextContent("₹14.90L Cr");
      expect(screen.getByTestId("metric-pe")).toHaveTextContent("29.4x");
      expect(screen.getByTestId("metric-yield")).toHaveTextContent("1.85%");
      expect(screen.getByTestId("metric-sector")).toHaveTextContent("Information Technology");

      // Strengths & Watchouts
      expect(screen.getByText(mockQuote.strengths[0])).toBeInTheDocument();
      expect(screen.getByText(mockQuote.watchouts[0])).toBeInTheDocument();
      expect(screen.getByTestId("business-summary")).toHaveTextContent(mockQuote.summary!);
    });

    it("quick select pills update the dissected stock", async () => {
      const mockZomatoQuote: LiveStockSnapshot = {
        ticker: "ZOMATO.NS",
        name: "Zomato Limited",
        price: 265.0,
        currency: "INR",
        change: 3.5,
        changePercent: 1.34,
        dayHigh: 268.0,
        dayLow: 260.0,
        fiftyTwoWeekHigh: 298.0,
        fiftyTwoWeekLow: 112.0,
        marketCap: 2340000000000,
        marketCapFormatted: "₹2.34L Cr",
        peRatio: 68.2,
        dividendYield: 0.0,
        sector: "Consumer Internet",
        industry: "Food Delivery & Quick Commerce",
        summary: "Leading Indian food delivery and quick-commerce network.",
        strengths: ["Blinkit scale moat", "Duopoly pricing power"],
        watchouts: ["High P/E multiple", "Dark store capex"],
        asOf: "2026-11-10",
      };

      const mockFetch = vi.fn((ticker: string) => {
        if (ticker.toUpperCase().includes("ZOMATO")) {
          return Promise.resolve(mockZomatoQuote);
        }
        return Promise.resolve(mockQuote);
      });

      render(<StockDissector fetchQuote={mockFetch} />);

      await waitFor(() => {
        expect(screen.getByText("TCS.NS")).toBeInTheDocument();
      });

      // Click Zomato pill
      const zomatoPill = screen.getByRole("button", { name: "Zomato" });
      fireEvent.click(zomatoPill);

      await waitFor(() => {
        expect(screen.getByText("ZOMATO.NS")).toBeInTheDocument();
      });

      expect(screen.getByText("Zomato Limited")).toBeInTheDocument();
      expect(screen.getByTestId("metric-pe")).toHaveTextContent("68.2x");
    });

    it("search input triggers debounced search and selects result from dropdown", async () => {
      const mockSearchResults: StockSearchResult[] = [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          exchange: "NASDAQ",
          type: "EQUITY",
        },
      ];

      const mockSearchFn = vi.fn().mockResolvedValue(mockSearchResults);
      const mockFetchQuote = vi.fn().mockResolvedValue(mockQuote);

      render(
        <StockDissector
          fetchQuote={mockFetchQuote}
          searchFn={mockSearchFn}
        />
      );

      const searchInput = screen.getByRole("combobox", {
        name: /Search company or stock symbol/i,
      });

      fireEvent.change(searchInput, { target: { value: "Apple" } });

      await waitFor(
        () => {
          expect(mockSearchFn).toHaveBeenCalledWith("Apple");
        },
        { timeout: 1000 },
      );

      // Dropdown option should appear
      await waitFor(() => {
        expect(screen.getByRole("option")).toBeInTheDocument();
      });

      const option = screen.getByRole("option");
      expect(option).toHaveTextContent("AAPL");
      expect(option).toHaveTextContent("Apple Inc.");

      // Click option
      fireEvent.click(option);

      // Verify fetch was called with AAPL
      await waitFor(() => {
        expect(mockFetchQuote).toHaveBeenCalledWith("AAPL");
      });
    });

    it("invokes onAskTutor with contextual stock prompt", async () => {
      const handleAskTutor = vi.fn();
      const mockFetchQuote = vi.fn().mockResolvedValue(mockQuote);

      render(
        <StockDissector
          onAskTutor={handleAskTutor}
          fetchQuote={mockFetchQuote}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("TCS.NS")).toBeInTheDocument();
      });

      const tutorBtn = screen.getByRole("button", {
        name: /Ask AI Tutor About Tata Consultancy Services Limited/i,
      });
      fireEvent.click(tutorBtn);

      expect(handleAskTutor).toHaveBeenCalled();
      expect(handleAskTutor.mock.calls[0][0]).toContain(
        "Explain the business model, valuation multiple (29.4x P/E)",
      );
      expect(handleAskTutor.mock.calls[0][0]).toContain("TCS.NS");
    });

    it("renders friendly error state when quote resolution fails", async () => {
      const mockFetchQuote = vi.fn().mockResolvedValue(null);

      render(
        <StockDissector
          initialTicker="INVALID_TICKER"
          fetchQuote={mockFetchQuote}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("stock-dissector-error")).toBeInTheDocument();
      });

      expect(screen.getByText(/Stock Dissection Notice/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry Dissection/i })).toBeInTheDocument();
    });
  });
});
