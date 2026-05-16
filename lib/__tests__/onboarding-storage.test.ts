import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAllOnboardingProgress,
  ONBOARDING_LEGACY_KEY,
  hasCompletedOnboardingStored,
  markDeviceOnboardingCarouselComplete,
  markUserOnboardingComplete,
  promoteGuestOnboardingToUser,
} from '@/lib/onboarding-storage';

describe('onboarding-storage', () => {
  let mem: Record<string, string>;

  beforeEach(() => {
    mem = {};
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(mem[key] ?? null),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      mem[key] = value;
      return Promise.resolve(undefined);
    });
    (AsyncStorage.multiRemove as jest.Mock).mockImplementation(async (keys: string[]) => {
      for (const k of keys) delete mem[k];
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      delete mem[key];
    });
  });

  it('guest completion only enables deviceCarouselDone', async () => {
    expect(await hasCompletedOnboardingStored(false, null)).toBe(false);
    await markDeviceOnboardingCarouselComplete();
    expect(await hasCompletedOnboardingStored(false, null)).toBe(true);

    let raw = (AsyncStorage.setItem as jest.Mock).mock.calls.find((c) => c[0] === '@medvba_onboarding_map_v2')?.[1];
    expect(JSON.parse(String(raw)).deviceCarouselDone).toBe(true);

    expect(await hasCompletedOnboardingStored(true, 'user-1')).toBe(true);

    raw = (AsyncStorage.setItem as jest.Mock).mock.calls
      .filter((c) => c[0] === '@medvba_onboarding_map_v2')
      .pop()?.[1];
    const final = JSON.parse(String(raw));
    expect(final.users).toContain('user-1');
    expect(final.deviceCarouselDone).toBe(false);
  });

  it('promoteGuestOnboardingToUser consumes device flag', async () => {
    await markDeviceOnboardingCarouselComplete();
    await promoteGuestOnboardingToUser('p2');
    expect(await hasCompletedOnboardingStored(true, 'p2')).toBe(true);
    expect(await hasCompletedOnboardingStored(false, null)).toBe(false);
  });

  it('migrates legacy key with profile hint onto users[]', async () => {
    mem[ONBOARDING_LEGACY_KEY] = 'true';
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(mem[key] ?? null),
    );
    expect(await hasCompletedOnboardingStored(true, 'legacy-u')).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(ONBOARDING_LEGACY_KEY);
  });

  it('clearAllOnboardingProgress wipes v2 + legacy', async () => {
    await clearAllOnboardingProgress();
    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  });

  it('markUserOnboardingComplete records profile id', async () => {
    await markUserOnboardingComplete('u9');
    expect(await hasCompletedOnboardingStored(true, 'u9')).toBe(true);
  });
});
