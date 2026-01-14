/**
 * ContributionGraph Component
 *
 * GitHub-style contribution graph showing habit completion data over time.
 * Displays a 52-week grid with day-of-week rows.
 */

import React, { useMemo, useCallback, memo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GraphCell } from './GraphCell';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, FontSizes } from '@/constants/theme';
import { getLocalDate, addDays, getDayOfWeek, parseLocalDate } from '@/utils/date';
import { getTargetForDate, isHabitScheduledForDate } from '@/utils/habit-schedule';
import type { Habit, HabitCompletion } from '@/database';

// Day labels for left side
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Month labels
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Grid configuration
const CELL_SIZE = 11;
const CELL_GAP = 3;
const WEEKS_TO_SHOW = 52;
const DAYS_PER_WEEK = 7;

interface ContributionGraphProps {
  /** The habit to display */
  habit: Habit;
  /** Array of completions for the date range */
  completions: HabitCompletion[];
  /** Callback when a cell is pressed */
  onCellPress?: (date: string, completion: HabitCompletion | undefined) => void;
  /** Currently selected date */
  selectedDate?: string | null;
  /** Today's date (YYYY-MM-DD), defaults to current date */
  today?: string;
}

interface CellData {
  date: string;
  percentage: number;
  completion: HabitCompletion | undefined;
}

/**
 * Generates week columns for the graph
 */
function generateWeekColumns(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  endDate: string,
  numWeeks: number
): CellData[][] {
  const weeks: CellData[][] = [];

  // Find the Sunday of the week containing endDate
  const endDateObj = parseLocalDate(endDate);
  const endDayOfWeek = getDayOfWeek(endDateObj);
  const weekEndDate = addDays(endDate, 6 - endDayOfWeek); // Go to Saturday

  // Calculate the start date (numWeeks * 7 days back from week end)
  const totalDays = numWeeks * 7;
  const startDate = addDays(weekEndDate, -(totalDays - 1));

  // Generate week by week
  let currentDate = startDate;
  for (let week = 0; week < numWeeks; week++) {
    const weekCells: CellData[] = [];

    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const completion = completionMap.get(currentDate);
      let percentage = 0;

      if (completion && completion.count > 0) {
        const isScheduled = isHabitScheduledForDate(habit, currentDate);
        if (isScheduled) {
          const target = getTargetForDate(habit, currentDate);
          if (habit.completion_display === 'binary') {
            percentage = completion.count >= target ? 1 : 0;
          } else {
            percentage = Math.min(completion.count / target, 1);
          }
        } else {
          // Completed on non-scheduled day - show as partial
          percentage = 0.5;
        }
      }

      weekCells.push({
        date: currentDate,
        percentage,
        completion,
      });

      currentDate = addDays(currentDate, 1);
    }

    weeks.push(weekCells);
  }

  return weeks;
}

/**
 * Calculates which months appear at which week positions
 */
function calculateMonthLabels(weeks: CellData[][]): { week: number; label: string }[] {
  const labels: { week: number; label: string }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    // Check the first day of each week (Sunday)
    const firstDayDate = parseLocalDate(week[0].date);
    const month = firstDayDate.getMonth();

    if (month !== lastMonth) {
      labels.push({
        week: weekIndex,
        label: MONTH_LABELS[month],
      });
      lastMonth = month;
    }
  });

  return labels;
}

function ContributionGraphComponent({
  habit,
  completions,
  onCellPress,
  selectedDate,
  today,
}: ContributionGraphProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Use provided today or get current date
  const currentDate = today ?? getLocalDate();

  // Create completion lookup map
  const completionMap = useMemo(() => {
    const map = new Map<string, HabitCompletion>();
    completions.forEach((c) => map.set(c.date, c));
    return map;
  }, [completions]);

  // Generate week columns
  const weeks = useMemo(() => {
    return generateWeekColumns(habit, completionMap, currentDate, WEEKS_TO_SHOW);
  }, [habit, completionMap, currentDate]);

  // Calculate month label positions
  const monthLabels = useMemo(() => {
    return calculateMonthLabels(weeks);
  }, [weeks]);

  const handleCellPress = useCallback((date: string) => {
    const completion = completionMap.get(date);
    onCellPress?.(date, completion);
  }, [completionMap, onCellPress]);

  // Calculate total width
  const gridWidth = WEEKS_TO_SHOW * (CELL_SIZE + CELL_GAP);

  return (
    <View style={styles.container}>
      {/* Month labels row */}
      <View style={styles.monthLabelsContainer}>
        <View style={styles.dayLabelsPlaceholder} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={{ width: gridWidth }}
        >
          <View style={styles.monthLabelsRow}>
            {monthLabels.map(({ week, label }) => (
              <ThemedText
                key={`${label}-${week}`}
                style={[
                  styles.monthLabel,
                  { color: textSecondary, left: week * (CELL_SIZE + CELL_GAP) },
                ]}
              >
                {label}
              </ThemedText>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Main grid with day labels */}
      <View style={styles.gridContainer}>
        {/* Day labels column */}
        <View style={styles.dayLabelsColumn}>
          {DAY_LABELS.map((label, index) => (
            <ThemedText
              key={`day-${index}`}
              style={[
                styles.dayLabel,
                { color: textSecondary, height: CELL_SIZE + CELL_GAP },
                // Only show S, T, S labels (every other one)
                index % 2 === 0 ? {} : styles.hiddenLabel,
              ]}
            >
              {label}
            </ThemedText>
          ))}
        </View>

        {/* Scrollable grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekColumn}>
                {week.map((cell, dayIndex) => (
                  <View
                    key={cell.date}
                    style={[styles.cellWrapper, { marginBottom: CELL_GAP }]}
                  >
                    <GraphCell
                      date={cell.date}
                      percentage={cell.percentage}
                      habitColor={habit.color}
                      isSelected={selectedDate === cell.date}
                      onPress={onCellPress ? handleCellPress : undefined}
                      size={CELL_SIZE}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container for the entire graph
  },
  monthLabelsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayLabelsPlaceholder: {
    width: 20, // Match dayLabelsColumn width
  },
  monthLabelsRow: {
    position: 'relative',
    height: 16,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: FontSizes.xs,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    width: 20,
    marginRight: Spacing.xs,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    textAlign: 'right',
    paddingRight: 4,
  },
  hiddenLabel: {
    opacity: 0,
  },
  scrollContent: {
    // Allow content to scroll
  },
  grid: {
    flexDirection: 'row',
  },
  weekColumn: {
    marginRight: CELL_GAP,
  },
  cellWrapper: {
    // Wrapper for spacing
  },
});

export const ContributionGraph = memo(ContributionGraphComponent);
