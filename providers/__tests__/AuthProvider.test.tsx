import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthProvider';
import { supabase } from '@/lib/supabase';

// Mock Cognito session
const mockCognitoSession = {
  tokens: {
    idToken: 'mock-id-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  },
  user: {
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  },
};

jest.mock('@/lib/cognito', () => ({
  isCognitoConfigured: jest.fn(() => true),
  cognitoSignIn: jest.fn(),
  cognitoSignUp: jest.fn(),
  cognitoSignOut: jest.fn().mockResolvedValue(undefined),
  cognitoForgotPassword: jest.fn(),
  cognitoSocialSignIn: jest.fn(),
  getCognitoSession: jest.fn().mockResolvedValue(null),
  CognitoError: class CognitoError extends Error {},
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { getCognitoSession } = require('@/lib/cognito');
    (getCognitoSession as jest.Mock).mockResolvedValue(null);
  });

  describe('Authentication State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('should set isAuthenticated to false when no session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should set isAuthenticated to true when Cognito session exists', async () => {
      const { getCognitoSession } = require('@/lib/cognito');
      (getCognitoSession as jest.Mock).mockResolvedValue(mockCognitoSession);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user-123',
                name: 'Test User',
                avatar: 'https://example.com/avatar.png',
                created_at: '2024-01-01',
                is_public: true,
              },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe('user-123');
      expect(result.current.profile?.name).toBe('Test User');
    });
  });

  describe('Sign Up', () => {
    it('should successfully sign up a new user via Cognito', async () => {
      const { cognitoSignUp } = require('@/lib/cognito');
      (cognitoSignUp as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signUp(
        'newuser@example.com',
        'password123',
        'New User'
      );

      expect(response.error).toBeNull();
      expect(response.session).toBeNull(); // email verification required
      expect(cognitoSignUp).toHaveBeenCalledWith('newuser@example.com', 'password123', 'New User');
    });

    it('should handle sign up errors', async () => {
      const { cognitoSignUp, CognitoError } = require('@/lib/cognito');
      (cognitoSignUp as jest.Mock).mockRejectedValue(new CognitoError('Email already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signUp(
        'existing@example.com',
        'password123',
        'User'
      );

      expect(response.error?.message).toBe('Email already exists');
      expect(response.session).toBeNull();
    });
  });

  describe('Sign In', () => {
    it('should successfully sign in a user via Cognito', async () => {
      const { cognitoSignIn } = require('@/lib/cognito');
      (cognitoSignIn as jest.Mock).mockResolvedValue(mockCognitoSession);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signIn('user@example.com', 'password123');

      expect(response.error).toBeNull();
      expect(cognitoSignIn).toHaveBeenCalledWith('user@example.com', 'password123');
    });

    it('should handle sign in errors', async () => {
      const { cognitoSignIn, CognitoError } = require('@/lib/cognito');
      (cognitoSignIn as jest.Mock).mockRejectedValue(new CognitoError('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signIn('user@example.com', 'wrongpassword');

      expect(response.error?.message).toBe('Invalid credentials');
    });
  });

  describe('Sign Out', () => {
    it('should successfully sign out a user', async () => {
      const { cognitoSignOut } = require('@/lib/cognito');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(cognitoSignOut).toHaveBeenCalled();
      expect(result.current.profile).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('Onboarding', () => {
    it('should check onboarding status on init', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@medvba_onboarding_complete') {
          return Promise.resolve('true');
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    it('should complete onboarding', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@medvba_onboarding_complete', 'true');
      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    it('should reset onboarding', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => { await result.current.completeOnboarding(); });
      expect(result.current.hasCompletedOnboarding).toBe(true);

      await act(async () => { await result.current.resetOnboarding(); });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@medvba_onboarding_complete');
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset via Cognito', async () => {
      const { cognitoForgotPassword } = require('@/lib/cognito');
      (cognitoForgotPassword as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.resetPassword('user@example.com');

      expect(response.error).toBeNull();
      expect(cognitoForgotPassword).toHaveBeenCalledWith('user@example.com');
    });
  });
});
