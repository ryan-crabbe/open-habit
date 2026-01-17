/**
 * StreakDisplay Component
 *
 * Shows current and best streak for a habit.
 */

import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, FontSizes, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { StreakResult } from '@/utils/streak';

interface StreakDisplayProps {
  /** Streak data to display */
  streak: StreakResult;
  /** Habit color for styling */
  habitColor: string;
}

function StreakDisplayComponent({ streak, habitColor }: StreakDisplayProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const colorScheme = useColorScheme() ?? 'light';
  const borderSecondary = Colors[colorScheme].borderSecondary;

  const unitLabel = streak.unit === 'weeks' ? 'week' : 'day';
  const currentUnit = streak.currentStreak === 1 ? unitLabel : `${unitLabel}s`;
  const bestUnit = streak.bestStreak === 1 ? unitLabel : `${unitLabel}s`;

  return (
    <View style={styles.container}>
      <View style={styles.streakItem}>
        <ThemedText style={[styles.streakValue, { color: habitColor }]}>
          {streak.currentStreak}
        </ThemedText>
        <ThemedText style={[styles.streakLabel, { color: textSecondary }]}>
          {currentUnit} streak
        </ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: borderSecondary }]} />

      <View style={styles.streakItem}>
        <ThemedText style={[styles.streakValue, { color: textSecondary }]}>
          {streak.bestStreak}
        </ThemedText>
        <ThemedText style={[styles.streakLabel, { color: textSecondary }]}>
          {bestUnit} best
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  streakItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  streakValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
  },
});

export const StreakDisplay = memo(StreakDisplayComponent);
