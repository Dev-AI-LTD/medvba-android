import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '@/locales/en';
import {
  APP_LANGUAGE_STORAGE_KEY,
  LEGACY_APP_LANGUAGE_STORAGE_KEY,
} from '@/providers/LanguageProvider';
import { AUTH_RETURN_TO_KEY } from '@/lib/auth-return-url';
import { AppTestProviders } from './testProviders';
import LoginScreen from '@/app/(auth)/login';
import SignUpScreen from '@/app/(auth)/signup';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import HomeScreen from '@/app/(tabs)/index';

/** English UI strings — stays aligned with default `LanguageProvider` + `locales/en.ts`. */
function enCopy(key: string): string {
  const v = en[key];
  if (typeof v !== 'string') {
    throw new Error(`Missing en locale string for key: ${key}`);
  }
  return v;
}

const renderWithApp = (ui: React.ReactElement) =>
  render(<AppTestProviders>{ui}</AppTestProviders>);

const findText = (text: string | RegExp) =>
  screen.findByText(text, {}, { timeout: 15000 });

type KindeAuthMocks = { login: jest.Mock; register: jest.Mock };

function getKindeAuthMocks(): KindeAuthMocks {
  const mocks = (globalThis as { __kindeAuthMocks?: KindeAuthMocks }).__kindeAuthMocks;
  if (!mocks) {
    throw new Error('Kinde auth mocks not initialized (jest.setup.js)');
  }
  return mocks;
}

describe('User flows (integration-style)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getKindeAuthMocks().login.mockResolvedValue({
      success: true,
      accessToken: 'mock-kinde-access',
      idToken: 'mock-kinde-id',
    });
    getKindeAuthMocks().register.mockResolvedValue({
      success: true,
      accessToken: 'mock-kinde-access',
      idToken: 'mock-kinde-id',
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@medvba_onboarding_map_v2') {
        return Promise.resolve(JSON.stringify({ users: [], deviceCarouselDone: true }));
      }
      if (key === APP_LANGUAGE_STORAGE_KEY || key === LEGACY_APP_LANGUAGE_STORAGE_KEY) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Login', () => {
    it('shows hosted email entry and welcome copy', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();
      expect(screen.getByTestId('loginHostedEmail')).toBeTruthy();
      expect(screen.getByText(enCopy('auth.createAccountWithEmail'))).toBeTruthy();
      expect(screen.getByTestId('loginHostedEmailSignIn')).toBeTruthy();
      expect(screen.getByText(enCopy('auth.signInWithEmail'))).toBeTruthy();
    });

    it('navigates to tabs after successful hosted email sign-up when onboarding is complete', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('loginHostedEmail'));
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
      expect(getKindeAuthMocks().register).toHaveBeenCalled();
      expect(getKindeAuthMocks().login).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('calls kinde.login when signing in with email', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('loginHostedEmailSignIn'));
      });

      await waitFor(() => {
        expect(getKindeAuthMocks().login).toHaveBeenCalled();
      });
      expect(getKindeAuthMocks().register).not.toHaveBeenCalled();
    });

    it('navigates to forgot password', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.forgotPassword')));
      });

      expect(router.push).toHaveBeenCalledWith('/(auth)/forgot-password');
    });

    it('returns to saved path after login when auth_return_to is set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@medvba_onboarding_map_v2') {
          return Promise.resolve(JSON.stringify({ users: [], deviceCarouselDone: true }));
        }
        if (key === AUTH_RETURN_TO_KEY) return Promise.resolve('quiz-chapters');
        return Promise.resolve(null);
      });

      renderWithApp(<LoginScreen />);
      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('loginHostedEmailSignIn'));
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/quiz-chapters');
      });
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_RETURN_TO_KEY);
    });

    it('uses kinde.login (not register) for Google sign-in', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('loginGoogleButton'));
      });

      await waitFor(() => {
        expect(getKindeAuthMocks().login).toHaveBeenCalled();
      });
      expect(getKindeAuthMocks().register).not.toHaveBeenCalled();
    });
  });

  describe('Sign up', () => {
    it('redirects signup route to login', async () => {
      renderWithApp(<SignUpScreen />);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
      });
    });
  });

  describe('Forgot password', () => {
    it('shows email validation error', async () => {
      renderWithApp(<ForgotPasswordScreen />);

      expect(await findText(enCopy('auth.sendPasswordResetEmail'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.sendPasswordResetEmail')));
      });

      expect(await findText(enCopy('auth.emailRequired'))).toBeTruthy();
    });

    it('requests password reset via API and shows email confirmation', async () => {
      renderWithApp(<ForgotPasswordScreen />);

      expect(await findText(enCopy('auth.sendPasswordResetEmail'))).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.emailPlaceholder')), 'recover@example.com');

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.sendPasswordResetEmail')));
      });

      await waitFor(() => {
        const fetchMock = global.fetch;
        expect(fetchMock).toHaveBeenCalled();
        const urls = (fetchMock as jest.Mock).mock.calls.map((c) => String(c[0]));
        expect(urls.some((u) => u.includes('/api/auth/request-password-reset'))).toBe(true);
      });

      expect(await findText(enCopy('auth.passwordResetOpenedTitle'))).toBeTruthy();
      expect(screen.getByText(/recover@example\.com/)).toBeTruthy();
    });
  });

  describe('Home dashboard', () => {
    it('renders continue learning hero and start quiz action', async () => {
      renderWithApp(<HomeScreen />);

      expect(await findText(enCopy('home.continueLearning'))).toBeTruthy();
      expect(screen.getByText(enCopy('home.startQuiz'))).toBeTruthy();
    });
  });
});
