/**
 * GraphCell Component
 *
 * Individual cell in a contribution graph.
 * Shows intensity based on completion percentage using habit's color.
 *
 * PERF: colorScheme and selectionBorderColor are passed as props to avoid
 * hook calls in each of 364+ cells per habit graph.
 */

import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getHabitIntensityColor } from '@/utils/color';
import { BorderRadius } from '@/constants/theme';

interface GraphCellProps {
  /** The date this cell represents (YYYY-MM-DD) */
  date: string;
  /** Completion percentage (0-1) */
  percentage: number;
  /** The habit's color (hex) */
  habitColor: string;
  /** Color scheme for intensity calculation (passed from parent to avoid hook per cell) */
  colorScheme: 'light' | 'dark';
  /** Border color for selected state (passed from parent to avoid hook per cell) */
  selectionBorderColor: string;
  /** Whether this cell is currently selected */
  isSelected?: boolean;
  /** Callback when cell is pressed */
  onPress?: (date: string) => void;
  /** Cell size in pixels */
  size?: number;
}

function GraphCellComponent({
  date,
  percentage,
  habitColor,
  colorScheme,
  selectionBorderColor,
  isSelected = false,
  onPress,
  size = 11,
}: GraphCellProps) {
  const backgroundColor = getHabitIntensityColor(percentage, habitColor, colorScheme);

  const handlePress = () => {
    onPress?.(date);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            backgroundColor,
            borderRadius: BorderRadius.sm / 2,
          },
          isSelected && { borderWidth: 2, borderColor: selectionBorderColor },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    // Base styles handled by inline props
  },
});

export const GraphCell = memo(GraphCellComponent);
