import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import createContextHook from '@nkzw/create-context-hook';
import Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENT_ID, FREE_AI_LIMIT, FREE_QUIZ_ANSWER_LIMIT } from '@/constants/subscription';
import { isAppReviewPremiumEmail } from '@/lib/app-review-premium';
import { useAuth } from '@/providers/AuthProvider';
import { useUpdateSubscription } from '@/lib/supabase-hooks';
import { log } from '@/lib/log';
import { trpc } from '@/lib/trpc';

/** Per-calendar-day free quiz answers used toward paywall; scoped per user id when logged in. */
const FREE_QUIZ_DAILY_KEY_PREFIX = 'medvba_free_quiz_answers_daily_v1_';

function freeQuizAnswersDailyStorageKey(userId: string, dateKey: string): string {
  return `${FREE_QUIZ_DAILY_KEY_PREFIX}${userId}_${dateKey}`;
}

function getPaywallConfig() {
  const extra = Constants.expoConfig?.extra ?? (Constants as any)?.manifest?.extra ?? {};
  const paywallEnabled = String(extra.EXPO_PUBLIC_PAYWALL_ENABLED ?? 'true') === 'true';
  const apiKeyIos = extra.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS as string | undefined;
  const apiKeyAndroid = extra.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID as string | undefined;
  const apiKey = Platform.OS === 'ios' ? apiKeyIos : apiKeyAndroid;
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  // Allow paywall on web for testing (shows "Download app" message; no real purchases)
  return { paywallEnabled: paywallEnabled, apiKey: apiKey ?? '', isNative };
}

type OfferingPackage = {
  identifier: string;
  product: {
    priceString: string;
    title?: string;
  };
};

type Offerings = {
  availablePackages: OfferingPackage[];
} | null;

function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

interface SubscriptionState {
  isPremium: boolean;
  freeQuizzesToday: number;
  /** Legacy AsyncStorage counter (device-global, unused for paywall). */
  freeQuestionsAnsweredToday: number;
  /** Today's count toward FREE_QUIZ_ANSWER_LIMIT (all chapters; resets each calendar day). */
  freeQuestionsAnsweredTotal: number;
  /** When paywall is on: count of free AI messages already used in the server rolling window (synced via tRPC). When off: legacy calendar-day cache from AsyncStorage. */
  freeAiQuestionsToday: number;
  isLoading: boolean;
  offerings: Offerings;
}

function isPremiumFromCustomerInfo(info: CustomerInfo | null): boolean {
  if (!info?.entitlements?.active) return false;
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

function inferSubscriptionTypeFromCustomerInfo(info: CustomerInfo | null): 'yearly' | 'monthly' {
  const ent = info?.entitlements?.active?.[ENTITLEMENT_ID] as { productIdentifier?: string } | undefined;
  const pid = String(ent?.productIdentifier ?? '').toLowerCase();
  if (
    pid.includes('annual') ||
    pid.includes('year') ||
    pid.includes('yearly') ||
    pid === '$rc_annual'
  ) {
    return 'yearly';
  }
  return 'monthly';
}

function isRevenueCatConfigurationError(error: unknown): boolean {
  const message = String((error as any)?.message ?? error ?? '');
  const code = String((error as any)?.code ?? '');
  return (
    code.includes('ConfigurationError') ||
    message.includes('ConfigurationError') ||
    message.includes('There\'s a problem with your configuration') ||
    message.includes('could be fetched from the Play Store')
  );
}

/** RevenueCat closes TestFlight/App Store builds that call configure() with a test_ API key. */
function isRevenueCatTestApiKeyInRelease(apiKey: string): boolean {
  return !__DEV__ && apiKey.trim().toLowerCase().startsWith('test_');
}

function isRevenueCatWrongPlatformApiKeyInRelease(apiKey: string): boolean {
  if (__DEV__) return false;
  const k = apiKey.trim().toLowerCase();
  if (Platform.OS === 'ios') return k.startsWith('goog_') || k.startsWith('amzn_');
  if (Platform.OS === 'android') return k.startsWith('appl_');
  return false;
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const { paywallEnabled: PAYWALL_ENABLED, apiKey: REVENUECAT_API_KEY, isNative: IS_NATIVE } = useMemo(getPaywallConfig, []);
  const revenueCatUsable =
    Boolean(REVENUECAT_API_KEY) &&
    !isRevenueCatTestApiKeyInRelease(REVENUECAT_API_KEY) &&
    !isRevenueCatWrongPlatformApiKeyInRelease(REVENUECAT_API_KEY);
  const { user } = useAuth();
  const isReviewPremiumAccount = isAppReviewPremiumEmail(user?.email);
  const updateSubscriptionMutation = useUpdateSubscription();
  const updateSubscriptionMutateAsyncRef = useRef(updateSubscriptionMutation.mutateAsync);
  updateSubscriptionMutateAsyncRef.current = updateSubscriptionMutation.mutateAsync;
  const trpcUtils = trpc.useUtils();
  const syncSubscriptionServer = trpc.subscription.syncFromClient.useMutation();

  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    freeQuizzesToday: 0,
    freeQuestionsAnsweredToday: 0,
    freeQuestionsAnsweredTotal: 0,
    freeAiQuestionsToday: 0,
    isLoading: true,
    offerings: null,
  });

  const hasPremiumAccess = state.isPremium || isReviewPremiumAccount;

  const currentOfferingRef = useRef<any>(null);
  const didLogRevenueCatConfigErrorRef = useRef(false);
  const revenueCatConfiguredRef = useRef(false);
  const revenueCatListenerRef = useRef<((info: CustomerInfo) => void) | null>(null);
  /** Profile id last passed to RevenueCat logIn (skip logOut when already anonymous). */
  const lastRevenueCatUserIdRef = useRef<string | null>(null);
  /** Debounced Supabase sync signature (premium:monthly | free). */
  const lastSyncedSignatureRef = useRef<string | null>(null);
  const premiumSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReportedPremiumRef = useRef<boolean | null>(null);
  /** Supabase grant / server premium (e.g. App Review demo) when RevenueCat has no IAP yet. */
  const serverGrantedPremiumRef = useRef(false);

  const todayKey = getTodayKey();

  const loadSubscriptionUsage = useCallback(async () => {
    try {
      log.debug('[Subscription] Loading subscription usage for', todayKey, 'user', user?.id ?? '(none)');

      const [quizCount, questionsAnsweredCount, aiCountRaw, paywallDailyRaw] = await Promise.all([
        AsyncStorage.getItem(`free_quiz_count_${todayKey}`),
        AsyncStorage.getItem(`free_questions_answered_${todayKey}`),
        PAYWALL_ENABLED
          ? Promise.resolve(null)
          : AsyncStorage.getItem(`free_ai_questions_${todayKey}`),
        user?.id ? AsyncStorage.getItem(freeQuizAnswersDailyStorageKey(user.id, todayKey)) : Promise.resolve(null),
      ]);

      let freeQuestionsAnsweredTotal = 0;
      if (user?.id) {
        if (paywallDailyRaw != null && paywallDailyRaw !== '') {
          freeQuestionsAnsweredTotal = Math.max(0, parseInt(paywallDailyRaw, 10) || 0);
        } else {
          const legacyLifetimeRaw = await AsyncStorage.getItem(`medvba_free_quiz_answers_total_v1_${user.id}`);
          if (legacyLifetimeRaw != null && legacyLifetimeRaw !== '') {
            freeQuestionsAnsweredTotal = Math.min(
              FREE_QUIZ_ANSWER_LIMIT,
              Math.max(0, parseInt(legacyLifetimeRaw, 10) || 0),
            );
            await AsyncStorage.setItem(
              freeQuizAnswersDailyStorageKey(user.id, todayKey),
              String(freeQuestionsAnsweredTotal),
            );
            await AsyncStorage.removeItem(`medvba_free_quiz_answers_total_v1_${user.id}`);
          }
        }
      }

      setState((prev) => ({
        ...prev,
        freeQuizzesToday: quizCount ? parseInt(quizCount, 10) : 0,
        freeQuestionsAnsweredToday: questionsAnsweredCount ? parseInt(questionsAnsweredCount, 10) : 0,
        freeAiQuestionsToday: PAYWALL_ENABLED ? 0 : (aiCountRaw ? parseInt(aiCountRaw, 10) : 0),
        freeQuestionsAnsweredTotal,
        ...(prev.isLoading && !PAYWALL_ENABLED ? { isLoading: false } : {}),
      }));

      log.debug(
        '[Subscription] Loaded usage — quizStartsToday:',
        quizCount || 0,
        'freePaywallAnswersToday:',
        freeQuestionsAnsweredTotal,
        'AI:',
        PAYWALL_ENABLED ? '(server sync)' : aiCountRaw || 0,
      );
    } catch (error) {
      log.error('[Subscription] Error loading subscription usage:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [todayKey, PAYWALL_ENABLED, user?.id]);

  useEffect(() => {
    void loadSubscriptionUsage();
  }, [loadSubscriptionUsage]);

  useEffect(() => {
    serverGrantedPremiumRef.current = false;
    lastSyncedSignatureRef.current = null;
    lastReportedPremiumRef.current = null;
    setState((prev) => ({
      ...prev,
      isPremium: false,
      freeAiQuestionsToday: 0,
      freeQuestionsAnsweredTotal: 0,
    }));
    if (premiumSyncDebounceRef.current) {
      clearTimeout(premiumSyncDebounceRef.current);
      premiumSyncDebounceRef.current = null;
    }
  }, [user?.id]);

  const canStartQuiz = useCallback((): boolean => {
    if (!PAYWALL_ENABLED) return true;
    if (hasPremiumAccess) return true;
    if (!user?.id) return false;
    return state.freeQuestionsAnsweredTotal < FREE_QUIZ_ANSWER_LIMIT;
  }, [PAYWALL_ENABLED, hasPremiumAccess, state.freeQuestionsAnsweredTotal, user?.id]);

  const canAskAiQuestion = useCallback((): boolean => {
    if (!PAYWALL_ENABLED) return true;
    if (hasPremiumAccess) return true;
    return state.freeAiQuestionsToday < FREE_AI_LIMIT;
  }, [PAYWALL_ENABLED, hasPremiumAccess, state.freeAiQuestionsToday]);

  const incrementQuizCount = useCallback(async (): Promise<boolean> => {
    if (!PAYWALL_ENABLED) {
      log.debug('[Subscription] Paywall disabled - skipping quiz limit');
      return true;
    }
    if (hasPremiumAccess) {
      log.debug('[Subscription] Premium user - no quiz limit');
      return true;
    }
    if (!user?.id) {
      log.debug('[Subscription] No user id - cannot start counted free quiz');
      return false;
    }

    if (state.freeQuestionsAnsweredTotal >= FREE_QUIZ_ANSWER_LIMIT) {
      log.debug('[Subscription] Daily free quiz answer limit reached');
      return false;
    }

    return true;
  }, [PAYWALL_ENABLED, hasPremiumAccess, state.freeQuestionsAnsweredTotal, user?.id]);

  const incrementQuestionAnsweredCount = useCallback(async (): Promise<boolean> => {
    if (!PAYWALL_ENABLED) {
      return true;
    }
    if (hasPremiumAccess) {
      return true;
    }

    if (!user?.id) {
      log.warn('[Subscription] incrementQuestionAnsweredCount: no user id; refusing free-tier increment');
      return false;
    }

    const newTotal = state.freeQuestionsAnsweredTotal + 1;
    try {
      const key = freeQuizAnswersDailyStorageKey(user.id, todayKey);
      await AsyncStorage.setItem(key, String(newTotal));
      setState((prev) => ({ ...prev, freeQuestionsAnsweredTotal: newTotal }));
      log.debug('[Subscription] Free quiz answers for today incremented to', newTotal);
      return newTotal <= FREE_QUIZ_ANSWER_LIMIT;
    } catch (error) {
      log.error('[Subscription] Error incrementing free quiz daily count:', error);
      return true;
    }
  }, [PAYWALL_ENABLED, hasPremiumAccess, state.freeQuestionsAnsweredTotal, user?.id, todayKey]);

  const validateAiQuestionMutation = trpc.subscription.validateAiQuestion.useMutation();
  const validateAiMutateAsyncRef = useRef(validateAiQuestionMutation.mutateAsync);
  validateAiMutateAsyncRef.current = validateAiQuestionMutation.mutateAsync;

  const getRemainingQuizzes = useCallback((): number => {
    if (!PAYWALL_ENABLED) return Infinity;
    if (hasPremiumAccess) return Infinity;
    if (!user?.id) return 0;
    return Math.max(0, FREE_QUIZ_ANSWER_LIMIT - state.freeQuestionsAnsweredTotal);
  }, [PAYWALL_ENABLED, hasPremiumAccess, state.freeQuestionsAnsweredTotal, user?.id]);

  const getRemainingAiQuestions = useCallback((): number => {
    if (!PAYWALL_ENABLED) return Infinity;
    if (hasPremiumAccess) return Infinity;
    return Math.max(0, FREE_AI_LIMIT - state.freeAiQuestionsToday);
  }, [PAYWALL_ENABLED, hasPremiumAccess, state.freeAiQuestionsToday]);

  const syncAiQuestionCountFromServer = useCallback(async (): Promise<void> => {
    if (!PAYWALL_ENABLED) return;

    try {
      const result = await validateAiMutateAsyncRef.current({ increment: false });
      if (result.isPremium) {
        serverGrantedPremiumRef.current = true;
        setState((prev) => ({
          ...prev,
          isPremium: true,
          freeAiQuestionsToday: 0,
        }));
        invalidateStudyQueriesRef.current();
        return;
      }
      const remaining = result.remaining;
      if (typeof remaining !== 'number' || remaining < 0) {
        setState((prev) => ({ ...prev, freeAiQuestionsToday: 0 }));
        return;
      }
      const serverCount = Math.min(FREE_AI_LIMIT, Math.max(0, FREE_AI_LIMIT - remaining));
      setState((prev) => ({ ...prev, freeAiQuestionsToday: serverCount }));
      log.debug('[Subscription] Synced AI count from server:', serverCount);
    } catch (error) {
      log.debug('[Subscription] Could not sync AI count from server');
    }
  }, [PAYWALL_ENABLED]);

  /** Paywall on: sync server premium + AI usage when user logs in (includes App Review grants). */
  useEffect(() => {
    if (!PAYWALL_ENABLED || !user?.id) return;
    void syncAiQuestionCountFromServer();
  }, [PAYWALL_ENABLED, user?.id, syncAiQuestionCountFromServer]);

  const invalidateStudyQueries = useCallback(() => {
    void trpcUtils.study.listChapters.invalidate();
    void trpcUtils.study.getChapter.invalidate();
    void trpcUtils.study.listModules.invalidate();
  }, [trpcUtils]);

  const syncPremiumToSupabase = useCallback(
    (type: 'yearly' | 'monthly') => {
      if (!user?.id) return;
      syncSubscriptionServer
        .mutateAsync({ status: 'premium', type })
        .catch((err) => {
          log.warn('[Subscription] Server premium sync failed, trying client upsert:', err);
          return updateSubscriptionMutateAsyncRef.current({
            userId: user.id,
            status: 'premium',
            type,
          });
        })
        .catch((clientErr) => {
          log.warn('[Subscription] Client premium sync failed:', clientErr);
        });
    },
    [user?.id, syncSubscriptionServer],
  );

  const syncFreeToSupabase = useCallback(() => {
    if (!user?.id) return;
    updateSubscriptionMutateAsyncRef
      .current({ userId: user.id, status: 'free', type: null, expiresAt: null })
      .catch((err) => {
        log.warn('[Subscription] Supabase free-tier sync failed:', err);
      });
  }, [user?.id]);

  const syncPremiumToSupabaseRef = useRef(syncPremiumToSupabase);
  syncPremiumToSupabaseRef.current = syncPremiumToSupabase;
  const syncFreeToSupabaseRef = useRef(syncFreeToSupabase);
  syncFreeToSupabaseRef.current = syncFreeToSupabase;
  const invalidateStudyQueriesRef = useRef(invalidateStudyQueries);
  invalidateStudyQueriesRef.current = invalidateStudyQueries;

  const scheduleRevenueCatSupabaseSync = useCallback(
    (info: CustomerInfo) => {
      if (!PAYWALL_ENABLED || !user?.id) return;

      const premium = isPremiumFromCustomerInfo(info);
      if (!premium && (isReviewPremiumAccount || serverGrantedPremiumRef.current)) {
        return;
      }
      const signature = premium
        ? `premium:${inferSubscriptionTypeFromCustomerInfo(info)}`
        : 'free';

      if (lastSyncedSignatureRef.current === signature) return;

      if (premiumSyncDebounceRef.current) {
        clearTimeout(premiumSyncDebounceRef.current);
      }

      premiumSyncDebounceRef.current = setTimeout(() => {
        premiumSyncDebounceRef.current = null;
        if (lastSyncedSignatureRef.current === signature) return;
        lastSyncedSignatureRef.current = signature;

        if (premium) {
          syncPremiumToSupabaseRef.current(inferSubscriptionTypeFromCustomerInfo(info));
        } else {
          syncFreeToSupabaseRef.current();
        }
      }, 800);
    },
    [PAYWALL_ENABLED, user?.id, isReviewPremiumAccount],
  );

  const scheduleRevenueCatSupabaseSyncRef = useRef(scheduleRevenueCatSupabaseSync);
  scheduleRevenueCatSupabaseSyncRef.current = scheduleRevenueCatSupabaseSync;

  const handleCustomerInfo = useCallback((info: CustomerInfo) => {
    const rcPremium = isPremiumFromCustomerInfo(info);
    const premium = rcPremium || serverGrantedPremiumRef.current || isReviewPremiumAccount;
    const prevPremium = lastReportedPremiumRef.current;
    lastReportedPremiumRef.current = premium;

    setState((prev) => (prev.isPremium === premium ? prev : { ...prev, isPremium: premium }));

    if ((prevPremium !== null && prevPremium !== premium) || (prevPremium === null && premium)) {
      invalidateStudyQueriesRef.current();
    }

    scheduleRevenueCatSupabaseSyncRef.current(info);
  }, [isReviewPremiumAccount]);

  const handleCustomerInfoRef = useRef(handleCustomerInfo);
  handleCustomerInfoRef.current = handleCustomerInfo;

  useEffect(() => {
    if (!PAYWALL_ENABLED || !REVENUECAT_API_KEY) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    if (!revenueCatUsable) {
      if (!didLogRevenueCatConfigErrorRef.current) {
        didLogRevenueCatConfigErrorRef.current = true;
        log.warn(
          '[Subscription] RevenueCat API key invalid for this platform/release — skipping Purchases.configure. iOS TestFlight needs appl_… (not test_ or goog_) in EAS production; run npm run check:revenuecat-ios.',
        );
      }
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    if (!IS_NATIVE) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    let listener: ((info: CustomerInfo) => void) | null = null;

    const initRevenueCat = async () => {
      try {
        if (!revenueCatConfiguredRef.current) {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          revenueCatConfiguredRef.current = true;
        }

        if (user?.id) {
          if (lastRevenueCatUserIdRef.current !== user.id) {
            const { customerInfo } = await Purchases.logIn(user.id);
            lastRevenueCatUserIdRef.current = user.id;
            handleCustomerInfoRef.current(customerInfo);
          }
        } else if (lastRevenueCatUserIdRef.current) {
          try {
            await Purchases.logOut();
          } catch {
            /* already anonymous */
          }
          lastRevenueCatUserIdRef.current = null;
          lastSyncedSignatureRef.current = null;
          lastReportedPremiumRef.current = null;
        }

        try {
          const offerings = await Purchases.getOfferings();
          const current = offerings.current;
          if (current?.availablePackages?.length) {
            currentOfferingRef.current = current;
            const mapped: Offerings = {
              availablePackages: current.availablePackages.map((pkg: any) => ({
                identifier: pkg.identifier,
                product: {
                  priceString: pkg.product?.priceString ?? '',
                  title: pkg.product?.title ?? '',
                },
              })),
            };
            setState((prev) => ({ ...prev, offerings: mapped }));
          }
        } catch (offeringsError) {
          if (isRevenueCatConfigurationError(offeringsError)) {
            if (!didLogRevenueCatConfigErrorRef.current) {
              didLogRevenueCatConfigErrorRef.current = true;
              log.warn(
                '[Subscription] RevenueCat offerings unavailable (Play Console products/offerings). App works; purchases disabled until configured.',
              );
            }
          } else {
            log.warn('[Subscription] getOfferings failed:', offeringsError);
          }
        }

        const customerInfo = await Purchases.getCustomerInfo();
        handleCustomerInfoRef.current(customerInfo);
        setState((prev) => ({ ...prev, isLoading: false }));

        if (!revenueCatListenerRef.current) {
          listener = (info: CustomerInfo) => {
            handleCustomerInfoRef.current(info);
          };
          revenueCatListenerRef.current = listener;
          Purchases.addCustomerInfoUpdateListener(listener);
        }
      } catch (error) {
        if (isRevenueCatConfigurationError(error)) {
          if (!didLogRevenueCatConfigErrorRef.current) {
            didLogRevenueCatConfigErrorRef.current = true;
            log.warn(
              '[Subscription] RevenueCat configuration incomplete. Purchases disabled until Play products/offerings are ready.',
            );
          }
        } else {
          log.error('[Subscription] RevenueCat init error:', error);
        }
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    void initRevenueCat();

    return () => {
      if (premiumSyncDebounceRef.current) {
        clearTimeout(premiumSyncDebounceRef.current);
        premiumSyncDebounceRef.current = null;
      }
    };
  }, [PAYWALL_ENABLED, REVENUECAT_API_KEY, revenueCatUsable, IS_NATIVE, user?.id]);

  /** Refresh entitlement when app returns to foreground (purchase outside app, family sharing, etc.). */
  useEffect(() => {
    if (!PAYWALL_ENABLED || !revenueCatUsable || !IS_NATIVE || !user?.id) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      void (async () => {
        try {
          if (!revenueCatConfiguredRef.current) return;
          const customerInfo = await Purchases.getCustomerInfo();
          lastSyncedSignatureRef.current = null;
          handleCustomerInfoRef.current(customerInfo);
        } catch {
          /* non-fatal */
        }
      })();
    });

    return () => sub.remove();
  }, [PAYWALL_ENABLED, revenueCatUsable, IS_NATIVE, user?.id]);

  const purchasePackage = useCallback(
    async (packageId: string): Promise<boolean> => {
      if (!PAYWALL_ENABLED || !revenueCatUsable) {
        log.debug('[Subscription] Purchases disabled (paywall or API key missing).');
        return false;
      }

      const offering = currentOfferingRef.current;
      if (!offering?.availablePackages?.length) {
        log.warn('[Subscription] No offerings available for purchase.');
        return false;
      }

      const pkg = offering.availablePackages.find((p: any) => p.identifier === packageId);
      if (!pkg) {
        log.warn('[Subscription] Package not found:', packageId);
        return false;
      }

      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const premium = isPremiumFromCustomerInfo(customerInfo);
        if (premium) {
          const isYearly =
            packageId === '$rc_annual' ||
            packageId === 'yearly' ||
            String(packageId).toLowerCase().includes('annual');
          lastSyncedSignatureRef.current = null;
          handleCustomerInfoRef.current(customerInfo);
          syncPremiumToSupabase(isYearly ? 'yearly' : 'monthly');
        }
        return premium;
      } catch (error: any) {
        const isCancel = error?.userCancelled === true;
        if (!isCancel) {
          log.error('[Subscription] Purchase error:', error);
        }
        return false;
      }
    },
    [PAYWALL_ENABLED, revenueCatUsable, syncPremiumToSupabase]
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!PAYWALL_ENABLED || !revenueCatUsable) {
      log.debug('[Subscription] Restore disabled (paywall or API key missing).');
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      lastSyncedSignatureRef.current = null;
      handleCustomerInfoRef.current(customerInfo);
      return isPremiumFromCustomerInfo(customerInfo);
    } catch (error) {
      log.error('[Subscription] Restore error:', error);
      return false;
    }
  }, [PAYWALL_ENABLED, revenueCatUsable]);

  const effectivePremium = !PAYWALL_ENABLED || hasPremiumAccess;

  useEffect(() => {
    if (!isReviewPremiumAccount || !user?.id) return;
    invalidateStudyQueries();
    log.debug('[Subscription] App review premium account — study queries invalidated');
  }, [isReviewPremiumAccount, user?.id, invalidateStudyQueries]);

  return useMemo(
    () => ({
      isPremium: effectivePremium,
      isPaywallEnabled: PAYWALL_ENABLED,
      isLoading: state.isLoading,
      freeQuizzesToday: state.freeQuizzesToday,
      freeQuestionsAnsweredToday: state.freeQuestionsAnsweredToday,
      freeQuestionsAnsweredTotal: state.freeQuestionsAnsweredTotal,
      freeAiQuestionsToday: state.freeAiQuestionsToday,
      offerings: state.offerings,
      canStartQuiz,
      canAskAiQuestion,
      incrementQuizCount,
      incrementQuestionAnsweredCount,
      getRemainingQuizzes,
      getRemainingAiQuestions,
      purchasePackage,
      restorePurchases,
      syncAiQuestionCountFromServer,
      FREE_QUIZ_LIMIT: FREE_QUIZ_ANSWER_LIMIT,
      FREE_AI_LIMIT,
    }),
    [
      effectivePremium,
      isReviewPremiumAccount,
      PAYWALL_ENABLED,
      state.isLoading,
      state.freeQuizzesToday,
      state.freeQuestionsAnsweredToday,
      state.freeQuestionsAnsweredTotal,
      state.freeAiQuestionsToday,
      state.offerings,
      canStartQuiz,
      canAskAiQuestion,
      incrementQuizCount,
      incrementQuestionAnsweredCount,
      getRemainingQuizzes,
      getRemainingAiQuestions,
      purchasePackage,
      restorePurchases,
      syncAiQuestionCountFromServer,
    ]
  );
});
