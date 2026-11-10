"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type {
  Locale,
  Profile,
  PartialProfile,
  ProfileField,
  LearningEvent,
} from "@/lib/engine/types";
import {
  calculateXP,
  calculateLevel,
  calculateStreak,
  evaluateBadges,
  type LevelTier,
  type StreakResult,
  type Badge,
} from "@/lib/engine/xp";
import {
  loadProfile,
  saveProfile,
  clearProfile as clearProfileStorage,
  resolveProfile,
  getProfileState,
  isProfileComplete,
  PROFILE_STORAGE_KEY,
} from "./profile";
import {
  loadEvents,
  clearEvents as clearEventsStorage,
  appendEvent as appendEventStorage,
  EVENTS_STORAGE_KEY,
} from "./events";

export const VERSION_PREFIX = "bull:v0:";

export const STORAGE_KEYS = {
  profile: PROFILE_STORAGE_KEY,
  events: EVENTS_STORAGE_KEY,
  locale: "bull_locale_v0",
} as const;

// In-memory storage fallback for private mode or environments where localStorage throws
const inMemoryStore = new Map<string, string>();

/**
 * Reads a value from localStorage with fallback to in-memory storage.
 * Gracefully handles JSON corruption by warning and returning defaultValue.
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        // Check in-memory fallback
        if (inMemoryStore.has(key)) {
          const mem = inMemoryStore.get(key)!;
          return JSON.parse(mem) as T;
        }
        return defaultValue;
      }
      try {
        return JSON.parse(raw) as T;
      } catch (err) {
        console.warn(`[Bull Store] Corrupt JSON for key "${key}". Resetting to default.`, err);
        try {
          window.localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return defaultValue;
      }
    }
  } catch (err) {
    console.warn(`[Bull Store] localStorage.getItem threw for key "${key}". Using in-memory store.`, err);
  }

  // Fallback to in-memory store
  if (inMemoryStore.has(key)) {
    try {
      return JSON.parse(inMemoryStore.get(key)!) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

/**
 * Writes a value to localStorage with fallback to in-memory storage.
 */
export function setItem<T>(key: string, value: T): boolean {
  const serialized = JSON.stringify(value);
  // Always update in-memory cache
  inMemoryStore.set(key, serialized);

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, serialized);
      return true;
    }
  } catch (err) {
    console.warn(`[Bull Store] localStorage.setItem threw for key "${key}". Using in-memory fallback.`, err);
  }
  return false;
}

/**
 * Removes a key from both localStorage and in-memory fallback.
 */
export function removeItem(key: string): void {
  inMemoryStore.delete(key);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[Bull Store] localStorage.removeItem threw for key "${key}".`, err);
  }
}

/**
 * Clears in-memory storage and known app keys from localStorage.
 */
export function clearStore(): void {
  inMemoryStore.clear();
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  } catch {
    // ignore
  }
}

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text?: string;
  blocks?: unknown[];
  followUps?: string[];
  timestamp: string;
};

export type BullState = {
  profile: PartialProfile;
  assumed: ProfileField[];
  events: LearningEvent[];
  locale: Locale;
  activeRoute: string;
  chatMessages: ChatMessage[];
  isHydrated: boolean;
};

export type BullContextType = BullState & {
  // Profile mutators
  setProfile: (profile: PartialProfile, assumed?: ProfileField[]) => void;
  updateProfile: (patch: PartialProfile, isAssumed?: boolean) => void;
  setProfileField: <K extends ProfileField>(field: K, value: Profile[K], isAssumed?: boolean) => void;
  clearProfile: () => void;

  // Events mutators
  logEvent: (event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string })) => boolean;
  clearEvents: () => void;

  // Locale switcher
  setLocale: (locale: Locale) => void;

  // Route & Navigation
  setActiveRoute: (route: string) => void;

  // Chat thread
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp"> & { id?: string; timestamp?: string }) => void;
  clearChat: () => void;

  // Gamification & Progress
  xp: number;
  level: LevelTier;
  streak: StreakResult;
  badges: Badge[];

  // Profile status
  isComplete: boolean;
  missingFields: ProfileField[];
  resolvedProfile: Profile;

  // Global reset
  resetAll: () => void;
};

export const BullContext = createContext<BullContextType | null>(null);

export type BullProviderProps = {
  children?: React.ReactNode;
  initialLocale?: Locale;
};

export function BullProvider({ children, initialLocale }: BullProviderProps) {
  const [profile, setProfileState] = useState<PartialProfile>(() => {
    return loadProfile().profile;
  });
  const [assumed, setAssumedState] = useState<ProfileField[]>(() => {
    return loadProfile().assumed;
  });
  const [events, setEventsState] = useState<LearningEvent[]>(() => {
    return loadEvents();
  });
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    const stored = getItem<Locale | null>(STORAGE_KEYS.locale, null);
    return stored === "hi-en" || stored === "en" ? stored : "en";
  });
  const [activeRoute, setActiveRoute] = useState<string>("/");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Client hydration sync
  useEffect(() => {
    const loadedProf = loadProfile();
    setProfileState(loadedProf.profile);
    setAssumedState(loadedProf.assumed);
    setEventsState(loadEvents());
    const storedLocale = getItem<Locale | null>(STORAGE_KEYS.locale, null);
    if (storedLocale && (storedLocale === "en" || storedLocale === "hi-en")) {
      setLocaleState(storedLocale);
    }
    setIsHydrated(true);
  }, []);

  const setProfile = useCallback((newProfile: PartialProfile, newAssumed: ProfileField[] = []) => {
    setProfileState(newProfile);
    setAssumedState(newAssumed);
    saveProfile(newProfile, newAssumed);
  }, []);

  const updateProfile = useCallback((patch: PartialProfile, isAssumed = false) => {
    setProfileState((prev) => {
      const nextProfile = { ...prev, ...patch };
      setAssumedState((prevAssumed) => {
        const nextAssumedSet = new Set(prevAssumed);
        for (const key of Object.keys(patch) as ProfileField[]) {
          if (isAssumed) {
            nextAssumedSet.add(key);
          } else {
            nextAssumedSet.delete(key);
          }
        }
        const nextAssumed = Array.from(nextAssumedSet);
        saveProfile(nextProfile, nextAssumed);
        return nextAssumed;
      });
      return nextProfile;
    });
  }, []);

  const setProfileFieldFn = useCallback(
    <K extends ProfileField>(field: K, value: Profile[K], isAssumed = false) => {
      updateProfile({ [field]: value } as PartialProfile, isAssumed);
    },
    [updateProfile],
  );

  const clearProfileFn = useCallback(() => {
    setProfileState({});
    setAssumedState([]);
    clearProfileStorage();
  }, []);

  const logEvent = useCallback(
    (event: LearningEvent | (Omit<LearningEvent, "timestamp"> & { timestamp?: string })): boolean => {
      const res = appendEventStorage(event);
      if (res.appended) {
        setEventsState(res.events);
      }
      return res.appended;
    },
    [],
  );

  const clearEventsFn = useCallback(() => {
    setEventsState([]);
    clearEventsStorage();
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setItem(STORAGE_KEYS.locale, newLocale);
  }, []);

  const addChatMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp"> & { id?: string; timestamp?: string }) => {
      const fullMsg: ChatMessage = {
        id: msg.id ?? `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: msg.timestamp ?? new Date().toISOString(),
        sender: msg.sender,
        text: msg.text,
        blocks: msg.blocks,
        followUps: msg.followUps,
      };
      setChatMessages((prev) => [...prev, fullMsg]);
    },
    [],
  );

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const resetAll = useCallback(() => {
    clearProfileFn();
    clearEventsFn();
    clearChat();
    clearStore();
  }, [clearProfileFn, clearEventsFn, clearChat]);

  // Derived calculations
  const xp = useMemo(() => calculateXP(events), [events]);
  const level = useMemo(() => calculateLevel(xp), [xp]);
  const streak = useMemo(() => calculateStreak(events, new Date().toISOString()), [events]);
  const badges = useMemo(() => evaluateBadges(events), [events]);

  const profileState = useMemo(() => getProfileState(profile, assumed), [profile, assumed]);
  const resolved = useMemo(() => resolveProfile(profile, assumed).profile, [profile, assumed]);
  const isComplete = useMemo(() => isProfileComplete(profile), [profile]);

  const contextValue: BullContextType = useMemo(
    () => ({
      profile,
      assumed,
      events,
      locale,
      activeRoute,
      chatMessages,
      isHydrated,
      setProfile,
      updateProfile,
      setProfileField: setProfileFieldFn,
      clearProfile: clearProfileFn,
      logEvent,
      clearEvents: clearEventsFn,
      setLocale,
      setActiveRoute,
      addChatMessage,
      clearChat,
      xp,
      level,
      streak,
      badges,
      isComplete,
      missingFields: profileState.missing,
      resolvedProfile: resolved,
      resetAll,
    }),
    [
      profile,
      assumed,
      events,
      locale,
      activeRoute,
      chatMessages,
      isHydrated,
      setProfile,
      updateProfile,
      setProfileFieldFn,
      clearProfileFn,
      logEvent,
      clearEventsFn,
      setLocale,
      setActiveRoute,
      addChatMessage,
      clearChat,
      xp,
      level,
      streak,
      badges,
      isComplete,
      profileState.missing,
      resolved,
      resetAll,
    ],
  );

  return React.createElement(BullContext.Provider, { value: contextValue }, children);
}

/**
 * Hook to access Bull client state and actions from within a BullProvider.
 */
export function useBullState(): BullContextType {
  const ctx = useContext(BullContext);
  if (!ctx) {
    throw new Error("useBullState must be used within a BullProvider");
  }
  return ctx;
}
