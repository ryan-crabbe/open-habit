/**
 * Progress Tab - Habit Visualization
 *
 * GitHub-style contribution graphs and streak visualization.
 */

import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, RefreshControl, TouchableOpacity, InteractionManager } from 'react-native';
import { useFocusEffect, router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HabitProgressCard } from '@/components/progress';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useDatabase, getHabits, getAllCompletionsInRange } from '@/database';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { getLocalDate } from '@/utils/date';
import { calculateStreak } from '@/utils/streak';
import type { Habit, HabitCompletion } from '@/database';
import type { StreakResult } from '@/utils/streak';

interface HabitWithCompletions {
  habit: Habit;
  completions: HabitCompletion[];
  streak: StreakResult; // Pre-computed to avoid blocking render
}

// Approximate card height for FlatList optimization
const ESTIMATED_CARD_HEIGHT = 320;

export default function ProgressScreen() {
  const { db, isReady, error } = useDatabase();
  const colorScheme = useColorScheme() ?? 'light';
  const errorColor = Colors[colorScheme].error;
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [habitsWithCompletions, setHabitsWithCompletions] = useState<HabitWithCompletions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load habits and completions with batch query (avoids N+1)
  const loadData = useCallback(async () => {
    if (!db) return;

    try {
      const habits = await getHabits(db);

      // Load current year only (can lazy-load previous years on navigation)
      const endDate = getLocalDate();
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;

      // Single batch query for all completions (instead of N+1 queries)
      const allCompletions = await getAllCompletionsInRange(db, startDate, endDate);

      // Group completions by habit_id
      const completionsByHabit = new Map<number, HabitCompletion[]>();
      allCompletions.forEach((c) => {
        const list = completionsByHabit.get(c.habit_id) || [];
        list.push(c);
        completionsByHabit.set(c.habit_id, list);
      });

      // Build habit data with pre-computed streaks (avoids blocking render)
      const habitsData: HabitWithCompletions[] = habits.map((habit) => {
        const completions = completionsByHabit.get(habit.id) || [];
        const streak = calculateStreak(habit, completions);
        return { habit, completions, streak };
      });

      setHabitsWithCompletions(habitsData);
    } catch (err) {
      console.error('Failed to load progress data:', err);
    }
  }, [db]);

  // Load data when screen focuses, using InteractionManager to avoid blocking UI
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let interactionHandle: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;

      // Wait for navigation animation to complete before loading
      interactionHandle = InteractionManager.runAfterInteractions(async () => {
        if (!isReady || !isMounted) return;

        setIsLoading(true);
        await loadData();
        if (isMounted) {
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        interactionHandle?.cancel();
      };
    }, [isReady, loadData])
  );

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // Render habit card with pre-computed streak
  const renderHabitCard = useCallback(
    ({ item }: { item: HabitWithCompletions }) => (
      <HabitProgressCard
        habit={item.habit}
        completions={item.completions}
        streak={item.streak}
      />
    ),
    []
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: HabitWithCompletions) => item.habit.id.toString(),
    []
  );

  // FlatList layout optimization - provides dimensions without measurement
  const getItemLayout = useCallback(
    (_data: ArrayLike<HabitWithCompletions> | null | undefined, index: number) => ({
      length: ESTIMATED_CARD_HEIGHT,
      offset: ESTIMATED_CARD_HEIGHT * index + Spacing.lg,
      index,
    }),
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
          <IconSymbol name="chart.bar" size={48} color={textSecondary} />
          <ThemedText style={styles.emptyTitle}>No progress yet</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
            Create a habit and start logging to see your progress
          </ThemedText>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/create-habit')}
          >
            <ThemedText style={styles.createButtonText}>Create Habit</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={habitsWithCompletions}
          renderItem={renderHabitCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          windowSize={5}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={100}
          removeClippedSubviews={true}
          initialNumToRender={3}
          getItemLayout={getItemLayout}
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: FontSizes.md * 1.4,
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
});
