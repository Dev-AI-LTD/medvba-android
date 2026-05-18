import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { HelpCircle, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import { Screen, ScreenHeader } from '@/components/layout';
import { openSupportMail } from '@/lib/support-mail';
import { iconMd, iconSm, screenPaddingX, space, typeScale } from '@/theme/iosDesign';

type FaqItem = {
  question: string;
  answer: string;
};

export default function HelpCenterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openingMail, setOpeningMail] = useState(false);

  const faqs: FaqItem[] = [
    {
      question: t('support.faq1Question'),
      answer: t('support.faq1Answer'),
    },
    {
      question: t('support.faq2Question'),
      answer: t('support.faq2Answer'),
    },
    {
      question: t('support.faq3Question'),
      answer: t('support.faq3Answer'),
    },
    {
      question: t('support.faq4Question'),
      answer: t('support.faq4Answer'),
    },
  ];

  const handleOpenSupportMail = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOpeningMail(true);
    try {
      const result = await openSupportMail({
        subject: t('support.helpQuickEmailSubject'),
        body: t('support.helpQuickEmailBody'),
      });
      if (result === 'sent' || result === 'saved') {
        Alert.alert(t('support.sentTitle'), t('support.sentMessage'));
      } else if (result === 'opened_mailto') {
        Alert.alert(t('support.mailtoOpenedTitle'), t('support.mailtoOpenedMessage'));
      } else if (result === 'unavailable') {
        Alert.alert(t('support.fallbackTitle'), t('support.fallbackMessage'));
      }
    } catch {
      Alert.alert(t('support.fallbackTitle'), t('support.fallbackMessage'));
    } finally {
      setOpeningMail(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen withGradient edges={['top', 'bottom']} padded={false}>
        <ScreenHeader
          layout="stack-centered"
          onBack={() => router.back()}
          title={t('support.helpCenterTitle')}
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.headerCard}>
            <View style={styles.headerRow}>
              <HelpCircle color={colors.primary} size={iconMd} />
              <Text style={styles.headerTitle}>{t('support.helpCenterTitle')}</Text>
            </View>
            <Text style={styles.headerSubtitle}>{t('support.helpCenterSubtitle')}</Text>
          </GlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('support.faqTitle')}</Text>
            {faqs.map((item, index) => (
              <GlassCard key={`${item.question}-${index}`} style={styles.faqCard}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </GlassCard>
            ))}
          </View>

          <GlassCard style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Mail color={colors.accentPink} size={iconMd} />
              <Text style={styles.contactTitle}>{t('support.contactSupport')}</Text>
            </View>
            <Text style={styles.contactSubtitle}>{t('support.contactSupportSubtitle')}</Text>
            <Button
              title={openingMail ? t('support.sending') : t('support.emailFromHelpButton')}
              onPress={() => void handleOpenSupportMail()}
              icon={<Mail color="#FFFFFF" size={iconSm} />}
              fullWidth
              loading={openingMail}
              disabled={openingMail}
            />
            <Text style={styles.secondaryHint}>{t('support.emailFromHelpSubtitle')}</Text>
            <Button
              title={t('support.contactSupportButton')}
              onPress={() => router.push('/support/contact-support')}
              variant="secondary"
              fullWidth
            />
          </GlassCard>
        </ScrollView>
      </Screen>
    </>
  );
}

const createStyles = (colors: {
  text: string;
  textSecondary: string;
  textMuted: string;
}) =>
  StyleSheet.create({
    content: {
      padding: screenPaddingX,
      gap: space.space4,
    },
    headerCard: {
      padding: screenPaddingX,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.space2,
      marginBottom: space.space2,
    },
    headerTitle: {
      ...typeScale.headline,
      fontWeight: '700' as const,
      color: colors.text,
    },
    headerSubtitle: {
      ...typeScale.subhead,
      color: colors.textSecondary,
    },
    section: {
      gap: space.space3,
    },
    sectionTitle: {
      ...typeScale.headline,
      color: colors.text,
    },
    faqCard: {
      padding: screenPaddingX,
    },
    faqQuestion: {
      ...typeScale.subheadMedium,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: space.space2,
    },
    faqAnswer: {
      ...typeScale.caption,
      color: colors.textSecondary,
    },
    contactCard: {
      padding: screenPaddingX,
      gap: space.space3,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.space2,
    },
    contactTitle: {
      ...typeScale.headline,
      color: colors.text,
    },
    contactSubtitle: {
      ...typeScale.caption,
      color: colors.textSecondary,
    },
    secondaryHint: {
      ...typeScale.footnote,
      color: colors.textMuted,
      marginTop: -space.space1,
    },
  });
