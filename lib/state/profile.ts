import type {
  Goal,
  Horizon,
  RiskComfort,
  Experience,
  Locale,
  Profile,
  PartialProfile,
  ProfileField,
  ProfileState,
} from "@/lib/engine/types";
import { getItem, setItem, removeItem } from "./store";

export const PROFILE_STORAGE_KEY = "bull_profile_v0";

export const DEFAULT_ASSUMED_PROFILE: Profile = {
  goal: "grow_wealth",
  horizon: "3_5y",
  riskComfort: "unsure",
  experience: "sip",
  locale: "en",
};

export const PROFILE_FIELDS: ProfileField[] = [
  "goal",
  "horizon",
  "riskComfort",
  "experience",
  "locale",
];

export type StoredProfileRecord = {
  version?: number;
  profile: PartialProfile;
  assumed?: ProfileField[];
  updatedAt?: string;
};

/**
 * Loads the saved profile and assumed fields from storage.
 * Gracefully handles missing keys, malformed data, or older schema variants.
 */
export function loadProfile(): { profile: PartialProfile; assumed: ProfileField[] } {
  const fallback = { profile: {} as PartialProfile, assumed: [] as ProfileField[] };
  const raw = getItem<StoredProfileRecord | PartialProfile | null>(PROFILE_STORAGE_KEY, fallback);

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  // Handle direct PartialProfile storage format
  if ("goal" in raw || "horizon" in raw || "riskComfort" in raw || "experience" in raw || "locale" in raw) {
    if (!("profile" in raw)) {
      return {
        profile: raw as PartialProfile,
        assumed: [],
      };
    }
  }

  const record = raw as StoredProfileRecord;
  return {
    profile: record.profile ?? {},
    assumed: Array.isArray(record.assumed) ? record.assumed : [],
  };
}

/**
 * Persists the profile and assumed fields list to storage.
 */
export function saveProfile(profile: PartialProfile, assumed: ProfileField[] = []): void {
  const record: StoredProfileRecord = {
    version: 0,
    profile,
    assumed,
    updatedAt: new Date().toISOString(),
  };
  setItem(PROFILE_STORAGE_KEY, record);
}

/**
 * Clears the profile from storage.
 */
export function clearProfile(): void {
  removeItem(PROFILE_STORAGE_KEY);
}

/**
 * Updates a single field on the saved profile, tracking or clearing its assumed status.
 */
export function setProfileField<K extends ProfileField>(
  field: K,
  value: Profile[K],
  isAssumed = false,
): { profile: PartialProfile; assumed: ProfileField[] } {
  const current = loadProfile();
  const nextProfile: PartialProfile = {
    ...current.profile,
    [field]: value,
  };

  const nextAssumedSet = new Set(current.assumed);
  if (isAssumed) {
    nextAssumedSet.add(field);
  } else {
    nextAssumedSet.delete(field);
  }

  const nextAssumed = Array.from(nextAssumedSet);
  saveProfile(nextProfile, nextAssumed);

  return {
    profile: nextProfile,
    assumed: nextAssumed,
  };
}

/**
 * Resolves a partial profile by filling all missing fields from DEFAULT_ASSUMED_PROFILE.
 * Any field supplied by default is added to the assumed list.
 */
export function resolveProfile(
  partial: PartialProfile,
  currentAssumed: ProfileField[] = [],
): { profile: Profile; assumed: ProfileField[] } {
  const assumedSet = new Set(currentAssumed);
  const resolved: Profile = {
    goal: partial.goal ?? (assumedSet.add("goal"), DEFAULT_ASSUMED_PROFILE.goal),
    horizon: partial.horizon ?? (assumedSet.add("horizon"), DEFAULT_ASSUMED_PROFILE.horizon),
    riskComfort:
      partial.riskComfort ?? (assumedSet.add("riskComfort"), DEFAULT_ASSUMED_PROFILE.riskComfort),
    experience:
      partial.experience ?? (assumedSet.add("experience"), DEFAULT_ASSUMED_PROFILE.experience),
    locale: partial.locale ?? (assumedSet.add("locale"), DEFAULT_ASSUMED_PROFILE.locale),
  };

  return {
    profile: resolved,
    assumed: Array.from(assumedSet),
  };
}

/**
 * Computes missing fields, assumed status, and completeness flag for a profile.
 */
export function getProfileState(
  partial: PartialProfile,
  currentAssumed: ProfileField[] = [],
): ProfileState {
  const missing = PROFILE_FIELDS.filter((f) => partial[f] === undefined);
  return {
    profile: partial,
    assumed: currentAssumed,
    missing,
    complete: missing.length === 0,
  };
}

/**
 * Type guard for complete profile.
 */
export function isProfileComplete(profile: PartialProfile): profile is Profile {
  return (
    profile.goal !== undefined &&
    profile.horizon !== undefined &&
    profile.riskComfort !== undefined &&
    profile.experience !== undefined &&
    profile.locale !== undefined
  );
}
