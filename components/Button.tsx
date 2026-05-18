import React, { useRef, memo, useCallback } from 'react';
import { 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator,
  Animated,
  Pressable,
  View,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import {
  spacing,
  typography,
  borderRadius,
  minTapTarget,
  buttonHeight,
  iconMd,
} from '@/constants/design';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function ButtonComponent({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const { colors, colorScheme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          fontSize: typography.small.fontSize,
          minHeight: minTapTarget,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xxl,
          fontSize: typography.bodySemibold.fontSize,
          minHeight: buttonHeight,
        };
      default:
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          fontSize: typography.bodySemibold.fontSize,
          minHeight: buttonHeight,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colorScheme === 'dark' 
              ? colors.cardBgLight 
              : colors.backgroundLight,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          },
          text: { color: colors.text },
          disabledContainer: { opacity: 0.5 },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.primary,
          },
          text: { color: colors.primary },
          disabledContainer: { 
            borderColor: colors.textMuted,
            opacity: 0.5,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: colors.primary },
          disabledContainer: { opacity: 0.5 },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.error,
          },
          text: { color: '#FFFFFF' },
          disabledContainer: { opacity: 0.5 },
        };
      default:
        return {
          container: {
            backgroundColor: colors.primary,
          },
          text: { color: '#FFFFFF' },
          disabledContainer: { opacity: 0.6 },
        };
    }
  };

  const sizeConfig = getSizeConfig();
  const variantStyles = getVariantStyles();
  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.container,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            minHeight: sizeConfig.minHeight,
          },
          variantStyles.container,
          isDisabled && variantStyles.disabledContainer,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator 
              color={variantStyles.text.color} 
              size="small"
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <View style={styles.iconLeft}>{icon}</View>
              )}
              <Text
                style={[
                  styles.text,
                  {
                    fontSize: sizeConfig.fontSize,
                    fontWeight: typography.bodySemibold.fontWeight,
                  },
                  variantStyles.text,
                  textStyle,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <View style={styles.iconRight}>{icon}</View>
              )}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});

const propsAreEqual = (prev: ButtonProps, next: ButtonProps) => {
  return (
    prev.title === next.title &&
    prev.variant === next.variant &&
    prev.size === next.size &&
    prev.disabled === next.disabled &&
    prev.loading === next.loading &&
    prev.fullWidth === next.fullWidth &&
    prev.icon === next.icon &&
    prev.iconPosition === next.iconPosition &&
    prev.style === next.style &&
    prev.textStyle === next.textStyle
  );
};

export default memo(ButtonComponent, propsAreEqual);
