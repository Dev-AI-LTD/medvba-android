import React, { Component, ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { AppColors } from '@/constants/colors';
import { logError } from '@/lib/monitoring';
import {
  buttonHeight,
  iconLg,
  iconSm,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AlertTriangle color={colors.error} size={iconLg + space.space5} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          We encountered an unexpected error. Please try again.
        </Text>

        {__DEV__ && error && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorText}>{error.toString()}</Text>
            {errorInfo && (
              <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
            )}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <RefreshCw color={colors.text} size={iconSm} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isAbortSignalError = 
      error.message?.includes('signal is aborted') ||
      error.message?.includes('abort');
    
    if (isAbortSignalError) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
      };
    }
    
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isAbortSignalError = 
      error.message?.includes('signal is aborted') ||
      error.message?.includes('abort');
    
    if (isAbortSignalError) {
      console.log('[ErrorBoundary] Ignoring abort signal error (component unmounted)');
      return;
    }
    
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    logError(error, { componentStack: errorInfo.componentStack ?? undefined });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenPaddingX,
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
    },
    title: {
      ...typeScale.title2,
      color: colors.text,
      marginTop: sectionGap,
      marginBottom: space.space2,
      textAlign: 'center',
    },
    message: {
      ...typeScale.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: sectionGap,
    },
    errorDetails: {
      width: '100%',
      maxHeight: 200,
      backgroundColor: colors.cardBg,
      borderRadius: radiusMd,
      padding: space.space4,
      marginBottom: sectionGap - space.space4,
    },
    errorText: {
      ...typeScale.caption,
      color: colors.error,
      fontFamily: 'monospace',
      marginBottom: space.space2 + 2,
    },
    stackText: {
      ...typeScale.caption2,
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: space.space6,
      paddingVertical: space.space3,
      borderRadius: radiusMd,
      gap: space.space2,
      minHeight: buttonHeight,
      minWidth: touchTargetMin * 2,
    },
    buttonText: {
      ...typeScale.body,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
