import { Platform } from 'react-native';

/**
 * iOS-first design system (Apple HIG).
 * Single source of truth for spacing, typography, radii, sizes, and touch targets.
 *
 * Layout: screen padding 16 · item gap 16 · section gap 24 · card padding 16
 * Controls: button/input height 50 · min touch 44×44
 * Icons: 16 / 20 / 24 / 28
 */

/** 4pt grid */
export const space = {
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  space7: 32,
  space8: 40,
  space9: 48,
} as const;

/** Screen & list layout */
export const screenPaddingX = space.space4;
export const screenPaddingXWide = space.space5;
export const fieldGap = space.space4;
export const itemGap = fieldGap;
export const sectionGap = space.space6;
export const cardPadding = space.space4;

/** Interactive minimums (Apple HIG) */
export const touchTargetMin = 44;
export const buttonHeight = 50;
export const inputHeight = 50;
export const inputMinHeight = inputHeight;
export const listRowMinHeight = touchTargetMin;

/** Icon sizes */
export const iconXs = 16;
export const iconSm = 20;
export const iconMd = 24;
export const iconLg = 28;
/** @deprecated Use iconSm–iconLg; kept for gradual migration */
export const iconXl = iconLg;

export const radiusSm = 8;
export const radiusMd = 12;
export const radiusLg = 16;
export const radiusPill = 999;

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

/** Apple Dynamic Type–aligned scale */
export const typeScale = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600' as const,
    letterSpacing: 0.36,
  },
  /** @deprecated Prefer title1 */
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  bodyMedium: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500' as const,
    letterSpacing: -0.41,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  subheadMedium: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.06,
  },
} as const;

/** Legacy 8pt spacing aliases */
export const SPACING = {
  x1: space.space2,
  x2: space.space4,
  x3: space.space6,
  x4: space.space7,
  x5: space.space8,
  x6: space.space9,
  x7: 56,
  x8: 64,
} as const;

export const TOUCH_TARGET_MIN = touchTargetMin;

export const hitSlop = {
  default: { top: 8, right: 8, bottom: 8, left: 8 },
  large: { top: 12, right: 12, bottom: 12, left: 12 },
} as const;

/** Aggregated tokens for imports */
export const tokens = {
  space,
  layout: {
    screenPaddingX,
    screenPaddingXWide,
    fieldGap,
    itemGap,
    sectionGap,
    cardPadding,
  },
  size: {
    touchTargetMin,
    buttonHeight,
    inputHeight,
    listRowMinHeight,
    icon: { xs: iconXs, sm: iconSm, md: iconMd, lg: iconLg },
  },
  radius: {
    sm: radiusSm,
    md: radiusMd,
    lg: radiusLg,
    pill: radiusPill,
  },
  type: typeScale,
  fontFamily,
} as const;

export type TypeScaleKey = keyof typeof typeScale;
