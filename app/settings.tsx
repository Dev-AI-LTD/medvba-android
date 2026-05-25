import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  Switch,
} from 'react-native';
import { Appbar, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadBlockedUsersFromStorage,
  removeBlockedUserById,
  type BlockedUser,
} from '@/lib/blocked-users-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  FileText,
  Heart,
  ChevronRight,
  Bell,
  Moon,
  HelpCircle,
  Mail,
  Info,
  Ban,
  UserX,
  Trash2,
  Globe,
  LogOut,
  User,
  MapPin,
  School,
  AlignLeft,
  Eye,
  EyeOff,
  Crown,
  CreditCard,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { safeAvatarUri } from '@/lib/safe-image-uri';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage, Language } from '@/providers/LanguageProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { presentCustomerCenter } from '@/lib/revenuecat';
import {
  cardPadding,
  fieldGap,
  iconLg,
  iconMd,
  iconSm,
  inputMinHeight,
  radiusLg,
  radiusMd,
  radiusSm,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { useUserProfile, useUpdateUserProfile, uploadProfilePhoto } from '@/lib/supabase-hooks';
import { APP_LAUNCH_ENGLISH_UI_ONLY } from '@/lib/app-ui-languages';
import PhotoPicker from '@/components/PhotoPicker';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBorder?: boolean;
  /** When false, hides the right chevron (e.g. for display-only rows like App Version). */
  showChevron?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, showBorder = true, showChevron = true }: SettingsItemProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingsItem, showBorder && styles.settingsItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemIcon}>{icon}</View>
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingsItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showChevron && <ChevronRight color={colors.textMuted} size={iconMd} />}
    </TouchableOpacity>
  );
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, refreshProfile, applyServerProfilePatch, resetOnboarding } = useAuth();
  const queryClient = useQueryClient();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { colors, preference: themePreference } = useTheme();
  const { isPremium, isPaywallEnabled } = useSubscription();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const { data: profile } = useUserProfile(user?.id);
  const updateProfileMutation = useUpdateUserProfile();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [university, setUniversity] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const appVersion =
    Constants.expoConfig?.version ||
    (Constants as any)?.manifest?.version ||
    'unknown';
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  const androidBuild = Constants.expoConfig?.android?.versionCode;
  const buildLabel = Platform.OS === 'ios' ? iosBuild : androidBuild;
  const appVersionLabel = buildLabel ? `${appVersion} (${buildLabel})` : appVersion;

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCity(profile.city || '');
      setUniversity(profile.university || '');
      setYearOfStudy(profile.year_of_study?.toString() || '');
      setBio(profile.bio || '');
      setIsPublic(profile.is_public);
      setPhotoUri(profile.profile_photo_url || profile.avatar);
    }
  }, [profile]);

  const loadBlockedUsers = async () => {
    try {
      setBlockedUsers(await loadBlockedUsersFromStorage());
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    if (!name.trim()) {
      Alert.alert(t('settings.missingInfo'), t('settings.nameRequired'));
      return;
    }

    try {
      setIsSaving(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const isRemotePhotoUri = (u: string) => /^https?:\/\//i.test(u);
      let photoUrl: string | undefined =
        profile?.profile_photo_url ??
        (typeof photoUri === 'string' && isRemotePhotoUri(photoUri) ? photoUri : undefined);

      // Any non-http(s) URI from the picker needs upload (file, content, ph, assets-library, etc.)
      const needsPhotoUpload =
        typeof photoUri === 'string' && photoUri.length > 0 && !isRemotePhotoUri(photoUri);
      if (needsPhotoUpload && photoUri) {
        setIsUploading(true);
        try {
          photoUrl = await uploadProfilePhoto(user.id, photoUri);
        } catch (error) {
          console.error('Error uploading photo:', error);
          Alert.alert(t('settings.uploadErrorTitle'), t('settings.uploadErrorMsg'));
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const updated = await updateProfileMutation.mutateAsync({
        userId: user.id,
        name: name.trim(),
        city: city.trim() || undefined,
        university: university.trim() || undefined,
        year_of_study: yearOfStudy ? parseInt(yearOfStudy, 10) : undefined,
        bio: bio.trim() || undefined,
        is_public: isPublic,
        profile_photo_url: photoUrl,
      });

      await refreshProfile();
      applyServerProfilePatch({
        profile_photo_url: updated?.profile_photo_url,
        avatar: updated?.avatar,
        name: updated?.name,
      });
      await queryClient.refetchQueries({ queryKey: ['userProfile', user.id] });
      const savedPhotoDisplay = updated?.profile_photo_url || updated?.avatar;
      if (savedPhotoDisplay) setPhotoUri(savedPhotoDisplay);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(t('common.ok'), t('settings.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.ok'), t('settings.profileUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblockUser = (user: BlockedUser) => {
    Alert.alert(
      t('settings.unblockUser'),
      t('settings.unblockConfirmMessage').replace('{name}', user.name),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.unblockButton'),
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              const updated = await removeBlockedUserById(user.id);
              setBlockedUsers(updated);
            } catch (e) {
              console.error('Failed to unblock user:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="settingsScreen">
      <LinearGradient
        colors={[colors.background, colors.backgroundLight, colors.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Appbar.Header style={[styles.appbar, { backgroundColor: colors.background }]}>
          <Appbar.BackAction
            onPress={() => router.back()}
            accessibilityLabel="settings-go-back"
            testID="settingsBack"
          />
          <Appbar.Content title={t('settings.title')} />
        </Appbar.Header>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: space.space7 }]}
        >
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <View style={[styles.sectionHeader, { marginBottom: fieldGap }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.myProfile')}</Text>
              <Button
                mode="outlined"
                onPress={handleSaveProfile}
                loading={isSaving || isUploading}
                disabled={isSaving || isUploading}
                icon="content-save"
              >
                {t('settings.save')}
              </Button>
            </View>
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.profilePhotoSection, { borderBottomColor: colors.glassBorder }]}>
                <PhotoPicker
                  currentPhotoUrl={photoUri}
                  onPhotoSelected={setPhotoUri}
                  onPhotoRemoved={() => setPhotoUri(profile?.profile_photo_url || profile?.avatar)}
                  size={80}
                />
              </View>

              <View style={[styles.profileInputGroup, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.inputLabel}>
                  <User color={colors.primary} size={iconSm} />
                  <Text style={[styles.inputLabelText, { color: colors.textSecondary }]}>{t('settings.nameLabel')}</Text>
                </View>
                <TextInput
                  style={[styles.profileTextInput, { backgroundColor: 'rgba(255,255,255,0.06)', color: colors.text, borderColor: colors.glassBorder }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('settings.namePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  maxLength={100}
                />
              </View>

              <View style={[styles.profileInputGroup, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.inputLabel}>
                  <MapPin color={colors.accent} size={iconSm} />
                  <Text style={[styles.inputLabelText, { color: colors.textSecondary }]}>{t('settings.cityLabel')}</Text>
                </View>
                <TextInput
                  style={[styles.profileTextInput, { backgroundColor: 'rgba(255,255,255,0.06)', color: colors.text, borderColor: colors.glassBorder }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder={t('settings.cityPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  maxLength={100}
                />
              </View>

              <View style={[styles.profileInputGroup, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.inputLabel}>
                  <School color={colors.secondary} size={iconSm} />
                  <Text style={[styles.inputLabelText, { color: colors.textSecondary }]}>{t('editProfile.universityFacultyLabel')}</Text>
                </View>
                <TextInput
                  style={[styles.profileTextInput, { backgroundColor: 'rgba(255,255,255,0.06)', color: colors.text, borderColor: colors.glassBorder }]}
                  value={university}
                  onChangeText={setUniversity}
                  placeholder={t('editProfile.universityExamplePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  maxLength={200}
                />
              </View>

              <View style={[styles.profileInputGroup, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.inputLabel}>
                  <School color={colors.warning} size={iconSm} />
                  <Text style={[styles.inputLabelText, { color: colors.textSecondary }]}>{t('editProfile.yearLabel')}</Text>
                </View>
                <View style={styles.yearSelector}>
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.yearButton, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: colors.glassBorder }, yearOfStudy === year.toString() && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setYearOfStudy(year.toString());
                      }}
                    >
                      <Text style={[styles.yearButtonText, { color: colors.textSecondary }, yearOfStudy === year.toString() && { color: colors.text, fontWeight: '700' as const }]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.profileInputGroup, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.inputLabel}>
                  <AlignLeft color={colors.accentPink} size={iconSm} />
                  <Text style={[styles.inputLabelText, { color: colors.textSecondary }]}>{t('editProfile.bioLabel')}</Text>
                </View>
                <TextInput
                  style={[styles.profileTextInput, styles.textArea, { backgroundColor: 'rgba(255,255,255,0.06)', color: colors.text, borderColor: colors.glassBorder }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder={t('editProfile.bioPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>{bio.length}/500</Text>
              </View>

              <View style={styles.privacySection}>
                <View style={styles.privacyIcon}>
                  {isPublic ? <Eye color={colors.success} size={iconLg} /> : <EyeOff color={colors.textMuted} size={iconLg} />}
                </View>
                <View style={styles.privacyInfo}>
                  <Text style={styles.settingsItemTitle}>{t('editProfile.publicProfile')}</Text>
                  <Text style={styles.settingsItemSubtitle}>
                    {isPublic ? t('editProfile.publicProfileOn') : t('editProfile.publicProfileOff')}
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={(value) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setIsPublic(value);
                  }}
                  trackColor={{ false: colors.cardBgLight, true: colors.success }}
                  thumbColor={colors.text}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              {!APP_LAUNCH_ENGLISH_UI_ONLY && (
              <View style={[styles.languageSection, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.languageSectionHeader}>
                  <View style={styles.settingsItemIcon}>
                    <Globe color={colors.primary} size={iconLg} />
                  </View>
                  <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>{t('settings.language')}</Text>
                    <Text style={styles.settingsItemSubtitle}>{t('settings.languageSubtitle')}</Text>
                  </View>
                </View>
                <View style={[styles.languageSelector, { borderColor: colors.glassBorder }]}>
                  {languages.map((lang) => {
                    const isActive = currentLanguage === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.languageButton,
                          isActive && styles.languageButtonActive,
                        ]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          changeLanguage(lang.code);
                        }}
                        activeOpacity={0.7}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          />
                        )}
                        <Text style={styles.languageFlag}>{lang.flag}</Text>
                        <Text style={[
                          styles.languageLabel,
                          isActive && styles.languageLabelActive,
                        ]}>
                          {lang.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              )}
              <SettingsItem
                icon={<Bell color={colors.primary} size={iconLg} />}
                title={t('settings.notifications')}
                subtitle={t('settings.notificationsSubtitle')}
                onPress={() => router.push('/notifications')}
              />
              <SettingsItem
                icon={<Moon color={colors.accent} size={iconLg} />}
                title={t('settings.appearance')}
                subtitle={
                  themePreference === 'system'
                    ? t('appearance.themeAuto')
                    : themePreference === 'light'
                    ? t('appearance.themeLight')
                    : t('appearance.themeDark')
                }
                onPress={() => router.push('/appearance')}
                showBorder={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.privacySafety')}</Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.blockedUsersHeader}>
                <View style={styles.blockedUsersIcon}>
                  <Ban color={colors.error} size={iconLg} />
                </View>
                <View style={styles.blockedUsersInfo}>
                  <Text style={styles.settingsItemTitle}>{t('settings.blockedUsers')}</Text>
                  <Text style={styles.settingsItemSubtitle}>
                    {blockedUsers.length === 0
                      ? t('settings.noBlockedUsers')
                      : blockedUsers.length === 1
                        ? t('settings.blockedUsersCount').replace('{count}', String(blockedUsers.length))
                        : t('settings.blockedUsersCountPlural').replace('{count}', String(blockedUsers.length))}
                  </Text>
                </View>
              </View>

              {blockedUsers.length > 0 && (
                <View style={[styles.blockedUsersList, { borderTopColor: colors.glassBorder }]}>
                  {blockedUsers.map((user, index) => (
                    <View
                      key={user.id}
                      style={[
                        styles.blockedUserItem,
                        index < blockedUsers.length - 1 && styles.blockedUserItemBorder
                      ]}
                    >
                      <Image
                        source={{ uri: safeAvatarUri(user.avatar, user.id) }}
                        style={styles.blockedUserAvatar}
                      />
                      <View style={styles.blockedUserInfo}>
                        <Text style={styles.blockedUserName}>{user.name}</Text>
                        <Text style={styles.blockedUserDate}>
                          {t('settings.blockedDate').replace('{date}', new Date(user.blockedAt).toLocaleDateString())}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.unblockButton}
                        onPress={() => handleUnblockUser(user)}
                      >
                        <UserX color={colors.error} size={iconSm} />
                        <Text style={[styles.unblockButtonText, { color: colors.error }]}>{t('settings.unblockButton')}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.support')}</Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <SettingsItem
                icon={<HelpCircle color={colors.warning} size={iconLg} />}
                title={t('settings.helpCenter')}
                subtitle={t('settings.helpCenterSubtitle')}
                onPress={() => router.push('/support/help-center')}
              />
              <SettingsItem
                icon={<BookOpen color={colors.accent} size={iconLg} />}
                title={t('settings.showIntroAgain')}
                subtitle={t('settings.showIntroAgainSubtitle')}
                onPress={() =>
                  Alert.alert(t('settings.showIntroAgain'), t('settings.showIntroAgainConfirm'), [
                    { text: t('settings.cancel'), style: 'cancel' },
                    {
                      text: t('settings.showIntroAgainButton'),
                      onPress: async () => {
                        await resetOnboarding();
                        router.replace('/(auth)/onboarding');
                      },
                    },
                  ])
                }
              />
              <SettingsItem
                icon={<Mail color={colors.accentPink} size={iconLg} />}
                title={t('settings.contactSupport')}
                subtitle={t('settings.contactSupportSubtitle')}
                onPress={() => router.push('/support/contact-support')}
                showBorder={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.legal')}</Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <SettingsItem
                icon={<Shield color={colors.primary} size={iconLg} />}
                title={t('settings.privacyPolicy')}
                subtitle={t('settings.privacyPolicySubtitle')}
                onPress={() => router.push('/legal/privacy-policy')}
              />
              <SettingsItem
                icon={<FileText color={colors.accent} size={iconLg} />}
                title={t('settings.termsOfService')}
                subtitle={t('settings.termsOfServiceSubtitle')}
                onPress={() => router.push('/legal/terms-of-service')}
              />
              <SettingsItem
                icon={<Heart color={colors.success} size={iconLg} />}
                title={t('settings.codeOfConduct')}
                subtitle={t('settings.codeOfConductSubtitle')}
                onPress={() => router.push('/legal/code-of-conduct')}
                showBorder={false}
              />
            </View>
          </View>

          {isPaywallEnabled && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.subscriptionSection')}</Text>
              <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                  style={StyleSheet.absoluteFill}
                />
                {isPremium ? (
                  <SettingsItem
                    icon={<CreditCard color={colors.success} size={iconLg} />}
                    title={t('settings.manageSubscription')}
                    subtitle={t('settings.manageSubscriptionSubtitle')}
                    onPress={() => presentCustomerCenter()}
                    showBorder={false}
                  />
                ) : (
                  <SettingsItem
                    icon={<Crown color={colors.warning} size={iconLg} />}
                    title={t('profile.upgradeToPremium')}
                    subtitle={t('profile.upgradeBannerSubtitleAll')}
                    onPress={() => router.push('/paywall')}
                    showBorder={false}
                  />
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.account')}</Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <TouchableOpacity
                style={[styles.deleteAccountItem, styles.settingsItemBorder, { borderBottomColor: colors.glassBorder }]}
                onPress={() => router.push('/delete-account')}
                activeOpacity={0.7}
              >
                <View style={styles.deleteAccountIcon}>
                  <Trash2 color={colors.error} size={iconLg} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.deleteAccountTitle, { color: colors.error }]}>{t('settings.deleteAccount')}</Text>
                  <Text style={[styles.deleteAccountSubtitle, { color: colors.textMuted }]}>{t('settings.deleteAccountSubtitle')}</Text>
                </View>
                <ChevronRight color={colors.error} size={iconMd} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signOutItem}
                onPress={() => {
                  Alert.alert(
                    t('settings.signOutConfirmTitle'),
                    t('settings.signOutConfirmMessage'),
                    [
                      { text: t('settings.cancel'), style: 'cancel' },
                      {
                        text: t('settings.signOut'),
                        style: 'destructive',
                        onPress: async () => {
                          if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }
                          await signOut();
                          router.replace('/(auth)/login');
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.signOutIcon}>
                  <LogOut color={colors.warning} size={iconLg} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.signOutTitle, { color: colors.warning }]}>{t('settings.signOut')}</Text>
                  <Text style={[styles.signOutSubtitle, { color: colors.textMuted }]}>{t('settings.signOutSubtitle')}</Text>
                </View>
                <ChevronRight color={colors.warning} size={iconMd} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.about')}</Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <SettingsItem
                icon={<Info color={colors.textSecondary} size={iconLg} />}
                title={t('settings.appVersion')}
                subtitle={appVersionLabel}
                onPress={() => Alert.alert(t('settings.appVersion'), appVersionLabel)}
                showBorder={false}
                showChevron={false}
              />
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: colors.glassBorder }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('settings.footer')}</Text>
            <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>{t('settings.footerSubtext')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  appbar: {
    elevation: 0,
    shadowOpacity: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space4,
    borderBottomWidth: 1,
  },
  title: {
    ...typeScale.title2,
    fontWeight: '700' as const,
  },
  closeButton: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingX,
    paddingTop: screenPaddingX,
    paddingBottom: space.space8,
  },
  section: {
    marginBottom: sectionGap,
  },
  sectionTitle: {
    ...typeScale.footnote,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: space.space3,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: radiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
  },
  settingsItemIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radiusMd,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemContent: {
    flex: 1,
    marginLeft: screenPaddingX,
  },
  settingsItemTitle: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
  settingsItemSubtitle: {
    ...typeScale.footnote,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  footerText: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
  footerSubtext: {
    ...typeScale.footnote,
    marginTop: 4,
  },
  blockedUsersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  blockedUsersIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radiusMd,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedUsersInfo: {
    flex: 1,
    marginLeft: screenPaddingX,
  },
  blockedUsersList: {
    borderTopWidth: 1,
  },
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  blockedUserItemBorder: {
    borderBottomWidth: 1,
  },
  blockedUserAvatar: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
  },
  blockedUserInfo: {
    flex: 1,
    marginLeft: space.space3,
  },
  blockedUserName: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  blockedUserDate: {
    ...typeScale.caption,
    marginTop: 2,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    borderRadius: radiusLg,
    gap: 6,
  },
  unblockButtonText: {
    ...typeScale.footnote,
    fontWeight: '600' as const,
  },
  deleteAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  deleteAccountIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radiusMd,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAccountTitle: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
  deleteAccountSubtitle: {
    ...typeScale.footnote,
    marginTop: 2,
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  signOutIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radiusMd,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutTitle: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
  signOutSubtitle: {
    ...typeScale.footnote,
    marginTop: 2,
  },
  languageSection: {
    padding: screenPaddingX,
    borderBottomWidth: 1,
  },
  languageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: cardPadding,
  },
  languageSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radiusMd,
    padding: 4,
    gap: 4,
    borderWidth: 1,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.space3,
    paddingHorizontal: space.space2,
    borderRadius: radiusSm,
    gap: 6,
    overflow: 'hidden',
    minHeight: touchTargetMin,
  },
  languageButtonActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  languageFlag: {
    ...typeScale.headline,
  },
  languageLabel: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  languageLabelActive: {
    fontWeight: '700' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.space3,
    marginLeft: 4,
  },
  saveProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space2,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveProfileButtonDisabled: {
    opacity: 0.5,
  },
  saveProfileButtonText: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  profilePhotoSection: {
    alignItems: 'center',
    padding: screenPaddingX,
    paddingBottom: space.space4,
    borderBottomWidth: 1,
  },
  profileInputGroup: {
    padding: screenPaddingX,
    borderBottomWidth: 1,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabelText: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  profileTextInput: {
    borderRadius: radiusMd,
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space3,
    ...typeScale.subhead,
    borderWidth: 1,
    minHeight: inputMinHeight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typeScale.caption,
    textAlign: 'right',
    marginTop: 6,
  },
  yearSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearButton: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearButtonActive: {
  },
  yearButtonText: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  yearButtonTextActive: {
    fontWeight: '700' as const,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  privacyIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radiusMd,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyInfo: {
    flex: 1,
    marginLeft: screenPaddingX,
    marginRight: space.space3,
  },
});
