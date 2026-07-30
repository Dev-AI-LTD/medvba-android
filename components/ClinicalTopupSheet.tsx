/**
 * Clinical Copilot top-up sheet (flag ON only).
 * Purchases via RevenueCat SDK; credits granted only by backend webhook / syncEntitlement.
 */

import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { trpc } from '@/lib/trpc';
import { trackClinicalEvent } from '@/lib/clinical-analytics';
import { purchaseCreditTopup } from '@/lib/revenuecat';
import { isClinicalCopilotUiEnabled } from '@/lib/clinical-copilot-flag';
import {
  radiusLg,
  radiusMd,
  screenPaddingX,
  space,
  typeScale,
} from '@/theme/iosDesign';
import type { AppColors } from '@/constants/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectProduct?: (productId: string, credits: number) => void;
};

const HINT_TO_PREFERRED_PRODUCT: Record<'50' | '100' | '250', string> = {
  '50': 'medvba_ai_credits_50',
  '100': 'medvba_ai_credits_100',
  '250': 'medvba_ai_credits_250',
};

export function ClinicalTopupSheet({ visible, onClose, onSelectProduct }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const intent = trpc.clinical.createTopupIntent.useMutation();
  const syncEntitlement = trpc.clinical.syncEntitlement.useMutation();
  const trpcUtils = trpc.useUtils();
  const [busyHint, setBusyHint] = useState<'50' | '100' | '250' | null>(null);

  const openPaywallFallback = () => {
    onClose();
    try {
      router.push('/paywall');
    } catch {
      /* ignore */
    }
  };

  const loadAndPick = async (hint: '50' | '100' | '250') => {
    if (busyHint) return;
    trackClinicalEvent('clinical_topup_intent', { packageHint: hint });
    setBusyHint(hint);

    try {
      let productId = HINT_TO_PREFERRED_PRODUCT[hint];
      let credits = Number(hint);

      try {
        const res = await intent.mutateAsync({ packageHint: hint });
        const pick =
          res.products.find((p) => String(p.credits) === hint) ??
          res.products.find((p) => p.productId.includes(`credits_${hint}`)) ??
          res.products[0];
        if (pick) {
          productId = pick.productId;
          credits = pick.credits;
        }
      } catch {
        /* use preferred product id */
      }

      onSelectProduct?.(productId, credits);

      if (!isClinicalCopilotUiEnabled()) {
        openPaywallFallback();
        return;
      }

      const result = await purchaseCreditTopup(productId);
      if (!result.purchased) {
        // Offerings missing or user cancelled — fall back to paywall route
        openPaywallFallback();
        return;
      }

      // Never grant credits client-side — sync from backend (webhook + REST).
      try {
        await syncEntitlement.mutateAsync();
        await trpcUtils.clinical.getStatus.invalidate();
        await trpcUtils.clinical.getCredits.invalidate();
      } catch {
        Alert.alert(t('paywall.infoTitle'), t('clinical.topupSubtitle'));
      }

      onClose();
    } finally {
      setBusyHint(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('clinical.topupTitle')}</Text>
          <Text style={styles.subtitle}>{t('clinical.topupSubtitle')}</Text>

          {(['50', '100', '250'] as const).map((hint) => (
            <TouchableOpacity
              key={hint}
              style={styles.row}
              onPress={() => void loadAndPick(hint)}
              accessibilityRole="button"
              disabled={busyHint != null}
            >
              <Text style={styles.rowTitle}>
                {t('clinical.topupCredits').replace('{count}', hint)}
              </Text>
              {busyHint === hint ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.rowCta}>{t('clinical.topupBuy')}</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t('clinical.topupClose')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.backgroundLight,
      borderTopLeftRadius: radiusLg,
      borderTopRightRadius: radiusLg,
      paddingHorizontal: screenPaddingX,
      paddingTop: space.space6,
      paddingBottom: space.space8,
      gap: space.space4,
    },
    title: {
      ...typeScale.title3,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      ...typeScale.footnote,
      color: colors.textSecondary,
      marginBottom: space.space2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: space.space4,
      paddingHorizontal: space.space4,
      borderRadius: radiusMd,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    rowTitle: {
      ...typeScale.body,
      fontWeight: '600',
      color: colors.text,
    },
    rowCta: {
      ...typeScale.footnote,
      fontWeight: '600',
      color: colors.primary,
    },
    closeBtn: {
      alignItems: 'center',
      paddingVertical: space.space4,
    },
    closeText: {
      ...typeScale.body,
      color: colors.textSecondary,
    },
  });
}
