/**
 * HabitProgressCard Component
 *
 * Card showing a habit's contribution graph and streak information.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ContributionGraph } from './ContributionGraph';
import { StreakDisplay } from './StreakDisplay';
import { CellDetailModal } from './CellDetailModal';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { calculateStreak } from '@/utils/streak';
import type { Habit, HabitCompletion } from '@/database';

interface HabitProgressCardProps {
  /** The habit to display */
  habit: Habit;
  /** Completion records for this habit */
  completions: HabitCompletion[];
}

export function HabitProgressCard({ habit, completions }: HabitProgressCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({}, 'card');

  // Selected cell state for modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCompletion, setSelectedCompletion] = useState<
    HabitCompletion | undefined
  >(undefined);

  // Calculate streak
  const streak = useMemo(() => {
    return calculateStreak(habit, completions);
  }, [habit, completions]);

  // Handle cell press
  const handleCellPress = useCallback(
    (date: string, completion: HabitCompletion | undefined) => {
      setSelectedDate(date);
      setSelectedCompletion(completion);
    },
    []
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedDate(null);
    setSelectedCompletion(undefined);
  }, []);

  return (
    <>
      <ThemedView
        style={[
          styles.card,
          { backgroundColor: cardBackground },
          Shadows[colorScheme].sm,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
          <ThemedText style={styles.habitName} numberOfLines={1}>
            {habit.name}
          </ThemedText>
        </View>

        {/* Contribution Graph */}
        <View style={styles.graphContainer}>
          <ContributionGraph
            habit={habit}
            completions={completions}
            onCellPress={handleCellPress}
            selectedDate={selectedDate}
          />
        </View>

        {/* Streak Display */}
        <StreakDisplay streak={streak} habitColor={habit.color} />
      </ThemedView>

      {/* Cell Detail Modal */}
      <CellDetailModal
        visible={selectedDate !== null}
        date={selectedDate}
        habit={habit}
        completion={selectedCompletion}
        onClose={handleCloseModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  habitName: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  graphContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
