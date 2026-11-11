"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { MasteryRing } from "@/ui/mastery-ring";
import { Search, BookOpen, TrendingUp, Target, Shield, DollarSign, ChevronRight } from "lucide-react";
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

export default function LearnPage() {
  const { tracks: trackData, nodes, getNode } = useSkillTree();
  const { xp, level, streak } = useProgress();
  const [activeTrack, setActiveTrack] = React.useState("analyze");
  const [searchQuery, setSearchQuery] = React.useState("");

  const trackNodes = nodes.filter(n => n.track === activeTrack);
  const availableNodes = trackNodes.filter(n => n.state !== "locked");
  const masteredNodes = trackNodes.filter(n => n.state === "mastered");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
                Skill Tree
              </h1>
              <p className="mt-2 text-muted-foreground">Master financial concepts through interactive learning paths</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">XP: <span className="font-display text-primary">{xp.toLocaleString()}</span></span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Level {level}</span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber/10 text-amber text-xs font-medium">
                  <span className="relative top-[1px]">🔥</span> {streak} day streak
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTrack} onValueChange={setActiveTrack} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-muted mb-6">
            {Object.entries(TRACK_LABELS).map(([id, label]) => {
              const Icon = TRACK_ICONS[id as keyof typeof TRACK_ICONS];
              const track = trackData.find(t => t.id === id);
              const progress = track ? track.nodes.filter(n => n.state === "mastered").length : 0;
              const total = track ? track.nodes.length : 0;
              return (
                <TabsTrigger key={id} value={id} className="gap-1.5 py-2 text-sm">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground ml-1">({progress}/{total})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concepts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mastered: {masteredNodes.length}/{trackNodes.length}</span>
            </div>
          </div>

        <TabsContent value="analyze" className="pt-6">
          <SkillTreeCanvas nodes={trackNodes} searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="dividend" className="pt-6">
          <SkillTreeCanvas nodes={trackNodes} searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="statements" className="pt-6">
          <SkillTreeCanvas nodes={trackNodes} searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="moats" className="pt-6">
          <SkillTreeCanvas nodes={trackNodes} searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  </div>
);
}

function SkillTreeCanvas({ nodes, searchQuery }: { nodes: ReturnType<typeof useSkillTree>["nodes"]; searchQuery: string }) {
  const filtered = nodes.filter(n => 
    n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.track.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No concepts match "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((node, i) => (
        <motion.article
          key={node.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          className={cn(
            "p-5 rounded-2xl glass dark:glass-dark border transition-all relative overflow-hidden",
            node.state === "mastered" && "border-emerald-500/30 bg-emerald-500/5",
            node.state === "learning" && "border-primary/30 bg-primary/5",
            node.state === "available" && "border-primary/20 hover:border-primary/40",
            node.state === "locked" && "border-muted/50 opacity-60"
          )}
        >
          {node.state === "mastered" && (
            <div className="absolute top-3 right-3">
              <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
            </div>
          )}
          
          <div className="flex items-start gap-3 mb-3">
            <MasteryRing progress={node.mastery.progress} size={48} strokeWidth={4} showLabel={false} level={node.mastery.level} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{node.label}</h3>
              <p className="text-xs text-muted-foreground">{node.track}</p>
            </div>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${node.mastery.progress}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                node.mastery.level >= 5 ? "bg-emerald-500" :
                node.mastery.level >= 3 ? "bg-primary" :
                node.mastery.level >= 1 ? "bg-amber-500" : "bg-muted"
              )}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "font-medium",
              node.state === "mastered" && "text-emerald-500",
              node.state === "learning" && "text-primary",
              node.state === "available" && "text-muted-foreground",
              node.state === "locked" && "text-muted-foreground/50"
            )}>
              {node.state === "mastered" ? "Mastered" : 
               node.state === "learning" ? `Level ${node.mastery.level}` :
               node.state === "available" ? "Available" : "Locked"}
            </span>
            {node.state !== "locked" && (
              <Button size="sm" variant="ghost" asChild className="h-8 px-3">
                <a href={`/learn/${node.id}`}>Learn</a>
              </Button>
            )}
          </div>
        </motion.article>
      ))}
    </div>
  );
}