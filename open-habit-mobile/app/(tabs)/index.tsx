/**
 * Log Tab - Today&apos;s Habits
 *
 * Main screen for logging daily habit completions.
 * Shows habits scheduled for today with tap-to-increment functionality.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Freeze } from 'react-freeze';
import { useIsFocused } from '@react-navigation/native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HabitCard } from '@/components/log';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  useDatabase,
  getHabits,
  getAllCompletionsForDate,
  incrementCompletion,
  decrementCompletion,
  skipCompletion,
  upsertCompletion,
  updateCompletionNote,
  getLastCompletionForHabit,
  getWeeklyCompletionCount,
  type Habit,
  type HabitCompletion,
} from '@/database';
import { formatDisplayDate, getLocalDate, getWeekBounds } from '@/utils/date';
import { isHabitScheduledForDate, getTargetForDate } from '@/utils/habit-schedule';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface HabitWithCompletion {
  habit: Habit;
  completion: HabitCompletion | null;
  targetCount: number;
  weeklyCount?: number; // For weekly habits
}

export default function LogScreen() {
  const { db, isReady, error } = useDatabase();
  const colorScheme = useColorScheme() ?? 'light';
  const errorColor = Colors[colorScheme].error;
  const isFocused = useIsFocused();

  // Use ref for today's date - updated on focus to handle midnight crossover
  const todayRef = useRef(getLocalDate());
  const [displayDate, setDisplayDate] = useState(formatDisplayDate(todayRef.current));

  // Load ID to prevent race conditions with stale async results
  const loadIdRef = useRef(0);

  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [totalHabitCount, setTotalHabitCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action sheet state
  const [selectedHabit, setSelectedHabit] = useState<HabitWithCompletion | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  const loadHabits = useCallback(async () => {
    if (!db) return;

    // Increment load ID to track this request
    const currentLoadId = ++loadIdRef.current;
    const today = todayRef.current;

    try {
      // Get all habits
      const allHabits = await getHabits(db);

      // Check if this load is still current (no newer load started)
      if (currentLoadId !== loadIdRef.current) return;

      // Get today's completions
      const todayCompletions = await getAllCompletionsForDate(db, today);
      const completionMap = new Map<number, HabitCompletion>();
      for (const c of todayCompletions) {
        completionMap.set(c.habit_id, c);
      }

      // Filter to habits scheduled for today
      const scheduledHabits: HabitWithCompletion[] = [];

      for (const habit of allHabits) {
        // For every_n_days with reset behavior, we need the last completion
        let lastCompletionDate: string | undefined;
        if (habit.frequency_type === 'every_n_days' && habit.missed_day_behavior === 'reset') {
          const lastCompletion = await getLastCompletionForHabit(db, habit.id);
          lastCompletionDate = lastCompletion?.date;
        }

        const isScheduled = isHabitScheduledForDate(habit, today, lastCompletionDate);
        if (!isScheduled) continue;

        const completion = completionMap.get(habit.id) ?? null;
        let targetCount = getTargetForDate(habit, today);
        let weeklyCount: number | undefined;

        // For weekly habits, show weekly progress
        if (habit.frequency_type === 'weekly') {
          const { startDate, endDate } = getWeekBounds(today, 1); // Monday start
          weeklyCount = await getWeeklyCompletionCount(db, habit.id, startDate, endDate);
          // targetCount is already the weekly target
        }

        scheduledHabits.push({
          habit,
          completion,
          targetCount,
          weeklyCount,
        });
      }

      // Final check before updating state
      if (currentLoadId !== loadIdRef.current) return;

      setTotalHabitCount(allHabits.length);
      setHabits(scheduledHabits);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      if (currentLoadId === loadIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [db]);

  // Load on focus and refresh date to handle midnight crossover
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        // Update today's date on focus in case midnight passed
        const newToday = getLocalDate();
        if (newToday !== todayRef.current) {
          todayRef.current = newToday;
          setDisplayDate(formatDisplayDate(newToday));
        }
        loadHabits();
      }
    }, [isReady, loadHabits])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadHabits();
  }, [loadHabits]);

  const handleTap = useCallback(async (item: HabitWithCompletion) => {
    if (!db) return;

    // Check if at target and overload not allowed
    const currentCount = item.completion?.count ?? 0;
    if (item.habit.allow_overload === 0 && currentCount >= item.targetCount) {
      return; // Don't increment - capped at target
    }

    try {
      await incrementCompletion(db, item.habit.id, todayRef.current);
      await loadHabits();
    } catch (err) {
      console.error('Failed to increment:', err);
    }
  }, [db, loadHabits]);

  const handleLongPress = useCallback((item: HabitWithCompletion) => {
    setSelectedHabit(item);
    setNoteText(item.completion?.note ?? '');
    setShowActionSheet(true);
  }, []);

  const handleQuickUndo = useCallback(async (item: HabitWithCompletion) => {
    if (!db || (item.completion?.count ?? 0) === 0) return;

    try {
      await decrementCompletion(db, item.habit.id, todayRef.current);
      await loadHabits();
    } catch (err) {
      console.error('Failed to decrement:', err);
    }
  }, [db, loadHabits]);

  const handleSkip = useCallback(async () => {
    if (!db || !selectedHabit) return;

    Alert.alert(
      'Skip Today',
      `Skip "${selectedHabit.habit.name}" for today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await skipCompletion(db, selectedHabit.habit.id, todayRef.current);
              await loadHabits();
            } catch (err) {
              console.error('Failed to skip:', err);
            }
            setShowActionSheet(false);
            setSelectedHabit(null);
          },
        },
      ]
    );
  }, [db, selectedHabit, loadHabits]);

  const handleUndo = useCallback(async () => {
    if (!db || !selectedHabit) return;

    try {
      await decrementCompletion(db, selectedHabit.habit.id, todayRef.current);
      await loadHabits();
    } catch (err) {
      console.error('Failed to decrement:', err);
    }
    setShowActionSheet(false);
    setSelectedHabit(null);
  }, [db, selectedHabit, loadHabits]);

  const handleOpenNoteModal = useCallback(() => {
    setShowActionSheet(false);
    setShowNoteModal(true);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!db || !selectedHabit) return;

    const today = todayRef.current;
    try {
      // If there's no completion yet, create one with count=0 (don't auto-increment)
      if (!selectedHabit.completion) {
        await upsertCompletion(db, selectedHabit.habit.id, today, 0, 0, noteText || null);
      } else {
        await updateCompletionNote(db, selectedHabit.habit.id, today, noteText || null);
      }
      await loadHabits();
    } catch (err) {
      console.error('Failed to save note:', err);
    }
    setShowNoteModal(false);
    setSelectedHabit(null);
    setNoteText('');
  }, [db, selectedHabit, noteText, loadHabits]);

  const closeActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setSelectedHabit(null);
  }, []);

  const closeNoteModal = useCallback(() => {
    setShowNoteModal(false);
    setSelectedHabit(null);
    setNoteText('');
  }, []);

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          Failed to initialize database: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isReady || isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Today&apos;s Habits</ThemedText>
          <ThemedText style={styles.date}>{displayDate}</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textSecondary }}>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: HabitWithCompletion }) => {
    // For weekly habits, use weekly count (already includes today's completions)
    // No need to add item.completion?.count - getWeeklyCompletionCount already includes it
    const isWeekly = item.habit.frequency_type === 'weekly';
    const effectiveCompletion = isWeekly && item.weeklyCount !== undefined
      ? {
          // Create a synthetic completion object for weekly display
          id: item.completion?.id ?? 0,
          habit_id: item.habit.id,
          date: todayRef.current,
          count: item.weeklyCount,
          skipped: item.completion?.skipped ?? 0,
          note: item.completion?.note ?? null,
          created_at: item.completion?.created_at ?? '',
          updated_at: item.completion?.updated_at ?? '',
        } as HabitCompletion
      : item.completion;

    return (
      <HabitCard
        habit={item.habit}
        completion={effectiveCompletion}
        targetCount={item.targetCount}
        onTap={() => handleTap(item)}
        onLongPress={() => handleLongPress(item)}
        onUndo={() => handleQuickUndo(item)}
      />
    );
  };

  return (
    <Freeze freeze={!isFocused}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Today&apos;s Habits</ThemedText>
          <ThemedText style={styles.date}>{displayDate}</ThemedText>
        </View>

        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            {totalHabitCount === 0 ? (
              // No habits created at all
              <ThemedView style={styles.emptyState}>
                <IconSymbol name="plus.circle" size={48} color={textSecondary} />
                <ThemedText style={styles.emptyTitle}>No habits yet</ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
                  Create your first habit to start tracking
                </ThemedText>
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: tintColor }]}
                  onPress={() => router.push('/create-habit')}
                >
                  <ThemedText style={styles.createButtonText}>Create Habit</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ) : (
              // Habits exist but none scheduled today
              <ThemedView style={styles.emptyState}>
                <IconSymbol name="checkmark.circle" size={48} color={tintColor} />
                <ThemedText style={styles.emptyTitle}>All done for today!</ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No habits are scheduled for today. Enjoy your free time!
                </ThemedText>
              </ThemedView>
            )}
          </View>
        ) : (
          <FlatList
            data={habits}
            renderItem={renderItem}
            keyExtractor={(item) => item.habit.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={tintColor}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Action Sheet Modal */}
        <Modal
          visible={showActionSheet}
          transparent
          animationType="fade"
          onRequestClose={closeActionSheet}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeActionSheet}
          >
            <View style={[styles.actionSheet, { backgroundColor: cardColor }]}>
              <View style={styles.actionSheetHeader}>
                <ThemedText style={styles.actionSheetTitle}>
                  {selectedHabit?.habit.name}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleUndo}
                disabled={(selectedHabit?.completion?.count ?? 0) === 0}
              >
                <IconSymbol name="arrow.uturn.backward" size={22} color={tintColor} />
                <ThemedText style={[
                  styles.actionButtonText,
                  (selectedHabit?.completion?.count ?? 0) === 0 && styles.disabledText
                ]}>
                  Undo Last
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSkip}
              >
                <IconSymbol name="minus.circle" size={22} color={Colors[colorScheme].warning} />
                <ThemedText style={styles.actionButtonText}>Skip Today</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenNoteModal}
              >
                <IconSymbol name="note.text" size={22} color={tintColor} />
                <ThemedText style={styles.actionButtonText}>
                  {selectedHabit?.completion?.note ? 'Edit Note' : 'Add Note'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={closeActionSheet}
              >
                <ThemedText style={[styles.actionButtonText, { color: textSecondary }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Note Modal */}
        <Modal
          visible={showNoteModal}
          transparent
          animationType="fade"
          onRequestClose={closeNoteModal}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity
              style={styles.modalOverlayInner}
              activeOpacity={1}
              onPress={closeNoteModal}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={[styles.noteModal, { backgroundColor: cardColor }]}
              >
                <View style={styles.noteModalHeader}>
                  <ThemedText style={styles.noteModalTitle}>Add Note</ThemedText>
                  <TouchableOpacity onPress={closeNoteModal}>
                    <IconSymbol name="xmark" size={20} color={textSecondary} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      color: textColor,
                      borderColor: textSecondary,
                      backgroundColor: backgroundColor,
                    },
                  ]}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Enter a note..."
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />

                <View style={styles.noteModalButtons}>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.cancelNoteButton]}
                    onPress={closeNoteModal}
                  >
                    <ThemedText style={{ color: textSecondary }}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noteButton, { backgroundColor: tintColor }]}
                    onPress={handleSaveNote}
                  >
                    <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      Save
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </ThemedView>
    </Freeze>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  createButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    padding: Spacing.xl,
  },
  // Action Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
    marginHorizontal: Spacing.lg,
  },
  actionSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  actionButtonText: {
    fontSize: 17,
  },
  disabledText: {
    opacity: 0.4,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  // Note Modal
  noteModal: {
    width: '90%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 16,
  },
  noteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  noteButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelNoteButton: {
    backgroundColor: 'transparent',
  },
});
