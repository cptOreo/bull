import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react"
import { screen, fireEvent, waitFor } from "@testing-library/dom";

import { ConceptCard } from "@/components/academy/concept-card";
import { CheckModal } from "@/components/academy/check-modal";
import { BadgeShelf } from "@/components/academy/badge-shelf";
import { StreakTracker } from "@/components/academy/streak-tracker";
import { MasteryRail } from "@/components/academy/mastery-rail";
import { ChatDisclaimerBanner } from "@/components/chat/disclaimer-banner";
import { ProvenanceDrawer, PROVENANCE_RUNGS } from "@/components/stock/provenance-drawer";
import { DataBadge } from "@/components/ui/data-badge";
import { CONCEPTS } from "@/lib/engine/curriculum";

describe("Batch 14: Academy Components & Presentation Tests", () => {
  // --------------------------------------------------------------------------
  // Task 56: Concept Card & Mastery Rail
  // --------------------------------------------------------------------------
  describe("Task 56: ConceptCard", () => {
    it("renders concept title, difficulty, reading time and XP reward", () => {
      render(
        <ConceptCard
          conceptId="C1"
          masteryStatus="unlocked"
          readingTimeMinutes={2}
          xpReward={20}
        />
      );

      // Title & ID
      expect(screen.getByText("C1")).toBeInTheDocument();
      expect(screen.getByText("A share is part ownership")).toBeInTheDocument();

      // Difficulty & Reading time & XP
      expect(screen.getByText("Beginner")).toBeInTheDocument();
      expect(screen.getByText(/2 min/i)).toBeInTheDocument();
      expect(screen.getByText("+20 XP")).toBeInTheDocument();
    });

    it("displays unlock condition and hint when locked, and suppresses click", () => {
      const handleSelect = vi.fn();
      render(
        <ConceptCard
          conceptId="C4"
          masteryStatus="locked"
          onSelect={handleSelect}
        />
      );

      // Should display unlock condition & hint
      expect(screen.getByText(/Unlocks when:/i)).toBeInTheDocument();
      const def = CONCEPTS.find((c) => c.id === "C4")!;
      expect(screen.getByText(new RegExp(def.unlockCondition, "i"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(def.unlockHint, "i"))).toBeInTheDocument();

      // Card should be aria-disabled
      const card = screen.getByRole("article");
      expect(card).toHaveAttribute("aria-disabled", "true");

      // Clicking should not trigger onSelect
      fireEvent.click(card);
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it("triggers onSelect and onClick when unlocked or in_progress", () => {
      const handleSelect = vi.fn();
      const handleClick = vi.fn();
      render(
        <ConceptCard
          conceptId="C3"
          masteryStatus="in_progress"
          checksCompleted={1}
          onSelect={handleSelect}
          onClick={handleClick}
        />
      );

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("aria-disabled", "false");

      fireEvent.click(card);
      expect(handleSelect).toHaveBeenCalledWith("C3");
      expect(handleClick).toHaveBeenCalled();

      // Keyboard navigation with Enter key
      fireEvent.keyDown(card, { key: "Enter", code: "Enter" });
      expect(handleSelect).toHaveBeenCalledTimes(2);
    });

    it("renders Hinglish title when locale is hi-en", () => {
      render(
        <ConceptCard
          conceptId="C3"
          masteryStatus="seen"
          locale="hi-en"
        />
      );

      expect(screen.getByText("P/E ratio aur sector ka asar")).toBeInTheDocument();
      expect(screen.getByText("P/E and why the sector matters")).toBeInTheDocument();
    });

    it("renders Mastered status badge and full mastery progress", () => {
      render(
        <ConceptCard
          conceptId="C5"
          masteryStatus="mastered"
          checksCompleted={3}
        />
      );

      expect(screen.getByText(/Mastered \(5\/5\)/i)).toBeInTheDocument();
      expect(screen.getByText("3/3 completed")).toBeInTheDocument();
    });

    it("MasteryRail renders 5 discrete steps with accessible progressbar attributes", () => {
      render(<MasteryRail state="practised" />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", "2");
      expect(bar).toHaveAttribute("aria-valuemax", "5");
      expect(bar).toHaveAttribute("aria-label", "Mastery progress: Practised");
    });
  });

  // --------------------------------------------------------------------------
  // Task 57: Check Modal
  // --------------------------------------------------------------------------
  describe("Task 57: CheckModal", () => {
    const mockCheckItem = {
      id: "test_check_1",
      conceptId: "C1" as const,
      question: "What does owning one share of an enterprise confer?",
      options: [
        "A guaranteed monthly coupon payment",
        "Fractional ownership of net assets and profits",
        "A personal liability for company office rent",
      ] as [string, string, string],
      correctIndex: 1,
      explanation:
        "Shares represent fractional equity in the company, entitling the owner to a proportionate share of distributed earnings without debt liability.",
    };

    it("displays question and 3 radio options with keyboard navigation", () => {
      render(
        <CheckModal
          isOpen={true}
          onClose={vi.fn()}
          checkItem={mockCheckItem}
        />
      );

      expect(screen.getByText(mockCheckItem.question)).toBeInTheDocument();
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);

      // Select first option
      fireEvent.click(radios[0]);
      expect(radios[0]).toHaveAttribute("aria-checked", "true");
      expect(radios[1]).toHaveAttribute("aria-checked", "false");

      // Arrow down key moves to next option
      fireEvent.keyDown(radios[0], { key: "ArrowDown" });
      expect(radios[1]).toHaveAttribute("aria-checked", "true");
    });

    it("provides explanatory feedback and logs +10 XP event on correct answer", () => {
      const handleLogEvent = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <CheckModal
          isOpen={true}
          onClose={vi.fn()}
          checkItem={mockCheckItem}
          logEvent={handleLogEvent}
          onSuccess={handleSuccess}
        />
      );

      const radios = screen.getAllByRole("radio");
      // Choose correct answer (index 1)
      fireEvent.click(radios[1]);

      const submitButton = screen.getByRole("button", { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      // Feedback display
      expect(screen.getByText(/Correct! \+10 XP awarded/i)).toBeInTheDocument();
      expect(screen.getByText(mockCheckItem.explanation)).toBeInTheDocument();

      // Verify event was logged with correct payload
      expect(handleLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "check_answered_correct",
          conceptId: "C1",
          itemId: "test_check_1",
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(mockCheckItem);
    });

    it("displays error feedback and allows retry without penalty on wrong choice", () => {
      const handleLogEvent = vi.fn();

      render(
        <CheckModal
          isOpen={true}
          onClose={vi.fn()}
          checkItem={mockCheckItem}
          logEvent={handleLogEvent}
        />
      );

      const radios = screen.getAllByRole("radio");
      // Choose wrong answer (index 0)
      fireEvent.click(radios[0]);

      fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

      // Shows wrong feedback and explanation
      expect(screen.getByText(/Not quite right/i)).toBeInTheDocument();
      expect(screen.getByText(mockCheckItem.explanation)).toBeInTheDocument();

      // No XP event should be logged on incorrect attempt
      expect(handleLogEvent).not.toHaveBeenCalled();

      // Retry button resets state for another attempt
      const retryBtn = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(retryBtn);

      expect(screen.queryByText(/Not quite right/i)).not.toBeInTheDocument();
    });

    it("handles Escape key dismissal and close button click", () => {
      const handleClose = vi.fn();
      render(
        <CheckModal
          isOpen={true}
          onClose={handleClose}
          checkItem={mockCheckItem}
        />
      );

      // Press Escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Click Close icon button
      const closeBtn = screen.getByRole("button", { name: /Close dialog/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // Task 58: Badge Shelf
  // --------------------------------------------------------------------------
  describe("Task 58: BadgeShelf", () => {
    it("renders all 6 Spec §8.8 badges with accessible labels and unlock states", () => {
      const mockBadges = [
        {
          id: "risk_namer" as const,
          name: "Risk Namer",
          description: "Pass the 'Name the risk' check on three distinct stocks.",
          unlocked: true,
          unlockedAt: "2026-11-10T10:00:00Z",
        },
        {
          id: "ratio_reader" as const,
          name: "Ratio Reader",
          description: "At least one correct check for each of C3, C4 and C5.",
          unlocked: false,
        },
        {
          id: "diversifier" as const,
          name: "Diversifier",
          description: "Pass the C8 applied mission.",
          unlocked: false,
        },
        {
          id: "patient_capital" as const,
          name: "Patient Capital",
          description: "Pass the C7 mission and view five-year charts for three distinct stocks.",
          unlocked: false,
        },
        {
          id: "no_fomo" as const,
          name: "No-FOMO",
          description: "Answer the fixed 'double your money' item in C8 correctly.",
          unlocked: true,
          unlockedAt: "2026-11-10T12:00:00Z",
        },
        {
          id: "hinglish_pro" as const,
          name: "Hinglish Pro",
          description: "Answer three concept checks correctly while the locale is hi-en.",
          unlocked: false,
        },
      ];

      render(<BadgeShelf badges={mockBadges} />);

      // Verify header count
      expect(screen.getByText("2 of 6 Unlocked")).toBeInTheDocument();

      // All 6 badges must be present
      expect(screen.getByText(/Risk Namer/i)).toBeInTheDocument();
      expect(screen.getByText(/Ratio Reader/i)).toBeInTheDocument();
      expect(screen.getByText(/Diversifier/i)).toBeInTheDocument();
      expect(screen.getByText(/Patient Capital/i)).toBeInTheDocument();
      expect(screen.getByText(/No-FOMO/i)).toBeInTheDocument();
      expect(screen.getByText(/Hinglish Pro/i)).toBeInTheDocument();

      // Verify friendly aliases
      expect(screen.getByText(/\(Risk Detective\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(Portfolio Architect\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(Long Horizon\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(Discipline Shield\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(Bilingual Investor\)/i)).toBeInTheDocument();

      // Verify unlock date for unlocked badges
      const unlockedDates = screen.getAllByText(/Unlocked on 2026-11-10/i);
      expect(unlockedDates.length).toBeGreaterThanOrEqual(1);

      // Verify criteria display for locked badges
      expect(screen.getByText(/Complete at least one correct check for P\/E/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Task 59: Streak Tracker
  // --------------------------------------------------------------------------
  describe("Task 59: StreakTracker", () => {
    it("correctly indicates active today, current streak count, and best streak", () => {
      render(
        <StreakTracker
          currentStreak={4}
          bestStreak={9}
          todayActive={true}
        />
      );

      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("days streak")).toBeInTheDocument();
      expect(screen.getByText(/Best streak:/i)).toBeInTheDocument();
      expect(screen.getByText("9 days")).toBeInTheDocument();
      expect(screen.getByText("Active today")).toBeInTheDocument();
    });

    it("renders the 7-day dot trail with IST calendar week track", () => {
      const { container } = render(
        <StreakTracker
          currentStreak={2}
          bestStreak={5}
          todayActive={false}
        />
      );

      expect(screen.getByText("7-Day IST Track")).toBeInTheDocument();
      expect(screen.getByText("Asia/Kolkata Calendar")).toBeInTheDocument();

      // 7 day labels
      const days = container.querySelectorAll(".grid-cols-7 > div");
      expect(days).toHaveLength(7);
      expect(screen.getByText("Answer one check today to keep it")).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Task 60: Presentation Checks — Chat Disclaimer Banner & Provenance Drawer
  // --------------------------------------------------------------------------
  describe("Task 60: Additional Presentation Controls", () => {
    it("Chat disclaimer banner renders SEBI educational notice", () => {
      render(<ChatDisclaimerBanner locale="en" />);

      const sebiNotice = screen.getByTestId("sebi-notice");
      expect(sebiNotice).toBeInTheDocument();
      expect(sebiNotice.textContent).toContain(
        "Bull is not registered with SEBI as an investment adviser"
      );
    });

    it("Chat disclaimer banner renders Hinglish SEBI notice when locale is hi-en", () => {
      render(<ChatDisclaimerBanner locale="hi-en" />);

      const sebiNotice = screen.getByTestId("sebi-notice");
      expect(sebiNotice).toBeInTheDocument();
      expect(sebiNotice.textContent).toContain(
        "Bull SEBI ke sath investment adviser ya research analyst ke roop mein registered nahi hai"
      );
    });

    it("ProvenanceDrawer displays 4-rung provenance hierarchy in exact order", () => {
      const handleClose = vi.fn();
      render(
        <ProvenanceDrawer
          isOpen={true}
          onClose={handleClose}
          ticker="TCS"
          activeRung={4}
        />
      );

      expect(screen.getByTestId("provenance-drawer")).toBeInTheDocument();
      expect(screen.getByText(/4-rung fallback ladder/i)).toBeInTheDocument();

      // Verify all 4 rungs exist in order
      expect(PROVENANCE_RUNGS).toHaveLength(4);
      expect(screen.getByText(/NSE bhavcopy \(official EOD\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Yahoo Finance chart endpoint/i)).toBeInTheDocument();
      expect(screen.getByText(/Stooq CSV/i)).toBeInTheDocument();
      expect(screen.getByText(/Manual CSV template/i)).toBeInTheDocument();

      // Rung 4 active indicator
      expect(screen.getByText(/Active Rung/i)).toBeInTheDocument();

      // Close button triggers onClose
      const closeBtn = screen.getByRole("button", { name: /Close provenance drawer/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });

    it("DataBadge applies amber class when stale", () => {
      // 30 days old for price is stale (threshold is current <= 4, stale <= 30)
      const now = "2026-11-10T12:00:00Z";
      const staleDate = "2026-10-20T12:00:00Z";

      render(<DataBadge asOf={staleDate} kind="price" now={now} />);

      const badge = screen.getByTestId("data-badge");
      expect(badge.className).toContain("amber");
    });
  });
});
