"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Search, X, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { SearchResults } from "./search-results";

const TABS = [
  { id: "stocks", label: "Stocks", icon: Search },
  { id: "pages", label: "Pages", icon: Search },
  { id: "ai", label: "Ask AI", icon: Search },
  { id: "learn", label: "Learn", icon: Search },
] as const;

export function CommandPalette() {
  const { isOpen, query, activeTab, setOpen, setQuery, setActiveTab } = useCommandPalette();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [setOpen]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[800] bg-black/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[800] w-full max-w-2xl lg:max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="glass dark:glass-dark rounded-2xl border border-border/50 shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stocks, pages, ask AI, learn concepts..."
                className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as (typeof TABS)[number]["id"])} className="w-full">
            <div className="px-4 border-b">
              <TabsList className="grid w-full grid-cols-4 bg-muted">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs px-2 py-1.5">
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="stocks" className="p-0">
              <SearchResults tab="stocks" query={query} />
            </TabsContent>
            <TabsContent value="pages" className="p-0">
              <SearchResults tab="pages" query={query} />
            </TabsContent>
            <TabsContent value="ai" className="p-0">
              <SearchResults tab="ai" query={query} />
            </TabsContent>
            <TabsContent value="learn" className="p-0">
              <SearchResults tab="learn" query={query} />
            </TabsContent>
          </Tabs>

          <div className="px-4 py-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>⌘K to open • ↑↓ to navigate • Enter to select • Esc to close</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘K</kbd>
          </div>
        </div>
      </motion.div>
    </>
  );
}