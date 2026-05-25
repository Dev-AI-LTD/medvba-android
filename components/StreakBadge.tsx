import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import {
  iconXs,
  iconSm,
  iconLg,
  radiusPill,
  space,
  typeScale,
} from '@/theme/iosDesign';

interface StreakBadgeProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

export default function StreakBadge({ streak, size = 'medium' }: StreakBadgeProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [mountAnim]);

  useEffect(() => {
    if (streak > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulse.start();
      glow.start();
      
      return () => {
        pulse.stop();
        glow.stop();
      };
    }
  }, [pulseAnim, glowAnim, streak]);

  const getSize = () => {
    switch (size) {
      case 'small':
        return { icon: iconXs, fontSize: typeScale.subhead.fontSize, padding: space.space2 };
      case 'large':
        return { icon: iconLg, fontSize: typeScale.title3.fontSize, padding: space.space4 };
      default:
        return { icon: iconSm, fontSize: typeScale.body.fontSize, padding: space.space3 };
    }
  };

  const sizeConfig = getSize();
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  return (
    <Animated.View 
      style={[
        { 
          transform: [
            { scale: mountAnim },
            { scale: pulseAnim },
          ] 
        }
      ]}
    >
      <Animated.View
        style={[
          styles.glowContainer,
          {
            opacity: glowOpacity,
            borderRadius: radiusPill,
          },
        ]}
      />
      <View 
        style={[
          styles.container,
          { 
            paddingHorizontal: sizeConfig.padding * 1.5, 
            paddingVertical: sizeConfig.padding * 0.6,
            borderRadius: radiusPill,
          },
        ]}
      >
        <Flame color={colors.streakOrange} size={sizeConfig.icon} fill={colors.streakOrange} />
        <Text 
          style={[
            styles.text, 
            { 
              fontSize: sizeConfig.fontSize, 
              color: colors.streakOrange,
              fontWeight: typeScale.headline.fontWeight,
            }
          ]}
        >
          {streak}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    gap: space.space1,
  },
  text: {
    fontWeight: '700' as const,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 149, 0, 0.3)',
  },
});
