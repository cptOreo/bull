import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/engine/types";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export interface DisclaimerBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  dismissible?: boolean;
  onDismiss?: () => void;
  locale?: Locale;
}

export function DisclaimerBanner({
  dismissible = true,
  onDismiss,
  locale = "en",
  className,
  ...props
}: DisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const noticeText =
    locale === "hi-en"
      ? "Bull ek educational research platform hai, SEBI-registered advisor nahi. Zero buy/sell recommendations ya price targets."
      : "Bull is an educational research platform, not a SEBI-registered advisor. Zero buy/sell recommendations or price targets.";

  return (
    <div
      role="region"
      aria-label="SEBI compliance notice"
      className={cn(
        "relative flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/90 px-4 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="inline-flex shrink-0 items-center rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
          Educational Notice
        </span>
        <p className="truncate font-normal sm:overflow-visible sm:whitespace-normal">
          {noticeText}
        </p>
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={copy.common.close}
          className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
