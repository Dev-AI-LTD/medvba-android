import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTestProviders } from './testProviders';
import LoginScreen from '@/app/(auth)/login';
import SignUpScreen from '@/app/(auth)/signup';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import HomeScreen from '@/app/(tabs)/index';

const renderWithApp = (ui: React.ReactElement) =>
  render(<AppTestProviders>{ui}</AppTestProviders>);

const findText = (text: string | RegExp) =>
  screen.findByText(text, {}, { timeout: 15000 });

describe('User flows (integration-style)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@medvba_onboarding_complete') return Promise.resolve('true');
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  });

  describe('Login', () => {
    it('shows validation errors when submitting empty form', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText('Welcome Back')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText('Sign In'));
      });

      expect(await findText('Email is required')).toBeTruthy();
      expect(screen.getByText('Password is required')).toBeTruthy();
    });

    it('navigates to tabs after successful email login when onboarding is complete', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText('Welcome Back')).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'user@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'secret12');

      await act(async () => {
        fireEvent.press(screen.getByText('Sign In'));
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('navigates to forgot password', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText('Welcome Back')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText('Forgot Password?'));
      });

      expect(router.push).toHaveBeenCalledWith('/(auth)/forgot-password');
    });

    it('navigates to signup', async () => {
      renderWithApp(<LoginScreen />);

      expect(await findText('Welcome Back')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText('Sign Up'));
      });

      expect(router.push).toHaveBeenCalledWith('/(auth)/signup');
    });
  });

  describe('Sign up', () => {
    it('shows validation errors for empty form', async () => {
      renderWithApp(<SignUpScreen />);

      expect(await findText('Join thousands of students')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getAllByText('Create Account')[1]);
      });

      expect(await findText('Name is required')).toBeTruthy();
      expect(screen.getByText('Email is required')).toBeTruthy();
    });

    it('submits sign up and navigates to tabs when auth returns a session', async () => {
      renderWithApp(<SignUpScreen />);

      expect(await findText('Join thousands of students')).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText('Enter your name'), 'Alex');
      fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'new@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Create a password'), 'secret12');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm your password'), 'secret12');

      await act(async () => {
        fireEvent.press(screen.getAllByText('Create Account')[1]);
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('Forgot password', () => {
    it('shows email validation error', async () => {
      renderWithApp(<ForgotPasswordScreen />);

      expect(await findText('Send Reset Link')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText('Send Reset Link'));
      });

      expect(await findText('Email is required')).toBeTruthy();
    });

    it('opens password reset and shows success state', async () => {
      renderWithApp(<ForgotPasswordScreen />);

      expect(await findText('Send Reset Link')).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'recover@example.com');

      await act(async () => {
        fireEvent.press(screen.getByText('Send Reset Link'));
      });

      await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalled();
      });

      expect(await findText('Check Your Email')).toBeTruthy();
      expect(screen.getByText(/recover@example\.com/)).toBeTruthy();
    });
  });

  describe('Home dashboard', () => {
    it('renders continue learning hero and start quiz action', async () => {
      renderWithApp(<HomeScreen />);

      expect(await findText('Continue Learning')).toBeTruthy();
      expect(screen.getByText('Start Quiz')).toBeTruthy();
    });
  });
});
