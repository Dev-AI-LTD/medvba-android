import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
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
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  });

  describe('Login', () => {
    it('shows validation errors when submitting empty form', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeBack'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.signIn')));
      });

      expect(await findText(enCopy('auth.emailRequired'))).toBeTruthy();
      expect(screen.getByText(enCopy('auth.passwordRequired'))).toBeTruthy();
    });

    it('navigates to tabs after successful email login when onboarding is complete', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeBack'))).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.emailPlaceholder')), 'user@example.com');
      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.passwordPlaceholder')), 'secret12');

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.signIn')));
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('navigates to forgot password', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeBack'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.forgotPassword')));
      });

      expect(router.push).toHaveBeenCalledWith('/(auth)/forgot-password');
    });

    it('navigates to signup', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText(enCopy('auth.welcomeBack'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.signUp')));
      });

      expect(router.push).toHaveBeenCalledWith('/(auth)/signup');
    });
  });

  describe('Sign up', () => {
    it('shows validation errors for empty form', async () => {
      renderWithApp(<SignUpScreen />);

      expect(await findText(enCopy('auth.joinStudents'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getAllByText(enCopy('auth.createAccount'))[1]);
      });

      expect(await findText(enCopy('auth.nameRequired'))).toBeTruthy();
      expect(screen.getByText(enCopy('auth.emailRequired'))).toBeTruthy();
    });

    it('submits sign up and navigates to tabs when auth returns a session', async () => {
      renderWithApp(<SignUpScreen />);

      expect(await findText(enCopy('auth.joinStudents'))).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.namePlaceholder')), 'Alex');
      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.emailPlaceholder')), 'new@example.com');
      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.createPasswordPlaceholder')), 'secret12');
      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.confirmPasswordPlaceholder')), 'secret12');

      await act(async () => {
        fireEvent.press(screen.getAllByText(enCopy('auth.createAccount'))[1]);
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('Forgot password', () => {
    it('shows email validation error', async () => {
      renderWithApp(<ForgotPasswordScreen />);

      expect(await findText(enCopy('auth.sendResetLink'))).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.sendResetLink')));
      });

      expect(await findText(enCopy('auth.emailRequired'))).toBeTruthy();
    });

    it('opens password reset and shows success state', async () => {
      renderWithApp(<ForgotPasswordScreen />);

      expect(await findText(enCopy('auth.sendResetLink'))).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText(enCopy('auth.emailPlaceholder')), 'recover@example.com');

      await act(async () => {
        fireEvent.press(screen.getByText(enCopy('auth.sendResetLink')));
      });

      await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalled();
      });

      expect(await findText(enCopy('auth.checkEmailTitle'))).toBeTruthy();
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
