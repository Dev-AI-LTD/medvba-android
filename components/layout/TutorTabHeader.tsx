import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bot, Sparkles, Crown } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import {
  iconSm,
  iconXl,
  screenPaddingX,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';

export function TutorTabHeader() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isPremium, isPaywallEnabled } = useSubscription();

  return (
    <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
      <View style={[styles.headerIcon, { backgroundColor: colors.cardBgLight }]}>
        <Bot color={colors.primary} size={iconXl} />
      </View>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tutor.title')}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.status, { color: colors.textSecondary }]}>
            {t('tutor.alwaysAvailable')}
          </Text>
        </View>
      </View>
      {isPaywallEnabled && isPremium ? (
        <View style={styles.premiumBadge}>
          <Sparkles color={colors.warning} size={iconSm} />
          <Text style={[styles.premiumText, { color: colors.warning }]}>{t('tutor.premium')}</Text>
        </View>
      ) : isPaywallEnabled ? (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push('/paywall')}
          accessibilityRole="button"
          accessibilityLabel={t('tutor.upgrade')}
        >
          <Crown color={colors.warning} size={iconSm} />
          <Text style={[styles.upgradeButtonText, { color: colors.warning }]}>{t('tutor.upgrade')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.space3,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typeScale.headline,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2,
    marginTop: space.space1,
  },
  onlineDot: {
    width: space.space2,
    height: space.space2,
    borderRadius: space.space1,
  },
  status: {
    ...typeScale.caption,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    borderRadius: space.space3,
    marginLeft: 'auto',
    gap: space.space1,
  },
  premiumText: {
    ...typeScale.footnote,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    borderRadius: space.space3,
    marginLeft: 'auto',
    gap: space.space1,
    minHeight: touchTargetMin,
  },
  upgradeButtonText: {
    ...typeScale.footnote,
    fontWeight: '600',
  },
});
