"use client";

import * as React from "react";
import { create } from "zustand";

interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  activeTab: "stocks" | "pages" | "ai" | "learn";
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setActiveTab: (tab: CommandPaletteState["activeTab"]) => void;
  reset: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  query: "",
  activeTab: "stocks",
  setOpen: (isOpen) => set({ isOpen, query: "", activeTab: "stocks" }),
  setQuery: (query) => set({ query }),
  setActiveTab: (activeTab) => set({ activeTab }),
  reset: () => set({ isOpen: false, query: "", activeTab: "stocks" }),
}));

// Global keyboard shortcut hook
export function useCommandPaletteShortcut() {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useCommandPalette.getState().setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      useCommandPalette.getState().setOpen(true);
    }
  });
}