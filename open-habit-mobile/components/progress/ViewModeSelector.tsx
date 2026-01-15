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

export type ViewMode = 'year' | '6months' | 'month' | 'week';

// Configuration for each view mode
export const VIEW_MODE_CONFIG: Record<ViewMode, { weeks: number; cellSize: number; label: string }> = {
  year: { weeks: 52, cellSize: 11, label: 'Year' },
  '6months': { weeks: 26, cellSize: 14, label: '6 Mo' },
  month: { weeks: 5, cellSize: 24, label: 'Month' },
  week: { weeks: 1, cellSize: 40, label: 'Week' },
};

interface ViewModeSelectorProps {
  /** Currently selected view mode */
  value: ViewMode;
  /** Callback when view mode changes */
  onChange: (mode: ViewMode) => void;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'year', label: VIEW_MODE_CONFIG.year.label },
  { value: '6months', label: VIEW_MODE_CONFIG['6months'].label },
  { value: 'month', label: VIEW_MODE_CONFIG.month.label },
  { value: 'week', label: VIEW_MODE_CONFIG.week.label },
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
