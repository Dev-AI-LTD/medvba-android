import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import { getSupportEmail, openSupportMail } from '@/lib/support-mail';

type CategoryOption = 'bug' | 'billing' | 'account' | 'other';

export default function ContactSupportScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<CategoryOption>('bug');
  const [message, setMessage] = useState('');
  const [includeTechInfo, setIncludeTechInfo] = useState(true);
  const [subjectError, setSubjectError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const categories: { value: CategoryOption; label: string }[] = [
    { value: 'bug', label: t('support.categoryBug') },
    { value: 'billing', label: t('support.categoryBilling') },
    { value: 'account', label: t('support.categoryAccount') },
    { value: 'other', label: t('support.categoryOther') },
  ];

  const version =
    Constants.expoConfig?.version ||
    (Constants as { manifest?: { version?: string } }).manifest?.version ||
    'unknown';

  const technicalInfo = [
    `App version: ${version}`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `User ID: ${user?.id ?? 'unknown'}`,
    `Email: ${user?.email ?? 'unknown'}`,
  ].join('\n');

  const composeBody = () => {
    const categoryLabel = categories.find((item) => item.value === category)?.label || '';
    const base = `${t('support.categoryLabel')}: ${categoryLabel}\n\n${message.trim()}`;
    if (!includeTechInfo) {
      return base;
    }
    return `${base}\n\n---\n${technicalInfo}`;
  };

  const validate = () => {
    let valid = true;
    if (!subject.trim()) {
      setSubjectError(t('support.subjectRequired'));
      valid = false;
    } else {
      setSubjectError('');
    }
    if (!message.trim()) {
      setMessageError(t('support.messageRequired'));
      valid = false;
    } else {
      setMessageError('');
    }
    return valid;
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(composeBody());
    Alert.alert(t('support.copiedTitle'), t('support.copiedMessage'));
  };

  const handleSend = async () => {
    if (!validate()) return;

    setIsSending(true);
    setShowFallback(false);
    const emailSubject = `[MEDVBA Support] ${subject.trim()}`;
    const body = composeBody();

    try {
      const result = await openSupportMail({
        subject: emailSubject,
        body,
      });

      if (result === 'sent') {
        Alert.alert(t('support.sentTitle'), t('support.sentMessage'));
      } else if (result === 'saved') {
        Alert.alert(t('support.savedTitle'), t('support.savedMessage'));
      } else if (result === 'opened_mailto') {
        Alert.alert(t('support.mailtoOpenedTitle'), t('support.mailtoOpenedMessage'));
      } else if (result === 'cancelled') {
        /* user dismissed composer */
      } else {
        setShowFallback(true);
      }
    } catch {
      setShowFallback(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('support.contactSupportTitle') }} />
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.formCard}>
            <Text style={styles.label}>{t('support.subjectLabel')}</Text>
            <TextInput
              style={[styles.input, subjectError && styles.inputError]}
              value={subject}
              onChangeText={setSubject}
              placeholder={t('support.subjectPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
            {subjectError ? <Text style={styles.errorText}>{subjectError}</Text> : null}

            <Text style={styles.label}>{t('support.categoryLabel')}</Text>
            <View style={styles.categoryRow}>
              {categories.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryChip,
                    category === option.value && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '20',
                    },
                  ]}
                  onPress={() => setCategory(option.value)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === option.value && { color: colors.primary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('support.messageLabel')}</Text>
            <TextInput
              style={[styles.textArea, messageError && styles.inputError]}
              value={message}
              onChangeText={setMessage}
              placeholder={t('support.messagePlaceholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            {messageError ? <Text style={styles.errorText}>{messageError}</Text> : null}

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>{t('support.includeTechInfo')}</Text>
                <Text style={styles.toggleSubtitle}>{t('support.includeTechInfoDesc')}</Text>
              </View>
              <Switch
                value={includeTechInfo}
                onValueChange={setIncludeTechInfo}
                trackColor={{ false: colors.cardBgLight, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>

            <Button
              title={isSending ? t('support.sending') : t('support.send')}
              onPress={() => void handleSend()}
              loading={isSending}
              disabled={isSending}
              fullWidth
            />
          </GlassCard>

          {showFallback && (
            <GlassCard style={styles.fallbackCard}>
              <Text style={styles.fallbackTitle}>{t('support.fallbackTitle')}</Text>
              <Text style={styles.fallbackText}>{t('support.fallbackMessage')}</Text>
              <Text style={styles.emailText}>{getSupportEmail()}</Text>
              <Button
                title={t('support.copyMessage')}
                onPress={() => void handleCopy()}
                variant="secondary"
                fullWidth
              />
            </GlassCard>
          )}

          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>{t('support.footerLine')}</Text>
            <Text style={styles.noteWarning}>{t('support.sensitiveWarning')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: {
  background: string;
  backgroundLight: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  glassBorder: string;
  cardBg: string;
  cardBgLight: string;
  primary: string;
  error: string;
  warning: string;
}) =>
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
    formCard: {
      padding: 16,
      gap: 12,
    },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.cardBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 14,
    },
    textArea: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.cardBg,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 14,
      minHeight: 120,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.cardBgLight,
    },
    categoryText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600' as const,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    toggleTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    toggleSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    fallbackCard: {
      padding: 16,
      gap: 10,
    },
    fallbackTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.text,
    },
    fallbackText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    emailText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.primary,
    },
    noteContainer: {
      paddingHorizontal: 4,
      gap: 6,
    },
    noteText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    noteWarning: {
      fontSize: 12,
      color: colors.warning,
    },
  });
