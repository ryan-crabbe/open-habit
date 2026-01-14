/**
 * Specific Days Config Component
 *
 * Day picker with per-day target inputs for specific_days habits.
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { withDisabledOpacity } from '@/utils';

interface SpecificDaysConfigProps {
  frequencyDays: Record<string, number>;
  onChange: (days: Record<string, number>) => void;
}

const DAYS = [
  { key: '0', label: 'S', name: 'Sunday' },
  { key: '1', label: 'M', name: 'Monday' },
  { key: '2', label: 'T', name: 'Tuesday' },
  { key: '3', label: 'W', name: 'Wednesday' },
  { key: '4', label: 'T', name: 'Thursday' },
  { key: '5', label: 'F', name: 'Friday' },
  { key: '6', label: 'S', name: 'Saturday' },
];

export function SpecificDaysConfig({ frequencyDays, onChange }: SpecificDaysConfigProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const toggleDay = (dayKey: string) => {
    const newDays = { ...frequencyDays };
    if (dayKey in newDays) {
      delete newDays[dayKey];
    } else {
      newDays[dayKey] = 1;
    }
    onChange(newDays);
  };

  const updateDayCount = (dayKey: string, delta: number) => {
    const currentCount = frequencyDays[dayKey] || 1;
    const newCount = Math.max(1, Math.min(99, currentCount + delta));
    onChange({ ...frequencyDays, [dayKey]: newCount });
  };

  const selectedDays = Object.keys(frequencyDays).sort();

  return (
    <View style={styles.container}>
      {/* Day toggles */}
      <View style={[styles.daysRow, { backgroundColor }]}>
        {DAYS.map((day) => {
          const isSelected = day.key in frequencyDays;
          return (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayToggle,
                isSelected && { backgroundColor: tintColor },
              ]}
              onPress={() => toggleDay(day.key)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.dayLabel,
                  { color: isSelected ? '#FFFFFF' : textColor },
                ]}
              >
                {day.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Per-day target inputs */}
      {selectedDays.length > 0 && (
        <View style={styles.targetsContainer}>
          <ThemedText style={styles.targetsLabel}>
            Times per day
          </ThemedText>
          {selectedDays.map((dayKey) => {
            const day = DAYS.find((d) => d.key === dayKey)!;
            const count = frequencyDays[dayKey];
            return (
              <View
                key={dayKey}
                style={[styles.targetRow, { backgroundColor }]}
              >
                <ThemedText style={styles.dayName}>{day.name}</ThemedText>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => updateDayCount(dayKey, -1)}
                    disabled={count <= 1}
                  >
                    <IconSymbol
                      name="minus"
                      size={16}
                      color={count <= 1 ? withDisabledOpacity(iconColor) : iconColor}
                    />
                  </TouchableOpacity>
                  <ThemedText style={styles.countText}>{count}</ThemedText>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => updateDayCount(dayKey, 1)}
                    disabled={count >= 99}
                  >
                    <IconSymbol
                      name="plus"
                      size={16}
                      color={count >= 99 ? withDisabledOpacity(iconColor) : iconColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {selectedDays.length === 0 && (
        <ThemedText style={styles.hint}>
          Select which days of the week
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  dayToggle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  targetsContainer: {
    gap: Spacing.sm,
  },
  targetsLabel: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginLeft: Spacing.sm,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  dayName: {
    fontSize: FontSizes.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  countText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  hint: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
