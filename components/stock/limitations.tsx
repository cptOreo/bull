import React from "react";

export interface LimitationsProps {
  items?: string[];
  ticker?: string;
  className?: string;
}

const DEFAULT_LIMITATIONS = [
  "Snapshot figures are dated and do not reflect intraday market price movements or live order book depth.",
  "Financial ratios are based on annual historical filings and do not capture unannounced management decisions or mid-quarter changes.",
  "Past returns and historical financial health do not guarantee future earnings trajectory or capital protection.",
  "Macroeconomic factors, regulatory interventions, and sector-wide headwinds cannot be fully modeled from historical balance sheets.",
];

export function Limitations({
  items = DEFAULT_LIMITATIONS,
  ticker,
  className = "",
}: LimitationsProps) {
  const displayItems = items.length > 0 ? items : DEFAULT_LIMITATIONS;

  return (
    <div
      role="region"
      aria-label="Data Limitations and Disclosures"
      className={`p-5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-zinc-800 dark:text-zinc-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
            What this data does not show {ticker ? `for ${ticker}` : ""}
          </h2>
          <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed list-disc list-inside">
            {displayItems.map((item, index) => (
              <li key={index} className="marker:text-amber-500">
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
            Bull is an educational research tool. We do not provide financial, legal, or investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}
