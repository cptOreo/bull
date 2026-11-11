"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { MasteryRing } from "@/ui/mastery-ring";
import {
  Search,
  BookOpen,
  DollarSign,
  Shield,
  LayoutGrid,
  Network,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { useProgress } from "@/state/use-progress";

const TRACK_ICONS = {
  analyze: Search,
  dividend: DollarSign,
  statements: BookOpen,
  moats: Shield,
} as const;

const TRACK_LABELS = {
  analyze: "Analyze Any Stock",
  dividend: "Build Dividend Portfolio",
  statements: "Read Financial Statements",
  moats: "Understand Moats",
} as const;

export interface SkillTreeViewProps {
  showHeader?: boolean;
  defaultTrack?: "analyze" | "dividend" | "statements" | "moats";
}

export function SkillTreeView({ showHeader = false, defaultTrack = "analyze" }: SkillTreeViewProps) {
  const router = useRouter();
  const { tracks: trackData, nodes } = useSkillTree();
  const { xp, level, streak } = useProgress();
  const [activeTrack, setActiveTrack] = React.useState<string>(defaultTrack);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"graph" | "grid">("graph");

  const trackNodes = nodes.filter((n) => n.track === activeTrack);
  const masteredCount = trackNodes.filter((n) => n.state === "mastered").length;
  const totalInTrack = trackNodes.length;

  return (
    <div className="w-full space-y-6">
      {showHeader && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Interactive Curriculum
                </span>
                <span className="text-xs text-muted-foreground">33 Financial Concepts</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight mt-1 text-foreground">
                Financial Skill Tree
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Master valuation, financial statements, dividends, and competitive moats through 5-step applied lessons.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-background text-sm">
                <span className="font-medium text-foreground">XP:</span>
                <span className="font-mono font-bold text-primary">{xp.toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  Lvl {level}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  🔥 {streak}d
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Guided Tour Helper Banner */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs sm:text-sm">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-foreground">Interactive Navigation: </span>
          <span className="text-muted-foreground">
            Click any concept node to enter the 5-step applied lesson player. Prerequisite arrows show progression dependencies. Mastery rings advance as you pass checks.
          </span>
        </div>
      </div>

      {/* Tracks Tabs */}
      <Tabs value={activeTrack} onValueChange={setActiveTrack} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/70 p-1 rounded-xl mb-4">
          {Object.entries(TRACK_LABELS).map(([id, label]) => {
            const Icon = TRACK_ICONS[id as keyof typeof TRACK_ICONS];
            const track = trackData.find((t) => t.id === id);
            const progress = track ? track.nodes.filter((n) => n.state === "mastered").length : 0;
            const total = track ? track.nodes.length : 0;
            return (
              <TabsTrigger key={id} value={id} className="gap-2 py-2 text-xs sm:text-sm rounded-lg">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
                <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                  {progress}/{total}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Search bar & quick filter */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts (e.g. P/E, DCF, Moats, ROE)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Track Completion:</span>
              <span className="font-mono font-bold text-foreground">
                {masteredCount} of {totalInTrack} ({Math.round((masteredCount / (totalInTrack || 1)) * 100)}%)
              </span>
            </div>

            {/* View Switcher */}
            <div className="flex items-center border border-border/80 rounded-xl p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setViewMode("graph")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === "graph" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Network className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Graph View vs Grid View */}
        {viewMode === "graph" ? (
          <SkillTreeGraphCanvas
            nodes={trackNodes}
            searchQuery={searchQuery}
            onNodeClick={(id) => router.push(`/learn/${id}`)}
          />
        ) : (
          <SkillTreeGridCanvas
            nodes={trackNodes}
            searchQuery={searchQuery}
          />
        )}
      </Tabs>
    </div>
  );
}

/**
 * Visual SVG Skill Tree Canvas with curved edges, circular 60px nodes,
 * mastery rings, and interactive click-to-lesson handlers.
 */
export function SkillTreeGraphCanvas({
  nodes,
  searchQuery,
  onNodeClick,
}: {
  nodes: ReturnType<typeof useSkillTree>["nodes"];
  searchQuery: string;
  onNodeClick: (id: string) => void;
}) {
  const filtered = nodes.filter(
    (n) =>
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Position nodes in a clean staggered layout
  const positions = React.useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    const cols = 4;
    const colSpacing = 220;
    const rowSpacing = 160;

    nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      coords[node.id] = {
        x: 80 + col * colSpacing + (row % 2 === 1 ? 40 : 0),
        y: 80 + row * rowSpacing,
      };
    });
    return coords;
  }, [nodes]);

  const maxRow = Math.ceil(nodes.length / 4);
  const canvasHeight = Math.max(550, maxRow * 160 + 100);

  return (
    <div className="relative w-full overflow-x-auto rounded-2xl glass dark:glass-dark border border-border/60 p-4">
      <div className="min-w-[920px] relative" style={{ height: canvasHeight }}>
        {/* SVG Prerequisite Connecting Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {nodes.map((node) => {
            const endPos = positions[node.id];
            if (!endPos) return null;

            return node.prerequisites.map((prereqId) => {
              const startPos = positions[prereqId];
              if (!startPos) return null;

              // Curved bezier path
              const dx = endPos.x - startPos.x;
              const dy = endPos.y - startPos.y;
              const cx1 = startPos.x + dx * 0.5;
              const cy1 = startPos.y;
              const cx2 = startPos.x + dx * 0.5;
              const cy2 = endPos.y;

              const pathData = `M ${startPos.x} ${startPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endPos.x} ${endPos.y}`;

              const isMastered = node.state === "mastered";

              return (
                <path
                  key={`${prereqId}->${node.id}`}
                  d={pathData}
                  fill="none"
                  stroke={isMastered ? "#10b981" : "rgba(100, 116, 139, 0.3)"}
                  strokeWidth={isMastered ? 2.5 : 1.5}
                  strokeDasharray={node.state === "locked" ? "4 4" : undefined}
                />
              );
            });
          })}
        </svg>

        {/* 60px Circular Interactive Nodes */}
        {filtered.map((node) => {
          const pos = positions[node.id] || { x: 100, y: 100 };
          const isMastered = node.state === "mastered";
          const isLearning = node.state === "learning";
          const isAvailable = node.state === "available";
          const isLocked = node.state === "locked";

          return (
            <motion.div
              key={node.id}
              style={{ left: pos.x - 36, top: pos.y - 36 }}
              whileHover={{ scale: isLocked ? 1.02 : 1.08 }}
              onClick={() => {
                if (!isLocked) {
                  onNodeClick(node.id);
                }
              }}
              className={cn(
                "absolute w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-shadow select-none group",
                isLocked ? "cursor-not-allowed opacity-60" : "hover:shadow-lg"
              )}
            >
              {/* Mastery Ring Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <MasteryRing
                  progress={node.mastery.progress}
                  size={68}
                  strokeWidth={4}
                  showLabel={false}
                  level={node.mastery.level}
                />
              </div>

              {/* Node Core Circle */}
              <div
                className={cn(
                  "w-[54px] h-[54px] rounded-full flex items-center justify-center text-xs font-bold transition-all relative",
                  isMastered && "bg-emerald-500 text-white shadow-emerald-500/20",
                  isLearning && "bg-primary text-primary-foreground animate-pulse shadow-primary/20",
                  isAvailable && "bg-background border-2 border-primary text-primary hover:bg-primary/10",
                  isLocked && "bg-muted text-muted-foreground border border-border/80"
                )}
              >
                {isMastered ? (
                  "✓"
                ) : isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <span className="font-mono">{node.xp} XP</span>
                )}
              </div>

              {/* Node Title Label & Badge */}
              <div className="absolute top-[76px] w-36 -left-[32px] text-center pointer-events-none">
                <span className="text-xs font-semibold block text-foreground truncate group-hover:text-primary transition-colors">
                  {node.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                    isMastered && "text-emerald-500 bg-emerald-500/10",
                    isLearning && "text-primary bg-primary/10",
                    isAvailable && "text-muted-foreground bg-muted",
                    isLocked && "text-muted-foreground/60"
                  )}
                >
                  {isMastered ? "Mastered" : isLearning ? `Lvl ${node.mastery.level}` : isAvailable ? "Available" : "Locked"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Grid View fallback for clean scanning of all concepts with progress bars
 */
export function SkillTreeGridCanvas({
  nodes,
  searchQuery,
}: {
  nodes: ReturnType<typeof useSkillTree>["nodes"];
  searchQuery: string;
}) {
  const filtered = nodes.filter(
    (n) =>
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p>No concepts match &ldquo;{searchQuery}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {filtered.map((node, i) => (
        <motion.article
          key={node.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * i }}
          className={cn(
            "p-5 rounded-2xl glass dark:glass-dark border transition-all relative overflow-hidden flex flex-col justify-between",
            node.state === "mastered" && "border-emerald-500/30 bg-emerald-500/5",
            node.state === "learning" && "border-primary/30 bg-primary/5",
            node.state === "available" && "border-primary/20 hover:border-primary/40 hover:shadow-xs",
            node.state === "locked" && "border-border/40 opacity-60"
          )}
        >
          <div>
            <div className="flex items-start gap-3 mb-3">
              <MasteryRing
                progress={node.mastery.progress}
                size={44}
                strokeWidth={4}
                showLabel={false}
                level={node.mastery.level}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate text-foreground">{node.label}</h3>
                <span className="text-xs text-muted-foreground uppercase">{node.track}</span>
              </div>
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                +{node.xp} XP
              </span>
            </div>

            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <div
                style={{ width: `${node.mastery.progress}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  node.state === "mastered" ? "bg-emerald-500" : "bg-primary"
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
            <span
              className={cn(
                "font-medium",
                node.state === "mastered" && "text-emerald-500",
                node.state === "learning" && "text-primary",
                node.state === "available" && "text-muted-foreground",
                node.state === "locked" && "text-muted-foreground/50"
              )}
            >
              {node.state === "mastered"
                ? "Mastered"
                : node.state === "learning"
                ? `In Progress · Level ${node.mastery.level}`
                : node.state === "available"
                ? "Available to Start"
                : "Locked"}
            </span>

            {node.state !== "locked" ? (
              <Button size="sm" variant="default" asChild className="h-7 text-xs gap-1">
                <Link href={`/learn/${node.id}`}>
                  <span>{node.state === "mastered" ? "Review" : "Start Lesson"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Prereqs needed
              </span>
            )}
          </div>
        </motion.article>
      ))}
    </div>
  );
}
