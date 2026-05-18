import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { screenPaddingX, space } from '@/theme/iosDesign';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Pins CTA above home indicator with standard horizontal padding. */
export function FixedBottomCta({ children, style }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: insets.bottom + space.space4,
          borderTopColor: colors.glassBorder,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: screenPaddingX,
    paddingTop: space.space4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
