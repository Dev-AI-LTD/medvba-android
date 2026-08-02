import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { contentMaxWidth } from '@/theme/iosDesign';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Centers a readable content column on wide / iPad layouts.
 * On phone widths the column simply fills available space.
 */
export function ContentColumn({ children, style }: Props) {
  return <View style={[styles.column, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
  },
});
