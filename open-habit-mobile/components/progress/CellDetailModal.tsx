/**
 * CellDetailModal Component
 *
 * Modal showing details for a selected contribution graph cell.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { formatDisplayDate } from '@/utils/date';
import { getTargetForDate } from '@/utils/habit-schedule';
import type { Habit, HabitCompletion } from '@/database';

interface CellDetailModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The selected date */
  date: string | null;
  /** The habit */
  habit: Habit;
  /** The completion record for the date (if any) */
  completion: HabitCompletion | undefined;
  /** Callback to close the modal */
  onClose: () => void;
}

export function CellDetailModal({
  visible,
  date,
  habit,
  completion,
  onClose,
}: CellDetailModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  if (!date) return null;

  const target = getTargetForDate(habit, date);
  const count = completion?.count ?? 0;
  const note = completion?.note;
  const skipped = completion?.skipped === 1;

  const isCompleted = count >= target;
  const displayDate = formatDisplayDate(date);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <ThemedView
              style={[
                styles.modal,
                { backgroundColor: cardBackground },
                Shadows[colorScheme].lg,
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
                <ThemedText style={styles.dateText}>{displayDate}</ThemedText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={20} color={textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Status */}
              <View style={styles.statusRow}>
                {skipped ? (
                  <>
                    <IconSymbol
                      name="minus.circle.fill"
                      size={24}
                      color={textSecondary}
                    />
                    <ThemedText style={[styles.statusText, { color: textSecondary }]}>
                      Skipped
                    </ThemedText>
                  </>
                ) : isCompleted ? (
                  <>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={24}
                      color={tintColor}
                    />
                    <ThemedText style={[styles.statusText, { color: tintColor }]}>
                      Completed
                    </ThemedText>
                  </>
                ) : count > 0 ? (
                  <>
                    <IconSymbol
                      name="circle.lefthalf.filled"
                      size={24}
                      color={habit.color}
                    />
                    <ThemedText style={styles.statusText}>In Progress</ThemedText>
                  </>
                ) : (
                  <>
                    <IconSymbol name="circle" size={24} color={textSecondary} />
                    <ThemedText style={[styles.statusText, { color: textSecondary }]}>
                      Not Started
                    </ThemedText>
                  </>
                )}
              </View>

              {/* Progress */}
              {!skipped && target > 0 && (
                <View style={styles.progressRow}>
                  <ThemedText style={[styles.progressLabel, { color: textSecondary }]}>
                    Progress
                  </ThemedText>
                  <ThemedText style={styles.progressValue}>
                    {count} / {target}
                  </ThemedText>
                </View>
              )}

              {/* Note */}
              {note && (
                <View style={styles.noteContainer}>
                  <ThemedText style={[styles.noteLabel, { color: textSecondary }]}>
                    Note
                  </ThemedText>
                  <ThemedText style={styles.noteText}>{note}</ThemedText>
                </View>
              )}
            </ThemedView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  progressLabel: {
    fontSize: FontSizes.sm,
  },
  progressValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  noteLabel: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  noteText: {
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.4,
  },
});
