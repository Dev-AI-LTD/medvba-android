import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { inputHeight } from '@/theme/iosDesign';

export type UITextFieldProps = {
  value?: string;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url' | 'decimal-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autocorrection?: boolean;
  disabled?: boolean;
  style?: StyleProp<TextStyle | ViewStyle>;
  right?: React.ReactNode;
  testID?: string;
};

/**
 * Cross-platform TextField using React Native Paper (avoids @expo/ui native view warnings on SDK 54).
 */
export function UITextField({
  value,
  defaultValue,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  autocorrection = true,
  disabled,
  style,
  right,
  testID,
}: UITextFieldProps) {
  const initialValue = value ?? defaultValue ?? '';
  return (
    <PaperTextInput
      mode="outlined"
      value={value !== undefined ? value : initialValue}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCorrect={autocorrection}
      disabled={disabled}
      style={[{ minHeight: inputHeight }, style] as StyleProp<TextStyle>}
      contentStyle={{ minHeight: inputHeight }}
      right={right}
      testID={testID}
    />
  );
}
