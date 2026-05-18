import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useLanguage } from '@/providers/LanguageProvider';
import { useIsOffline } from '@/lib/use-network-auth-offline';
import { SPACING } from '@/theme/paperTheme';

/** Inline notice for screens that need network for fresh data (social, tutor, etc.). */
export function OfflineFeatureNotice() {
  const offline = useIsOffline();
  const { t } = useLanguage();
  const theme = useTheme();

  if (!offline) return null;

  return (
    <View
      style={[styles.box, { backgroundColor: theme.colors.surfaceVariant }]}
      accessibilityRole="text"
    >
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('offline.featureRequiresInternet')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginHorizontal: SPACING.x3,
    marginBottom: SPACING.x2,
    padding: SPACING.x2,
    borderRadius: 10,
  },
});
