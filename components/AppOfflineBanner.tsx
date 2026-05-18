import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/providers/LanguageProvider';
import { useIsOffline } from '@/lib/use-network-auth-offline';
import { SPACING } from '@/theme/paperTheme';

/** Compact offline indicator for signed-in app areas (tabs, etc.). */
export function AppOfflineBanner() {
  const theme = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const offline = useIsOffline();

  if (!offline) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top > 0 ? insets.top : SPACING.x2,
          backgroundColor: theme.colors.errorContainer,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
      accessibilityRole="alert"
    >
      <Text variant="labelLarge" style={{ color: theme.colors.onErrorContainer }}>
        {t('offline.workingOfflineTitle')}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, opacity: 0.92 }}>
        {t('offline.workingOfflineMessage')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.x3,
    paddingBottom: SPACING.x2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
