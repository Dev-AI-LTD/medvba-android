import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Database, Users, Lock, Mail, Globe } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { screenPaddingX, sectionGap, space, typeScale } from '@/theme/iosDesign';

const LAST_UPDATED_EN = 'January 12, 2026';
const LAST_UPDATED_RO = '12 ianuarie 2026';
const COMPANY_NAME = 'Dev AI LTD';
const COMPANY_ADDRESS = 'Bogdan Voivoda, № 1, Ruse 7002, Ruse Region, Ruse Municipality, Bulgaria';
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

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const lastUpdatedDate = currentLanguage === 'ro' ? LAST_UPDATED_RO : LAST_UPDATED_EN;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('settings.privacyPolicy') }} />
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
                colors={[colors.primary, colors.secondary]}
                style={StyleSheet.absoluteFill}
              />
              <Shield color={colors.text} size={32} />
            </View>
            <Text style={styles.lastUpdated}>{t('privacy.lastUpdated').replace('{date}', lastUpdatedDate)}</Text>
          </View>

          <Text style={styles.intro}>
            {t('privacy.intro').replace('{company}', COMPANY_NAME)}
          </Text>

          <Section
            icon={<Database color={colors.primary} size={20} />}
            title={t('privacy.informationWeCollect')}
          >
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('privacy.accountInfo')}</Text> {t('privacy.accountInfoDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('privacy.quizProgressData')}</Text> {t('privacy.quizProgressDataDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('privacy.studySessionData')}</Text> {t('privacy.studySessionDataDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('privacy.videoCallData')}</Text> {t('privacy.videoCallDataDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('privacy.deviceInfo')}</Text> {t('privacy.deviceInfoDesc')}
            </Text>
          </Section>

          <Section
            icon={<Users color={colors.accent} size={20} />}
            title={t('privacy.thirdPartyServices')}
          >
            <Text style={styles.paragraph}>
              {t('privacy.thirdPartyIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.supabase')}</Text> {t('privacy.supabaseDesc')}
              </Text>
            </View>
            <Text style={styles.paragraph}>
              {t('privacy.thirdPartyNote')}
            </Text>
          </Section>

          <Section
            icon={<Lock color={colors.success} size={20} />}
            title={t('privacy.howWeUseInfo')}
          >
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('privacy.useInfo1')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.useInfo2')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.useInfo3')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.useInfo4')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.useInfo5')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.useInfo6')}</Text>
            </View>
          </Section>

          <Section
            icon={<Globe color={colors.accentPink} size={20} />}
            title={t('privacy.yourRights')}
          >
            <Text style={styles.paragraph}>
              {t('privacy.gdprIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.rightAccess')}</Text> {t('privacy.rightAccessDesc')}
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.rightRectification')}</Text> {t('privacy.rightRectificationDesc')}
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.rightErasure')}</Text> {t('privacy.rightErasureDesc')}
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.rightPortability')}</Text> {t('privacy.rightPortabilityDesc')}
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.rightRestriction')}</Text> {t('privacy.rightRestrictionDesc')}
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>{t('privacy.rightObjection')}</Text> {t('privacy.rightObjectionDesc')}
              </Text>
            </View>
            <Text style={styles.paragraph}>
              {t('privacy.exerciseRights').replace('{email}', CONTACT_EMAIL)}
            </Text>
          </Section>

          <Section
            icon={<Shield color={colors.warning} size={20} />}
            title={t('privacy.dataSecurity')}
          >
            <Text style={styles.paragraph}>
              {t('privacy.securityIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('privacy.security1')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.security2')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.security3')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.security4')}</Text>
            </View>
          </Section>

          <Section
            icon={<Database color={colors.primary} size={20} />}
            title={t('privacy.dataRetention')}
          >
            <Text style={styles.paragraph}>
              {t('privacy.retentionDesc1')}
            </Text>
            <Text style={styles.paragraph}>
              {t('privacy.retentionDesc2')}
            </Text>
          </Section>

          <Section
            icon={<Users color={colors.accent} size={20} />}
            title={t('privacy.childrensPrivacy')}
          >
            <Text style={styles.paragraph}>
              {t('privacy.childrensPrivacyDesc')}
            </Text>
          </Section>

          <Section
            icon={<Mail color={colors.accentPink} size={20} />}
            title={t('privacy.contactUs')}
          >
            <Text style={styles.paragraph}>
              {t('privacy.contactIntro')}
            </Text>
            <View style={styles.contactBox}>
              <Text style={styles.contactText}>{COMPANY_NAME}</Text>
              <Text style={styles.contactText}>{COMPANY_ADDRESS}</Text>
              <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
            </View>
          </Section>

          <Text style={styles.footer}>
            {t('privacy.footer')}
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
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  intro: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sectionTitle: {
    ...typeScale.headline,
    color: colors.text,
  },
  sectionContent: {
    padding: 16,
  },
  paragraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600' as const,
    color: colors.text,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 4,
  },
  contactBox: {
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  contactEmail: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
