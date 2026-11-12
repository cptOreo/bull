"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useBullState, BullProvider } from "./store";
import type { BullContextType } from "./store";

export { BullProvider, useBullState };
export type { BullContextType };

export type UseBullResult = BullContextType & {
  reset: () => void;
};

/**
 * Primary React hook exposing Bull client state, profile updater,
 * locale switcher, learning event logger, and XP/level/streak/badge progress.
 */
export function useBull(): UseBullResult {
  const state = useBullState();
  return {
    ...state,
    reset: state.resetAll,
  };
}

export default useBull;

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  goal: "analyze" | "dividend" | "statements" | "moats";
  experience: "none" | "few" | "sip";
  horizon: "1_3y" | "3_5y" | "5_10y" | "10y_plus";
  riskComfort: "low" | "medium" | "high" | "unsure";
  locale: "en" | "hi-en";
}

export interface LearningProgress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  mastery: Record<string, { level: number; progress: number }>;
  badges: string[];
  completedLessons: string[];
  completedMissions: string[];
  quizHistory: Array<{ date: string; score: number; xp: number }>;
}

export interface BullState {
  profile: UserProfile | null;
  progress: LearningProgress;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: Partial<UserProfile>) => void;
  clearProfile: () => void;
  updateProgress: (updates: Partial<LearningProgress>) => void;
  addXP: (amount: number, source: string) => void;
  completeLesson: (lessonId: string) => void;
  completeMission: (missionId: string) => void;
  updateMastery: (conceptId: string, level: number, progress: number) => void;
  addBadge: (badgeId: string) => void;
  recordQuiz: (score: number, xp: number) => void;
  checkStreak: () => void;
  completeOnboarding: () => void;
}

const INITIAL_PROGRESS: LearningProgress = {
  xp: 0,
  level: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
  mastery: {},
  badges: [],
  completedLessons: [],
  completedMissions: [],
  quizHistory: [],
};

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];

function calculateLevel(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i;
  }
  return 0;
}

export const useBullStore = create<BullState>()(
  persist(
    immer((set, get) => ({
      profile: null,
      progress: INITIAL_PROGRESS,
      hasCompletedOnboarding: false,

      setProfile: (updates) => set((state) => {
        state.profile = { ...state.profile!, ...updates } as UserProfile;
      }),

      clearProfile: () => set((state) => {
        state.profile = null;
      }),

      updateProgress: (updates) => set((state) => {
        state.progress = { ...state.progress, ...updates };
      }),

      addXP: (amount) => set((state) => {
        const newXP = state.progress.xp + amount;
        const newLevel = calculateLevel(newXP);
        const leveledUp = newLevel > state.progress.level;
        
        state.progress.xp = newXP;
        state.progress.level = newLevel;
        
        if (leveledUp) {
          // Could trigger level-up celebration
        }
      }),

      completeLesson: (lessonId) => set((state) => {
        if (!state.progress.completedLessons.includes(lessonId)) {
          state.progress.completedLessons.push(lessonId);
          get().addXP(20, `lesson:${lessonId}`);
        }
      }),

      completeMission: (missionId) => set((state) => {
        if (!state.progress.completedMissions.includes(missionId)) {
          state.progress.completedMissions.push(missionId);
          get().addXP(30, `mission:${missionId}`);
        }
      }),

      updateMastery: (conceptId, level, progress) => set((state) => {
        const current = state.progress.mastery[conceptId] || { level: 0, progress: 0 };
        const oldLevel = current.level;
        state.progress.mastery[conceptId] = { level, progress };
        
        if (level > oldLevel) {
          get().addXP(50, `mastery:${conceptId}`);
        }
      }),

      addBadge: (badgeId) => set((state) => {
        if (!state.progress.badges.includes(badgeId)) {
          state.progress.badges.push(badgeId);
          get().addXP(100, `badge:${badgeId}`);
        }
      }),

      recordQuiz: (score, xp) => set((state) => {
        const today = new Date().toISOString().split("T")[0];
        state.progress.quizHistory.push({ date: today, score, xp });
        get().addXP(xp, "quiz");
      }),

      checkStreak: () => set((state) => {
        const today = new Date().toISOString().split("T")[0];
        const lastActive = state.progress.lastActiveDate;
        
        if (lastActive === today) return; // Already checked today
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        
        if (lastActive === yesterday) {
          state.progress.streak += 1;
        } else if (lastActive !== today) {
          state.progress.streak = 1;
        }
        
        state.progress.lastActiveDate = today;
        
        // Streak bonuses
        if (state.progress.streak === 7) get().addXP(50, "streak:7");
        if (state.progress.streak === 30) get().addXP(100, "streak:30");
        if (state.progress.streak === 100) get().addXP(200, "streak:100");
      }),

      completeOnboarding: () => set((state) => {
        state.hasCompletedOnboarding = true;
      }),
    })),
    {
      name: "bull-v2-state",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted: unknown) => {
        return persisted as BullState;
      },
    }
  )
);
