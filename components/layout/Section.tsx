import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/providers/ThemeProvider';
import { sectionGap, space, typeScale } from '@/theme/iosDesign';

type Props = {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Section({ title, children, style }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, style]}>
      {title ? (
        <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: sectionGap,
  },
  title: {
    ...typeScale.subheadMedium,
    marginBottom: space.space2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
