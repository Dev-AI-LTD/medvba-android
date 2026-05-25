import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { EyeOff } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  iconSm,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour >= 18) return 'home.greetingEvening';
  if (hour >= 12) return 'home.greetingAfternoon';
  return 'home.greetingMorning';
}

export function HomeWelcomeHeader() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const displayName = profile?.name?.split(' ')[0] || profile?.email || t('common.student');
  const avatarUri =
    profile?.profile_photo_url ||
    profile?.avatar ||
    'https://api.dicebear.com/7.x/avataaars/png?seed=default';

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image source={require('../../assets/images/icon-auth.png')} style={styles.appIcon} />
        <View style={styles.headerTextWrap}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]} numberOfLines={1}>
              {t(greetingKey())}
            </Text>
            <TouchableOpacity
              style={[styles.privacyBadge, { backgroundColor: colors.textMuted + '20' }]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={profile?.isPublic === false ? 'Private profile' : 'Public profile'}
            >
              <EyeOff size={iconSm} color={colors.textMuted} />
              <Text style={[styles.privacyBadgeText, { color: colors.textMuted }]}>
                {profile?.isPublic === false ? 'Private' : 'Public'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile')}
        accessibilityRole="button"
        accessibilityLabel={t('tabs.profile')}
      >
        <Image
          key={`avatar:${profile?.id ?? 'anon'}:${profile?.profile_photo_url ?? profile?.avatar ?? 'default'}`}
          source={{ uri: avatarUri }}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sectionGap,
    marginTop: space.space2,
  },
  greeting: {
    ...typeScale.subhead,
    flexShrink: 0,
  },
  userName: {
    ...typeScale.title,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space3,
    flex: 1,
    minWidth: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2,
    minWidth: 0,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space1,
    paddingHorizontal: space.space2,
    paddingVertical: space.space1,
    borderRadius: space.space2,
    minHeight: touchTargetMin,
  },
  privacyBadgeText: {
    ...typeScale.footnote,
    fontWeight: '600',
  },
  appIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
  },
  avatar: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
  },
});
