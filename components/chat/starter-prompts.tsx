import React from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/engine/types";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export interface StarterPromptItem {
  id: string;
  label: string;
  prompt: string;
  category?: "shortlist" | "concept" | "compare" | "analysis";
}

export interface StarterPromptsProps extends React.HTMLAttributes<HTMLDivElement> {
  locale?: Locale;
  onSelectPrompt: (prompt: string) => void;
  prompts?: StarterPromptItem[];
}

const DEFAULT_PROMPTS_EN: StarterPromptItem[] = [
  {
    id: "low-debt-it",
    label: "Find low-debt IT stocks for 3 years",
    prompt: "Find low-debt IT stocks for 3 years",
    category: "shortlist",
  },
  {
    id: "pe-ratio",
    label: "Explain P/E ratio like I'm 15",
    prompt: "Explain P/E ratio like I'm 15",
    category: "concept",
  },
  {
    id: "compare-tcs-infy",
    label: "Compare TCS vs Infosys",
    prompt: "Compare TCS vs Infosys",
    category: "compare",
  },
  {
    id: "bank-eval",
    label: "How to evaluate bank stocks",
    prompt: "How to evaluate bank stocks",
    category: "analysis",
  },
];

const DEFAULT_PROMPTS_HI_EN: StarterPromptItem[] = [
  {
    id: "low-debt-it",
    label: "3 saal ke liye low-debt IT stocks dhundho",
    prompt: "3 saal ke liye low-debt IT stocks dhundho",
    category: "shortlist",
  },
  {
    id: "pe-ratio",
    label: "P/E ratio explain karo jaise main 15 saal ka hoon",
    prompt: "P/E ratio explain karo jaise main 15 saal ka hoon",
    category: "concept",
  },
  {
    id: "compare-tcs-infy",
    label: "TCS vs Infosys compare karo",
    prompt: "TCS vs Infosys compare karo",
    category: "compare",
  },
  {
    id: "bank-eval",
    label: "Bank stocks kaise evaluate karein",
    prompt: "Bank stocks kaise evaluate karein",
    category: "analysis",
  },
];

export function StarterPrompts({
  locale = "en",
  onSelectPrompt,
  prompts,
  className,
  ...props
}: StarterPromptsProps) {
  const copy = locale === "hi-en" ? copyHiEn : copyEn;
  const items = prompts || (locale === "hi-en" ? DEFAULT_PROMPTS_HI_EN : DEFAULT_PROMPTS_EN);

  return (
    <div className={cn("w-full space-y-3", className)} {...props}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {copy.chat.starterPromptsTitle}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-left text-xs text-zinc-700 shadow-2xs transition-all",
              "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 hover:shadow-xs",
              "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-850 dark:hover:text-zinc-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:ring-offset-1",
              "active:scale-[0.98] cursor-pointer"
            )}
          >
            <span className="text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500">
              →
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
