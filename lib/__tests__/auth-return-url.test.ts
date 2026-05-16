import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_RETURN_TO_KEY,
  clearAuthReturnDestination,
  isSafeAuthReturnPath,
  resolvePostAuthHref,
  saveAuthReturnTo,
  serializeAuthReturnPath,
} from '@/lib/auth-return-url';

describe('auth-return-url', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('serializes stack routes', () => {
    expect(serializeAuthReturnPath(['quiz-chapters'])).toBe('quiz-chapters');
    expect(serializeAuthReturnPath(['(tabs)', 'tutor'])).toBe('(tabs)/tutor');
  });

  it('rejects auth and legal paths', () => {
    expect(serializeAuthReturnPath(['(auth)', 'login'])).toBeNull();
    expect(serializeAuthReturnPath(['legal', 'terms-of-service'])).toBeNull();
    expect(isSafeAuthReturnPath('../evil')).toBe(false);
  });

  it('saves return path to AsyncStorage', async () => {
    await saveAuthReturnTo(['quiz-session']);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(AUTH_RETURN_TO_KEY, 'quiz-session');
  });

  it('resolvePostAuthHref consumes stored path', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('quiz-chapters');
    await expect(resolvePostAuthHref(true)).resolves.toBe('/quiz-chapters');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_RETURN_TO_KEY);
  });

  it('resolvePostAuthHref falls back to tabs when onboarding complete', async () => {
    await expect(resolvePostAuthHref(true)).resolves.toBe('/(tabs)');
  });

  it('resolvePostAuthHref falls back to onboarding when not complete', async () => {
    await expect(resolvePostAuthHref(false)).resolves.toBe('/(auth)/onboarding');
  });

  it('clearAuthReturnDestination removes stored path', async () => {
    await clearAuthReturnDestination();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_RETURN_TO_KEY);
  });
});
