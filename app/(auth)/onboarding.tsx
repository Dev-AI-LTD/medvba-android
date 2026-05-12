import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  ViewToken,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Users, Trophy, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';

const { width } = Dimensions.get('window');

/** Local asset path — Metro resolves `require` reliably; `@/` alias can fail for some native bundles. */
const APP_ICON_SOURCE = require('../../assets/images/icon.png');

function OnboardingAppLogo() {
  return (
    <View style={styles.onboardingLogoOuter} collapsable={false}>
      <Image
        source={APP_ICON_SOURCE}
        style={styles.onboardingLogoImage}
        resizeMode="contain"
      />
    </View>
  );
}

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

interface SlideData {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  gradient: string[];
}

const slidesData: SlideData[] = [
  {
    id: '1',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    descriptionKey: 'onboarding.slide1.description',
    icon: <OnboardingAppLogo />,
    gradient: [colors.primary, colors.primaryDark],
  },
  {
    id: '2',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    descriptionKey: 'onboarding.slide2.description',
    icon: <Brain size={80} color={colors.accent} strokeWidth={1.5} />,
    gradient: [colors.accent, colors.success],
  },
  {
    id: '3',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    descriptionKey: 'onboarding.slide3.description',
    icon: <Users size={80} color={colors.accentPink} strokeWidth={1.5} />,
    gradient: [colors.accentPink, colors.error],
  },
  {
    id: '4',
    titleKey: 'onboarding.slide4.title',
    subtitleKey: 'onboarding.slide4.subtitle',
    descriptionKey: 'onboarding.slide4.description',
    icon: <Trophy size={80} color={colors.streakOrange} strokeWidth={1.5} />,
    gradient: [colors.streakOrange, colors.streakYellow],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide> | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { completeOnboarding, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const slides: OnboardingSlide[] = useMemo(() => slidesData.map(slide => ({
    id: slide.id,
    title: t(slide.titleKey),
    subtitle: t(slide.subtitleKey),
    description: t(slide.descriptionKey),
    icon: slide.icon,
    gradient: slide.gradient,
  })), [t]);

  const handleGetStarted = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await completeOnboarding();
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [completeOnboarding, isAuthenticated]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      // Update UI immediately; rely on scroll position for the actual slide.
      setCurrentIndex(nextIndex);
      // `scrollToIndex` can fail on some targets if layout isn't measurable yet.
      // `scrollToOffset` works reliably with paging + fixed-width items.
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  }, [currentIndex, slides.length, handleGetStarted]);

  const handleSkip = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await completeOnboarding();
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [completeOnboarding, isAuthenticated]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={[`${item.gradient[0]}20`, `${item.gradient[1]}10`]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {item.icon}
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: item.gradient[0] }]}>{item.subtitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 3, 1],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: dotOpacity,
                  backgroundColor: slides[index].gradient[0],
                  transform: [{ scaleX: dotScale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: Platform.OS !== 'web' }
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {renderPagination()}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: slides[currentIndex].gradient[0] }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
            </Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  onboardingLogoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  onboardingLogoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
