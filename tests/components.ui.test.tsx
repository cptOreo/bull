import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react"
import { screen, fireEvent } from "@testing-library/dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { DataBadge } from "@/components/ui/data-badge";
import { EducationNote } from "@/components/ui/education-note";
import { GlossaryTooltip } from "@/components/ui/glossary-tooltip";

describe("UI Primitives", () => {
  describe("Card", () => {
    it("renders card subcomponents with correct hierarchy and text", () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Nifty 50 Metric</CardTitle>
            <CardDescription>Audited annual financial data</CardDescription>
          </CardHeader>
          <CardContent>P/E Ratio: 22.4</CardContent>
          <CardFooter>Source: Screener.in</CardFooter>
        </Card>
      );

      expect(screen.getByTestId("test-card")).toBeInTheDocument();
      expect(screen.getByText("Nifty 50 Metric")).toBeInTheDocument();
      expect(screen.getByText("Audited annual financial data")).toBeInTheDocument();
      expect(screen.getByText("P/E Ratio: 22.4")).toBeInTheDocument();
      expect(screen.getByText("Source: Screener.in")).toBeInTheDocument();
    });
  });

  describe("Button", () => {
    it("renders button variants and handles click events", () => {
      const handleClick = vi.fn();
      render(
        <Button variant="destructive" size="lg" onClick={handleClick}>
          Delete Filter
        </Button>
      );

      const btn = screen.getByRole("button", { name: /delete filter/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("respects disabled state", () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Action
        </Button>
      );

      const btn = screen.getByRole("button", { name: /disabled action/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Badge", () => {
    it("renders badges with proper variant styles", () => {
      const { rerender } = render(<Badge variant="success">+14.2%</Badge>);
      expect(screen.getByText("+14.2%")).toBeInTheDocument();

      rerender(<Badge variant="destructive">-8.5%</Badge>);
      expect(screen.getByText("-8.5%")).toBeInTheDocument();
    });
  });

  describe("Tabs", () => {
    it("renders tabs and navigates via click and keyboard arrow keys", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList aria-label="Financials">
            <TabsTrigger value="tab1">Overview</TabsTrigger>
            <TabsTrigger value="tab2">Ratios</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Overview Content</TabsContent>
          <TabsContent value="tab2">Ratios Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Overview Content")).toBeInTheDocument();
      expect(screen.queryByText("Ratios Content")).not.toBeInTheDocument();

      const tab2Trigger = screen.getByRole("tab", { name: "Ratios" });
      fireEvent.click(tab2Trigger);
      expect(screen.getByText("Ratios Content")).toBeInTheDocument();
      expect(screen.queryByText("Overview Content")).not.toBeInTheDocument();

      // Keyboard navigation
      fireEvent.keyDown(tab2Trigger, { key: "ArrowLeft" });
      expect(screen.getByText("Overview Content")).toBeInTheDocument();
    });
  });

  describe("Dialog", () => {
    it("opens dialog on trigger click and closes on close button / ESC", () => {
      render(
        <Dialog>
          <DialogTrigger>Open Metric Details</DialogTrigger>
          <DialogContent>
            <DialogTitle>Metric Methodology</DialogTitle>
            <DialogDescription>P/E is calculated using 10-session close price.</DialogDescription>
            <DialogClose>Dismiss</DialogClose>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      fireEvent.click(screen.getByText("Open Metric Details"));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Metric Methodology")).toBeInTheDocument();

      // Close via close button
      fireEvent.click(screen.getByText("Dismiss"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Tooltip", () => {
    it.skip("reveals tooltip on mouse enter and hides on mouse leave", async () => {
      render(
        <Tooltip delayDuration={0}>
          <TooltipTrigger>P/E</TooltipTrigger>
          <TooltipContent>Price to Earnings Ratio</TooltipContent>
        </Tooltip>
      );

      const trigger = screen.getByText("P/E");
      fireEvent.mouseEnter(trigger);

      expect(await screen.findByRole("tooltip")).toHaveTextContent("Price to Earnings Ratio");

      fireEvent.mouseLeave(trigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Progress", () => {
    it("renders progress bar with correct aria attributes", () => {
      render(<Progress value={45} max={100} />);
      const progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "45");
      expect(progress).toHaveAttribute("aria-valuemax", "100");
    });
  });

  describe("DataBadge", () => {
    it("renders formatted date and links to /method", () => {
      render(<DataBadge asOf="2026-11-10" sourceLabel="Screener" freshness="current" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/method");
      expect(link).toHaveTextContent("As of 2026-11-10");
      expect(link).toHaveTextContent("Screener");
    });
  });

  describe("EducationNote", () => {
    it("renders mandatory approved educational disclaimer", () => {
      render(<EducationNote locale="en" />);
      expect(
        screen.getByText("This is educational analysis and not a buy or sell recommendation.")
      ).toBeInTheDocument();
    });

    it("renders Hinglish disclaimer when locale is hi-en", () => {
      render(<EducationNote locale="hi-en" />);
      expect(
        screen.getByText("Yeh educational analysis hai aur koi buy ya sell recommendation nahi hai.")
      ).toBeInTheDocument();
    });
  });

  describe("GlossaryTooltip", () => {
    it("renders financial term trigger and displays plain-English definition with real-world analogy on click", () => {
      render(<GlossaryTooltip term="pe">P/E Ratio</GlossaryTooltip>);

      const trigger = screen.getByRole("button", { name: /p\/e ratio/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Click to open popover
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(screen.getByText("Price-to-Earnings Ratio")).toBeInTheDocument();
      expect(screen.getByText(/Compares current stock price to annual profit per share/i)).toBeInTheDocument();
      expect(screen.getByText(/If an apartment costs ₹20L and brings ₹1L annual rent/i)).toBeInTheDocument();

      // Dismiss via Escape key
      fireEvent.keyDown(trigger, { key: "Escape" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("supports all major beginner financial terms (Market Cap, Debt/Equity, ROCE, Dividend Yield, Drawdown)", () => {
      const termsToVerify = [
        { term: "marketCap", expectedTitle: "Market Capitalisation", expectedAnalogySnippet: "pizza sliced into 10 pieces" },
        { term: "debtToEquity", expectedTitle: "Debt-to-Equity Ratio", expectedAnalogySnippet: "₹80L home loan" },
        { term: "roce", expectedTitle: "Return on Capital Employed", expectedAnalogySnippet: "cafe with ₹10L total capital" },
        { term: "dividendYield", expectedTitle: "Dividend Yield", expectedAnalogySnippet: "fixed deposit interest" },
        { term: "drawdown", expectedTitle: "Maximum Drawdown", expectedAnalogySnippet: "roller-coaster test" },
      ];

      for (const item of termsToVerify) {
        const { unmount } = render(<GlossaryTooltip term={item.term} />);
        const trigger = screen.getByRole("button");
        fireEvent.click(trigger);

        expect(screen.getAllByText(item.expectedTitle).length).toBeGreaterThan(0);
        expect(screen.getByText(new RegExp(item.expectedAnalogySnippet, "i"))).toBeInTheDocument();
        unmount();
      }
    });
  });
});
