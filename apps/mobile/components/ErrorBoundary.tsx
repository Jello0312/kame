// ═══════════════════════════════════════════════════════════════
// ErrorBoundary — Crash-safe fallback for unhandled component errors
// ═══════════════════════════════════════════════════════════════
// React error boundaries MUST be class components (React limitation).
// Wraps the entire app in _layout.tsx. On crash: shows branded
// fallback UI with a "Restart" button that reloads the app.
// ═══════════════════════════════════════════════════════════════

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../src/theme/constants';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleRestart = () => {
    // Reset error boundary state so the app re-renders from scratch.
    // If the same error recurs, the boundary will catch it again.
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>:(</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app ran into an unexpected error.{'\n'}Please restart and try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetail} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          )}
          <Pressable style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Restart</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emoji: {
    fontSize: 48,
    color: COLORS.gray400,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
  },
  errorDetail: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.tealBright,
    paddingHorizontal: SPACING['3xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
  },
});
