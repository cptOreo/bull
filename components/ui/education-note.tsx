import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/engine/types";
import { APPROVED_EXEMPTIONS } from "@/lib/engine/safety.exemptions";

export interface EducationNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  locale?: Locale;
  text?: string;
  conceptId?: string;
}

export function EducationNote({
  locale = "en",
  text,
  conceptId,
  className,
  ...props
}: EducationNoteProps) {
  // Default to the exact approved exempt educational disclaimer text
  const disclaimer =
    text ||
    (locale === "hi-en"
      ? APPROVED_EXEMPTIONS[1] // "Yeh educational analysis hai aur koi buy ya sell recommendation nahi hai."
      : APPROVED_EXEMPTIONS[0]); // "This is educational analysis and not a buy or sell recommendation."

  return (
    <div
      role="note"
      aria-label="Educational disclaimer"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/80 p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400",
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <span>{disclaimer}</span>
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
