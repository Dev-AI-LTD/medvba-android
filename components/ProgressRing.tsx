import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/providers/ThemeProvider';
import { space, typeScale } from '@/theme/iosDesign';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
  label?: string;
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  showPercentage = true,
  label,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const ringColor = color || colors.primary;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, [progress, animatedValue, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.cardBgLight}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showPercentage && (
        <View style={[styles.labelContainer, { width: size, height: size }]}>
          <Text 
            style={[
              styles.percentage, 
              { 
                color: colors.text,
                ...typeScale.headline,
              }
            ]}
          >
            {Math.round(progress)}%
          </Text>
          {label && (
            <Text 
              style={[
                styles.label, 
                { 
                  color: colors.textSecondary,
                  ...typeScale.caption,
                  marginTop: space.space1,
                }
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontWeight: '700' as const,
  },
  label: {
    fontWeight: '400' as const,
  },
});
