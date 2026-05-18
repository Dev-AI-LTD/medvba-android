import React from 'react';
import { View, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import {
  screenPaddingX,
  touchTargetMin,
  iconXl,
  typeScale,
  space,
} from '@/theme/iosDesign';

type Layout = 'tab' | 'stack-centered' | 'stack-inline';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: React.ReactNode;
  large?: boolean;
  /** tab: title left + action right. stack-centered: back + centered title. stack-inline: back + label (chat). */
  layout?: Layout;
  /** Pill/circle back control (settings-style). */
  backVariant?: 'plain' | 'pill';
  bordered?: boolean;
  /** When false, omit horizontal padding (parent `Screen` already uses `padded`). */
  inset?: boolean;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  rightAction,
  large = false,
  layout = 'stack-centered',
  backVariant = 'plain',
  bordered = false,
  inset = true,
  style,
}: Props) {
  const { colors } = useTheme();

  const titleStyle = large ? styles.largeTitle : styles.title;
  const borderStyle = bordered ? { borderBottomColor: colors.glassBorder, borderBottomWidth: StyleSheet.hairlineWidth } : null;
  const wrapStyle = [styles.wrap, !inset && styles.wrapFlush, borderStyle, style];

  const backControl = onBack ? (
    <TouchableOpacity
      onPress={onBack}
      style={[
        layout === 'stack-inline' ? styles.backBtnInline : styles.backBtn,
        backVariant === 'pill' && {
          backgroundColor: colors.cardBg,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          borderRadius: touchTargetMin / 2,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={backLabel ?? 'Back'}
    >
      <ChevronLeft color={backVariant === 'pill' ? colors.text : colors.primary} size={iconXl} />
      {backLabel && layout === 'stack-inline' ? (
        <Text style={[styles.backLabel, { color: colors.primary }]} numberOfLines={1}>
          {backLabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  ) : null;

  if (layout === 'tab') {
    return (
      <View style={wrapStyle}>
        <View style={styles.tabRow}>
          <View style={styles.tabTitleBlock}>
            <Text style={[titleStyle, { color: colors.text }]} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {rightAction ? <View style={styles.rightSlot}>{rightAction}</View> : null}
        </View>
      </View>
    );
  }

  if (layout === 'stack-inline') {
    return (
      <View style={wrapStyle}>
        <View style={styles.inlineRow}>
          {backControl}
          {rightAction ?? <View style={styles.flexSpacer} />}
        </View>
      </View>
    );
  }

  return (
    <View style={wrapStyle}>
      <View style={styles.row}>
        {onBack ? backControl : <View style={styles.backPlaceholder} />}
        <View style={styles.titleBlockCentered}>
          <Text style={[titleStyle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.rightSlot}>
          {rightAction ?? <View style={styles.backPlaceholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: screenPaddingX,
    paddingTop: space.space2,
    paddingBottom: space.space2,
  },
  wrapFlush: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargetMin,
    gap: space.space2,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargetMin,
    gap: space.space2,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargetMin,
    gap: space.space2,
  },
  backBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargetMin,
    paddingRight: space.space2,
    maxWidth: '42%',
  },
  backPlaceholder: {
    width: touchTargetMin,
  },
  backLabel: {
    ...typeScale.subheadMedium,
    marginLeft: -space.space1,
  },
  titleBlockCentered: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  tabTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  flexSpacer: {
    flex: 1,
  },
  largeTitle: {
    ...typeScale.largeTitle,
  },
  title: {
    ...typeScale.title2,
  },
  subtitle: {
    ...typeScale.subhead,
    marginTop: space.space1,
  },
  rightSlot: {
    minWidth: touchTargetMin,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
