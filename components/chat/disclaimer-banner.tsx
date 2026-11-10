import React from "react";
import type { Locale } from "@/lib/engine/types";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export interface ChatDisclaimerBannerProps {
  locale?: Locale;
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

/**
 * ChatDisclaimerBanner displays the mandatory SEBI educational notice
 * and non-advisory disclaimer before financial simulator outputs.
 */
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

export default ChatDisclaimerBanner;
