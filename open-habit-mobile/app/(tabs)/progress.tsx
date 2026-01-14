/**
 * Progress Tab - Habit Visualization
 *
 * GitHub-style contribution graphs and streak visualization.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HabitProgressCard } from '@/components/progress';
import { useDatabase, getHabits, getCompletionsInRange } from '@/database';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { getLocalDate, addDays } from '@/utils/date';
import type { Habit, HabitCompletion } from '@/database';

interface HabitWithCompletions {
  habit: Habit;
  completions: HabitCompletion[];
}

export default function ProgressScreen() {
  const { db, isReady, error } = useDatabase();
  const colorScheme = useColorScheme() ?? 'light';
  const errorColor = Colors[colorScheme].error;
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [habitsWithCompletions, setHabitsWithCompletions] = useState<HabitWithCompletions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load habits and completions
  const loadData = useCallback(async () => {
    if (!db) return;

    try {
      const habits = await getHabits(db);

      // Calculate date range (52 weeks back from today)
      const endDate = getLocalDate();
      const startDate = addDays(endDate, -364);

      // Load completions for each habit
      const habitsData: HabitWithCompletions[] = await Promise.all(
        habits.map(async (habit) => {
          const completions = await getCompletionsInRange(db, habit.id, startDate, endDate);
          return { habit, completions };
        })
      );

      setHabitsWithCompletions(habitsData);
    } catch (err) {
      console.error('Failed to load progress data:', err);
    }
  }, [db]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function load() {
        if (!isReady) return;

        setIsLoading(true);
        await loadData();
        if (isMounted) {
          setIsLoading(false);
        }
      }

      load();

      return () => {
        isMounted = false;
      };
    }, [isReady, loadData])
  );

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // Render habit card
  const renderHabitCard = useCallback(
    ({ item }: { item: HabitWithCompletions }) => (
      <HabitProgressCard habit={item.habit} completions={item.completions} />
    ),
    []
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: HabitWithCompletions) => item.habit.id.toString(),
    []
  );

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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {habitsWithCompletions.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No habits yet</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
            Create a habit in Settings to start tracking your progress
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={habitsWithCompletions}
          renderItem={renderHabitCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: FontSizes.md * 1.4,
  },
  errorText: {
    padding: Spacing.xl,
  },
});
