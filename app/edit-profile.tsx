import React, { useState, useMemo, useCallback, useRef } from 'react';
import { getDefaultAvatarUrl } from '@/lib/avatar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Camera, Save, User, MapPin, School, BookOpen, Eye, EyeOff, X } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import {
  buttonHeight,
  cardPadding,
  fieldGap,
  iconLg,
  iconMd,
  iconSm,
  iconXl,
  inputMinHeight,
  radiusLg,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import GlassCard from '@/components/GlassCard';
import { useUpdateUserProfile, useUserProfile, uploadProfilePhoto } from '@/lib/supabase-hooks';
import PhotoPicker from '@/components/PhotoPicker';
import { useQueryClient } from '@tanstack/react-query';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile, applyServerProfilePatch } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(user?.id);
  const updateProfileMutation = useUpdateUserProfile();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [university, setUniversity] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const lastProcessedUri = useRef<string | null>(null);
  const uploadInProgress = useRef(false);
  const isPickerActive = useRef(false);

  // Reset picker state on mount/unmount
  React.useEffect(() => {
    return () => {
      isPickerActive.current = false;
      lastProcessedUri.current = null;
      uploadInProgress.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setUniversity(profile.university || '');
      setYearOfStudy(profile.year_of_study ? profile.year_of_study.toString() : '');
      setIsPublic(profile.is_public);
    }
  }, [profile]);

  const handlePhotoRemoved = useCallback(async () => {
    if (!user?.id) return;
    if (uploadInProgress.current) return;
    
    setIsUploadingPhoto(true);
    try {
      const dicebearUrl = getDefaultAvatarUrl(user.id);
      setLocalPhotoUri(null);
      const updated = await updateProfileMutation.mutateAsync({
        userId: user.id,
        profile_photo_url: dicebearUrl,
      });
      await refreshProfile();
      applyServerProfilePatch({
        profile_photo_url: updated?.profile_photo_url,
        avatar: updated?.avatar,
        name: updated?.name,
      });
      await queryClient.refetchQueries({ queryKey: ['userProfile', user.id] });
      if (Platform.OS !== 'web') {
        Alert.alert(t('editProfile.photoResetTitle'), t('editProfile.photoResetMessage'));
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error) || 'Unknown error';
      Alert.alert(
        t('common.error'),
        t('editProfile.photoResetFailed').replace('{error}', errorMsg),
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [user?.id, updateProfileMutation, refreshProfile, queryClient, applyServerProfilePatch, t]);

  const handlePhotoSelected = useCallback(async (uri: string) => {
    // Ultimate guard - if picker isn't active, ignore
    if (!isPickerActive.current) {
      console.log('[EditProfile] Picker not active, ignoring callback');
      return;
    }
    
    if (!user?.id) {
      isPickerActive.current = false;
      return;
    }
    
    if (lastProcessedUri.current === uri) {
      console.log('[EditProfile] Same URI already processed, ignoring');
      isPickerActive.current = false;
      return;
    }
    
    if (uploadInProgress.current) {
      console.log('[EditProfile] Upload already in progress, ignoring');
      isPickerActive.current = false;
      return;
    }

    console.log('[EditProfile] Photo selected, URI:', uri.substring(0, 50));
    
    // Immediately disable picker to prevent any re-triggers
    isPickerActive.current = false;
    uploadInProgress.current = true;
    lastProcessedUri.current = uri;
    setIsPickingPhoto(false);
    setIsUploadingPhoto(true);

    const userId = user.id;
    const localUri = uri;
    setLocalPhotoUri(localUri);

    try {
      console.log('[EditProfile] Uploading photo for user:', userId);
      const photoUrl = await uploadProfilePhoto(userId, localUri);
      console.log('[EditProfile] Photo uploaded, URL:', photoUrl);

      console.log('[EditProfile] Updating profile with new photo URL');
      const updated = await updateProfileMutation.mutateAsync({
        userId: userId,
        profile_photo_url: photoUrl,
      });
      console.log('[EditProfile] Profile updated successfully');

      await refreshProfile();
      applyServerProfilePatch({
        profile_photo_url: updated?.profile_photo_url,
        avatar: updated?.avatar,
        name: updated?.name,
      });
      await queryClient.refetchQueries({ queryKey: ['userProfile', userId] });

      setLocalPhotoUri(null);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('[EditProfile] Error:', error?.message || error);
      const errorMsg = error?.message || 'Unknown error';
      if (Platform.OS === 'web') {
        alert(`${t('editProfile.uploadError')} (${errorMsg})`);
      } else {
        Alert.alert(t('common.ok'), `${t('editProfile.uploadError')} (${errorMsg})`);
      }
      setLocalPhotoUri(null);
    } finally {
      uploadInProgress.current = false;
      setIsUploadingPhoto(false);
    }
  }, [user?.id, updateProfileMutation, refreshProfile, queryClient, applyServerProfilePatch, t]);

  const openPhotoPicker = useCallback(() => {
    // Reset all states before opening
    isPickerActive.current = true;
    lastProcessedUri.current = null;
    uploadInProgress.current = false;
    setIsPickingPhoto(true);
  }, []);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert(t('editProfile.nameRequired'));
      } else {
        Alert.alert(t('common.ok'), t('editProfile.nameRequired'));
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const updated = await updateProfileMutation.mutateAsync({
        userId: user.id,
        name: name.trim(),
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        university: university.trim() || undefined,
        year_of_study: yearOfStudy ? parseInt(yearOfStudy, 10) : undefined,
        is_public: isPublic,
      });

      await refreshProfile();
      applyServerProfilePatch({
        profile_photo_url: updated?.profile_photo_url,
        avatar: updated?.avatar,
        name: updated?.name,
      });
      await queryClient.refetchQueries({ queryKey: ['userProfile', user.id] });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      if (Platform.OS === 'web') {
        alert(t('editProfile.updateError'));
      } else {
        Alert.alert(t('common.ok'), t('editProfile.updateError'));
      }
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.background, colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft color={colors.text} size={iconXl} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('editProfile.loadingProfile')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const displayAvatar = localPhotoUri || profile?.profile_photo_url || profile?.avatar;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.background, colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft color={colors.text} size={iconXl} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, updateProfileMutation.isPending && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}
            activeOpacity={0.7}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Save color={colors.primary} size={iconLg} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.photoSection}>
            <View style={styles.avatarContainer}>
              {displayAvatar && <Image source={{ uri: displayAvatar }} style={styles.avatar} />}
              {isUploadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={openPhotoPicker}
              disabled={isUploadingPhoto}
              activeOpacity={0.7}
            >
              <Camera color={colors.primary} size={iconSm} />
              <Text style={styles.changePhotoText}>{t('editProfile.changePhoto')}</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.formSection}>
            <Text style={styles.sectionTitle}>{t('editProfile.basicInfo')}</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <User color={colors.textSecondary} size={iconSm} />
                <Text style={styles.labelText}>{t('editProfile.nameLabel')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('editProfile.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <BookOpen color={colors.textSecondary} size={iconSm} />
                <Text style={styles.labelText}>{t('editProfile.bioLabel')}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder={t('editProfile.bioPlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.formSection}>
            <Text style={styles.sectionTitle}>{t('editProfile.studyInfo')}</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <MapPin color={colors.textSecondary} size={iconSm} />
                <Text style={styles.labelText}>{t('editProfile.cityLabel')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder={t('editProfile.cityPlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <School color={colors.textSecondary} size={iconSm} />
                <Text style={styles.labelText}>{t('editProfile.universityLabel')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={university}
                onChangeText={setUniversity}
                placeholder={t('editProfile.universityPlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <BookOpen color={colors.textSecondary} size={iconSm} />
                <Text style={styles.labelText}>{t('editProfile.yearLabel')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={yearOfStudy}
                onChangeText={(text) => setYearOfStudy(text.replace(/[^0-9]/g, ''))}
                placeholder="1-6"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.formSection}>
            <Text style={styles.sectionTitle}>{t('editProfile.privacy')}</Text>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setIsPublic(!isPublic);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.toggleLabel}>
                {isPublic ? <Eye color={colors.success} size={iconMd} /> : <EyeOff color={colors.textMuted} size={iconMd} />}
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleTitle}>{t('editProfile.publicProfile')}</Text>
                  <Text style={styles.toggleDescription}>
                    {isPublic ? t('editProfile.publicProfileOn') : t('editProfile.publicProfileOff')}
                  </Text>
                </View>
              </View>
              <View style={[styles.toggle, isPublic && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>

      {isPickingPhoto && !isUploadingPhoto && (
        <View style={StyleSheet.absoluteFill}>
          <PhotoPicker
            currentPhotoUrl={displayAvatar}
            onPhotoSelected={handlePhotoSelected}
            onPhotoRemoved={handlePhotoRemoved}
            size={120}
            showRemoveButton={true}
          />
          <TouchableOpacity
            style={styles.photoPickerClose}
            onPress={() => {
              isPickerActive.current = false;
              setIsPickingPhoto(false);
            }}
            activeOpacity={0.7}
          >
            <X color={colors.text} size={iconXl} />
          </TouchableOpacity>
        </View>
      )}
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenPaddingX,
      paddingVertical: space.space4,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    headerTitle: {
      ...typeScale.title3,
      fontWeight: '700' as const,
      color: colors.text,
    },
    backButton: {
      width: touchTargetMin,
      height: touchTargetMin,
      borderRadius: touchTargetMin / 2,
      backgroundColor: colors.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    saveButton: {
      width: touchTargetMin,
      height: touchTargetMin,
      borderRadius: touchTargetMin / 2,
      backgroundColor: colors.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...typeScale.subhead,
      color: colors.textSecondary,
      marginTop: cardPadding,
    },
    scrollContent: {
      paddingHorizontal: screenPaddingX,
      paddingTop: screenPaddingX,
      paddingBottom: space.space8,
    },
    photoSection: {
      alignItems: 'center',
      paddingVertical: sectionGap,
      marginBottom: cardPadding,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: cardPadding,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: colors.primary,
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    changePhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: screenPaddingX,
      paddingVertical: 10,
      minHeight: touchTargetMin,
      backgroundColor: colors.cardBgLight,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    changePhotoText: {
      ...typeScale.subhead,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    formSection: {
      marginBottom: cardPadding,
    },
    sectionTitle: {
      ...typeScale.headline,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: space.space5,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    labelText: {
      ...typeScale.subhead,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    input: {
      backgroundColor: colors.cardBgLight,
      borderRadius: radiusMd,
      paddingHorizontal: screenPaddingX,
      paddingVertical: space.space3,
      ...typeScale.subhead,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      minHeight: inputMinHeight,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 14,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: space.space3,
      minHeight: touchTargetMin,
    },
    toggleLabel: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toggleTextContainer: {
      flex: 1,
    },
    toggleTitle: {
      ...typeScale.subhead,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    toggleDescription: {
      ...typeScale.footnote,
      color: colors.textMuted,
    },
    toggle: {
      width: 52,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.cardBgLight,
      borderWidth: 2,
      borderColor: colors.glassBorder,
      padding: 2,
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    toggleThumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.text,
    },
    toggleThumbActive: {
      alignSelf: 'flex-end',
    },
    photoPickerClose: {
      position: 'absolute',
      top: 60,
      right: screenPaddingX,
      width: buttonHeight,
      height: buttonHeight,
      borderRadius: buttonHeight / 2,
      backgroundColor: colors.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
      zIndex: 1000,
    },
  });
