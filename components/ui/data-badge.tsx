import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Freshness } from "@/lib/data/provenance";

export interface DataBadgeProps extends React.HTMLAttributes<HTMLAnchorElement> {
  asOf: string;
  freshness?: Freshness;
  sourceLabel?: string;
  href?: string;
}

export function DataBadge({
  asOf,
  freshness = "current",
  sourceLabel,
  href = "/method",
  className,
  ...props
}: DataBadgeProps) {
  const statusStyles: Record<Freshness, { dot: string; text: string; bg: string }> = {
    current: {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60",
    },
    stale: {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60",
    },
    expired: {
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-300",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/60",
    },
  };

  const style = statusStyles[freshness];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        style.bg,
        style.text,
        className
      )}
      title={sourceLabel ? `Source: ${sourceLabel} (as of ${asOf})` : `As of ${asOf}`}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} aria-hidden="true" />
      <span>As of {asOf}</span>
      {sourceLabel && <span className="opacity-75">· {sourceLabel}</span>}
    </Link>
  );
}
