/**
 * @deprecated Prefer importing from `@/theme/iosDesign` for new code.
 * Re-exports iOS HIG tokens for backward compatibility.
 */
import {
  space,
  screenPaddingX,
  screenPaddingXWide,
  fieldGap,
  sectionGap,
  cardPadding,
  touchTargetMin,
  buttonHeight,
  inputMinHeight,
  listRowMinHeight,
  iconSm,
  iconMd,
  iconLg,
  iconXl,
  radiusSm,
  radiusMd,
  radiusLg,
  radiusPill,
  typeScale,
  TOUCH_TARGET_MIN,
} from '@/theme/iosDesign';

export const spacing = {
  xs: space.space1,
  sm: space.space2,
  md: space.space3,
  lg: space.space4,
  xl: space.space5,
  xxl: space.space6,
  xxxl: space.space7,
  huge: space.space8,
  massive: space.space9,
} as const;

export const typography = {
  h1: typeScale.largeTitle,
  h2: typeScale.title,
  h3: typeScale.title2,
  h4: typeScale.headline,
  body: typeScale.body,
  bodyMedium: typeScale.bodyMedium,
  bodySemibold: typeScale.headline,
  small: typeScale.subhead,
  smallMedium: typeScale.subheadMedium,
  caption: typeScale.caption,
  captionMedium: typeScale.captionMedium,
} as const;

export const borderRadius = {
  xs: 4,
  sm: radiusSm,
  md: radiusMd,
  lg: radiusLg,
  xl: 20,
  xxl: 24,
  full: radiusPill,
} as const;

export {
  screenPaddingX,
  screenPaddingXWide,
  fieldGap,
  sectionGap,
  cardPadding,
  touchTargetMin,
  buttonHeight,
  inputMinHeight,
  listRowMinHeight,
  iconSm,
  iconMd,
  iconLg,
  iconXl,
};

export const elevation = {
  glass: {
    default: {
      blur: 4,
      opacity: 0.08,
      borderOpacity: 0.15,
    },
    light: {
      blur: 6,
      opacity: 0.12,
      borderOpacity: 0.18,
    },
    heavy: {
      blur: 8,
      opacity: 0.16,
      borderOpacity: 0.2,
    },
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  easing: {
    inOut: 'ease-in-out' as const,
    out: 'ease-out' as const,
    in: 'ease-in' as const,
    spring: 'spring' as const,
  },
} as const;

export const hitSlop = {
  default: { top: 8, right: 8, bottom: 8, left: 8 },
  large: { top: 12, right: 12, bottom: 12, left: 12 },
} as const;

export const minTapTarget = TOUCH_TARGET_MIN;
