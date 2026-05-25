import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { buttonHeight, touchTargetMin } from '@/theme/iosDesign';

type Variant = 'default' | 'bordered' | 'borderless' | 'outlined' | 'elevated' | 'borderedProminent' | 'plain';

export type UIButtonProps = {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Material icon name (leadingIcon). */
  icon?: string;
  testID?: string;
};

/**
 * Cross-platform Button using React Native Paper (avoids @expo/ui native view warnings on SDK 54).
 * For contained/borderedProminent buttons, color is used as background and text uses a contrasting color (white).
 */
export function UIButton({
  children,
  onPress,
  variant = 'default',
  disabled = false,
  color,
  style,
  icon,
  testID,
}: UIButtonProps) {
  const mode = variant === 'borderless' || variant === 'plain' ? 'text' : variant === 'bordered' || variant === 'outlined' ? 'outlined' : 'contained';
  const isContained = mode === 'contained';
  const buttonColor = isContained && color ? color : undefined;
  const textColor = isContained && color ? '#FFFFFF' : color;
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      icon={icon}
      buttonColor={buttonColor}
      textColor={textColor}
      style={[{ minHeight: Math.max(buttonHeight, touchTargetMin) }, style]}
      contentStyle={{ minHeight: buttonHeight }}
      testID={testID}
    >
      {children}
    </PaperButton>
  );
}
