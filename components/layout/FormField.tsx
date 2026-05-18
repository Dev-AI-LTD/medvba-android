import React from 'react';
import { View, StyleSheet, TextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/providers/ThemeProvider';
import {
  fieldGap,
  inputMinHeight,
  radiusMd,
  space,
  typeScale,
} from '@/theme/iosDesign';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

export function FormField({ label, hint, containerStyle, style, ...inputProps }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.cardBgLight,
            borderColor: colors.glassBorder,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {hint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: fieldGap,
  },
  label: {
    ...typeScale.subheadMedium,
    marginBottom: space.space2,
  },
  input: {
    ...typeScale.body,
    minHeight: inputMinHeight,
    borderRadius: radiusMd,
    borderWidth: 1,
    paddingHorizontal: space.space4,
    paddingVertical: space.space3,
  },
  hint: {
    ...typeScale.caption,
    marginTop: space.space2,
  },
});
