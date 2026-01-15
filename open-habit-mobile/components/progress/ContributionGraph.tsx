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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, FontSizes } from '@/constants/theme';
import { getLocalDate, addDays, getDayOfWeek, parseLocalDate } from '@/utils/date';
import { getTargetForDate, isHabitScheduledForDate } from '@/utils/habit-schedule';
import type { Habit, HabitCompletion } from '@/database';
import type { ViewMode } from './ViewModeSelector';
import { VIEW_MODE_CONFIG } from './ViewModeSelector';

// Day labels for left side
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Month labels
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Default grid configuration
const DEFAULT_CELL_SIZE = 11;
const CELL_GAP = 3;
const DEFAULT_WEEKS_TO_SHOW = 52;
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
  /** Year to display (calendar year view). If provided and viewMode is 'year', shows Jan 1 - Dec 31 */
  year?: number;
  /** Ref callback to get ScrollView for programmatic scrolling */
  scrollViewRef?: React.RefObject<ScrollView | null>;
  /** View mode for different time ranges and cell sizes */
  viewMode?: ViewMode;
}

interface CellData {
  date: string;
  percentage: number;
  completion: HabitCompletion | undefined;
}

/**
 * Calculates cell data (percentage) for a given date
 */
function calculateCellData(
  date: string,
  habit: Habit,
  completionMap: Map<string, HabitCompletion>
): CellData {
  const completion = completionMap.get(date);
  let percentage = 0;

  if (completion && completion.count > 0) {
    const isScheduled = isHabitScheduledForDate(habit, date);
    if (isScheduled) {
      const target = getTargetForDate(habit, date);
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

  return { date, percentage, completion };
}

/**
 * Generates week columns for a rolling window (default mode)
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
      weekCells.push(calculateCellData(currentDate, habit, completionMap));
      currentDate = addDays(currentDate, 1);
    }

    weeks.push(weekCells);
  }

  return weeks;
}

/**
 * Generates week columns for a calendar year (Jan 1 - Dec 31)
 */
function generateYearColumns(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  year: number
): CellData[][] {
  const weeks: CellData[][] = [];

  // Jan 1 of the year
  const jan1 = `${year}-01-01`;
  const jan1Date = parseLocalDate(jan1);
  const jan1DayOfWeek = getDayOfWeek(jan1Date);

  // Find the Sunday before or on Jan 1
  const gridStartDate = addDays(jan1, -jan1DayOfWeek);

  // Dec 31 of the year
  const dec31 = `${year}-12-31`;
  const dec31Date = parseLocalDate(dec31);
  const dec31DayOfWeek = getDayOfWeek(dec31Date);

  // Find the Saturday after or on Dec 31
  const gridEndDate = addDays(dec31, 6 - dec31DayOfWeek);

  // Calculate number of weeks
  const startMs = parseLocalDate(gridStartDate).getTime();
  const endMs = parseLocalDate(gridEndDate).getTime();
  const numWeeks = Math.round((endMs - startMs) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Generate week by week
  let currentDate = gridStartDate;
  for (let week = 0; week < numWeeks; week++) {
    const weekCells: CellData[] = [];

    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      weekCells.push(calculateCellData(currentDate, habit, completionMap));
      currentDate = addDays(currentDate, 1);
    }

    weeks.push(weekCells);
  }

  return weeks;
}

/**
 * Calculates which months appear at which week positions
 * @param weeks - The week data
 * @param targetYear - If provided, only show labels for months in this year
 */
function calculateMonthLabels(
  weeks: CellData[][],
  targetYear?: number
): { week: number; label: string }[] {
  const labels: { week: number; label: string }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    // Check the first day of each week (Sunday)
    const firstDayDate = parseLocalDate(week[0].date);
    const month = firstDayDate.getMonth();
    const cellYear = firstDayDate.getFullYear();

    // Skip if this month is from a different year (e.g., Dec from previous year)
    if (targetYear !== undefined && cellYear !== targetYear) {
      return;
    }

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
  year,
  scrollViewRef,
  viewMode = 'year',
}: ContributionGraphProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const selectionBorderColor = useThemeColor({}, 'text');
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

  // Use provided today or get current date
  const currentDate = today ?? getLocalDate();

  // Get configuration for the current view mode
  const modeConfig = VIEW_MODE_CONFIG[viewMode];
  const cellSize = modeConfig.cellSize;
  const weeksToShow = modeConfig.weeks;

  // Create completion lookup map
  const completionMap = useMemo(() => {
    const map = new Map<string, HabitCompletion>();
    completions.forEach((c) => map.set(c.date, c));
    return map;
  }, [completions]);

  // Generate week columns based on view mode
  const weeks = useMemo(() => {
    // For year view mode with year prop, use calendar year
    if (viewMode === 'year' && year !== undefined) {
      return generateYearColumns(habit, completionMap, year);
    }
    // Otherwise use rolling window with configured weeks
    return generateWeekColumns(habit, completionMap, currentDate, weeksToShow);
  }, [habit, completionMap, currentDate, year, viewMode, weeksToShow]);

  // Calculate month label positions
  const monthLabels = useMemo(() => {
    // Pass year to filter out months from other years (e.g., Dec from previous year)
    return calculateMonthLabels(weeks, viewMode === 'year' ? year : undefined);
  }, [weeks, viewMode, year]);

  const handleCellPress = useCallback((date: string) => {
    const completion = completionMap.get(date);
    onCellPress?.(date, completion);
  }, [completionMap, onCellPress]);

  // Calculate total width based on actual weeks and cell size
  const gridWidth = weeks.length * (cellSize + CELL_GAP);

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
                  { color: textSecondary, left: week * (cellSize + CELL_GAP) },
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
                { color: textSecondary, height: cellSize + CELL_GAP },
                // Only show S, T, S labels (every other one) for small cells
                cellSize < 20 && index % 2 !== 0 && styles.hiddenLabel,
              ]}
            >
              {label}
            </ThemedText>
          ))}
        </View>

        {/* Scrollable grid */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={[styles.weekColumn, { marginRight: CELL_GAP }]}>
                {week.map((cell) => (
                  <View
                    key={cell.date}
                    style={[styles.cellWrapper, { marginBottom: CELL_GAP }]}
                  >
                    <GraphCell
                      date={cell.date}
                      percentage={cell.percentage}
                      habitColor={habit.color}
                      colorScheme={colorScheme}
                      selectionBorderColor={selectionBorderColor}
                      isSelected={selectedDate === cell.date}
                      onPress={onCellPress ? handleCellPress : undefined}
                      size={cellSize}
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
    // marginRight applied inline with dynamic CELL_GAP
  },
  cellWrapper: {
    // Wrapper for spacing
  },
});

export const ContributionGraph = memo(ContributionGraphComponent);
