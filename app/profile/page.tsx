"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { MasteryRing } from "@/ui/mastery-ring";
import { 
  TrendingUp, 
  Award, 
  Flame, 
  Calendar, 
  BookOpen, 
  Target, 
  Shield, 
  DollarSign,
  Search,
  ChevronRight,
  CheckCircle,
  User,
  Settings,
  LogOut
} from "lucide-react";
import { useProfile } from "@/state/use-profile";
import { useProgress } from "@/state/use-progress";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { BADGES } from "@/lib/engine/xp";
import { useUI } from "@/lib/state/use-ui";
import { formatDate } from "@/lib/engine/format";
import Link from "next/link";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Search,
  DollarSign,
  Shield,
  Flame,
  Calendar,
  Award,
  Target,
};

function getBadgeIcon(icon: string) {
  return ICON_MAP[icon] || Award;
}

export default function ProfilePage() {
  const { profile, clearProfile } = useProfile();
  const { xp, level, streak, mastery, badges, completedLessons, quizHistory } = useProgress();
  const { nodes } = useSkillTree();
  const { addToast } = useUI();

  const totalMastery = nodes.reduce((sum, n) => sum + n.mastery.progress, 0) / (nodes.length || 1);
  const masteredCount = nodes.filter(n => n.mastery.level >= 5).length;
  const learningCount = nodes.filter(n => n.mastery.level >= 1 && n.mastery.level < 5).length;

  const xpForNextLevel = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][level + 1] || 999999;
  const xpProgress = level > 0 
    ? ((xp - [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][level]) / 
       (xpForNextLevel - [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][level])) * 100
    : (xp / 100) * 100;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
                Your Profile
              </h1>
              <p className="mt-2 text-muted-foreground">Track your learning progress and achievements</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addToast("Settings coming soon", "info")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {profile && (
                <Button variant="ghost" size="sm" onClick={clearProfile} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>

          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                        Goal: {profile.goal}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-emerald/10 text-emerald">
                        Level {level}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-amber/10 text-amber">
                        {streak} day streak
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">{xp.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber/10 text-amber">
                    <Flame className="h-4 w-4" />
                    <span className="font-medium">{streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald/10 text-emerald">
                    <Award className="h-4 w-4" />
                    <span className="font-medium">Level {level}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1 p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Overall Mastery
              </h3>
              <div className="flex flex-col items-center">
                <MasteryRing 
                  progress={Math.round(totalMastery)} 
                  size={120} 
                  strokeWidth={6} 
                  showLabel={true} 
                  level={Math.ceil(totalMastery / 20)} 
                />
                <p className="mt-2 text-center text-muted-foreground">Average across all concepts</p>
                <p className="mt-1 text-center text-2xl font-display font-bold">{Math.round(totalMastery)}%</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1 p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" />
                Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {BADGES.slice(0, 6).map((badge) => {
                  const Icon = getBadgeIcon(badge.icon);
                  return (
                    <Badge 
                      key={badge.id} 
                      variant={badges.includes(badge.id) ? "success" : "outline"}
                      className="gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{badge.name}</span>
                    </Badge>
                  );
                })}
                {badges.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{badges.length - 6} more
                  </Badge>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1 p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                Streak Calendar
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                  <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>
                ))}
                {Array.from({ length: 28 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (27 - i));
                  const isActive = Math.random() > 0.7; // Mock data
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "h-8 w-8 rounded flex items-center justify-center text-xs font-medium transition-colors",
                        isActive ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground/50"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Current streak: {streak} days
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Learning Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>XP to next level</span>
                    <span className="font-medium">{xpProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, xpProgress)}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      transition={{ delay: 0.3, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {xp.toLocaleString()} / {([0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][level + 1] || 999999).toLocaleString()} XP
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-display font-bold text-primary">{completedLessons.length}</p>
                    <p className="text-xs text-muted-foreground">Lessons Completed</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-display font-bold text-emerald-500">{masteredCount}</p>
                    <p className="text-xs text-muted-foreground">Concepts Mastered</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-2xl font-display font-bold text-amber-500">{learningCount}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" />
                All Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((badge) => {
                  const Icon = getBadgeIcon(badge.icon);
                  return (
                    <Badge 
                      key={badge.id} 
                      variant={badges.includes(badge.id) ? "success" : "outline"}
                      className="gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{badge.name}</span>
                    </Badge>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Earned: {badges.length} / {BADGES.length}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Quiz History
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {quizHistory.length > 0 ? (
                  quizHistory.slice().reverse().map((quiz, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg glass dark:glass-dark"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Daily Quiz</p>
                          <p className="text-xs text-muted-foreground">{formatDate(quiz.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", quiz.score >= 4 ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose")}>
                          {quiz.score}/5
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                          +{quiz.xp} XP
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No quizzes taken yet</p>
                    <p className="text-sm">Take the daily quiz to earn XP and badges</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl glass dark:glass-dark border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Completed Lessons
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {completedLessons.length > 0 ? (
                  completedLessons.slice().reverse().map((lesson, i) => (
                    <motion.div
                      key={lesson}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg glass dark:glass-dark"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{lesson.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-emerald/10 text-emerald">
                        +20 XP
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No lessons completed yet</p>
                    <p className="text-sm">Start a learning track to begin</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}