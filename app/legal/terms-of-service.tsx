import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, UserCheck, AlertTriangle, Scale, ShieldX, Ban } from 'lucide-react-native';
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

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const lastUpdatedDate = currentLanguage === 'ro' ? LAST_UPDATED_RO : LAST_UPDATED_EN;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('settings.termsOfService') }} />
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
                colors={[colors.accent, colors.primary]}
                style={StyleSheet.absoluteFill}
              />
              <FileText color={colors.text} size={32} />
            </View>
            <Text style={styles.lastUpdated}>{t('terms.lastUpdated').replace('{date}', lastUpdatedDate)}</Text>
          </View>

          <Text style={styles.intro}>
            {t('terms.intro')}
          </Text>

          <Section
            icon={<UserCheck color={colors.primary} size={20} />}
            title={t('terms.accountResponsibilities')}
          >
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.accountCreation')}</Text> {t('terms.accountCreationDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.ageRequirement')}</Text> {t('terms.ageRequirementDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.accountSecurity')}</Text> {t('terms.accountSecurityDesc').replace('{email}', CONTACT_EMAIL)}
            </Text>
          </Section>

          <Section
            icon={<AlertTriangle color={colors.warning} size={20} />}
            title={t('terms.acceptableUse')}
          >
            <Text style={styles.paragraph}>
              {t('terms.acceptableUseIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse1')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse2')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse3')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse4')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse5')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse6')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse7')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.acceptableUse8')}</Text>
            </View>
          </Section>

          <Section
            icon={<Scale color={colors.accent} size={20} />}
            title={t('terms.intellectualProperty')}
          >
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.ourContent')}</Text> {t('terms.ourContentDesc').replace('{company}', COMPANY_NAME)}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.userContent')}</Text> {t('terms.userContentDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.medicalDisclaimer')}</Text> {t('terms.medicalDisclaimerDesc')}
            </Text>
          </Section>

          <Section
            icon={<Ban color={colors.error} size={20} />}
            title={t('terms.accountTermination')}
          >
            <Text style={styles.paragraph}>
              {t('terms.terminationIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('terms.termination1')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.termination2')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.termination3')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.termination4')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.termination5')}</Text>
            </View>
            <Text style={styles.paragraph}>
              {t('terms.terminationUser')}
            </Text>
          </Section>

          <Section
            icon={<ShieldX color={colors.accentPink} size={20} />}
            title={t('terms.disclaimerOfWarranties')}
          >
            <Text style={styles.paragraph}>
              {t('terms.warrantyIntro')}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('terms.warranty1')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.warranty2')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.warranty3')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.warranty4')}</Text>
            </View>
            <Text style={styles.paragraph}>
              {t('terms.warrantyExam')}
            </Text>
          </Section>

          <Section
            icon={<Scale color={colors.warning} size={20} />}
            title={t('terms.limitationOfLiability')}
          >
            <Text style={styles.paragraph}>
              {t('terms.liabilityIntro').replace('{company}', COMPANY_NAME)}
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('terms.liability1')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.liability2')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.liability3')}</Text>
              <Text style={styles.bulletItem}>• {t('terms.liability4')}</Text>
            </View>
            <Text style={styles.paragraph}>
              {t('terms.liabilityTotal')}
            </Text>
          </Section>

          <Section
            icon={<FileText color={colors.primary} size={20} />}
            title={t('terms.subscriptionPayments')}
          >
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.premiumFeatures')}</Text> {t('terms.premiumFeaturesDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.billing')}</Text> {t('terms.billingDesc')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('terms.refunds')}</Text> {t('terms.refundsDesc')}
            </Text>
          </Section>

          <Section
            icon={<Scale color={colors.accent} size={20} />}
            title={t('terms.governingLaw')}
          >
            <Text style={styles.paragraph}>
              {t('terms.governingLawDesc')}
            </Text>
            <Text style={styles.paragraph}>
              {t('terms.governingLawEnforcement')}
            </Text>
          </Section>

          <Section
            icon={<FileText color={colors.accentPink} size={20} />}
            title={t('terms.changesToTerms')}
          >
            <Text style={styles.paragraph}>
              {t('terms.changesToTermsDesc')}
            </Text>
          </Section>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>{t('terms.questions')}</Text>
            <Text style={styles.contactText}>{t('terms.questionsContact')}</Text>
            <View style={styles.contactBox}>
              <Text style={styles.contactInfo}>{COMPANY_NAME}</Text>
              <Text style={styles.contactInfo}>{COMPANY_ADDRESS}</Text>
              <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
            </View>
          </View>

          <Text style={styles.footer}>
            {t('terms.footer')}
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
    paddingBottom: space.space8,
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
    marginBottom: 12,
  },
  lastUpdated: {
    ...typeScale.caption,
    color: colors.textSecondary,
  },
  intro: {
    ...typeScale.subhead,
    color: colors.textSecondary,
    marginBottom: sectionGap,
    textAlign: 'center',
  },
  section: {
    marginBottom: sectionGap,
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
    padding: screenPaddingX,
  },
  paragraph: {
    ...typeScale.subhead,
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
  contactSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  contactBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  contactInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  contactEmail: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 4,
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
