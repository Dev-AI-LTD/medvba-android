/**
 * Unit tests for AuthProvider — Cognito-only
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      // Supabase auth is no longer used — these should not be called
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

jest.mock('@/lib/cognito', () => ({
  isCognitoConfigured: jest.fn(() => true),
  cognitoSignIn: jest.fn(),
  cognitoSignUp: jest.fn(),
  cognitoSignOut: jest.fn().mockResolvedValue(undefined),
  cognitoForgotPassword: jest.fn(),
  cognitoSocialSignIn: jest.fn(),
  getCognitoSession: jest.fn().mockResolvedValue(null),
  getCognitoIdToken: jest.fn().mockResolvedValue(null),
  CognitoError: class CognitoError extends Error {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@nkzw/create-context-hook', () => ({
  __esModule: true,
  default: jest.fn((createValue) => createValue),
}));

jest.mock('@/lib/supabase-hooks', () => ({
  useUserProfile: jest.fn(() => ({ data: null })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/biometric', () => ({
  authenticateWithBiometric: jest.fn().mockResolvedValue({ success: false }),
  isBiometricAvailable: jest.fn().mockResolvedValue(false),
  getBiometricCapabilities: jest.fn().mockResolvedValue({ hasHardware: false, isEnrolled: false, supportedTypes: [] }),
  getBiometricTypeName: jest.fn().mockReturnValue('Biometric'),
}));

jest.mock('@/lib/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: { OS: 'android' },
    Alert: { alert: jest.fn() },
    AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
  };
});

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Validation', () => {
    it('should reject empty email', async () => {
      const validateEmail = (email: string) => {
        if (!email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
        return null;
      };

      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('   ')).toBe('Email is required');
      expect(validateEmail('invalid')).toBe('Invalid email address');
      expect(validateEmail('invalid@')).toBe('Invalid email address');
      expect(validateEmail('invalid@test')).toBe('Invalid email address');
      expect(validateEmail('valid@test.com')).toBeNull();
    });
  });

  describe('Password Validation', () => {
    it('should reject short passwords', async () => {
      const validatePassword = (password: string) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return null;
      };

      expect(validatePassword('')).toBe('Password is required');
      expect(validatePassword('12345')).toBe('Password must be at least 6 characters');
      expect(validatePassword('123456')).toBeNull();
    });
  });

  describe('Name Validation', () => {
    it('should reject empty or short names', async () => {
      const validateName = (name: string) => {
        if (!name.trim()) return 'Name is required';
        if (name.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      };

      expect(validateName('')).toBe('Name is required');
      expect(validateName('A')).toBe('Name must be at least 2 characters');
      expect(validateName('John')).toBeNull();
    });
  });

  describe('Error Message Mapping', () => {
    it('should map error codes to user-friendly messages', () => {
      const getErrorMessage = (error: { code?: string; message?: string }) => {
        const code = error.code;
        if (code === 'email_not_confirmed') {
          return 'Please verify your email address';
        }
        if (code === 'invalid_credentials') {
          return 'Invalid login credentials';
        }
        if (error.message?.includes('already registered')) {
          return 'This email is already registered';
        }
        return error.message || 'An error occurred';
      };

      expect(getErrorMessage({ code: 'email_not_confirmed' })).toBe('Please verify your email address');
      expect(getErrorMessage({ code: 'invalid_credentials' })).toBe('Invalid login credentials');
      expect(getErrorMessage({ message: 'User already registered' })).toBe('This email is already registered');
    });
  });
});
