import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedvbaAccessToken } from '@/lib/medvba-access-token';
import { decodeProfileIdFromMedvbaJwt } from '@/lib/medvba-jwt-profile-id';

/**
 * Deprecated single-device flag — migrated once into `@medvba_onboarding_map_v2`.
 */
export const ONBOARDING_LEGACY_KEY = '@medvba_onboarding_complete';

const ONBOARDING_V2_KEY = '@medvba_onboarding_map_v2';

export type MedvbaOnboardingV2State = {
  /** Profile ids (`profiles.id`) that finished the onboarding flow (logged-in completion). */
  users: string[];
  /**
   * True after the carousel is completed **while logged out** (before account).
   * Cleared once promoted onto the first logged-in `profile_id` via {@link promoteGuestOnboardingToUser}.
   */
  deviceCarouselDone: boolean;
};

async function loadV2(): Promise<MedvbaOnboardingV2State> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_V2_KEY);
    if (!raw) {
      return { users: [], deviceCarouselDone: false };
    }
    const parsed = JSON.parse(raw) as Partial<MedvbaOnboardingV2State>;
    const users = Array.isArray(parsed.users) ? parsed.users.filter((id) => typeof id === 'string' && id.length > 0) : [];
    return {
      users,
      deviceCarouselDone: parsed.deviceCarouselDone === true,
    };
  } catch {
    return { users: [], deviceCarouselDone: false };
  }
}

async function persistV2(state: MedvbaOnboardingV2State): Promise<void> {
  const next = {
    users: [...new Set(state.users)],
    deviceCarouselDone: state.deviceCarouselDone,
  };
  await AsyncStorage.setItem(ONBOARDING_V2_KEY, JSON.stringify(next));
}

async function migrateLegacyIfNeeded(profileIdHint: string | null | undefined): Promise<void> {
  try {
    const legacy = await AsyncStorage.getItem(ONBOARDING_LEGACY_KEY);
    if (legacy !== 'true') return;

    await AsyncStorage.removeItem(ONBOARDING_LEGACY_KEY);
    const existing = await loadV2();

    if (profileIdHint && profileIdHint.length > 0) {
      const users = existing.users.includes(profileIdHint)
        ? existing.users
        : [...existing.users, profileIdHint];
      await persistV2({
        users,
        deviceCarouselDone: existing.deviceCarouselDone,
      });
      return;
    }

    await persistV2({
      ...existing,
      deviceCarouselDone: true,
    });
  } catch {
    /* non-fatal */
  }
}

export async function readOnboardingStorageState(profileIdHint: string | null | undefined): Promise<MedvbaOnboardingV2State> {
  await migrateLegacyIfNeeded(profileIdHint);
  return loadV2();
}

/**
 * Effective completion for router + post-auth redirects.
 * When logged in as `profileId`, onboarding is tied to that id.
 * Guests only see carousel skip when `deviceCarouselDone` is true.
 */
export async function hasCompletedOnboardingStored(
  authenticated: boolean,
  profileId: string | undefined | null,
): Promise<boolean> {
  await migrateLegacyIfNeeded(profileId);
  const state = await loadV2();

  if (authenticated && typeof profileId === 'string' && profileId.length > 0) {
    if (state.users.includes(profileId)) return true;
    if (state.deviceCarouselDone) {
      await promoteGuestOnboardingToUser(profileId, state);
      return true;
    }
    return false;
  }

  return state.deviceCarouselDone;
}

/** After carousel while logged out; user will log in/sign up next. */
export async function markDeviceOnboardingCarouselComplete(): Promise<void> {
  const state = await loadV2();
  await persistV2({ ...state, deviceCarouselDone: true });
}

/** Logged-in user finished onboarding from the carousel / settings replay. */
export async function markUserOnboardingComplete(profileId: string): Promise<void> {
  if (!profileId) return;
  const state = await loadV2();
  const users = state.users.includes(profileId) ? state.users : [...state.users, profileId];
  await persistV2({ ...state, users });
}

/** Run after MEDVBA JWT is applied: consume guest carousel for this profile. */
export async function promoteGuestOnboardingToUser(
  profileId: string | null | undefined,
  prefetch?: MedvbaOnboardingV2State,
): Promise<void> {
  if (!profileId || profileId.length === 0) return;
  const state = prefetch ?? (await loadV2());
  if (!state.deviceCarouselDone) return;
  const users = state.users.includes(profileId) ? state.users : [...state.users, profileId];
  await persistV2({ users, deviceCarouselDone: false });
}

export async function clearAllOnboardingProgress(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ONBOARDING_V2_KEY, ONBOARDING_LEGACY_KEY]);
  } catch {
    /* non-fatal */
  }
}

/**
 * After OAuth/email login, MEDVBA JWT is already in memory — use it for onboarding resolution
 * (React `user` may not have flushed yet).
 */
export async function resolvePostAuthOnboardingDone(): Promise<boolean> {
  const memory = getMedvbaAccessToken();
  const looksJwt = typeof memory === 'string' && memory.split('.').length === 3;
  const profileId = looksJwt ? decodeProfileIdFromMedvbaJwt(memory) : null;
  if (!profileId) {
    await migrateLegacyIfNeeded(null);
    const state = await loadV2();
    return state.deviceCarouselDone;
  }
  return hasCompletedOnboardingStored(true, profileId);
}
