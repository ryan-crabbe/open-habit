/**
 * Notification Settings Screen
 *
 * Global notification toggle and per-habit reminder management.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href, useFocusEffect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useNotifications } from '@/hooks/use-notifications';
import { useDatabase, getHabits, getRemindersForHabit } from '@/database';
import type { Habit, HabitReminder } from '@/database';
import { Spacing, FontSizes, BorderRadius } from '@/constants/theme';

interface HabitWithReminders {
  habit: Habit;
  reminders: HabitReminder[];
  enabledCount: number;
}

export default function NotificationSettingsScreen() {
  const { db, isReady } = useDatabase();
  const {
    permissionStatus,
    isEnabled,
    isLoading: notifLoading,
    setEnabled,
    requestPermissions,
    openSettings,
  } = useNotifications();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const warningColor = useThemeColor({}, 'warning');

  const [habitsWithReminders, setHabitsWithReminders] = useState<
    HabitWithReminders[]
  >([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);

  // Load habits and their reminders (refresh on screen focus)
  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        if (!db || !isReady) return;

        setIsLoadingHabits(true);
        try {
          const habits = await getHabits(db);
          const habitsData: HabitWithReminders[] = [];

          for (const habit of habits) {
            const reminders = await getRemindersForHabit(db, habit.id);
            const enabledCount = reminders.filter((r) => r.enabled === 1).length;
            habitsData.push({ habit, reminders, enabledCount });
          }

          setHabitsWithReminders(habitsData);
        } catch (err) {
          console.error('Failed to load habits:', err);
        } finally {
          setIsLoadingHabits(false);
        }
      }

      loadData();
    }, [db, isReady])
  );

  const handleToggleGlobal = useCallback(
    async (value: boolean) => {
      if (permissionStatus === 'denied' && value) {
        // User trying to enable but permissions denied
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive habit reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return;
      }

      if (permissionStatus === 'undetermined' && value) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Notification permission is required to receive reminders.'
          );
          return;
        }
      }

      await setEnabled(value);
    },
    [permissionStatus, requestPermissions, setEnabled, openSettings]
  );

  const handleEditHabitReminders = useCallback((habitId: number) => {
    router.push(`/edit-habit?id=${habitId}` as Href);
  }, []);

  if (notifLoading || isLoadingHabits) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Permission Warning */}
        {permissionStatus === 'denied' && (
          <TouchableOpacity
            style={[
              styles.warningBanner,
              { backgroundColor: warningColor + '20' },
            ]}
            onPress={openSettings}
          >
            <IconSymbol
              name="exclamationmark.triangle"
              size={20}
              color={warningColor}
            />
            <ThemedText style={[styles.warningText, { color: warningColor }]}>
              Notifications are disabled in system settings. Tap to open
              settings.
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Global Toggle */}
        <ThemedText style={styles.sectionHeader}>GENERAL</ThemedText>
        <ThemedView
          style={[styles.section, { backgroundColor: cardBackground }]}
        >
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <ThemedText style={styles.toggleLabel}>
                Enable Notifications
              </ThemedText>
              <ThemedText
                style={[styles.toggleDescription, { color: textSecondary }]}
              >
                Receive reminders for your habits
              </ThemedText>
            </View>
            <Switch
              value={isEnabled && permissionStatus !== 'denied'}
              onValueChange={handleToggleGlobal}
              trackColor={{ true: tintColor }}
              disabled={permissionStatus === 'denied'}
            />
          </View>
        </ThemedView>

        {/* Per-Habit Reminders */}
        <ThemedText style={styles.sectionHeader}>HABIT REMINDERS</ThemedText>
        <ThemedView
          style={[styles.section, { backgroundColor: cardBackground }]}
        >
          {habitsWithReminders.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                No habits created yet
              </ThemedText>
            </View>
          ) : (
            habitsWithReminders.map((item, index) => (
              <React.Fragment key={item.habit.id}>
                {index > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.habitRow}
                  onPress={() => handleEditHabitReminders(item.habit.id)}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.habit.color },
                    ]}
                  />
                  <View style={styles.habitInfo}>
                    <ThemedText style={styles.habitName}>
                      {item.habit.name}
                    </ThemedText>
                    <ThemedText
                      style={[styles.reminderCount, { color: textSecondary }]}
                    >
                      {item.reminders.length === 0
                        ? 'No reminders'
                        : `${item.enabledCount} of ${item.reminders.length} reminders active`}
                    </ThemedText>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}
        </ThemedView>

        {/* Info text */}
        <ThemedText style={[styles.infoText, { color: textSecondary }]}>
          Tap a habit to manage its reminders. Reminders will only fire on days
          when the habit is scheduled.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  backText: {
    fontSize: FontSizes.md,
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    marginLeft: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  toggleContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: FontSizes.md,
  },
  reminderCount: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginLeft: Spacing.lg + 12 + Spacing.md, // Align with text after color dot
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
  },
  infoText: {
    fontSize: FontSizes.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
});
