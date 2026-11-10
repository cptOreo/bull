import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DisclaimerBanner } from "@/components/chat/disclaimer-banner";
import { StarterPrompts } from "@/components/chat/starter-prompts";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatContainer } from "@/components/chat/chat-container";
import { BullProvider } from "@/lib/state/store";
import type { Block } from "@/lib/engine/types";

// Polyfill scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Chat Components", () => {
  describe("DisclaimerBanner", () => {
    it("renders SEBI compliant disclaimer text in English", () => {
      render(<DisclaimerBanner locale="en" />);
      expect(
        screen.getByText(
          "Bull is an educational research platform, not a SEBI-registered advisor. Zero buy/sell recommendations or price targets."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Educational Notice")).toBeInTheDocument();
    });

    it("renders SEBI compliant disclaimer text in Hinglish", () => {
      render(<DisclaimerBanner locale="hi-en" />);
      expect(
        screen.getByText(
          "Bull ek educational research platform hai, SEBI-registered advisor nahi. Zero buy/sell recommendations ya price targets."
        )
      ).toBeInTheDocument();
    });

    it("dismisses on click when dismissible is true", () => {
      const handleDismiss = vi.fn();
      render(<DisclaimerBanner dismissible onDismiss={handleDismiss} />);
      const closeBtn = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText(/Bull is an educational research platform/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("StarterPrompts", () => {
    it("renders default interactive prompts and calls onSelectPrompt", () => {
      const handleSelect = vi.fn();
      render(<StarterPrompts locale="en" onSelectPrompt={handleSelect} />);

      expect(screen.getByText("Try asking:")).toBeInTheDocument();
      const chip = screen.getByText("Find low-debt IT stocks for 3 years");
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(handleSelect).toHaveBeenCalledWith("Find low-debt IT stocks for 3 years");
    });

    it("renders natural Hinglish prompts when locale is hi-en", () => {
      const handleSelect = vi.fn();
      render(<StarterPrompts locale="hi-en" onSelectPrompt={handleSelect} />);

      expect(
        screen.getByText("3 saal ke liye low-debt IT stocks dhundho")
      ).toBeInTheDocument();
      expect(screen.getByText("TCS vs Infosys compare karo")).toBeInTheDocument();
    });
  });

  describe("MessageBubble", () => {
    it("renders user bubble with right alignment and initial", () => {
      render(
        <MessageBubble
          sender="user"
          text="Which IT company has higher ROE?"
          timestamp="14:30"
        />
      );

      expect(screen.getByText("Which IT company has higher ROE?")).toBeInTheDocument();
      expect(screen.getByText("U")).toBeInTheDocument();
      expect(screen.getByText("14:30")).toBeInTheDocument();
    });

    it("renders assistant bubble with emblem and text", () => {
      render(
        <MessageBubble
          sender="assistant"
          text="TCS has an ROE of 51.5% compared to Infosys at 31.8%."
        />
      );

      expect(
        screen.getByText("TCS has an ROE of 51.5% compared to Infosys at 31.8%.")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Bull Assistant")).toBeInTheDocument();
    });

    it("renders polymorphic shortlist block", () => {
      const blocks: Block[] = [
        {
          type: "shortlist",
          cards: [
            {
              ticker: "TCS",
              name: "Tata Consultancy Services Ltd",
              sectorName: "Information Technology",
              businessDescription: "Global leader in IT services and consulting.",
              reasons: ["Zero debt balance sheet", "5-year ROE average above 40%"],
              riskSentence: "High exposure to North American tech spending slowdown.",
              factorBars: [
                { factor: "quality", label: "Quality", score: 92, weight: 0.3 },
                { factor: "stability", label: "Stability", score: 88, weight: 0.2 },
              ],
              asOf: "2026-11-10",
              sourceLabel: "Audited FY24",
            },
          ],
          thinFit: false,
          sectors: 1,
          diversityNote: "Diversification across sectors reduces idiosyncratic risk.",
          howChosen: {
            weights: {
              quality: 0.3,
              stability: 0.2,
              growth: 0.2,
              valuation: 0.1,
              income: 0.1,
              simplicity: 0.1,
            },
            anchorsSummary: "P/E: 28.5 (sector median: 30.2)",
            sectorCap: 2,
            threshold: 70,
          },
        },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);

      expect(screen.getByText("TCS")).toBeInTheDocument();
      expect(screen.getByText("Tata Consultancy Services Ltd")).toBeInTheDocument();
      expect(screen.getByText("Zero debt balance sheet")).toBeInTheDocument();
      expect(screen.getByText(/High exposure to North American/)).toBeInTheDocument();
      expect(screen.getByText("Diversification across sectors reduces idiosyncratic risk.")).toBeInTheDocument();
    });

    it("renders polymorphic stock_detail block with 4-rung metrics", () => {
      const blocks: Block[] = [
        {
          type: "stock_detail",
          ticker: "INFY",
          sections: [
            {
              id: "valuation",
              title: "Valuation Metrics",
              rows: [{ label: "P/E Ratio", value: "24.5", note: "10-day avg close" }],
            },
            {
              id: "profitability",
              title: "Profitability & Returns",
              rows: [{ label: "ROE", value: "31.8%" }],
            },
            {
              id: "debt",
              title: "Debt & Solvency",
              rows: [{ label: "Debt to Equity", value: "0.08" }],
            },
            {
              id: "growth",
              title: "Growth & Capital",
              rows: [{ label: "5Y Sales CAGR", value: "11.2%" }],
            },
          ],
        },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);

      expect(screen.getByText("INFY")).toBeInTheDocument();
      expect(screen.getByText("Valuation Metrics")).toBeInTheDocument();
      expect(screen.getByText("P/E Ratio")).toBeInTheDocument();
      expect(screen.getByText("24.5")).toBeInTheDocument();
      expect(screen.getByText("Profitability & Returns")).toBeInTheDocument();
      expect(screen.getByText("Debt & Solvency")).toBeInTheDocument();
      expect(screen.getByText("Growth & Capital")).toBeInTheDocument();
    });

    it("renders polymorphic comparison block", () => {
      const blocks: Block[] = [
        {
          type: "comparison",
          tickers: ["TCS", "INFY"],
          rows: [
            { label: "P/E Ratio", stockAValue: "28.5", stockBValue: "24.5" },
            { label: "ROE", stockAValue: "51.5%", stockBValue: "31.8%" },
          ],
        },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);

      expect(screen.getByText("TCS")).toBeInTheDocument();
      expect(screen.getByText("INFY")).toBeInTheDocument();
      expect(screen.getByText("51.5%")).toBeInTheDocument();
      expect(screen.getByText("31.8%")).toBeInTheDocument();
      expect(
        screen.getByText(/Bull presents side-by-side data without selecting a winner/i)
      ).toBeInTheDocument();
    });

    it("renders polymorphic news block", () => {
      const blocks: Block[] = [
        {
          type: "news",
          items: [
            {
              headline: "TCS expands cloud partnership with AWS",
              summary: "Multi-year agreement announced for AI and enterprise cloud migrations.",
              sourceName: "BSE Filing",
              publishedAt: "2026-10-15",
              kind: "announcement",
              sourceUrl: "https://bseindia.com",
            },
          ],
        },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);

      expect(screen.getByText(/TCS expands cloud partnership with AWS/)).toBeInTheDocument();
      expect(screen.getByText("BSE Filing")).toBeInTheDocument();
      expect(screen.getByText("2026-10-15")).toBeInTheDocument();
      expect(
        screen.getByText("Multi-year agreement announced for AI and enterprise cloud migrations.")
      ).toBeInTheDocument();
    });

    it("renders polymorphic boundary block", () => {
      const blocks: Block[] = [
        {
          type: "boundary",
          topic: "advice",
          explanation:
            "Bull does not provide investment advice, buy or sell recommendations, or target prices.",
        },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);

      expect(screen.getByText("Investment Advice Boundary")).toBeInTheDocument();
      expect(
        screen.getByText("Bull does not provide investment advice, buy or sell recommendations, or target prices.")
      ).toBeInTheDocument();
    });

    it("renders polymorphic education_note, limitations, and coverage_miss blocks", () => {
      const blocks: Block[] = [
        {
          type: "education_note",
          text: "This is educational analysis and not a buy or sell recommendation.",
        },
        {
          type: "limitations",
          items: ["Management quality is not scored.", "Real-time intra-day swings are omitted."],
        },
        {
          type: "coverage_miss",
          name: "Apple Inc (AAPL)",
          reason: "Apple is a US company. Bull covers 12 constituent companies from the Nifty 50.",
        },
      ];

      render(<MessageBubble sender="assistant" blocks={blocks} />);

      expect(
        screen.getByText("This is educational analysis and not a buy or sell recommendation.")
      ).toBeInTheDocument();
      expect(screen.getByText("Important Limitations & Assumptions")).toBeInTheDocument();
      expect(screen.getByText("Management quality is not scored.")).toBeInTheDocument();
      expect(screen.getByText(/Apple Inc \(AAPL\) is not covered in Bull v0/)).toBeInTheDocument();
    });
  });

  describe("ChatContainer", () => {
    it("renders empty state with welcome, starter prompts, and quick actions", () => {
      render(
        <BullProvider>
          <ChatContainer />
        </BullProvider>
      );

      expect(screen.getByText("Bull")).toBeInTheDocument();
      expect(screen.getByText(/Start a conversation to discover companies/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask about a company, compare two stocks/i)).toBeInTheDocument();
    });

    it("submits message via composer input and button", async () => {
      const handleSendMessage = vi.fn();
      render(
        <BullProvider>
          <ChatContainer onSendMessage={handleSendMessage} />
        </BullProvider>
      );

      const textarea = screen.getByPlaceholderText(/Ask about a company/i);
      const submitBtn = screen.getByRole("button", { name: /send/i });

      // Button is disabled when input is empty
      expect(submitBtn).toBeDisabled();

      fireEvent.change(textarea, { target: { value: "Tell me about ITC" } });
      expect(submitBtn).toBeEnabled();

      fireEvent.click(submitBtn);
      expect(handleSendMessage).toHaveBeenCalledWith("Tell me about ITC");
    });

    it("submits message on Enter key without shift", () => {
      const handleSendMessage = vi.fn();
      render(
        <BullProvider>
          <ChatContainer onSendMessage={handleSendMessage} />
        </BullProvider>
      );

      const textarea = screen.getByPlaceholderText(/Ask about a company/i);
      fireEvent.change(textarea, { target: { value: "Compare TCS and INFY" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

      expect(handleSendMessage).toHaveBeenCalledWith("Compare TCS and INFY");
    });

    it("does not submit on Shift+Enter (allows newline)", () => {
      const handleSendMessage = vi.fn();
      render(
        <BullProvider>
          <ChatContainer onSendMessage={handleSendMessage} />
        </BullProvider>
      );

      const textarea = screen.getByPlaceholderText(/Ask about a company/i);
      fireEvent.change(textarea, { target: { value: "Line 1" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

      expect(handleSendMessage).not.toHaveBeenCalled();
    });

    it("disables input and shows loading state while awaiting engine response", () => {
      render(
        <BullProvider>
          <ChatContainer isLoading={true} />
        </BullProvider>
      );

      const textarea = screen.getByPlaceholderText(/Ask about a company/i);
      expect(textarea).toBeDisabled();
      expect(screen.getByLabelText("Bull is thinking")).toBeInTheDocument();
    });

    it("renders message stream when messages are present", () => {
      const testMessages = [
        { id: "1", sender: "user" as const, text: "Compare TCS vs Infosys", timestamp: "12:00" },
        { id: "2", sender: "assistant" as const, text: "Here is the comparison:", timestamp: "12:01" },
      ];

      render(
        <BullProvider>
          <ChatContainer messages={testMessages} />
        </BullProvider>
      );

      expect(screen.getByText("Compare TCS vs Infosys")).toBeInTheDocument();
      expect(screen.getByText("Here is the comparison:")).toBeInTheDocument();
    });
  });
});
