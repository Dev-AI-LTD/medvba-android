jest.mock('@/lib/expo-public-extra', () => ({
  getMergedExpoExtra: jest.fn(() => ({})),
}));

import { getMergedExpoExtra } from '@/lib/expo-public-extra';
import {
  isAppLaunchEnglishUiOnly,
  resolveAppContentLanguage,
} from '@/lib/app-ui-languages';
import { resolveStudyContentLocale } from '@/lib/study-content-locale';

const mockGetMergedExpoExtra = getMergedExpoExtra as jest.MockedFunction<typeof getMergedExpoExtra>;

describe('resolveAppContentLanguage', () => {
  it('returns en for en UI', () => {
    expect(resolveAppContentLanguage('en')).toBe('en');
  });

  it('returns en for ro UI', () => {
    expect(resolveAppContentLanguage('ro')).toBe('en');
  });

  it('returns en for es UI', () => {
    expect(resolveAppContentLanguage('es')).toBe('en');
  });
});

describe('resolveStudyContentLocale', () => {
  it('returns en for every UI locale', () => {
    expect(resolveStudyContentLocale('en')).toBe('en');
    expect(resolveStudyContentLocale('ro')).toBe('en');
    expect(resolveStudyContentLocale('es')).toBe('en');
  });
});

describe('isAppLaunchEnglishUiOnly', () => {
  const prevEnv = process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;

  beforeEach(() => {
    mockGetMergedExpoExtra.mockReset();
    mockGetMergedExpoExtra.mockReturnValue({});
    delete process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;
  });

  afterAll(() => {
    if (prevEnv === undefined) delete process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;
    else process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES = prevEnv;
  });

  it('defaults to English-only when allow flag is absent', () => {
    expect(isAppLaunchEnglishUiOnly()).toBe(true);
  });

  it('allows UI locales when extra flag is true', () => {
    mockGetMergedExpoExtra.mockReturnValue({ EXPO_PUBLIC_ALLOW_UI_LOCALES: 'true' });
    expect(isAppLaunchEnglishUiOnly()).toBe(false);
  });

  it('allows UI locales when process.env flag is 1 and extra is empty', () => {
    process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES = '1';
    expect(isAppLaunchEnglishUiOnly()).toBe(false);
  });

  it('re-reads config on each call (not frozen at import)', () => {
    mockGetMergedExpoExtra.mockReturnValue({});
    expect(isAppLaunchEnglishUiOnly()).toBe(true);
    mockGetMergedExpoExtra.mockReturnValue({ EXPO_PUBLIC_ALLOW_UI_LOCALES: 'true' });
    expect(isAppLaunchEnglishUiOnly()).toBe(false);
  });
});
