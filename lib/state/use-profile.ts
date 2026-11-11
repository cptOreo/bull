import { useBullStore } from "./use-bull";

export function useProfile() {
  const { profile, setProfile, clearProfile, hasCompletedOnboarding, completeOnboarding } = useBullStore();

  return {
    profile,
    setProfile,
    clearProfile,
    hasCompletedOnboarding,
    completeOnboarding,
    isComplete: profile !== null,
  };
}