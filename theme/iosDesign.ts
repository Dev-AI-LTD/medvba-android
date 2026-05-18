import { Platform } from 'react-native';

/**
 * Apple HIG–aligned design tokens (4/8pt grid, 44pt touch targets, iOS type scale).
 * Single source of truth — import from here or via @/constants/design re-exports.
 *
 * | Token            | Value |
 * |------------------|-------|
 * | screenPaddingX   | 16    |
 * | fieldGap         | 16    |
 * | sectionGap       | 24    |
 * | cardPadding      | 16    |
 * | touchTargetMin   | 44    |
 * | buttonHeight     | 50    |
 * | body             | 17/22 |
 * | subhead          | 15/20 |
 * | caption          | 13/18 |
 */

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

export const screenPaddingX = space.space4;
export const screenPaddingXWide = space.space5;
export const fieldGap = space.space4;
export const sectionGap = space.space6;
export const cardPadding = space.space4;

export const touchTargetMin = 44;
export const buttonHeight = 50;
export const inputMinHeight = 44;
export const listRowMinHeight = 44;

export const iconSm = 18;
export const iconMd = 20;
export const iconLg = 22;
export const iconXl = 24;

export const radiusSm = 8;
export const radiusMd = 12;
export const radiusLg = 16;
export const radiusPill = 999;

/** iOS uses San Francisco via system font; Android uses platform sans-serif. */
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

export const typeScale = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
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
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  captionMedium: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: -0.08,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
} as const;

/** Legacy SPACING aliases (8pt multiples) for gradual migration. */
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
