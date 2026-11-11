// lib/hooks/use-lesson.ts
import { useState, useCallback } from "react";
import { useSkillTree } from "./use-skill-tree";
import { useBullStore } from "@/state/use-bull";
import { getLesson, type LessonData } from "@/lib/data/lessons";

export const LESSON_STEPS = [
  { id: "concept", title: "1. Concept & Mental Model" },
  { id: "your-stock", title: "2. Real Stock Application" },
  { id: "practice", title: "3. Guided Practice & Simulator" },
  { id: "mission", title: "4. Applied Mission" },
  { id: "check", title: "5. Mastery Check" },
] as const;

export type LessonStepId = typeof LESSON_STEPS[number]["id"];

export function useLesson(conceptId: string) {
  const lessonData: LessonData = getLesson(conceptId);
  const { updateMastery, completeLesson, completeMission, addXP } = useBullStore();
  const { nodes } = useSkillTree();
  const node = nodes.find(n => n.id === conceptId);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [missionSubmitted, setMissionSubmitted] = useState(false);
  const [missionFeedback, setMissionFeedback] = useState<string | null>(null);
  const [masteryScore, setMasteryScore] = useState<number | null>(null);
  const [hasPassedCheck, setHasPassedCheck] = useState(false);

  const currentStepId = LESSON_STEPS[currentStep].id;
  const isLastStep = currentStep === LESSON_STEPS.length - 1;

  const markStepDone = useCallback((stepId: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
  }, []);

  const nextStep = useCallback(() => {
    markStepDone(currentStepId);
    if (currentStep < LESSON_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, currentStepId, markStepDone]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const submitMission = useCallback((userResponse: string) => {
    setMissionSubmitted(true);
    completeMission(conceptId);
    addXP(30, `mission:${conceptId}`);
    setMissionFeedback(
      userResponse.trim().length > 15
        ? "Good analysis! Your reasoning accounts for both business durability and capital risks."
        : "Mission submitted. Remember to evaluate how debt and industry competition affect margins over time."
    );
    markStepDone("mission");
  }, [conceptId, completeMission, addXP, markStepDone]);

  const submitMasteryCheck = useCallback((correctCount: number, total: number) => {
    setMasteryScore(correctCount);
    const passed = correctCount >= Math.ceil(total * 0.6);
    setHasPassedCheck(passed);

    if (passed) {
      completeLesson(conceptId);
      const newLevel = Math.max(1, (node?.mastery.level || 0) + 1);
      updateMastery(conceptId, Math.min(5, newLevel), 100);
      addXP(50, `mastery:${conceptId}`);
      markStepDone("check");
    }
    return passed;
  }, [conceptId, completeLesson, updateMastery, addXP, node?.mastery.level, markStepDone]);

  return {
    lesson: lessonData,
    node,
    steps: LESSON_STEPS,
    currentStep,
    currentStepId,
    isLastStep,
    completedSteps,
    missionSubmitted,
    missionFeedback,
    masteryScore,
    hasPassedCheck,
    setCurrentStep,
    nextStep,
    prevStep,
    markStepDone,
    submitMission,
    submitMasteryCheck,
  };
}
