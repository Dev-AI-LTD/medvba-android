import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookOpen, ChevronRight, Crown, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen, ScreenHeader } from '@/components/layout';
import GlassCard from '@/components/GlassCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useStudyChapterList } from '@/lib/study-hooks';
import { resolveStudyContentLocale } from '@/lib/study-content-locale';
import { STUDY_MODULE_IDS } from '@/constants/study';
import {
  cardPadding,
  iconLg,
  iconMd,
  iconSm,
  screenPaddingX,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

export default function StudyChaptersScreen() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { t, getModuleName, currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const { isPremium, isPaywallEnabled } = useSubscription();
  const locale = resolveStudyContentLocale(currentLanguage);
  const { chapters } = useStudyChapterList(moduleId ?? '', locale);

  if (!moduleId || !(STUDY_MODULE_IDS as readonly string[]).includes(moduleId)) {
    router.replace('/(tabs)/quiz');
    return null;
  }

  const openChapter = (chapterId: string, locked: boolean, comingSoon: boolean) => {
    if (comingSoon) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (locked && isPaywallEnabled && !isPremium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/paywall');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/study/chapter/[chapterId]',
      params: { chapterId, moduleId },
    });
  };

  return (
    <Screen withGradient edges={['top', 'bottom']} padded={false}>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        title={getModuleName(moduleId)}
        subtitle={t('study.chaptersSubtitle')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {chapters.map((chapter) => (
          <TouchableOpacity
            key={chapter.chapterId}
            onPress={() => openChapter(chapter.chapterId, chapter.isLocked, chapter.comingSoon)}
            activeOpacity={chapter.comingSoon ? 1 : 0.8}
            disabled={chapter.comingSoon}
            style={styles.rowWrap}
          >
            <GlassCard style={[styles.card, chapter.comingSoon && styles.cardMuted]}>
              <BookOpen color={colors.primary} size={iconLg} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                  {chapter.title}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {chapter.questionCount} {t('quiz.questionsShort')}
                </Text>
                <View style={styles.badges}>
                  {chapter.comingSoon ? (
                    <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>
                      {t('study.chapterComingSoon')}
                    </Text>
                  ) : chapter.isFreePreview ? (
                    <Text style={[styles.badgeLabel, { color: colors.success }]}>
                      {t('study.chapterFree')}
                    </Text>
                  ) : chapter.isLocked ? (
                    <View style={styles.premiumRow}>
                      <Crown color={colors.warning} size={iconSm} />
                      <Text style={[styles.badgeLabel, { color: colors.warning }]}>
                        {t('study.chapterPremium')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {chapter.comingSoon ? (
                <Lock color={colors.textMuted} size={iconMd} />
              ) : (
                <ChevronRight color={colors.textMuted} size={iconMd} />
              )}
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: sectionGap,
    gap: space.space3,
  },
  rowWrap: { marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: cardPadding,
    gap: space.space3,
  },
  cardMuted: { opacity: 0.75 },
  info: { flex: 1 },
  name: { ...typeScale.body, fontWeight: '600' },
  meta: { ...typeScale.footnote, marginTop: 2 },
  badges: { marginTop: space.space1 },
  badgeLabel: { ...typeScale.caption, fontWeight: '600' },
  premiumRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
