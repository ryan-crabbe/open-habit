/**
 * Reminders Config Component
 *
 * Manages reminder times for a habit with add, edit, toggle, and delete functionality.
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Switch } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, FontSizes, Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ReminderState {
  id?: number;
  time: string; // HH:MM format
  enabled: boolean;
}

interface RemindersConfigProps {
  reminders: ReminderState[];
  onAdd: (time: string) => void;
  onUpdate: (index: number, time: string) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
}

/**
 * Format HH:MM time to display format (e.g., "9:00 AM")
 */
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Convert HH:MM string to Date object for picker
 */
function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Convert Date object to HH:MM string
 */
function dateToTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function RemindersConfig({
  reminders,
  onAdd,
  onUpdate,
  onToggle,
  onRemove,
}: RemindersConfigProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderSecondary = Colors[colorScheme].borderSecondary;

  const [showPicker, setShowPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  const handleAddPress = () => {
    // Default to 9:00 AM for new reminders
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setPickerValue(defaultTime);
    setEditingIndex(null);
    setShowPicker(true);
  };

  const handleEditPress = (index: number) => {
    setPickerValue(timeToDate(reminders[index].time));
    setEditingIndex(index);
    setShowPicker(true);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate && event.type !== 'dismissed') {
      const time = dateToTime(selectedDate);
      setPickerValue(selectedDate);

      if (Platform.OS === 'android') {
        // Android closes picker automatically, apply change immediately
        if (editingIndex !== null) {
          onUpdate(editingIndex, time);
        } else {
          onAdd(time);
        }
      }
    }
  };

  const handleDone = () => {
    const time = dateToTime(pickerValue);
    if (editingIndex !== null) {
      onUpdate(editingIndex, time);
    } else {
      onAdd(time);
    }
    setShowPicker(false);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setEditingIndex(null);
  };

  return (
    <View style={styles.container}>
      {/* Reminder List */}
      {reminders.length > 0 && (
        <View style={[styles.remindersList, { backgroundColor }]}>
          {reminders.map((reminder, index) => (
            <View key={reminder.id ?? `new-${index}`}>
              {index > 0 && (
                <View style={[styles.separator, { backgroundColor: borderSecondary }]} />
              )}
              <View style={styles.reminderRow}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => handleEditPress(index)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.timeText}>
                    {formatTimeDisplay(reminder.time)}
                  </ThemedText>
                </TouchableOpacity>

                <View style={styles.actions}>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => onToggle(index)}
                    trackColor={{ true: tintColor }}
                  />
                  <TouchableOpacity
                    onPress={() => onRemove(index)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol name="trash" size={18} color={Colors[colorScheme].error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {reminders.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor }]}>
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            No reminders set
          </ThemedText>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: tintColor }]}
        onPress={handleAddPress}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.addButtonText}>Add Reminder</ThemedText>
      </TouchableOpacity>

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* iOS Done/Cancel Buttons */}
      {Platform.OS === 'ios' && showPicker && (
        <View style={styles.pickerButtons}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={handleCancel}
          >
            <ThemedText style={[styles.pickerButtonText, { color: textSecondary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerButton, styles.doneButton, { backgroundColor: tintColor }]}
            onPress={handleDone}
          >
            <ThemedText style={styles.doneButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  remindersList: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg,
  },
  timeButton: {
    flex: 1,
  },
  timeText: {
    fontSize: FontSizes.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pickerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  pickerButtonText: {
    fontSize: FontSizes.md,
  },
  doneButton: {
    backgroundColor: undefined, // Set dynamically
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
});
