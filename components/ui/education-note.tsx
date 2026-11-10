import React from "react";
import type { Locale } from "@/lib/engine/types";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export interface EducationNoteProps {
  locale?: Locale;
  className?: string;
}

export function EducationNote({ locale = "en", className = "" }: EducationNoteProps) {
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  return (
    <div
      role="note"
      data-testid="education-note"
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed ${className}`}
    >
      <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Educational Purpose Only</span>
      </div>
      <p>{copy.disclaimers.educationNote}</p>
    </div>
  );
}

export default EducationNote;
