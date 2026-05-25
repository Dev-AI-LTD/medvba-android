import { StyleSheet } from 'react-native';
import {
  cardPadding,
  fieldGap,
  itemGap,
  radiusLg,
  radiusMd,
  screenPaddingX,
  sectionGap,
  touchTargetMin,
  typeScale,
} from './iosDesign';

/** Shared layout primitives for screens (no colors — use theme colors inline). */
export const screenLayout = {
  screenPaddingX,
  fieldGap,
  itemGap,
  sectionGap,
  cardPadding,
  radiusMd,
  radiusLg,
  touchTargetMin,
  typeScale,
} as const;

export function createMinTouchStyle(
  width: number = touchTargetMin,
  height: number = touchTargetMin,
) {
  return {
    minWidth: width,
    minHeight: height,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export const commonScreenStyles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  section: {
    marginBottom: sectionGap,
  },
  sectionTitle: {
    ...typeScale.subheadMedium,
    marginBottom: fieldGap,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: radiusLg,
    padding: cardPadding,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargetMin,
    gap: fieldGap,
  },
});
