import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { getMergedExpoExtra } from '@/lib/expo-public-extra';
import { resolveAppContentLanguage } from '@/lib/app-ui-languages';
import {
  APP_LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  useLanguage,
} from '@/providers/LanguageProvider';

jest.mock('@/lib/expo-public-extra', () => ({
  getMergedExpoExtra: jest.fn(() => ({})),
}));

const mockGetMergedExpoExtra = getMergedExpoExtra as jest.MockedFunction<typeof getMergedExpoExtra>;

function wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('LanguageProvider UI locale gate', () => {
  const prevEnv = process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMergedExpoExtra.mockReset();
    mockGetMergedExpoExtra.mockReturnValue({});
    delete process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === APP_LANGUAGE_STORAGE_KEY) return 'ro';
      return null;
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    if (prevEnv === undefined) delete process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;
    else process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES = prevEnv;
  });

  it('allow flag on + stored ro => UI ro after hydration', async () => {
    mockGetMergedExpoExtra.mockReturnValue({ EXPO_PUBLIC_ALLOW_UI_LOCALES: 'true' });
    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentLanguage).toBe('ro');
  });

  it('allow flag off => visible UI en but does not overwrite stored ro', async () => {
    mockGetMergedExpoExtra.mockReturnValue({});
    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentLanguage).toBe('en');

    const languageWrites = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      (call) => call[0] === APP_LANGUAGE_STORAGE_KEY,
    );
    expect(languageWrites).toEqual([]);
  });

  it('restoring allow flag returns UI ro without selecting language again', async () => {
    mockGetMergedExpoExtra.mockReturnValue({});
    const gated = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(gated.result.current.isLoading).toBe(false));
    expect(gated.result.current.currentLanguage).toBe('en');
    gated.unmount();

    mockGetMergedExpoExtra.mockReturnValue({ EXPO_PUBLIC_ALLOW_UI_LOCALES: 'true' });
    const restored = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(restored.result.current.isLoading).toBe(false));
    expect(restored.result.current.currentLanguage).toBe('ro');

    const languageWrites = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      (call) => call[0] === APP_LANGUAGE_STORAGE_KEY,
    );
    expect(languageWrites).toEqual([]);
  });

  it('changeLanguage persists preference even while English-only gate is on', async () => {
    mockGetMergedExpoExtra.mockReturnValue({});
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.changeLanguage('es');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(APP_LANGUAGE_STORAGE_KEY, 'es');
    // Visible UI still gated to English.
    expect(result.current.currentLanguage).toBe('en');
  });

  it('content locale path does not write @medvba_language', async () => {
    mockGetMergedExpoExtra.mockReturnValue({ EXPO_PUBLIC_ALLOW_UI_LOCALES: 'true' });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (AsyncStorage.setItem as jest.Mock).mockClear();
    expect(resolveAppContentLanguage(result.current.currentLanguage)).toBe('en');
    expect(resolveAppContentLanguage('ro')).toBe('en');
    expect(resolveAppContentLanguage('es')).toBe('en');

    const languageWrites = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      (call) => call[0] === APP_LANGUAGE_STORAGE_KEY,
    );
    expect(languageWrites).toEqual([]);
  });

  it('getChapterTitle returns English medical title for RO/ES UI', async () => {
    mockGetMergedExpoExtra.mockReturnValue({ EXPO_PUBLIC_ALLOW_UI_LOCALES: 'true' });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentLanguage).toBe('ro');
    expect(result.current.getChapterTitle('tissues')).toBe('Tissues');
    expect(result.current.t('session.chapter')).toBe('Capitol');

    await act(async () => {
      await result.current.changeLanguage('es');
    });
    expect(result.current.currentLanguage).toBe('es');
    expect(result.current.getChapterTitle('tissues')).toBe('Tissues');
    expect(result.current.t('session.chapter')).toBe('Capítulo');
  });
});
