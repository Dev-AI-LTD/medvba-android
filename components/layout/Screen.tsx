import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/providers/ThemeProvider';
import { screenPaddingX } from '@/theme/iosDesign';

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  /** Applies standard 16pt horizontal padding to the content wrapper. */
  padded?: boolean;
  /** Optional brand gradient behind content (uses theme background colors). */
  withGradient?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = true,
  withGradient = false,
  style,
  contentStyle,
}: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }, style]}
      edges={edges}
    >
      {withGradient ? (
        <LinearGradient
          colors={[colors.background, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: screenPaddingX,
  },
});
