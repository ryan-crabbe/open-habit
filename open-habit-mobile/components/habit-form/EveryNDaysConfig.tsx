/**
 * Every N Days Config Component
 *
 * Configuration for every_n_days habits: interval, start date, missed behavior.
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDisplayDate } from '@/utils/date';
import { withDisabledOpacity } from '@/utils';
import type { MissedDayBehavior } from '@/database/habits';

interface EveryNDaysConfigProps {
  interval: number;
  startDate: string;
  missedBehavior: MissedDayBehavior;
  targetCount: number;
  onIntervalChange: (n: number) => void;
  onStartDateChange: (date: string) => void;
  onMissedBehaviorChange: (behavior: MissedDayBehavior) => void;
  onTargetCountChange: (count: number) => void;
}

export function EveryNDaysConfig({
  interval,
  startDate,
  missedBehavior,
  targetCount,
  onIntervalChange,
  onStartDateChange,
  onMissedBehaviorChange,
  onTargetCountChange,
}: EveryNDaysConfigProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const incrementInterval = () => onIntervalChange(Math.min(interval + 1, 365));
  const decrementInterval = () => onIntervalChange(Math.max(interval - 1, 2));

  const incrementTarget = () => onTargetCountChange(Math.min(targetCount + 1, 99));
  const decrementTarget = () => onTargetCountChange(Math.max(targetCount - 1, 1));

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      onStartDateChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  // Parse startDate to Date object (validate format first)
  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(startDate);
  const dateValue = isValidDateFormat ? new Date(startDate + 'T00:00:00') : new Date();

  return (
    <View style={styles.container}>
      {/* Interval */}
      <View style={[styles.row, { backgroundColor }]}>
        <ThemedText style={styles.label}>Every N days</ThemedText>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={decrementInterval}
            disabled={interval <= 2}
          >
            <IconSymbol
              name="minus"
              size={20}
              color={interval <= 2 ? withDisabledOpacity(iconColor) : iconColor}
            />
          </TouchableOpacity>
          <ThemedText style={styles.countText}>{interval}</ThemedText>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={incrementInterval}
            disabled={interval >= 365}
          >
            <IconSymbol
              name="plus"
              size={20}
              color={interval >= 365 ? withDisabledOpacity(iconColor) : iconColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Target count */}
      <View style={[styles.row, { backgroundColor }]}>
        <ThemedText style={styles.label}>Times per occurrence</ThemedText>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={decrementTarget}
            disabled={targetCount <= 1}
          >
            <IconSymbol
              name="minus"
              size={20}
              color={targetCount <= 1 ? withDisabledOpacity(iconColor) : iconColor}
            />
          </TouchableOpacity>
          <ThemedText style={styles.countText}>{targetCount}</ThemedText>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={incrementTarget}
            disabled={targetCount >= 99}
          >
            <IconSymbol
              name="plus"
              size={20}
              color={targetCount >= 99 ? withDisabledOpacity(iconColor) : iconColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Start date */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor }]}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.label}>Start date</ThemedText>
        <View style={styles.dateValue}>
          <ThemedText style={styles.dateText}>
            {formatDisplayDate(startDate)}
          </ThemedText>
          <IconSymbol name="chevron.right" size={16} color={iconColor} />
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'ios' && showDatePicker && (
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: tintColor }]}
          onPress={() => setShowDatePicker(false)}
        >
          <ThemedText style={styles.doneButtonText}>Done</ThemedText>
        </TouchableOpacity>
      )}

      {/* Missed day behavior */}
      <View style={styles.behaviorSection}>
        <ThemedText style={styles.sectionLabel}>If you miss a day</ThemedText>
        <View style={[styles.behaviorRow, { backgroundColor }]}>
          <TouchableOpacity
            style={[
              styles.behaviorOption,
              missedBehavior === 'continue' && { backgroundColor: tintColor },
            ]}
            onPress={() => onMissedBehaviorChange('continue')}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.behaviorText,
                { color: missedBehavior === 'continue' ? '#FFFFFF' : textColor },
              ]}
            >
              Continue counting
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.behaviorOption,
              missedBehavior === 'reset' && { backgroundColor: tintColor },
            ]}
            onPress={() => onMissedBehaviorChange('reset')}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.behaviorText,
                { color: missedBehavior === 'reset' ? '#FFFFFF' : textColor },
              ]}
            >
              Reset to Day 1
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  label: {
    fontSize: FontSizes.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  countText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: FontSizes.md,
    opacity: 0.8,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  behaviorSection: {
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  behaviorRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  behaviorOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  behaviorText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
