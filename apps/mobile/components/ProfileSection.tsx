import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { COLORS, FONTS, SPACING, COMPONENT } from '../src/theme/constants';

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: COMPONENT.screenPadding,
    marginTop: SPACING['2xl'],
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
});
