/**
 * ViewModeSelector Component
 *
 * Segmented control for switching between graph view modes.
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, FontSizes, BorderRadius } from '@/constants/theme';

export type ViewMode = 'yearly' | 'monthly' | 'weekly';

interface ViewModeSelectorProps {
  /** Currently selected view mode */
  value: ViewMode;
  /** Callback when view mode changes */
  onChange: (mode: ViewMode) => void;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'yearly', label: 'Year' },
  { value: 'monthly', label: 'Month' },
  { value: 'weekly', label: 'Week' },
];

export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {VIEW_MODES.map((mode) => {
        const isSelected = value === mode.value;
        return (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.option,
              isSelected && [styles.optionSelected, { backgroundColor: cardColor }],
            ]}
            onPress={() => onChange(mode.value)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.optionText,
                { color: isSelected ? textColor : textSecondary },
                isSelected && styles.optionTextSelected,
              ]}
            >
              {mode.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md - 2,
  },
  optionSelected: {
    // Background applied via inline style
  },
  optionText: {
    fontSize: FontSizes.sm,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
});
