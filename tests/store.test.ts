// @vitest-environment jsdom
import "@/tests/setup";
import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  getItem,
  setItem,
  removeItem,
  clearStore,
  STORAGE_KEYS,
  BullProvider,
  useBullState,
} from "@/lib/state/store";
import {
  loadProfile,
  saveProfile,
  clearProfile,
  setProfileField,
  resolveProfile,
  getProfileState,
  DEFAULT_ASSUMED_PROFILE,
  PROFILE_STORAGE_KEY,
} from "@/lib/state/profile";
import {
  loadEvents,
  saveEvents,
  clearEvents,
  appendEvent,
  computeStreak,
  computeXP,
  computeLevel,
  computeBadges,
  EVENTS_STORAGE_KEY,
} from "@/lib/state/events";
import type { LearningEvent, PartialProfile } from "@/lib/engine/types";

describe("lib/state/store - versioned local storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStore();
    vi.restoreAllMocks();
  });

  it("reads and writes with version prefix or canonical key", () => {
    setItem("bull:v0:test", { value: 42 });
    expect(getItem("bull:v0:test", null)).toEqual({ value: 42 });

    // Canonical keys
    setItem(STORAGE_KEYS.profile, { goal: "grow_wealth" });
    expect(getItem(STORAGE_KEYS.profile, null)).toEqual({ goal: "grow_wealth" });
  });

  it("resets gracefully and returns default with a warning when JSON is corrupt", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem("bull:v0:corrupt", "{invalid-json-data");

    const result = getItem("bull:v0:corrupt", { fallback: true });
    expect(result).toEqual({ fallback: true });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("falls back to in-memory store when localStorage throws", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    // In-memory fallback functions
    setItem("test-memory-key", "memory-value");
    expect(getItem("test-memory-key", null)).toBe("memory-value");

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("removes items and clears store accurately", () => {
    setItem("key1", "val1");
    setItem("key2", "val2");
    removeItem("key1");
    expect(getItem("key1", null)).toBeNull();
    expect(getItem("key2", null)).toBe("val2");

    clearStore();
    expect(getItem("key2", null)).toBeNull();
  });
});

describe("lib/state/profile - persistence and assumed tracking", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStore();
  });

  it("loads empty profile by default", () => {
    const { profile, assumed } = loadProfile();
    expect(profile).toEqual({});
    expect(assumed).toEqual([]);
  });

  it("saves and loads profile accurately with bull_profile_v0", () => {
    const saved: PartialProfile = {
      goal: "dividends",
      horizon: "5_10y",
      riskComfort: "medium",
    };
    saveProfile(saved, ["horizon"]);

    const loaded = loadProfile();
    expect(loaded.profile.goal).toBe("dividends");
    expect(loaded.profile.horizon).toBe("5_10y");
    expect(loaded.profile.riskComfort).toBe("medium");
    expect(loaded.assumed).toEqual(["horizon"]);

    // Verify key in localStorage
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).not.toBeNull();
  });

  it("updates individual profile fields and tracks assumed status", () => {
    setProfileField("goal", "grow_wealth", false);
    let state = loadProfile();
    expect(state.profile.goal).toBe("grow_wealth");
    expect(state.assumed).not.toContain("goal");

    setProfileField("riskComfort", "unsure", true);
    state = loadProfile();
    expect(state.profile.riskComfort).toBe("unsure");
    expect(state.assumed).toContain("riskComfort");

    // Changing with explicit user preference removes assumed status
    setProfileField("riskComfort", "high", false);
    state = loadProfile();
    expect(state.profile.riskComfort).toBe("high");
    expect(state.assumed).not.toContain("riskComfort");
  });

  it("resolves default assumptions when fields are missing", () => {
    const partial: PartialProfile = { goal: "learn" };
    const { profile, assumed } = resolveProfile(partial, []);

    expect(profile.goal).toBe("learn");
    expect(profile.horizon).toBe(DEFAULT_ASSUMED_PROFILE.horizon);
    expect(profile.riskComfort).toBe(DEFAULT_ASSUMED_PROFILE.riskComfort);
    expect(profile.experience).toBe(DEFAULT_ASSUMED_PROFILE.experience);
    expect(profile.locale).toBe(DEFAULT_ASSUMED_PROFILE.locale);

    expect(assumed).toContain("horizon");
    expect(assumed).toContain("riskComfort");
    expect(assumed).toContain("experience");
    expect(assumed).not.toContain("goal");
  });

  it("computes complete and missing status accurately in getProfileState", () => {
    const partial: PartialProfile = { goal: "dividends", horizon: "1_3y" };
    const state = getProfileState(partial, []);

    expect(state.complete).toBe(false);
    expect(state.missing).toEqual(["riskComfort", "experience", "locale"]);

    const completeProfile: PartialProfile = {
      goal: "dividends",
      horizon: "1_3y",
      riskComfort: "low",
      experience: "none",
      locale: "en",
    };
    const fullState = getProfileState(completeProfile, []);
    expect(fullState.complete).toBe(true);
    expect(fullState.missing).toEqual([]);
  });

  it("clears profile from storage", () => {
    saveProfile({ goal: "preserve" });
    expect(loadProfile().profile.goal).toBe("preserve");

    clearProfile();
    expect(loadProfile().profile).toEqual({});
  });
});

describe("lib/state/events - event log persistence and gamification", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStore();
  });

  it("loads empty event log by default", () => {
    expect(loadEvents()).toEqual([]);
  });

  it("appends events and persists to bull_events_v0", () => {
    const event: LearningEvent = {
      type: "stock_viewed",
      ticker: "INFY",
      timestamp: "2026-11-10T10:00:00Z",
    };
    const { events, appended } = appendEvent(event);
    expect(appended).toBe(true);
    expect(events.length).toBe(1);
    expect(events[0].ticker).toBe("INFY");

    const loaded = loadEvents();
    expect(loaded.length).toBe(1);
    expect(loaded[0].type).toBe("stock_viewed");
    expect(window.localStorage.getItem(EVENTS_STORAGE_KEY)).not.toBeNull();
  });

  it("deduplicates identical events appropriately", () => {
    const event1: LearningEvent = {
      type: "lesson_completed",
      conceptId: "C1",
      timestamp: "2026-11-10T10:00:00Z",
    };
    const res1 = appendEvent(event1);
    expect(res1.appended).toBe(true);

    // Duplicate lesson_completed for same concept should be deduplicated
    const res2 = appendEvent({
      type: "lesson_completed",
      conceptId: "C1",
      timestamp: "2026-11-10T10:05:00Z",
    });
    expect(res2.appended).toBe(false);
    expect(res2.events.length).toBe(1);

    // Different concept should be appended
    const res3 = appendEvent({
      type: "lesson_completed",
      conceptId: "C2",
      timestamp: "2026-11-10T10:10:00Z",
    });
    expect(res3.appended).toBe(true);
    expect(res3.events.length).toBe(2);
  });

  it("computes streak, XP, level, and badges from stored events", () => {
    const events: LearningEvent[] = [
      { type: "lesson_completed", conceptId: "C1", timestamp: "2026-11-09T12:00:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "item_1", timestamp: "2026-11-09T12:05:00Z" },
      { type: "check_answered_correct", conceptId: "C1", itemId: "item_2", timestamp: "2026-11-10T10:00:00Z" },
      { type: "mission_passed", conceptId: "C1", timestamp: "2026-11-10T10:05:00Z" },
    ];
    saveEvents(events);

    const xp = computeXP();
    expect(xp).toBe(60); // 20 (lesson) + 10 (check) + 30 (mission)

    const level = computeLevel();
    expect(level.level).toBe(1);

    const streak = computeStreak(undefined, "2026-11-10T10:00:00Z");
    expect(streak.current).toBe(2);
    expect(streak.todayActive).toBe(true);

    const badges = computeBadges();
    const firstSteps = badges.find((b) => b.id === "first_steps");
    expect(firstSteps?.unlocked).toBe(true);
  });

  it("clears event log", () => {
    appendEvent({ type: "stock_viewed", ticker: "TCS", timestamp: "2026-11-10T10:00:00Z" });
    expect(loadEvents().length).toBe(1);

    clearEvents();
    expect(loadEvents()).toEqual([]);
  });
});

describe("lib/state/store - BullProvider and useBullState", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStore();
  });

  it("provides initial state and allows state mutations inside React tree", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(BullProvider, { initialLocale: "en" }, children);

    const { result } = renderHook(() => useBullState(), { wrapper });

    expect(result.current.locale).toBe("en");
    expect(result.current.profile).toEqual({});
    expect(result.current.events).toEqual([]);
    expect(result.current.xp).toBe(0);
    expect(result.current.isComplete).toBe(false);

    // Update profile
    act(() => {
      result.current.setProfileField("goal", "grow_wealth", false);
    });
    expect(result.current.profile.goal).toBe("grow_wealth");
    expect(result.current.assumed).not.toContain("goal");

    // Log event
    act(() => {
      result.current.logEvent({
        type: "lesson_completed",
        conceptId: "C1",
        timestamp: "2026-11-10T10:00:00Z",
      });
    });
    expect(result.current.events.length).toBe(1);
    expect(result.current.xp).toBe(20);

    // Switch locale
    act(() => {
      result.current.setLocale("hi-en");
    });
    expect(result.current.locale).toBe("hi-en");

    // Reset all
    act(() => {
      result.current.resetAll();
    });
    expect(result.current.profile).toEqual({});
    expect(result.current.events).toEqual([]);
    expect(result.current.xp).toBe(0);
  });
});

