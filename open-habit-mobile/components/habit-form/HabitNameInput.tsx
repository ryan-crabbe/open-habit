/**
 * Habit Name Input Component
 *
 * Text input for the habit name with error display.
 */

import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, FontSizes } from '@/constants/theme';

interface HabitNameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function HabitNameInput({ value, onChange, error }: HabitNameInputProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const placeholderColor = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');

  return (
    <View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor,
            color: textColor,
            borderColor: error ? errorColor : 'transparent',
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder="Enter habit name"
        placeholderTextColor={placeholderColor}
        autoCapitalize="sentences"
        autoCorrect={false}
        maxLength={100}
      />
      {error && (
        <ThemedText style={[styles.error, { color: errorColor }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: FontSizes.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  error: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
