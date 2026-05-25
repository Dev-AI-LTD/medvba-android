import React from 'react';
import { View, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import {
  listRowMinHeight,
  screenPaddingX,
  space,
  touchTargetMin,
  iconMd,
  typeScale,
  hitSlop,
} from '@/theme/iosDesign';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ListRow({
  title,
  subtitle,
  left,
  right,
  showChevron = false,
  onPress,
  style,
}: Props) {
  const { colors } = useTheme();

  const content = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
      {showChevron ? (
        <ChevronRight color={colors.textMuted} size={iconMd} style={styles.chevron} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.row, styles.rowPressable, style]}
        hitSlop={hitSlop.default}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: listRowMinHeight,
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space2,
    gap: space.space2,
  },
  rowPressable: {
    minHeight: touchTargetMin,
  },
  left: {
    width: iconMd + space.space2,
    minHeight: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    ...typeScale.body,
  },
  subtitle: {
    ...typeScale.subhead,
    marginTop: space.space1,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: space.space1,
  },
});
