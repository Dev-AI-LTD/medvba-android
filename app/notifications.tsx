import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/layout';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  iconMd,
  radiusLg,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationSettings,
} from '@/lib/notification-preferences';
import { isStudyTimeBlockedByDnd } from '@/lib/dnd-time';
import { ensureAndroidStudyNotificationChannels } from '@/lib/local-notifications-init';
import {
  requestNotificationPermissionAsync,
  syncStudyReminderNotification,
} from '@/lib/study-reminder-schedule';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [showStudyTimePicker, setShowStudyTimePicker] = useState(false);
  const [showDndStartPicker, setShowDndStartPicker] = useState(false);
  const [showDndEndPicker, setShowDndEndPicker] = useState(false);

  const settingsRef = useRef<NotificationSettings | null>(null);
  settingsRef.current = settings;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const studyCopy = useMemo(
    () => ({
      title: t('notifications.studyReminderLocalTitle'),
      body: t('notifications.studyReminderLocalBody'),
    }),
    [t]
  );

  const applyNativeSchedule = useCallback(
    async (next: NotificationSettings) => {
      if (Platform.OS === 'web') return;
      await ensureAndroidStudyNotificationChannels();
      await syncStudyReminderNotification(next, studyCopy);
    },
    [studyCopy]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadNotificationPreferences();
      if (cancelled) return;
      setSettings(loaded);
      await applyNativeSchedule(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyNativeSchedule]);

  const pushSettings = useCallback(
    async (next: NotificationSettings) => {
      await saveNotificationPreferences(next);
      setSettings(next);
      await applyNativeSchedule(next);
    },
    [applyNativeSchedule]
  );

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const updateSetting = useCallback(
    async (key: keyof NotificationSettings, value: boolean | string) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const base = settingsRef.current;
      if (!base) return;
      const next = { ...base, [key]: value };
      await pushSettings(next);
    },
    [pushSettings]
  );

  const onStudyRemindersChange = useCallback(
    async (value: boolean) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (!settingsRef.current) return;
      if (value && Platform.OS !== 'web') {
        const ok = await requestNotificationPermissionAsync();
        if (!ok) {
          Alert.alert(
            t('notifications.permissionDeniedTitle'),
            t('notifications.permissionDeniedMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('notifications.openSettings'), onPress: () => void Linking.openSettings() },
            ]
          );
          return;
        }
      }
      await updateSetting('studyReminders', value);
    },
    [t, updateSetting]
  );

  const studyBlocked =
    settings &&
    settings.studyReminders &&
    isStudyTimeBlockedByDnd(
      settings.studyTime,
      settings.doNotDisturb,
      settings.doNotDisturbStart,
      settings.doNotDisturbEnd
    );

  if (!settings) {
    return (
      <Screen withGradient edges={['top', 'bottom']}>
        <ScreenHeader
          layout="stack-centered"
          onBack={() => router.back()}
          title={t('notifications.title')}
          backVariant="pill"
          bordered
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen withGradient edges={['top', 'bottom']} padded={false}>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => router.back()}
        title={t('notifications.title')}
        backVariant="pill"
        bordered
      />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>
                    {t('notifications.studyReminders')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.studyRemindersDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.studyReminders}
                  onValueChange={onStudyRemindersChange}
                  trackColor={{ false: colors.cardBgLight, true: colors.primary }}
                  thumbColor={colors.text}
                />
              </View>

              {settings.studyReminders && (
                <TouchableOpacity
                  style={styles.timePickerContainer}
                  onPress={() => {
                    setShowDndStartPicker(false);
                    setShowDndEndPicker(false);
                    setShowStudyTimePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.timePickerIcon}>
                    <Clock color={colors.primary} size={iconMd} />
                  </View>
                  <View style={styles.timePickerInfo}>
                    <Text style={styles.timePickerLabel}>
                      {t('notifications.studyTime')}
                    </Text>
                    <Text style={styles.timePickerValue}>{settings.studyTime}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {studyBlocked && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>{t('notifications.studyTimeBlockedByDnd')}</Text>
                </View>
              )}

              {showStudyTimePicker && (
                <DateTimePicker
                  value={parseTime(settings.studyTime)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowStudyTimePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      void updateSetting('studyTime', formatTime(selectedDate));
                    }
                  }}
                />
              )}

              <View style={[styles.settingItem, styles.settingItemBorder, styles.settingItemMuted]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>
                    {t('notifications.chatNotifications')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.chatNotificationsDesc')}
                  </Text>
                </View>
                <Switch
                  value={false}
                  disabled
                  trackColor={{ false: colors.cardBgLight, true: colors.primary }}
                  thumbColor={colors.textMuted}
                  accessibilityState={{ disabled: true }}
                  accessibilityLabel={t('notifications.chatNotifications')}
                />
              </View>

              <View style={[styles.settingItem, styles.settingItemBorder, styles.settingItemMuted]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>
                    {t('notifications.medvbaUpdates')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.medvbaUpdatesDesc')}
                  </Text>
                </View>
                <Switch
                  value={false}
                  disabled
                  trackColor={{ false: colors.cardBgLight, true: colors.primary }}
                  thumbColor={colors.textMuted}
                  accessibilityState={{ disabled: true }}
                  accessibilityLabel={t('notifications.medvbaUpdates')}
                />
              </View>

              <View style={[styles.settingItem, styles.settingItemBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>
                    {t('notifications.soundEnabled')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.soundEnabledDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => void updateSetting('soundEnabled', value)}
                  trackColor={{ false: colors.cardBgLight, true: colors.primary }}
                  thumbColor={colors.text}
                />
              </View>

              <View style={[styles.settingItem, styles.settingItemBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>
                    {t('notifications.doNotDisturb')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t('notifications.doNotDisturbDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.doNotDisturb}
                  onValueChange={(value) => void updateSetting('doNotDisturb', value)}
                  trackColor={{ false: colors.cardBgLight, true: colors.primary }}
                  thumbColor={colors.text}
                />
              </View>

              {settings.doNotDisturb && (
                <>
                  <TouchableOpacity
                    style={styles.timePickerContainer}
                    onPress={() => {
                      setShowStudyTimePicker(false);
                      setShowDndEndPicker(false);
                      setShowDndStartPicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.timePickerIcon}>
                      <Clock color={colors.primary} size={iconMd} />
                    </View>
                    <View style={styles.timePickerInfo}>
                      <Text style={styles.timePickerLabel}>{t('notifications.dndStart')}</Text>
                      <Text style={styles.timePickerValue}>{settings.doNotDisturbStart}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timePickerContainer}
                    onPress={() => {
                      setShowStudyTimePicker(false);
                      setShowDndStartPicker(false);
                      setShowDndEndPicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.timePickerIcon}>
                      <Clock color={colors.primary} size={iconMd} />
                    </View>
                    <View style={styles.timePickerInfo}>
                      <Text style={styles.timePickerLabel}>{t('notifications.dndEnd')}</Text>
                      <Text style={styles.timePickerValue}>{settings.doNotDisturbEnd}</Text>
                    </View>
                  </TouchableOpacity>

                  {showDndStartPicker && (
                    <DateTimePicker
                      value={parseTime(settings.doNotDisturbStart)}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowDndStartPicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          void updateSetting('doNotDisturbStart', formatTime(selectedDate));
                        }
                      }}
                    />
                  )}
                  {showDndEndPicker && (
                    <DateTimePicker
                      value={parseTime(settings.doNotDisturbEnd)}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowDndEndPicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          void updateSetting('doNotDisturbEnd', formatTime(selectedDate));
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: {
  background: string;
  backgroundLight: string;
  text: string;
  glassBorder: string;
  cardBg: string;
  cardBgLight: string;
  textSecondary: string;
  primary: string;
}) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: screenPaddingX,
      paddingTop: screenPaddingX,
      paddingBottom: space.space8,
    },
    section: {
      marginBottom: sectionGap,
    },
    sectionCard: {
      borderRadius: radiusLg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenPaddingX,
      gap: space.space3,
    },
    settingItemBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
    },
    settingItemMuted: {
      opacity: 0.65,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      ...typeScale.body,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    timePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenPaddingX,
      paddingTop: 0,
      gap: space.space3,
    },
    timePickerIcon: {
      width: touchTargetMin,
      height: touchTargetMin,
      borderRadius: radiusMd,
      backgroundColor: 'rgba(255,255,255,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timePickerInfo: {
      flex: 1,
    },
    timePickerLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    timePickerValue: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.primary,
    },
    warningBanner: {
      paddingHorizontal: screenPaddingX,
      paddingBottom: space.space3,
    },
    warningText: {
      fontSize: 13,
      color: colors.primary,
      lineHeight: 18,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenPaddingX,
    },
  });
