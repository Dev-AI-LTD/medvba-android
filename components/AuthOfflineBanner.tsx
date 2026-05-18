import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/providers/LanguageProvider';
import { useBlockingAuthOffline } from '@/lib/use-network-auth-offline';
import { radiusMd, screenPaddingX, space } from '@/theme/iosDesign';

export function AuthOfflineBanner() {
  const theme = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const offline = useBlockingAuthOffline();

  if (!offline) return null;

  const top = Platform.OS === 'web' ? space.space3 : insets.top + space.space2;

  return (
    <View style={[styles.wrap, { top }]} pointerEvents="box-none" accessibilityRole="alert">
      <View
        style={[
          styles.banner,
          {
            borderColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.errorContainer,
          },
        ]}
      >
        <View style={styles.textCol}>
          <Text variant="titleSmall" style={{ color: theme.colors.onErrorContainer }}>
            {t('offline.needsInternetTitle')}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, opacity: 0.92 }}>
            {t('offline.needsInternetMessage')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 6,
    paddingHorizontal: screenPaddingX,
  },
  banner: {
    borderRadius: radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.space4,
  },
  textCol: {
    flex: 1,
  },
});
