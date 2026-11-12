"use client";

import { Bot, ArrowRight } from "lucide-react";
import { useChatStore } from "@/components/providers/chat-provider";

export function AISearchResult({ query }: { query: string }) {
  const { setMode, setContext, addMessage } = useChatStore();

  const handleAsk = (mode: "tutor" | "analyst", prompt: string) => {
    setMode(mode);
    setContext({});
    addMessage({ role: "user", content: prompt, mode, context: {} });
  };

  const suggestions = query
    ? [
        { mode: "tutor" as const, prompt: query, label: `Ask Tutor: "${query}"` },
        { mode: "analyst" as const, prompt: query, label: `Ask Analyst: "${query}"` },
      ]
    : [
        { mode: "tutor" as const, prompt: "Explain P/E ratio with a real-world analogy", label: "Learn: P/E Ratio" },
        { mode: "analyst" as const, prompt: "Screen for high ROE, low debt stocks under 20x P/E", label: "Analyze: Quality Screen" },
        { mode: "tutor" as const, prompt: "What are the red flags in Zomato's cash flow?", label: "Learn: Red Flags" },
        { mode: "analyst" as const, prompt: "Build a DCF model for Reliance Industries", label: "Analyze: DCF for Reliance" },
      ];

  return (
    <div className="space-y-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => handleAsk(s.mode, s.prompt)}
          className="w-full flex items-center gap-3 p-4 rounded-xl glass dark:glass-dark hover:bg-accent/50 transition-colors text-left group"
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{s.label}</p>
            <p className="text-sm text-muted-foreground">{s.mode === "tutor" ? "Learn mode" : "Analyst mode"}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground" />
        </button>
      ))}
    </div>
  );
}