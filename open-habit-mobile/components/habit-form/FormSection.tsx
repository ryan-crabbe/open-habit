/**
 * Form Section Component
 *
 * Wraps form fields with a label and consistent styling.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, FontSizes } from '@/constants/theme';

interface FormSectionProps {
  label: string;
  children: React.ReactNode;
}

export function FormSection({ label, children }: FormSectionProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: Spacing.sm,
  },
});
