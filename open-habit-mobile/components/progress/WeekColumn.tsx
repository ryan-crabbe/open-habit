/**
 * WeekColumn Component
 *
 * Renders a single week (7 days) as one component with shared touch handling.
 * Reduces component count from 7 GraphCell + 7 TouchableOpacity to 1 component.
 */

import React, { memo, useCallback } from 'react';
import { StyleSheet, View, Pressable, GestureResponderEvent } from 'react-native';

import { getHabitIntensityColor } from '@/utils/color';
import { BorderRadius } from '@/constants/theme';

interface CellData {
  date: string;
  percentage: number;
}

interface WeekColumnProps {
  /** Array of 7 cell data objects for the week */
  weekData: CellData[];
  /** Cell size in pixels */
  cellSize: number;
  /** Gap between cells */
  cellGap: number;
  /** The habit's color (hex) */
  habitColor: string;
  /** Color scheme for intensity calculation */
  colorScheme: 'light' | 'dark';
  /** Border color for selected state */
  selectionBorderColor: string;
  /** Currently selected date */
  selectedDate?: string | null;
  /** Callback when a cell is pressed */
  onCellPress?: (date: string) => void;
}

function WeekColumnComponent({
  weekData,
  cellSize,
  cellGap,
  habitColor,
  colorScheme,
  selectionBorderColor,
  selectedDate,
  onCellPress,
}: WeekColumnProps) {
  // Calculate which cell was pressed based on Y coordinate
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!onCellPress) return;

      const { locationY } = event.nativeEvent;
      const cellTotalHeight = cellSize + cellGap;
      const cellIndex = Math.floor(locationY / cellTotalHeight);

      if (cellIndex >= 0 && cellIndex < weekData.length) {
        onCellPress(weekData[cellIndex].date);
      }
    },
    [onCellPress, cellSize, cellGap, weekData]
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onCellPress}
      style={[styles.column, { marginRight: cellGap }]}
    >
      {weekData.map((cell) => {
        const backgroundColor = getHabitIntensityColor(
          cell.percentage,
          habitColor,
          colorScheme
        );
        const isSelected = selectedDate === cell.date;

        return (
          <View
            key={cell.date}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor,
                marginBottom: cellGap,
                borderRadius: BorderRadius.sm / 2,
              },
              isSelected && {
                borderWidth: 2,
                borderColor: selectionBorderColor,
              },
            ]}
          />
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  cell: {
    // Base styles applied inline
  },
});

export const WeekColumn = memo(WeekColumnComponent);
