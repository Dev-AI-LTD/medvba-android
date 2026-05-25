import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { iconXs, iconSm, radiusMd, space, typeScale } from '@/theme/iosDesign';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function PremiumBadge({ size = 'medium', style }: PremiumBadgeProps) {
  const { colors } = useTheme();

  const dimensions = {
    small: { height: space.space5, padding: space.space1, fontSize: typeScale.caption2.fontSize, iconSize: iconXs - 6 },
    medium: { height: space.space6, padding: space.space2 - 2, fontSize: typeScale.caption.fontSize, iconSize: iconXs },
    large: { height: space.space7, padding: space.space2, fontSize: typeScale.footnote.fontSize, iconSize: iconSm - 6 },
  };

  const dim = dimensions[size];

  return (
    <View style={[styles.container, { height: dim.height }, style]}>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingHorizontal: dim.padding }]}>
          <Crown size={dim.iconSize} color="#FFF" strokeWidth={2.5} />
          <Text style={[styles.text, { fontSize: dim.fontSize }]}>PRO</Text>
        </View>
      </LinearGradient>
      <View style={[styles.glassEffect, { backgroundColor: colors.background + '30' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radiusMd,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space1,
  },
  text: {
    color: '#FFF',
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  glassEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.3,
  },
});
