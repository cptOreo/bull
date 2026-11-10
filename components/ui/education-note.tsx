import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/engine/types";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { APPROVED_EXEMPTIONS } from "@/lib/engine/safety.exemptions";

export interface EducationNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  locale?: Locale;
  text?: string;
  conceptId?: string;
  className?: string;
}

export function EducationNote({
  locale = "en",
  text,
  conceptId,
  className = "",
  ...props
}: EducationNoteProps) {
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const disclaimer =
    text ||
    (locale === "hi-en"
      ? APPROVED_EXEMPTIONS[1]
      : APPROVED_EXEMPTIONS[0]);

  return (
    <div
      role="note"
      data-testid="education-note"
      aria-label="Educational disclaimer"
      className={cn(
        "rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
        <svg
          className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Educational Purpose Only</span>
      </div>
      <div>
        <span>{disclaimer || copy.disclaimers.educationNote}</span>
        {conceptId && (
          <span className="ml-1.5 inline-block">
            <Link
              href={`/academy#${conceptId}`}
              className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-200 dark:hover:text-zinc-400"
            >
              Learn about {conceptId}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}

export default EducationNote;
