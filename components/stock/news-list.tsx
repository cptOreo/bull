import React from "react";
import type { NewsItemView } from "@/lib/engine/types";
import { formatDate } from "@/lib/engine/format";

export interface NewsListProps {
  items: NewsItemView[];
  ticker?: string;
  className?: string;
}

const KIND_CONFIG: Record<
  NewsItemView["kind"],
  { label: string; badge: string }
> = {
  fact: {
    label: "Fact",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  commentary: {
    label: "Commentary",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  announcement: {
    label: "Announcement",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
};

export function NewsList({
  items,
  ticker,
  className = "",
}: NewsListProps) {
  // Cap at 5 items
  const recentItems = items.slice(0, 5);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-serif font-bold text-zinc-950 dark:text-zinc-50">
            Recent Context & News {ticker ? `(${ticker})` : ""}
          </h2>
          <p className="text-xs text-zinc-500">
            Filtered within 90 days of snapshot date
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {recentItems.length} {recentItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      {recentItems.length === 0 ? (
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The snapshot contains no recent news items within the 90-day window for this company.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentItems.map((item, index) => {
            const kindStyle = KIND_CONFIG[item.kind] || KIND_CONFIG.fact;

            return (
              <article
                key={index}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${kindStyle.badge}`}
                    >
                      {kindStyle.label}
                    </span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {item.sourceName}
                    </span>
                  </div>
                  <time className="text-[11px] font-mono text-zinc-400">
                    {formatDate(item.publishedAt)}
                  </time>
                </div>

                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">
                  {item.headline}
                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.summary}
                </p>

                {item.sourceUrl && (
                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      Read full source report &rarr;
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
