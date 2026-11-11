// lib/hooks/use-lesson.ts
import { useState, useCallback } from "react";
import type * as React from "react";
import { useSkillTree } from "./use-skill-tree";
import { useBullStore } from "@/state/use-bull";

interface LessonStep {
  id: string;
  title: string;
  component: React.ComponentType<{ conceptId: string; onComplete: () => void }>;
}

interface LessonContent {
  conceptId: string;
  title: string;
  description: string;
  analogy: string;
  formula: string;
  steps: LessonStep[];
  practiceQuestions: Array<{ question: string; options: string[]; correct: number; explanation: string }>;
  mission: { prompt: string; xp: number };
  masteryCheck: Array<{ question: string; options: string[]; correct: number; explanation: string }>;
}

const LESSON_CONTENT: Record<string, LessonContent> = {
  "pe-ratio": {
    conceptId: "pe-ratio",
    title: "P/E Ratio",
    description: "The Price-to-Earnings ratio tells you how many years of profit you're paying for.",
    analogy: "Your neighborhood kirana store earns ₹5L profit/year. If the owner sells for ₹50L, P/E = 10x (10% earnings yield). If sold for ₹5Cr, P/E = 100x — 100 years to break even!",
    formula: "P/E = Price per Share ÷ Earnings per Share | Earnings Yield = 1 ÷ P/E",
    steps: [
      { id: "concept", title: "Concept", component: () => null },
      { id: "your-stock", title: "Your Stock", component: () => null },
      { id: "practice", title: "Guided Practice", component: () => null },
      { id: "mission", title: "Applied Mission", component: () => null },
      { id: "check", title: "Mastery Check", component: () => null },
    ],
    practiceQuestions: [
      { question: "A company earns ₹10/share. Its stock trades at ₹250. What's the P/E?", options: ["20x", "25x", "30x", "15x"], correct: 1, explanation: "P/E = ₹250 ÷ ₹10 = 25x" },
      { question: "What does a P/E of 10x mean for earnings yield?", options: ["5%", "10%", "15%", "20%"], correct: 1, explanation: "Earnings Yield = 1 ÷ 10 = 10%" },
    ],
    mission: { prompt: "Calculate P/E for Zomato and explain what it means for a long-term investor", xp: 30 },
    masteryCheck: [
      { question: "Lower P/E generally means...", options: ["Higher earnings yield", "Lower earnings yield", "Higher growth", "More risk"], correct: 0, explanation: "Lower P/E = higher earnings yield (1/P/E)" },
      { question: "If Stock A has P/E 15x and Stock B has P/E 30x, which has higher earnings yield?", options: ["Stock A", "Stock B", "Same", "Cannot determine"], correct: 0, explanation: "Stock A: 1/15 = 6.7% vs Stock B: 1/30 = 3.3%" },
    ],
  },
};

export function useLesson(conceptId: string) {
  const content = LESSON_CONTENT[conceptId];
  const { updateMastery, completeLesson, addXP } = useBullStore();
  const { nodes } = useSkillTree();
  const node = nodes.find(n => n.id === conceptId);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState<Record<string, boolean>>({});

  const currentStepData = content?.steps[currentStep];
  const isComplete = currentStep >= (content?.steps.length || 0) - 1 && !!stepProgress[currentStepData?.id || ""];

  const completeStep = useCallback((stepId: string) => {
    setStepProgress(prev => ({ ...prev, [stepId]: true }));
    if (currentStep < (content?.steps.length || 0) - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, content?.steps.length]);

  const completeLessonHandler = useCallback(() => {
    completeLesson(conceptId);
    updateMastery(conceptId, Math.min(5, (node?.mastery.level || 0) + 1), 100);
    addXP(20, `lesson:${conceptId}`);
  }, [conceptId, completeLesson, updateMastery, addXP, node?.mastery.level]);

  return {
    content,
    currentStep,
    currentStepData,
    stepProgress,
    isComplete,
    completeStep,
    completeLesson: completeLessonHandler,
    setCurrentStep,
  };
}
