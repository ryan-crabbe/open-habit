/**
 * Color Picker Component
 *
 * Grid of preset color swatches for habit color selection.
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { HabitColors, Spacing, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {HabitColors.map((color) => {
        const isSelected = value === color;
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.swatch,
              { backgroundColor: color },
              isSelected && styles.selectedSwatch,
            ]}
            onPress={() => onChange(color)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSwatch: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});
