import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { HelpCircle, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import { openSupportMail } from '@/lib/support-mail';

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
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('support.helpCenterTitle') }} />
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.headerCard}>
            <View style={styles.headerRow}>
              <HelpCircle color={colors.primary} size={22} />
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
              <Mail color={colors.accentPink} size={20} />
              <Text style={styles.contactTitle}>{t('support.contactSupport')}</Text>
            </View>
            <Text style={styles.contactSubtitle}>{t('support.contactSupportSubtitle')}</Text>
            <Button
              title={openingMail ? t('support.sending') : t('support.emailFromHelpButton')}
              onPress={() => void handleOpenSupportMail()}
              icon={<Mail color="#FFFFFF" size={18} />}
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
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    headerCard: {
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
    },
    faqCard: {
      padding: 16,
    },
    faqQuestion: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 6,
    },
    faqAnswer: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    contactCard: {
      padding: 16,
      gap: 10,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    contactTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
    },
    contactSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    secondaryHint: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
      marginTop: -4,
    },
  });
