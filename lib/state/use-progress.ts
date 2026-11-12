import { useBullStore } from "./use-bull";

export function useProgress() {
  const { progress, checkStreak } = useBullStore();

  const xpForNextLevel = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level + 1] || 999999;
  const xpProgress = progress.level > 0 
    ? ((progress.xp - [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level]) / 
       (xpForNextLevel - [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level])) * 100
    : (progress.xp / 100) * 100;

  return {
    ...progress,
    xpProgress: Math.min(100, Math.max(0, xpProgress)),
    xpForNextLevel,
    xpInLevel: progress.xp - ([0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000][progress.level] || 0),
    checkStreak,
  };
}