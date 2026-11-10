import React, { useState } from "react";
import type { BadgeId, Badge } from "@/lib/engine/xp";

export interface BadgeMeta {
  id: BadgeId;
  name: string;
  alias: string;
  tier: "bronze" | "silver" | "gold" | "emerald";
  description: string;
  criteria: string;
}

export const BADGE_METAS: Record<BadgeId, BadgeMeta> = {
  risk_namer: {
    id: "risk_namer",
    name: "Risk Namer",
    alias: "Risk Detective",
    tier: "bronze",
    description: "Identify risk factors across 3 stocks.",
    criteria: "Pass the 'Name the risk' check on 3 distinct companies.",
  },
  ratio_reader: {
    id: "ratio_reader",
    name: "Ratio Reader",
    alias: "Ratio Reader",
    tier: "silver",
    description: "Master P/E, P/B, and ROE.",
    criteria: "Complete at least one correct check for P/E, Debt, and Return on Capital.",
  },
  diversifier: {
    id: "diversifier",
    name: "Diversifier",
    alias: "Portfolio Architect",
    tier: "gold",
    description: "Build or inspect a 3+ sector shortlist.",
    criteria: "Pass the C8 Diversification applied stock mission.",
  },
  patient_capital: {
    id: "patient_capital",
    name: "Patient Capital",
    alias: "Long Horizon",
    tier: "silver",
    description: "Set 5+ year horizon and review drawdown.",
    criteria: "Pass the C7 drawdown mission and inspect five-year charts for 3 stocks.",
  },
  no_fomo: {
    id: "no_fomo",
    name: "No-FOMO",
    alias: "Discipline Shield",
    tier: "gold",
    description: "Read high valuation warning without dismissing.",
    criteria: "Correctly reject guaranteed doubling and speculative hype in C8 check.",
  },
  hinglish_pro: {
    id: "hinglish_pro",
    name: "Hinglish Pro",
    alias: "Bilingual Investor",
    tier: "emerald",
    description: "Complete a lesson in Hinglish.",
    criteria: "Answer 3 concept checks correctly while the app locale is set to Hinglish.",
  },
};

export interface BadgeShelfProps {
  badges?: Badge[];
  className?: string;
  onBadgeClick?: (badgeId: BadgeId) => void;
}

// Crisp SVG Emblems for each badge
function BadgeIcon({ id, isUnlocked, tier }: { id: BadgeId; isUnlocked: boolean; tier: BadgeMeta["tier"] }) {
  const iconColor = isUnlocked
    ? tier === "bronze"
      ? "text-amber-700 dark:text-amber-500"
      : tier === "silver"
      ? "text-slate-400 dark:text-slate-200"
      : tier === "gold"
      ? "text-amber-500 dark:text-amber-400"
      : "text-emerald-500 dark:text-emerald-400"
    : "text-zinc-400 dark:text-zinc-600";

  switch (id) {
    case "risk_namer":
      // Magnifying glass with danger flag / detective emblem
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="7" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35M11 8v3M11 14h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "ratio_reader":
      // Balance scale / ratio bars
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 19h16M7 15l3-6 3 6M17 15l-3-6-3 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3v16" strokeWidth="2" />
        </svg>
      );
    case "diversifier":
      // Hexagon / 3-sector architectural compass
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="12 2 21 8.5 21 15.5 12 22 3 15.5 3 8.5" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" strokeWidth="2" />
        </svg>
      );
    case "patient_capital":
      // Hourglass / long horizon curve
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 2h14M5 22h14M7 2v5l5 5-5 5v5M17 2v5l-5 5 5 5v5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "no_fomo":
      // Defensive heraldic shield
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "hinglish_pro":
      // Bilingual dialogue / script glyphs
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg className={`w-8 h-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
        </svg>
      );
  }
}

export function BadgeShelf({
  badges: propBadges,
  className = "",
  onBadgeClick,
}: BadgeShelfProps) {
  const [activeTooltip, setActiveTooltip] = useState<BadgeId | null>(null);

  // Construct full 6 badges list
  const allIds: BadgeId[] = [
    "risk_namer",
    "ratio_reader",
    "diversifier",
    "patient_capital",
    "no_fomo",
    "hinglish_pro",
  ];

  const badgesMap = new Map<BadgeId, Badge>();
  if (propBadges) {
    for (const b of propBadges) {
      badgesMap.set(b.id, b);
    }
  }

  const items = allIds.map((id) => {
    const meta = BADGE_METAS[id];
    const fromProps = badgesMap.get(id);

    return {
      id,
      name: fromProps?.name || meta.name,
      alias: meta.alias,
      tier: meta.tier,
      description: meta.description,
      criteria: meta.criteria,
      unlocked: Boolean(fromProps?.unlocked),
      unlockedAt: fromProps?.unlockedAt,
    };
  });

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm ${className}`}
      data-testid="badge-shelf"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Earned Badges
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Milestones earned through disciplined financial comprehension
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
            {unlockedCount} of 6 Unlocked
          </span>
        </div>
      </div>

      {/* Grid of 6 Badges */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        role="region"
        aria-label="Badge showcase"
      >
        {items.map((badge) => {
          const isUnlocked = badge.unlocked;
          const tierBorder = isUnlocked
            ? badge.tier === "bronze"
              ? "border-amber-700/40 bg-gradient-to-b from-amber-500/10 to-amber-900/5 shadow-amber-900/10"
              : badge.tier === "silver"
              ? "border-slate-400/50 bg-gradient-to-b from-slate-200/40 to-slate-400/10 shadow-slate-500/10"
              : badge.tier === "gold"
              ? "border-amber-400/60 bg-gradient-to-b from-amber-300/20 to-amber-500/10 shadow-amber-500/10"
              : "border-emerald-500/50 bg-gradient-to-b from-emerald-300/20 to-emerald-500/10 shadow-emerald-500/10"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 opacity-75";

          return (
            <div
              key={badge.id}
              role="article"
              tabIndex={0}
              aria-label={`${badge.name} (${badge.alias}): ${isUnlocked ? "Unlocked" : "Locked"}. ${badge.criteria}`}
              onClick={() => onBadgeClick?.(badge.id)}
              onMouseEnter={() => setActiveTooltip(badge.id)}
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={() => setActiveTooltip(badge.id)}
              onBlur={() => setActiveTooltip(null)}
              className={`relative flex flex-col p-4 rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm hover:shadow-md ${tierBorder}`}
            >
              {/* Badge Icon & Tier Pill */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-200 ${
                    isUnlocked
                      ? "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800/80 border-dashed border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  <BadgeIcon id={badge.id} isUnlocked={isUnlocked} tier={badge.tier} />
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full font-bold ${
                      isUnlocked
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 mt-1 capitalize">
                    {badge.tier} enamel
                  </span>
                </div>
              </div>

              {/* Names */}
              <div className="mb-2">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                  {badge.name}
                  {badge.alias !== badge.name && (
                    <span className="text-xs font-normal text-zinc-500">
                      ({badge.alias})
                    </span>
                  )}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-1">
                  {badge.description}
                </p>
              </div>

              {/* Criteria / Unlock Date */}
              <div className="mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] font-sans">
                {isUnlocked ? (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>
                      {badge.unlockedAt
                        ? `Unlocked on ${badge.unlockedAt.slice(0, 10)}`
                        : "Achieved"}
                    </span>
                  </div>
                ) : (
                  <div className="text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Criteria: </span>
                    <span>{badge.criteria}</span>
                  </div>
                )}
              </div>

              {/* Criteria Tooltip on hover / focus */}
              {activeTooltip === badge.id && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-zinc-900 text-white text-xs shadow-xl z-20 pointer-events-none animate-in fade-in"
                >
                  <div className="font-bold mb-0.5 text-zinc-100">{badge.name} ({badge.alias})</div>
                  <p className="text-zinc-300 leading-snug">{badge.criteria}</p>
                  <div className="mt-1 text-[10px] text-zinc-400 font-mono">
                    Tier: {badge.tier.toUpperCase()} · {isUnlocked ? "Achieved" : "Incomplete"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BadgeShelf;
