import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react"
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import HomePage from "@/app/page";
import { BullProvider } from "@/lib/state/store";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("HomePage (Educational Learning Studio)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { symbol: "ZOMATO", name: "Zomato Limited", exchange: "NSE", type: "EQUITY" },
        ],
      }),
    });
  });

  function renderPage() {
    return render(
      <BullProvider>
        <HomePage />
      </BullProvider>
    );
  }

  it("renders the educational studio header, status badge, and title", () => {
    renderPage();
    expect(screen.getByText("Bull Educational Studio")).toBeInTheDocument();
    expect(
      screen.getByText(/Understand businesses from the owner's perspective/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NSE · BSE · Global Equities · Audited Reports/i)
    ).toBeInTheDocument();
  });

  it("renders all 4 studio tabs with accessible roles", () => {
    renderPage();
    const tabList = screen.getByRole("tablist", { name: /Educational Studio Sections/i });
    expect(tabList).toBeInTheDocument();

    const masterclassTab = screen.getByRole("tab", { name: /Masterclass/i });
    const sandboxTab = screen.getByRole("tab", { name: /Valuation Sandbox/i });
    const dissectorTab = screen.getByRole("tab", { name: /Live Stock Dissector/i });
    const tutorTab = screen.getByRole("tab", { name: /AI Financial Tutor/i });

    expect(masterclassTab).toHaveAttribute("aria-selected", "true");
    expect(sandboxTab).toHaveAttribute("aria-selected", "false");
    expect(dissectorTab).toHaveAttribute("aria-selected", "false");
    expect(tutorTab).toHaveAttribute("aria-selected", "false");
  });

  it("switches to Valuation Sandbox when clicking the sandbox tab", () => {
    renderPage();
    const sandboxTab = screen.getByRole("tab", { name: /Valuation Sandbox/i });
    fireEvent.click(sandboxTab);

    expect(sandboxTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Valuation & Solvency Simulator")).toBeInTheDocument();
    expect(screen.getByText("Calculated Valuation Multiple")).toBeInTheDocument();
  });

  it("switches to Live Stock Dissector when clicking the dissector tab", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ticker: "ZOMATO",
        name: "Zomato Limited",
        price: 264.5,
        currency: "INR",
        change: 4.8,
        changePercent: 1.85,
        dayHigh: 268.0,
        dayLow: 259.2,
        fiftyTwoWeekHigh: 298.2,
        fiftyTwoWeekLow: 112.5,
        marketCap: 233500,
        marketCapFormatted: "₹2.34L Cr",
        peRatio: 68.4,
        dividendYield: 0.0,
        sector: "Consumer Internet",
        industry: "Quick Commerce & Food Delivery",
        summary: "Operates India's leading restaurant delivery app alongside Blinkit.",
        strengths: ["Blinkit store density delivers operating profits faster than peers"],
        watchouts: ["Heavy dark-store capex needed to defend turf against Zepto"],
        asOf: "2026-11-10",
      }),
    });

    renderPage();
    const dissectorTab = screen.getByRole("tab", { name: /Live Stock Dissector/i });
    fireEvent.click(dissectorTab);

    expect(dissectorTab).toHaveAttribute("aria-selected", "true");
    await waitFor(() => {
      expect(screen.getByText("Live Stock Dissector")).toBeInTheDocument();
    });
  });

  it("switches to AI Financial Tutor when clicking the tutor tab", () => {
    renderPage();
    const tutorTab = screen.getByRole("tab", { name: /AI Financial Tutor/i });
    fireEvent.click(tutorTab);

    expect(tutorTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/Ask about a company/i)).toBeInTheDocument();
  });

  it("renders universal live search bar with combobox role and kbd hint", () => {
    renderPage();
    const searchInput = screen.getByRole("combobox");
    expect(searchInput).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Search any Indian or global stock")
    );
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("renders curiosity prompt chips that can trigger AI Tutor", () => {
    renderPage();
    expect(screen.getByText("Curiosity:")).toBeInTheDocument();
    const kiranaChip = screen.getByRole("button", { name: "Kirana Store P/E Ratio" });
    expect(kiranaChip).toBeInTheDocument();

    fireEvent.click(kiranaChip);
    const tutorTab = screen.getByRole("tab", { name: /AI Financial Tutor/i });
    expect(tutorTab).toHaveAttribute("aria-selected", "true");
  });
});
