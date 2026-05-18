import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Settings, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  iconLg,
  iconSm,
  screenPaddingX,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';

export function ProfileTabHeader() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const openSettings = () => router.push('/settings');

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.titleRow} onPress={openSettings} activeOpacity={0.7}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile')}</Text>
        {profile?.isPublic === false ? (
          <View style={[styles.privacyBadge, { backgroundColor: colors.textMuted + '20' }]}>
            <EyeOff size={iconSm} color={colors.textMuted} />
            <Text style={[styles.privacyBadgeText, { color: colors.textMuted }]}>Private</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingsButton, { borderColor: colors.glassBorder }]}
        activeOpacity={0.7}
        onPress={openSettings}
        testID="profileOpenSettings"
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Settings color={colors.textSecondary} size={iconLg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenPaddingX,
    marginBottom: screenPaddingX,
    marginTop: space.space2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space3,
    flex: 1,
    minWidth: 0,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space1,
    paddingHorizontal: space.space2,
    paddingVertical: space.space1,
    borderRadius: space.space3,
  },
  privacyBadgeText: {
    ...typeScale.footnote,
    fontWeight: '600',
  },
  title: {
    ...typeScale.title,
  },
  settingsButton: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
