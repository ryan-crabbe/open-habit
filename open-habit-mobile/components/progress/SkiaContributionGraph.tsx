/**
 * SkiaContributionGraph Component
 *
 * High-performance contribution graph using Skia canvas rendering.
 * Renders entire graph as a single canvas instead of 364+ React components.
 */

import React, { useMemo, useCallback, memo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, GestureResponderEvent } from 'react-native';
import { Canvas, RoundedRect, Text, useFont } from '@shopify/react-native-skia';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, FontSizes } from '@/constants/theme';
import { getLocalDate, addDays, getDayOfWeek, parseLocalDate } from '@/utils/date';
import { getTargetForDate, isHabitScheduledForDate } from '@/utils/habit-schedule';
import { getHabitIntensityColor } from '@/utils/color';
import type { Habit, HabitCompletion } from '@/database';
import type { ViewMode } from './ViewModeSelector';
import { VIEW_MODE_CONFIG } from './ViewModeSelector';

// Day labels for left side
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Month labels
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Grid configuration
const CELL_GAP = 3;
const DAYS_PER_WEEK = 7;
const CELL_RADIUS = 2;

interface SkiaContributionGraphProps {
  habit: Habit;
  completions: HabitCompletion[];
  onCellPress?: (date: string, completion: HabitCompletion | undefined) => void;
  selectedDate?: string | null;
  today?: string;
  year?: number;
  scrollViewRef?: React.RefObject<ScrollView | null>;
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
      percentage = 0.5;
    }
  }

  return { date, percentage, completion };
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

  const jan1 = `${year}-01-01`;
  const jan1Date = parseLocalDate(jan1);
  const jan1DayOfWeek = getDayOfWeek(jan1Date);
  const gridStartDate = addDays(jan1, -jan1DayOfWeek);

  const dec31 = `${year}-12-31`;
  const dec31Date = parseLocalDate(dec31);
  const dec31DayOfWeek = getDayOfWeek(dec31Date);
  const gridEndDate = addDays(dec31, 6 - dec31DayOfWeek);

  const startMs = parseLocalDate(gridStartDate).getTime();
  const endMs = parseLocalDate(gridEndDate).getTime();
  const numWeeks = Math.round((endMs - startMs) / (7 * 24 * 60 * 60 * 1000)) + 1;

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
 * Generates week columns for a rolling window
 */
function generateWeekColumns(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  endDate: string,
  numWeeks: number
): CellData[][] {
  const weeks: CellData[][] = [];

  const endDateObj = parseLocalDate(endDate);
  const endDayOfWeek = getDayOfWeek(endDateObj);
  const weekEndDate = addDays(endDate, 6 - endDayOfWeek);

  const totalDays = numWeeks * 7;
  const startDate = addDays(weekEndDate, -(totalDays - 1));

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
 * Calculates which months appear at which week positions
 */
function calculateMonthLabels(
  weeks: CellData[][],
  targetYear?: number
): { week: number; label: string }[] {
  const labels: { week: number; label: string }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDayDate = parseLocalDate(week[0].date);
    const month = firstDayDate.getMonth();
    const cellYear = firstDayDate.getFullYear();

    if (targetYear !== undefined && cellYear !== targetYear) {
      return;
    }

    if (month !== lastMonth) {
      labels.push({ week: weekIndex, label: MONTH_LABELS[month] });
      lastMonth = month;
    }
  });

  return labels;
}

function SkiaContributionGraphComponent({
  habit,
  completions,
  onCellPress,
  selectedDate,
  today,
  year,
  scrollViewRef,
  viewMode = 'year',
}: SkiaContributionGraphProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const selectionBorderColor = useThemeColor({}, 'text');
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

  const currentDate = today ?? getLocalDate();
  const modeConfig = VIEW_MODE_CONFIG[viewMode];
  const cellSize = modeConfig.cellSize;
  const weeksToShow = modeConfig.weeks;

  // Create completion lookup map
  const completionMap = useMemo(() => {
    const map = new Map<string, HabitCompletion>();
    completions.forEach((c) => map.set(c.date, c));
    return map;
  }, [completions]);

  // Generate week columns
  const weeks = useMemo(() => {
    if (viewMode === 'year' && year !== undefined) {
      return generateYearColumns(habit, completionMap, year);
    }
    return generateWeekColumns(habit, completionMap, currentDate, weeksToShow);
  }, [habit, completionMap, currentDate, year, viewMode, weeksToShow]);

  // Calculate month label positions
  const monthLabels = useMemo(() => {
    return calculateMonthLabels(weeks, viewMode === 'year' ? year : undefined);
  }, [weeks, viewMode, year]);

  // Calculate dimensions
  const gridWidth = weeks.length * (cellSize + CELL_GAP);
  const gridHeight = DAYS_PER_WEEK * (cellSize + CELL_GAP) - CELL_GAP;

  // Pre-compute all cell colors for Skia rendering
  const cellColors = useMemo(() => {
    return weeks.map((week) =>
      week.map((cell) => getHabitIntensityColor(cell.percentage, habit.color, colorScheme))
    );
  }, [weeks, habit.color, colorScheme]);

  // Handle touch - calculate which cell was pressed
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!onCellPress) return;

      const { locationX, locationY } = event.nativeEvent;

      // Calculate week (column) and day (row) from coordinates
      const weekIndex = Math.floor(locationX / (cellSize + CELL_GAP));
      const dayIndex = Math.floor(locationY / (cellSize + CELL_GAP));

      // Bounds check
      if (weekIndex >= 0 && weekIndex < weeks.length && dayIndex >= 0 && dayIndex < DAYS_PER_WEEK) {
        const cell = weeks[weekIndex][dayIndex];
        onCellPress(cell.date, cell.completion);
      }
    },
    [onCellPress, cellSize, weeks]
  );

  // Find selected cell position for highlight
  const selectedPosition = useMemo(() => {
    if (!selectedDate) return null;

    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      for (let dayIndex = 0; dayIndex < weeks[weekIndex].length; dayIndex++) {
        if (weeks[weekIndex][dayIndex].date === selectedDate) {
          return { weekIndex, dayIndex };
        }
      }
    }
    return null;
  }, [selectedDate, weeks]);

  return (
    <View style={styles.container}>
      {/* Day labels column - fixed on left */}
      <View style={styles.dayLabelsColumn}>
        <View style={styles.dayLabelsSpacer} />
        {DAY_LABELS.map((label, index) => (
          <ThemedText
            key={`day-${index}`}
            style={[
              styles.dayLabel,
              { color: textSecondary, height: cellSize + CELL_GAP },
              cellSize < 20 && index % 2 !== 0 && styles.hiddenLabel,
            ]}
          >
            {label}
          </ThemedText>
        ))}
      </View>

      {/* Scrollable area */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={[styles.scrollContent, { width: gridWidth }]}>
          {/* Month labels row */}
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

          {/* Skia Canvas - single component for entire grid */}
          <Pressable onPress={handlePress} disabled={!onCellPress}>
            <Canvas style={{ width: gridWidth, height: gridHeight }}>
              {/* Render all cells as rounded rectangles */}
              {weeks.map((week, weekIndex) =>
                week.map((cell, dayIndex) => (
                  <RoundedRect
                    key={cell.date}
                    x={weekIndex * (cellSize + CELL_GAP)}
                    y={dayIndex * (cellSize + CELL_GAP)}
                    width={cellSize}
                    height={cellSize}
                    r={CELL_RADIUS}
                    color={cellColors[weekIndex][dayIndex]}
                  />
                ))
              )}

              {/* Selection highlight */}
              {selectedPosition && (
                <RoundedRect
                  x={selectedPosition.weekIndex * (cellSize + CELL_GAP) - 1}
                  y={selectedPosition.dayIndex * (cellSize + CELL_GAP) - 1}
                  width={cellSize + 2}
                  height={cellSize + 2}
                  r={CELL_RADIUS}
                  color="transparent"
                  style="stroke"
                  strokeWidth={2}
                />
              )}
            </Canvas>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    width: 20,
    marginRight: Spacing.xs,
  },
  dayLabelsSpacer: {
    height: 16 + Spacing.xs,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    textAlign: 'right',
    paddingRight: 4,
  },
  hiddenLabel: {
    opacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Width set dynamically
  },
  monthLabelsRow: {
    position: 'relative',
    height: 16,
    marginBottom: Spacing.xs,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: FontSizes.xs,
  },
});

export const SkiaContributionGraph = memo(SkiaContributionGraphComponent);
