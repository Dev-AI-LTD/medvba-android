import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/layout';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import {
  iconLg,
  radiusLg,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';

type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeOption {
  mode: ThemeMode;
  icon: typeof Sun;
  titleKey: string;
  descKey: string;
}

export default function AppearanceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { preference, setPreference, colors, isTransitioning } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(1));

  const selectTheme = (theme: ThemeMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setPreference(theme === 'auto' ? 'system' : theme);
  };

  const themeOptions: ThemeOption[] = [
    {
      mode: 'auto',
      icon: Smartphone,
      titleKey: 'appearance.themeAuto',
      descKey: 'appearance.themeAutoDesc',
    },
    {
      mode: 'light',
      icon: Sun,
      titleKey: 'appearance.themeLight',
      descKey: 'appearance.themeLightDesc',
    },
    {
      mode: 'dark',
      icon: Moon,
      titleKey: 'appearance.themeDark',
      descKey: 'appearance.themeDarkDesc',
    },
  ];

  const currentMode = preference === 'system' ? 'auto' : preference;

  return (
    <Screen withGradient edges={['top', 'bottom']} padded={false}>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => router.back()}
        title={t('appearance.title')}
        backVariant="pill"
        bordered
      />

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!isTransitioning}
          >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('appearance.themeSection')}
            </Text>
            <View style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
              <LinearGradient
                colors={[colors.cardBgLight, colors.cardBg]}
                style={StyleSheet.absoluteFill}
              />
              {themeOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = currentMode === option.mode;
                const isLast = index === themeOptions.length - 1;

                const iconColors: Record<ThemeMode, string> = {
                  auto: colors.primary,
                  light: colors.warning,
                  dark: colors.accent,
                };

                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.themeOption,
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.glassBorder,
                      },
                    ]}
                    onPress={() => selectTheme(option.mode)}
                    activeOpacity={0.7}
                    disabled={isTransitioning}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected
                            ? colors.primary
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View
                      style={[
                        styles.themeIconContainer,
                        { backgroundColor: colors.cardBgLight },
                      ]}
                    >
                      <Icon color={iconColors[option.mode]} size={iconLg} />
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeTitle, { color: colors.text }]}>
                        {t(option.titleKey)}
                      </Text>
                      <Text
                        style={[
                          styles.themeDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t(option.descKey)}
                      </Text>
                    </View>
                    {isTransitioning && isSelected && (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
        </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: screenPaddingX,
    paddingTop: screenPaddingX,
    paddingBottom: space.space8,
  },
  section: {
    marginBottom: sectionGap,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: radiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
    gap: space.space3,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    ...typeScale.body,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
