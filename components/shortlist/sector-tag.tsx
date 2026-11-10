import React from "react";

export interface SectorTagProps {
  sector: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

interface SectorColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}

const SECTOR_THEMES: Record<string, SectorColorConfig> = {
  it: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/80 dark:border-blue-800/60",
    dot: "bg-blue-500",
    label: "Information Technology",
  },
  financial: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    label: "Financial Services",
  },
  banking: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    label: "Banking & Financials",
  },
  automobile: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/60",
    dot: "bg-amber-500",
    label: "Automobiles & Auto Components",
  },
  healthcare: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200/80 dark:border-purple-800/60",
    dot: "bg-purple-500",
    label: "Healthcare & Pharmaceuticals",
  },
  pharma: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200/80 dark:border-purple-800/60",
    dot: "bg-purple-500",
    label: "Pharmaceuticals",
  },
  fmcg: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/60",
    dot: "bg-rose-500",
    label: "Fast Moving Consumer Goods",
  },
  energy: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200/80 dark:border-orange-800/60",
    dot: "bg-orange-500",
    label: "Oil, Gas & Energy",
  },
  telecom: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200/80 dark:border-indigo-800/60",
    dot: "bg-indigo-500",
    label: "Telecommunication",
  },
  capital_goods: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200/80 dark:border-cyan-800/60",
    dot: "bg-cyan-500",
    label: "Capital Goods",
  },
  consumer_discretionary: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-200/80 dark:border-fuchsia-800/60",
    dot: "bg-fuchsia-500",
    label: "Consumer Discretionary",
  },
};

const DEFAULT_THEME: SectorColorConfig = {
  bg: "bg-zinc-100 dark:bg-zinc-800/60",
  text: "text-zinc-700 dark:text-zinc-300",
  border: "border-zinc-200 dark:border-zinc-700",
  dot: "bg-zinc-500",
  label: "Industry Sector",
};

export function getSectorTheme(sectorOrId: string): SectorColorConfig {
  const norm = sectorOrId.toLowerCase().trim().replace(/[- &]/g, "_");

  if (SECTOR_THEMES[norm]) return SECTOR_THEMES[norm];

  // Partial match heuristic
  if (norm.includes("it") || norm.includes("tech") || norm.includes("software")) return SECTOR_THEMES.it;
  if (norm.includes("bank") || norm.includes("finance") || norm.includes("financial")) return SECTOR_THEMES.financial;
  if (norm.includes("auto") || norm.includes("motor") || norm.includes("vehicle")) return SECTOR_THEMES.automobile;
  if (norm.includes("pharma") || norm.includes("health") || norm.includes("drug")) return SECTOR_THEMES.healthcare;
  if (norm.includes("fmcg") || norm.includes("consumer_goods") || norm.includes("staple")) return SECTOR_THEMES.fmcg;
  if (norm.includes("energy") || norm.includes("oil") || norm.includes("gas") || norm.includes("fuel") || norm.includes("power")) return SECTOR_THEMES.energy;
  if (norm.includes("telecom") || norm.includes("communication")) return SECTOR_THEMES.telecom;
  if (norm.includes("capital") || norm.includes("machin") || norm.includes("infra")) return SECTOR_THEMES.capital_goods;
  if (norm.includes("discretionary") || norm.includes("retail")) return SECTOR_THEMES.consumer_discretionary;

  return DEFAULT_THEME;
}

export function SectorTag({
  sector,
  id,
  size = "md",
  className = "",
}: SectorTagProps) {
  const theme = getSectorTheme(id || sector);

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
  };

  return (
    <span
      role="status"
      title={`Sector: ${sector}`}
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${theme.dot} ${dotSizes[size]}`} aria-hidden="true" />
      <span className="truncate">{sector}</span>
    </span>
  );
}
