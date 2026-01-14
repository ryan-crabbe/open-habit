/**
 * Frequency Type Selector Component
 *
 * Segmented control for selecting habit frequency type.
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import type { FrequencyType } from '@/database/habits';

interface FrequencyTypeSelectorProps {
  value: FrequencyType;
  onChange: (type: FrequencyType) => void;
}

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'specific_days', label: 'Specific Days' },
  { value: 'every_n_days', label: 'Every N Days' },
];

export function FrequencyTypeSelector({ value, onChange }: FrequencyTypeSelectorProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {FREQUENCY_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              isSelected && { backgroundColor: tintColor },
            ]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.optionText,
                { color: isSelected ? '#FFFFFF' : textColor },
              ]}
            >
              {option.label}
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
    flexWrap: 'wrap',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  option: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  optionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
