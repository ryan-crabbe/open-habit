/**
 * Manage Habits Screen
 *
 * Displays all habits with drag-to-reorder functionality.
 * Tap a habit to edit, drag to reorder.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href, useFocusEffect } from 'expo-router';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDatabase, getHabits, reorderHabits } from '@/database';
import { Spacing, FontSizes, BorderRadius, Colors, Shadows } from '@/constants/theme';
import type { Habit } from '@/database/habits';

export default function ManageHabitsScreen() {
  const { db, isReady, error: dbError } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = Colors[colorScheme ?? 'light'].error;

  // Load habits when screen focuses
  useFocusEffect(
    useCallback(() => {
      async function loadHabits() {
        if (!db) return;
        setIsLoading(true);
        try {
          const loadedHabits = await getHabits(db);
          setHabits(loadedHabits);
        } catch (err) {
          console.error('Failed to load habits:', err);
        } finally {
          setIsLoading(false);
        }
      }

      if (isReady) {
        loadHabits();
      }
    }, [db, isReady])
  );

  const handleDragEnd = async ({ data }: { data: Habit[] }) => {
    if (!db) return;

    // Save previous state for rollback
    const previousHabits = habits;

    // Update local state immediately for responsive UI
    setHabits(data);

    // Persist new order to database
    try {
      const orderedIds = data.map((h) => h.id);
      await reorderHabits(db, orderedIds);
    } catch (err) {
      console.error('Failed to save habit order:', err);
      // Reload from database to get correct order
      try {
        const loadedHabits = await getHabits(db);
        setHabits(loadedHabits);
      } catch (reloadErr) {
        console.error('Failed to reload habits:', reloadErr);
        setHabits(previousHabits);
      }
      Alert.alert('Error', 'Failed to save habit order');
    }
  };

  const handleEditHabit = (habit: Habit) => {
    router.push({ pathname: '/edit-habit', params: { id: habit.id.toString() } } as Href);
  };

  const getFrequencyLabel = (habit: Habit): string => {
    switch (habit.frequency_type) {
      case 'daily':
        return habit.target_count === 1 ? 'Daily' : `${habit.target_count}x daily`;
      case 'weekly':
        return habit.target_count === 1 ? 'Weekly' : `${habit.target_count}x per week`;
      case 'specific_days':
        try {
          const days = habit.frequency_days ? JSON.parse(habit.frequency_days) : {};
          const dayCount = Object.keys(days).length;
          return `${dayCount} days/week`;
        } catch {
          return 'Specific days';
        }
      case 'every_n_days':
        return `Every ${habit.frequency_interval} days`;
      default:
        return '';
    }
  };

  const renderHabitItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleEditHabit(item)}
          onLongPress={drag}
          delayLongPress={150}
          style={[
            styles.habitRow,
            { backgroundColor: cardBackground },
            isActive && styles.habitRowActive,
            Shadows[colorScheme ?? 'light'].sm,
          ]}
        >
          {/* Color indicator */}
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />

          {/* Content */}
          <View style={styles.habitContent}>
            <ThemedText style={styles.habitName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={[styles.habitFrequency, { color: textSecondary }]}>
              {getFrequencyLabel(item)}
            </ThemedText>
          </View>

          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <IconSymbol name="line.3.horizontal" size={20} color={textSecondary} />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (dbError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          Failed to initialize database: {dbError.message}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <IconSymbol name="chevron.left" size={24} color={tintColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Manage Habits</ThemedText>
          <View style={styles.headerButton} />
        </View>

        {/* Content */}
        {!isReady || isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.centered}>
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No habits yet
            </ThemedText>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: tintColor }]}
              onPress={() => router.push('/create-habit')}
            >
              <ThemedText style={styles.createButtonText}>Create Habit</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <DraggableFlatList
            data={habits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHabitItem}
            onDragEnd={handleDragEnd}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Hint text */}
        {habits.length > 0 && (
          <View style={styles.hintContainer}>
            <ThemedText style={[styles.hintText, { color: textSecondary }]}>
              Long press and drag to reorder
            </ThemedText>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  habitRowActive: {
    opacity: 0.9,
    transform: [{ scale: 1.02 }],
  },
  colorIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  habitContent: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  habitName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: FontSizes.sm,
  },
  dragHandle: {
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.lg,
    marginBottom: Spacing.lg,
  },
  createButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  hintContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: FontSizes.sm,
  },
  errorText: {
    padding: Spacing.xl,
  },
});
