/**
 * HabitProgressCard Component
 *
 * Card showing a habit's contribution graph and streak information.
 */

import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ContributionGraph } from './ContributionGraph';
import { StreakDisplay } from './StreakDisplay';
import { CellDetailModal } from './CellDetailModal';
import { ViewModeSelector, VIEW_MODE_CONFIG } from './ViewModeSelector';
import type { ViewMode } from './ViewModeSelector';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { getLocalDate, parseLocalDate, getDayOfWeek, addDays } from '@/utils/date';
import type { Habit, HabitCompletion } from '@/database';
import type { StreakResult } from '@/utils/streak';

// Grid configuration (match ContributionGraph)
const CELL_SIZE = 11;
const CELL_GAP = 3;

interface HabitProgressCardProps {
  /** The habit to display */
  habit: Habit;
  /** Completion records for this habit */
  completions: HabitCompletion[];
  /** Pre-computed streak (calculated during data load, not render) */
  streak: StreakResult;
}

function HabitProgressCardComponent({ habit, completions, streak }: HabitProgressCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  // Current year
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Year state for navigation
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('year');

  // ScrollView ref for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // Selected cell state for modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCompletion, setSelectedCompletion] = useState<
    HabitCompletion | undefined
  >(undefined);

  // streak is now received as a prop (pre-computed during data load)

  // Calculate scroll position to show current week (for current year)
  const scrollToCurrentWeek = useCallback(() => {
    if (selectedYear !== currentYear || !scrollViewRef.current) return;

    const today = getLocalDate();
    const jan1 = `${selectedYear}-01-01`;
    const jan1Date = parseLocalDate(jan1);
    const jan1DayOfWeek = getDayOfWeek(jan1Date);
    const gridStartDate = addDays(jan1, -jan1DayOfWeek);

    // Calculate weeks from grid start to today
    const startMs = parseLocalDate(gridStartDate).getTime();
    const todayMs = parseLocalDate(today).getTime();
    const weeksFromStart = Math.floor((todayMs - startMs) / (7 * 24 * 60 * 60 * 1000));

    // Scroll to show current week (with some padding on the left)
    const scrollX = Math.max(0, (weeksFromStart - 4) * (CELL_SIZE + CELL_GAP));
    scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
  }, [selectedYear, currentYear]);

  // Auto-scroll to current week when viewing current year
  useEffect(() => {
    // Small delay to ensure the ScrollView is rendered
    const timer = setTimeout(scrollToCurrentWeek, 100);
    return () => clearTimeout(timer);
  }, [scrollToCurrentWeek]);

  // Year navigation
  const canGoNext = selectedYear < currentYear;
  const canGoPrev = true; // Allow going back indefinitely

  const handlePrevYear = useCallback(() => {
    if (canGoPrev) {
      setSelectedYear((y) => y - 1);
    }
  }, [canGoPrev]);

  const handleNextYear = useCallback(() => {
    if (canGoNext) {
      setSelectedYear((y) => y + 1);
    }
  }, [canGoNext]);

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

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          <ViewModeSelector value={viewMode} onChange={setViewMode} />
        </View>

        {/* Year Navigation - only show in year view mode */}
        {viewMode === 'year' && (
          <View style={styles.yearNav}>
            <TouchableOpacity
              onPress={handlePrevYear}
              style={styles.yearNavButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol name="chevron.left" size={18} color={tintColor} />
            </TouchableOpacity>

            <ThemedText style={styles.yearLabel}>{selectedYear}</ThemedText>

            <TouchableOpacity
              onPress={handleNextYear}
              style={[styles.yearNavButton, !canGoNext && styles.yearNavButtonDisabled]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={!canGoNext}
            >
              <IconSymbol
                name="chevron.right"
                size={18}
                color={canGoNext ? tintColor : textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Contribution Graph */}
        <View style={styles.graphContainer}>
          <ContributionGraph
            habit={habit}
            completions={completions}
            onCellPress={handleCellPress}
            selectedDate={selectedDate}
            year={viewMode === 'year' ? selectedYear : undefined}
            scrollViewRef={scrollViewRef}
            viewMode={viewMode}
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
  viewModeContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  yearNavButton: {
    padding: Spacing.xs,
  },
  yearNavButtonDisabled: {
    opacity: 0.3,
  },
  yearLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    minWidth: 50,
    textAlign: 'center',
  },
  graphContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});

export const HabitProgressCard = memo(HabitProgressCardComponent);
