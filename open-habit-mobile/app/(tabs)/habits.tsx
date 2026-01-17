/**
 * Habits Tab - Habit Management
 *
 * Shows all habits with drag-to-reorder and a button to create new habits.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router, Href, useFocusEffect } from 'expo-router';
import { Freeze } from 'react-freeze';
import { useIsFocused } from '@react-navigation/native';
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

export default function HabitsScreen() {
  const { db, isReady, error: dbError } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const isFocused = useIsFocused();

  const cardBackground = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = Colors[colorScheme].error;

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
          if (__DEV__) console.error('Failed to load habits:', err);
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

    const previousHabits = habits;
    setHabits(data);

    try {
      const orderedIds = data.map((h) => h.id);
      await reorderHabits(db, orderedIds);
    } catch (err) {
      if (__DEV__) console.error('Failed to save habit order:', err);
      try {
        const loadedHabits = await getHabits(db);
        setHabits(loadedHabits);
      } catch (reloadErr) {
        if (__DEV__) console.error('Failed to reload habits:', reloadErr);
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
            Shadows[colorScheme].sm,
          ]}
        >
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.habitContent}>
            <ThemedText style={styles.habitName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={[styles.habitFrequency, { color: textSecondary }]}>
              {getFrequencyLabel(item)}
            </ThemedText>
          </View>
          <View style={styles.dragHandle}>
            <IconSymbol name="line.3.horizontal" size={20} color={textSecondary} />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderHeader = () => (
    <TouchableOpacity
      style={[styles.createButton, { backgroundColor: tintColor }]}
      onPress={() => router.push('/create-habit')}
      activeOpacity={0.8}
    >
      <IconSymbol name="plus" size={20} color={Colors[colorScheme].buttonText} />
      <ThemedText style={[styles.createButtonText, { color: Colors[colorScheme].buttonText }]}>
        Create New Habit
      </ThemedText>
    </TouchableOpacity>
  );

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
    <Freeze freeze={!isFocused}>
      <GestureHandlerRootView style={styles.container}>
        <ThemedView style={styles.container}>
          {!isReady || isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={tintColor} />
            </View>
          ) : habits.length === 0 ? (
            <View style={styles.centered}>
              <IconSymbol name="square.grid.2x2" size={48} color={textSecondary} />
              <ThemedText style={styles.emptyTitle}>No habits yet</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
                Create your first habit to start tracking
              </ThemedText>
              <TouchableOpacity
                style={[styles.emptyCreateButton, { backgroundColor: tintColor }]}
                onPress={() => router.push('/create-habit')}
              >
                <ThemedText style={[styles.createButtonText, { color: Colors[colorScheme].buttonText }]}>
                  Create Habit
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <DraggableFlatList
                data={habits}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderHabitItem}
                onDragEnd={handleDragEnd}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
              />
              <View style={styles.hintContainer}>
                <ThemedText style={[styles.hintText, { color: textSecondary }]}>
                  Long press and drag to reorder
                </ThemedText>
              </View>
            </>
          )}
        </ThemedView>
      </GestureHandlerRootView>
    </Freeze>
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
    padding: Spacing.xl,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  createButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyCreateButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
