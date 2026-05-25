import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Users, AlertOctagon, Flag, ShieldCheck, MessageCircle } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  cardPadding,
  radiusLg,
  radiusMd,
  radiusSm,
  screenPaddingX,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

const LAST_UPDATED = 'January 12, 2026';
const CONTACT_EMAIL = 'contact@devaieood.com';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function CodeOfConductScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('settings.codeOfConduct') }} />
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[colors.success, colors.accent]}
                style={StyleSheet.absoluteFill}
              />
              <Heart color={colors.text} size={32} />
            </View>
            <Text style={styles.lastUpdated}>{t('conduct.lastUpdated').replace('{date}', LAST_UPDATED)}</Text>
          </View>

          <Text style={styles.intro}>
            {t('conduct.intro')}
          </Text>

          <View style={styles.highlightBox}>
            <LinearGradient
              colors={['rgba(0, 196, 140, 0.15)', 'rgba(0, 245, 212, 0.1)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.highlightTitle}>{t('conduct.coreValues')}</Text>
            <Text style={styles.highlightText}>
              {t('conduct.coreValuesText')}
            </Text>
          </View>

          <Section
            icon={<Users color={colors.primary} size={20} />}
            title={t('conduct.studyRoomBehavior')}
          >
            <Text style={styles.subheading}>{t('conduct.expectedBehavior')}</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>{t('conduct.expected1')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.expected2')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.expected3')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.expected4')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.expected5')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.expected6')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.expected7')}</Text>
            </View>
            
            <Text style={[styles.subheading, { marginTop: 16 }]}>{t('conduct.prohibitedBehavior')}</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItemRed}>{t('conduct.prohibited1')}</Text>
              <Text style={styles.bulletItemRed}>{t('conduct.prohibited2')}</Text>
              <Text style={styles.bulletItemRed}>{t('conduct.prohibited3')}</Text>
              <Text style={styles.bulletItemRed}>{t('conduct.prohibited4')}</Text>
              <Text style={styles.bulletItemRed}>{t('conduct.prohibited5')}</Text>
            </View>
          </Section>

          <Section
            icon={<AlertOctagon color={colors.error} size={20} />}
            title={t('conduct.zeroTolerance')}
          >
            <Text style={styles.paragraph}>
              {t('conduct.zeroToleranceIntro').replace('ZERO TOLERANCE', `<bold>ZERO TOLERANCE</bold>`)}
            </Text>
            <View style={styles.warningBox}>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance1')}</Text>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance2')}</Text>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance3')}</Text>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance4')}</Text>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance5')}</Text>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance6')}</Text>
              <Text style={styles.warningItem}>{t('conduct.zeroTolerance7')}</Text>
            </View>
          </Section>

          <Section
            icon={<ShieldCheck color={colors.success} size={20} />}
            title={t('conduct.consequences')}
          >
            <Text style={styles.paragraph}>
              {t('conduct.consequencesIntro')}
            </Text>
            
            <View style={styles.consequenceItem}>
              <View style={[styles.consequenceBadge, { backgroundColor: 'rgba(255, 184, 0, 0.2)' }]}>
                <Text style={[styles.consequenceLevel, { color: colors.warning }]}>{t('conduct.level1')}</Text>
              </View>
              <View style={styles.consequenceContent}>
                <Text style={styles.consequenceTitle}>{t('conduct.level1Title')}</Text>
                <Text style={styles.consequenceDesc}>{t('conduct.level1Desc')}</Text>
              </View>
            </View>

            <View style={styles.consequenceItem}>
              <View style={[styles.consequenceBadge, { backgroundColor: 'rgba(255, 149, 0, 0.2)' }]}>
                <Text style={[styles.consequenceLevel, { color: colors.streakOrange }]}>{t('conduct.level2')}</Text>
              </View>
              <View style={styles.consequenceContent}>
                <Text style={styles.consequenceTitle}>{t('conduct.level2Title')}</Text>
                <Text style={styles.consequenceDesc}>{t('conduct.level2Desc')}</Text>
              </View>
            </View>

            <View style={styles.consequenceItem}>
              <View style={[styles.consequenceBadge, { backgroundColor: 'rgba(255, 107, 157, 0.2)' }]}>
                <Text style={[styles.consequenceLevel, { color: colors.accentPink }]}>{t('conduct.level3')}</Text>
              </View>
              <View style={styles.consequenceContent}>
                <Text style={styles.consequenceTitle}>{t('conduct.level3Title')}</Text>
                <Text style={styles.consequenceDesc}>{t('conduct.level3Desc')}</Text>
              </View>
            </View>

            <View style={styles.consequenceItem}>
              <View style={[styles.consequenceBadge, { backgroundColor: 'rgba(255, 71, 87, 0.2)' }]}>
                <Text style={[styles.consequenceLevel, { color: colors.error }]}>{t('conduct.level4')}</Text>
              </View>
              <View style={styles.consequenceContent}>
                <Text style={styles.consequenceTitle}>{t('conduct.level4Title')}</Text>
                <Text style={styles.consequenceDesc}>{t('conduct.level4Desc')}</Text>
              </View>
            </View>

            <Text style={styles.note}>
              {t('conduct.note')}
            </Text>
          </Section>

          <Section
            icon={<Flag color={colors.accentPink} size={20} />}
            title={t('conduct.reportViolations')}
          >
            <Text style={styles.paragraph}>
              {t('conduct.reportIntro')}
            </Text>
            <View style={styles.reportSteps}>
              <View style={styles.reportStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  {t('conduct.reportStep1')}
                </Text>
              </View>
              <View style={styles.reportStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  {t('conduct.reportStep2').replace('{email}', CONTACT_EMAIL)}
                </Text>
              </View>
              <View style={styles.reportStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  {t('conduct.reportStep3')}
                </Text>
              </View>
            </View>
            <Text style={styles.paragraph}>
              {t('conduct.reportConfidential')}
            </Text>
          </Section>

          <Section
            icon={<MessageCircle color={colors.accent} size={20} />}
            title={t('conduct.positiveEnvironment')}
          >
            <Text style={styles.paragraph}>
              {t('conduct.positiveIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>{t('conduct.positive1')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.positive2')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.positive3')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.positive4')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.positive5')}</Text>
              <Text style={styles.bulletItem}>{t('conduct.positive6')}</Text>
            </View>
          </Section>

          <View style={styles.commitmentBox}>
            <LinearGradient
              colors={['rgba(0, 180, 216, 0.2)', 'rgba(2, 62, 138, 0.15)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.commitmentTitle}>{t('conduct.commitment')}</Text>
            <Text style={styles.commitmentText}>
              {t('conduct.commitmentText')}
            </Text>
          </View>

          <Text style={styles.footer}>
            {t('conduct.footer')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: screenPaddingX,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: sectionGap,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: space.space3,
  },
  lastUpdated: {
    ...typeScale.footnote,
    color: colors.textSecondary,
  },
  intro: {
    ...typeScale.subhead,
    color: colors.textSecondary,
    marginBottom: space.space5,
    textAlign: 'center',
  },
  highlightBox: {
    borderRadius: radiusLg,
    padding: screenPaddingX,
    marginBottom: sectionGap,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  highlightTitle: {
    ...typeScale.headline,
    color: colors.text,
    marginBottom: 8,
  },
  highlightText: {
    ...typeScale.subhead,
    color: colors.accent,
    textAlign: 'center',
    letterSpacing: 1,
  },
  section: {
    marginBottom: sectionGap,
    backgroundColor: colors.cardBg,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space3,
    padding: cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sectionTitle: {
    ...typeScale.headline,
    color: colors.text,
  },
  sectionContent: {
    padding: cardPadding,
  },
  subheading: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: space.space3,
  },
  paragraph: {
    ...typeScale.subhead,
    color: colors.textSecondary,
    marginBottom: space.space3,
  },
  bold: {
    fontWeight: '700' as const,
    color: colors.error,
  },
  bulletList: {
    gap: 6,
  },
  bulletItem: {
    ...typeScale.subhead,
    color: colors.textSecondary,
  },
  bulletItemRed: {
    ...typeScale.subhead,
    color: colors.error,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: radiusMd,
    padding: cardPadding,
    marginTop: space.space3,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  warningItem: {
    ...typeScale.subhead,
    color: colors.textSecondary,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: cardPadding,
    gap: space.space3,
  },
  consequenceBadge: {
    paddingHorizontal: space.space3,
    paddingVertical: 6,
    borderRadius: radiusSm,
  },
  consequenceLevel: {
    ...typeScale.caption,
    fontWeight: '700' as const,
  },
  consequenceContent: {
    flex: 1,
  },
  consequenceTitle: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  consequenceDesc: {
    ...typeScale.footnote,
    color: colors.textSecondary,
  },
  note: {
    ...typeScale.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: space.space2,
  },
  reportSteps: {
    marginTop: space.space3,
    gap: cardPadding,
  },
  reportStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.space3,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typeScale.subhead,
    fontWeight: '700' as const,
    color: colors.text,
  },
  stepText: {
    flex: 1,
    ...typeScale.subhead,
    color: colors.textSecondary,
  },
  commitmentBox: {
    borderRadius: radiusLg,
    padding: screenPaddingX,
    marginBottom: sectionGap,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  commitmentTitle: {
    ...typeScale.headline,
    color: colors.text,
    marginBottom: space.space3,
    textAlign: 'center',
  },
  commitmentText: {
    ...typeScale.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    ...typeScale.footnote,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
