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

describe('User flows (integration-style)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@medvba_onboarding_complete') return Promise.resolve('true');
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
    });

    it('navigates to tabs after successful hosted email sign-in when onboarding is complete', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('loginHostedEmail'));
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('navigates to forgot password', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeUnifiedTitle'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.forgotPassword')));
      });

      expect(router.push).toHaveBeenCalledWith('/(auth)/forgot-password');
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
