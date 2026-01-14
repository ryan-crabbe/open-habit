/**
 * Daily Frequency Config Component
 *
 * Target count input for daily habits.
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { withDisabledOpacity } from '@/utils';

interface DailyFrequencyConfigProps {
  targetCount: number;
  onChange: (count: number) => void;
}

export function DailyFrequencyConfig({ targetCount, onChange }: DailyFrequencyConfigProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const iconColor = useThemeColor({}, 'icon');

  const increment = () => onChange(Math.min(targetCount + 1, 99));
  const decrement = () => onChange(Math.max(targetCount - 1, 1));

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemedText style={styles.label}>Times per day</ThemedText>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={decrement}
          disabled={targetCount <= 1}
        >
          <IconSymbol
            name="minus"
            size={20}
            color={targetCount <= 1 ? withDisabledOpacity(iconColor) : iconColor}
          />
        </TouchableOpacity>
        <ThemedText style={styles.countText}>{targetCount}</ThemedText>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={increment}
          disabled={targetCount >= 99}
        >
          <IconSymbol
            name="plus"
            size={20}
            color={targetCount >= 99 ? withDisabledOpacity(iconColor) : iconColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  label: {
    fontSize: FontSizes.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  countText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
});
