"use client";

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

export interface ChatDisclaimerBannerProps {
  locale?: Locale;
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function ChatDisclaimerBanner({
  locale = "en",
  className = "",
  onDismiss,
  showDismiss = false,
}: ChatDisclaimerBannerProps) {
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  return (
    <div
      role="region"
      aria-label="SEBI Educational Notice"
      data-testid="chat-disclaimer-banner"
      className={`rounded-xl border border-amber-200/90 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-800/80 p-3.5 sm:p-4 text-xs shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-amber-700 dark:text-amber-400 mt-0.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1 space-y-1 text-amber-950 dark:text-amber-100 font-sans leading-relaxed">
          <p className="font-semibold text-amber-900 dark:text-amber-200" data-testid="sebi-notice">
            {copy.disclaimers.sebiNotice}
          </p>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
            {copy.disclaimers.educationNote}
          </p>
        </div>

        {showDismiss && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss disclaimer"
            className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 p-1 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default DisclaimerBanner;
