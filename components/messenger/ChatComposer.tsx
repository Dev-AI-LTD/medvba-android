import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import {
  space,
  touchTargetMin,
  iconMd,
  inputMinHeight,
  radiusMd,
  screenPaddingX,
  typeScale,
} from '@/theme/iosDesign';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  onFocus?: () => void;
};

export function ChatComposer({ value, onChangeText, onSend, placeholder, disabled, onFocus }: Props) {
  const { colors } = useTheme();
  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          borderTopColor: colors.glassBorder,
          backgroundColor: colors.backgroundLight,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.cardBgLight,
            color: colors.text,
            borderColor: colors.glassBorder,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={2000}
        editable={!disabled}
        onFocus={onFocus}
      />
      <TouchableOpacity
        style={[
          styles.sendBtn,
          { backgroundColor: canSend ? colors.primary : colors.glassBorder },
        ]}
        onPress={handleSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Send color={canSend ? colors.inverse : colors.textMuted} size={iconMd} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: screenPaddingX,
    paddingTop: space.space2,
    paddingBottom: Platform.OS === 'ios' ? space.space4 : space.space2,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space.space2,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: inputMinHeight,
    borderRadius: radiusMd + 10,
    borderWidth: 1,
    paddingHorizontal: space.space4,
    paddingVertical: space.space2 + 2,
    ...typeScale.body,
  },
  sendBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.space1,
  },
});
