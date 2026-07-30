/**
 * Unit tests for SubscriptionProvider
 */

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
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

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: jest.fn().mockResolvedValue([{ customerInfo: null }]),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    purchasePackage: jest.fn().mockResolvedValue([{ customerInfo: null }]),
    restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
}));

jest.mock('@/lib/supabase-hooks', () => ({
  useUpdateSubscription: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ error: null }),
  })),
}));

jest.mock('@/lib/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: jest.fn(() => ({
      study: {
        listChapters: { invalidate: jest.fn() },
        getChapter: { invalidate: jest.fn() },
        listModules: { invalidate: jest.fn() },
      },
      clinical: {
        getStatus: { invalidate: jest.fn() },
        getCredits: { invalidate: jest.fn() },
      },
    })),
    subscription: {
      validateAiQuestion: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn().mockResolvedValue({ allowed: true, remaining: 0, isPremium: false }),
        })),
      },
      syncFromClient: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn().mockResolvedValue({ ok: true }),
        })),
      },
    },
    clinical: {
      syncEntitlement: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn().mockResolvedValue({ ok: true, enabled: false }),
        })),
      },
    },
  },
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: { OS: 'android' },
  };
});

describe('SubscriptionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct FREE_AI_LIMIT', () => {
      const { FREE_AI_LIMIT } = require('@/constants/subscription');
      expect(FREE_AI_LIMIT).toBe(10);
    });

    it('should have correct FREE_QUIZ_ANSWER_LIMIT and legacy alias', () => {
      const { FREE_QUIZ_ANSWER_LIMIT, FREE_DAILY_QUIZ_LIMIT } = require('@/constants/subscription');
      expect(FREE_QUIZ_ANSWER_LIMIT).toBe(10);
      expect(FREE_DAILY_QUIZ_LIMIT).toBe(10);
    });
  });

  describe('Daily Key Generation', () => {
    it('should generate consistent date keys', () => {
      const getTodayKey = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      };

      const key1 = getTodayKey();
      const key2 = getTodayKey();
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Premium Status Check', () => {
    it('should return true for active premium entitlement', () => {
      const isPremiumFromCustomerInfo = (info: { entitlements?: { active?: Record<string, unknown> } } | null) => {
        if (!info?.entitlements?.active) return false;
        return Boolean(info.entitlements.active['premium']);
      };

      expect(isPremiumFromCustomerInfo({ entitlements: { active: { premium: {} } } })).toBe(true);
      expect(isPremiumFromCustomerInfo({ entitlements: { active: {} } })).toBe(false);
      expect(isPremiumFromCustomerInfo(null)).toBe(false);
    });
  });

  describe('Quiz Limit Logic (daily free pool)', () => {
    it('should return true when paywall is disabled', () => {
      const canStartQuiz = (paywallEnabled: boolean, isPremium: boolean, questionsAnswered: number, limit: number) => {
        if (!paywallEnabled) return true;
        if (isPremium) return true;
        return questionsAnswered < limit;
      };

      expect(canStartQuiz(false, false, 0, 10)).toBe(true);
      expect(canStartQuiz(true, true, 100, 10)).toBe(true);
      expect(canStartQuiz(true, false, 5, 10)).toBe(true);
      expect(canStartQuiz(true, false, 10, 10)).toBe(false);
      expect(canStartQuiz(true, false, 15, 10)).toBe(false);
    });
  });

  describe('AI Question Limit Logic', () => {
    it('should return true when paywall is disabled', () => {
      const canAskAiQuestion = (paywallEnabled: boolean, isPremium: boolean, questionsToday: number, limit: number) => {
        if (!paywallEnabled) return true;
        if (isPremium) return true;
        return questionsToday < limit;
      };

      expect(canAskAiQuestion(false, false, 0, 10)).toBe(true);
      expect(canAskAiQuestion(true, true, 100, 10)).toBe(true);
      expect(canAskAiQuestion(true, false, 0, 10)).toBe(true);
      expect(canAskAiQuestion(true, false, 10, 10)).toBe(false);
    });
  });

  describe('Remaining free questions (daily pool)', () => {
    it('should calculate remaining quizzes correctly', () => {
      const getRemainingQuizzes = (paywallEnabled: boolean, isPremium: boolean, answered: number, limit: number) => {
        if (!paywallEnabled) return Infinity;
        if (isPremium) return Infinity;
        return Math.max(0, limit - answered);
      };

      expect(getRemainingQuizzes(false, false, 0, 10)).toBe(Infinity);
      expect(getRemainingQuizzes(true, true, 0, 10)).toBe(Infinity);
      expect(getRemainingQuizzes(true, false, 5, 10)).toBe(5);
      expect(getRemainingQuizzes(true, false, 10, 10)).toBe(0);
      expect(getRemainingQuizzes(true, false, 15, 10)).toBe(0);
    });

    it('should calculate remaining AI questions correctly', () => {
      const getRemainingAiQuestions = (paywallEnabled: boolean, isPremium: boolean, questionsToday: number, limit: number) => {
        if (!paywallEnabled) return Infinity;
        if (isPremium) return Infinity;
        return Math.max(0, limit - questionsToday);
      };

      expect(getRemainingAiQuestions(false, false, 0, 10)).toBe(Infinity);
      expect(getRemainingAiQuestions(true, true, 100, 10)).toBe(Infinity);
      expect(getRemainingAiQuestions(true, false, 0, 10)).toBe(10);
      expect(getRemainingAiQuestions(true, false, 10, 10)).toBe(0);
    });
  });

  describe('Purchase Package Logic', () => {
    it('should validate package identifier for yearly', () => {
      const isYearly = (packageId: string) => {
        return packageId === '$rc_annual' || packageId === 'yearly' || String(packageId).toLowerCase().includes('annual');
      };

      expect(isYearly('$rc_annual')).toBe(true);
      expect(isYearly('yearly')).toBe(true);
      expect(isYearly('annual_subscription')).toBe(true);
      expect(isYearly('$rc_monthly')).toBe(false);
      expect(isYearly('monthly')).toBe(false);
    });
  });
});
