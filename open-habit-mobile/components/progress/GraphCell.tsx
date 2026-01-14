/**
 * GraphCell Component
 *
 * Individual cell in a contribution graph.
 * Shows intensity based on completion percentage using habit's color.
 */

import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getHabitIntensityColor } from '@/utils/color';
import { BorderRadius } from '@/constants/theme';

interface GraphCellProps {
  /** The date this cell represents (YYYY-MM-DD) */
  date: string;
  /** Completion percentage (0-1) */
  percentage: number;
  /** The habit's color (hex) */
  habitColor: string;
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
  isSelected = false,
  onPress,
  size = 11,
}: GraphCellProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = getHabitIntensityColor(percentage, habitColor, colorScheme);
  const borderColor = useThemeColor({}, 'text');

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
          isSelected && { borderWidth: 2, borderColor },
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
