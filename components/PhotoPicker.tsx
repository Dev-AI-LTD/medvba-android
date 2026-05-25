import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Upload } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/providers/ThemeProvider';
import type { AppColors } from '@/constants/colors';
import { iconSm, radiusMd, touchTargetMin } from '@/theme/iosDesign';

interface PhotoPickerProps {
  currentPhotoUrl?: string;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved?: () => void;
  size?: number;
  showRemoveButton?: boolean;
}

export default function PhotoPicker({
  currentPhotoUrl,
  onPhotoSelected,
  onPhotoRemoved,
  size = 120,
  showRemoveButton = true,
}: PhotoPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isLoading, setIsLoading] = useState(false);
  const pickInProgress = useRef(false);
  const lastSelectedUri = useRef<string | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need photo library permissions to change your profile picture.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = useCallback(async () => {
    if (pickInProgress.current) return;
    pickInProgress.current = true;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      pickInProgress.current = false;
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].uri) {
        const selectedUri = result.assets[0].uri;
        
        // Prevent duplicate selections
        if (lastSelectedUri.current === selectedUri) {
          console.log('[PhotoPicker] Duplicate selection detected, ignoring');
          pickInProgress.current = false;
          setIsLoading(false);
          return;
        }
        
        lastSelectedUri.current = selectedUri;
        console.log('[PhotoPicker] Photo selected, URI length:', selectedUri.length);
        onPhotoSelected(selectedUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
      pickInProgress.current = false;
    }
  }, [onPhotoSelected]);

  useEffect(() => {
    return () => {
      lastSelectedUri.current = null;
    };
  }, []);

  const handlePhotoOptions = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const canRemove = !!(currentPhotoUrl && showRemoveButton && onPhotoRemoved);

    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Choose from Library',
          onPress: () => pickImage(),
        },
        ...(canRemove
          ? [
              {
                text: 'Reset to Default Avatar',
                style: 'destructive' as const,
                onPress: () => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }
                  onPhotoRemoved?.();
                },
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  }, [currentPhotoUrl, showRemoveButton, onPhotoRemoved, pickImage]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <TouchableOpacity
        style={[styles.photoContainer, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={handlePhotoOptions}
        activeOpacity={0.8}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
      >
        {currentPhotoUrl ? (
          <Image source={{ uri: currentPhotoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Upload color={colors.textSecondary} size={size / 3} />
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <View style={styles.editButton}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Upload color={colors.text} size={iconSm} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoContainer: {
      borderWidth: 3,
      borderColor: colors.primary,
      overflow: 'hidden',
      backgroundColor: colors.cardBg,
      minWidth: touchTargetMin,
      minHeight: touchTargetMin,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBgLight,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: touchTargetMin,
      height: touchTargetMin,
      borderRadius: touchTargetMin / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
      overflow: 'hidden',
    },
  });
}
