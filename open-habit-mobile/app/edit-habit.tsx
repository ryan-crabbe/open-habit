/**
 * Edit Habit Screen
 *
 * Form for editing an existing habit. Reuses form components from create-habit.
 */

import React, { useReducer, useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useDatabase, getHabitById, updateHabit, deleteHabit } from '@/database';
import { HabitColors, Spacing, FontSizes, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getLocalDate } from '@/utils/date';
import type { Habit, FrequencyType, MissedDayBehavior, HabitInput } from '@/database/habits';

import { FormSection } from '@/components/habit-form/FormSection';
import { HabitNameInput } from '@/components/habit-form/HabitNameInput';
import { FrequencyTypeSelector } from '@/components/habit-form/FrequencyTypeSelector';
import { ColorPicker } from '@/components/habit-form/ColorPicker';
import { DailyFrequencyConfig } from '@/components/habit-form/DailyFrequencyConfig';
import { WeeklyFrequencyConfig } from '@/components/habit-form/WeeklyFrequencyConfig';
import { SpecificDaysConfig } from '@/components/habit-form/SpecificDaysConfig';
import { EveryNDaysConfig } from '@/components/habit-form/EveryNDaysConfig';

// Form state shape
interface FormState {
  name: string;
  frequencyType: FrequencyType;
  targetCount: number;
  frequencyDays: Record<string, number>;
  frequencyInterval: number;
  frequencyStartDate: string;
  missedDayBehavior: MissedDayBehavior;
  color: string;
  allowOverload: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

// Action types
type FormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_FREQUENCY_TYPE'; payload: FrequencyType }
  | { type: 'SET_TARGET_COUNT'; payload: number }
  | { type: 'SET_FREQUENCY_DAYS'; payload: Record<string, number> }
  | { type: 'SET_FREQUENCY_INTERVAL'; payload: number }
  | { type: 'SET_FREQUENCY_START_DATE'; payload: string }
  | { type: 'SET_MISSED_DAY_BEHAVIOR'; payload: MissedDayBehavior }
  | { type: 'SET_COLOR'; payload: string }
  | { type: 'SET_ALLOW_OVERLOAD'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'RESET_ERRORS' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'INIT_FROM_HABIT'; payload: Habit };

function getInitialState(): FormState {
  return {
    name: '',
    frequencyType: 'daily',
    targetCount: 1,
    frequencyDays: {},
    frequencyInterval: 2,
    frequencyStartDate: getLocalDate(),
    missedDayBehavior: 'continue',
    color: HabitColors[0],
    allowOverload: true,
    errors: {},
    isSubmitting: false,
  };
}

function habitToFormState(habit: Habit): FormState {
  let frequencyDays: Record<string, number> = {};
  if (habit.frequency_days) {
    try {
      frequencyDays = JSON.parse(habit.frequency_days);
    } catch (err) {
      if (__DEV__) console.warn('Failed to parse frequency_days for habit:', habit.id, err);
    }
  }
  return {
    name: habit.name,
    frequencyType: habit.frequency_type,
    targetCount: habit.target_count,
    frequencyDays,
    frequencyInterval: habit.frequency_interval ?? 2,
    frequencyStartDate: habit.frequency_start_date ?? getLocalDate(),
    missedDayBehavior: habit.missed_day_behavior ?? 'continue',
    color: habit.color,
    allowOverload: habit.allow_overload === 1,
    errors: {},
    isSubmitting: false,
  };
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_FREQUENCY_TYPE':
      // Reset frequency-specific fields when type changes
      return {
        ...state,
        frequencyType: action.payload,
        targetCount: 1,
        frequencyDays: {},
        frequencyInterval: 2,
        frequencyStartDate: getLocalDate(),
        missedDayBehavior: 'continue',
      };
    case 'SET_TARGET_COUNT':
      return { ...state, targetCount: action.payload };
    case 'SET_FREQUENCY_DAYS':
      return { ...state, frequencyDays: action.payload };
    case 'SET_FREQUENCY_INTERVAL':
      return { ...state, frequencyInterval: action.payload };
    case 'SET_FREQUENCY_START_DATE':
      return { ...state, frequencyStartDate: action.payload };
    case 'SET_MISSED_DAY_BEHAVIOR':
      return { ...state, missedDayBehavior: action.payload };
    case 'SET_COLOR':
      return { ...state, color: action.payload };
    case 'SET_ALLOW_OVERLOAD':
      return { ...state, allowOverload: action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'RESET_ERRORS':
      return { ...state, errors: {} };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'INIT_FROM_HABIT':
      return habitToFormState(action.payload);
    default:
      return state;
  }
}

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = id ? parseInt(id, 10) : null;

  const { db, isReady, error: dbError } = useDatabase();
  const [state, dispatch] = useReducer(formReducer, getInitialState());
  const [habit, setHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const isDeletingRef = useRef(false);
  const colorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderSecondary = Colors[colorScheme ?? 'light'].borderSecondary;
  const errorColor = Colors[colorScheme ?? 'light'].error;

  // Load habit on mount
  useEffect(() => {
    let isMounted = true;

    async function loadHabit() {
      if (!db || !habitId) {
        if (isMounted) {
          setLoadError('Invalid habit ID');
          setIsLoading(false);
        }
        return;
      }

      try {
        const loadedHabit = await getHabitById(db, habitId);
        if (!isMounted) return;

        if (!loadedHabit) {
          setLoadError('Habit not found');
        } else {
          setHabit(loadedHabit);
          dispatch({ type: 'INIT_FROM_HABIT', payload: loadedHabit });
        }
      } catch (err) {
        if (!isMounted) return;
        if (__DEV__) console.error('Failed to load habit:', err);
        setLoadError('Failed to load habit');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (isReady) {
      loadHabit();
    }

    return () => {
      isMounted = false;
    };
  }, [db, habitId, isReady]);

  const handleSave = async () => {
    if (!db || !habitId || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    dispatch({ type: 'RESET_ERRORS' });
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    // Build HabitInput based on frequencyType
    const input: Partial<HabitInput> = {
      name: state.name.trim(),
      frequency_type: state.frequencyType,
      color: state.color,
      allow_overload: state.allowOverload ? 1 : 0,
    };

    // Add type-specific fields
    switch (state.frequencyType) {
      case 'daily':
        input.target_count = state.targetCount;
        input.frequency_days = null;
        input.frequency_interval = null;
        input.frequency_start_date = null;
        input.missed_day_behavior = null;
        break;
      case 'specific_days':
        input.frequency_days = JSON.stringify(state.frequencyDays);
        input.target_count = 1;
        input.frequency_interval = null;
        input.frequency_start_date = null;
        input.missed_day_behavior = null;
        break;
      case 'every_n_days':
        input.frequency_interval = state.frequencyInterval;
        input.frequency_start_date = state.frequencyStartDate;
        input.missed_day_behavior = state.missedDayBehavior;
        input.target_count = state.targetCount;
        input.frequency_days = null;
        break;
      case 'weekly':
        input.target_count = state.targetCount;
        input.frequency_days = null;
        input.frequency_interval = null;
        input.frequency_start_date = null;
        input.missed_day_behavior = null;
        break;
    }

    try {
      await updateHabit(db, habitId, input);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update habit';
      Alert.alert('Validation Error', message);
    } finally {
      isSubmittingRef.current = false;
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handleDelete = () => {
    if (!habit) return;

    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This will also delete all completion history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!db || !habitId || isDeletingRef.current) return;
            isDeletingRef.current = true;
            try {
              await deleteHabit(db, habitId);
              router.back();
            } catch (err) {
              isDeletingRef.current = false;
              if (__DEV__) console.error('Failed to delete habit:', err);
              Alert.alert('Error', 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  // Validate form state for enabling Save button
  const hasValidFrequencyConfig = () => {
    if (state.frequencyType === 'specific_days') {
      return Object.keys(state.frequencyDays).length > 0;
    }
    return true;
  };

  const canSave = state.name.trim().length > 0 && !state.isSubmitting && hasValidFrequencyConfig();

  if (dbError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          Failed to initialize database: {dbError.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isReady || isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: borderSecondary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ThemedText style={styles.cancelText}>Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Edit Habit</ThemedText>
          <View style={styles.headerButton} />
        </View>
        <ThemedView style={[styles.container, styles.centered]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {loadError}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Habit</ThemedText>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={!canSave}
        >
          <ThemedText
            style={[
              styles.saveText,
              { color: canSave ? tintColor : textSecondaryColor },
            ]}
          >
            {state.isSubmitting ? 'Saving...' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection label="Name">
            <HabitNameInput
              value={state.name}
              onChange={(value) => dispatch({ type: 'SET_NAME', payload: value })}
              error={state.errors.name}
            />
          </FormSection>

          <FormSection label="Frequency">
            <FrequencyTypeSelector
              value={state.frequencyType}
              onChange={(type) => dispatch({ type: 'SET_FREQUENCY_TYPE', payload: type })}
            />

            {/* Conditional frequency config */}
            <View style={styles.frequencyConfig}>
              {state.frequencyType === 'daily' && (
                <DailyFrequencyConfig
                  targetCount={state.targetCount}
                  onChange={(count) => dispatch({ type: 'SET_TARGET_COUNT', payload: count })}
                />
              )}
              {state.frequencyType === 'weekly' && (
                <WeeklyFrequencyConfig
                  targetCount={state.targetCount}
                  onChange={(count) => dispatch({ type: 'SET_TARGET_COUNT', payload: count })}
                />
              )}
              {state.frequencyType === 'specific_days' && (
                <SpecificDaysConfig
                  frequencyDays={state.frequencyDays}
                  onChange={(days) => dispatch({ type: 'SET_FREQUENCY_DAYS', payload: days })}
                />
              )}
              {state.frequencyType === 'every_n_days' && (
                <EveryNDaysConfig
                  interval={state.frequencyInterval}
                  startDate={state.frequencyStartDate}
                  missedBehavior={state.missedDayBehavior}
                  targetCount={state.targetCount}
                  onIntervalChange={(n) => dispatch({ type: 'SET_FREQUENCY_INTERVAL', payload: n })}
                  onStartDateChange={(date) => dispatch({ type: 'SET_FREQUENCY_START_DATE', payload: date })}
                  onMissedBehaviorChange={(behavior) => dispatch({ type: 'SET_MISSED_DAY_BEHAVIOR', payload: behavior })}
                  onTargetCountChange={(count) => dispatch({ type: 'SET_TARGET_COUNT', payload: count })}
                />
              )}
            </View>
          </FormSection>

          <FormSection label="Color">
            <ColorPicker
              value={state.color}
              onChange={(color) => dispatch({ type: 'SET_COLOR', payload: color })}
            />
          </FormSection>

          <FormSection label="Options">
            <View style={styles.optionRow}>
              <View style={styles.optionTextContainer}>
                <ThemedText style={styles.optionLabel}>Allow exceeding target</ThemedText>
                <ThemedText style={[styles.optionHint, { color: textSecondaryColor }]}>
                  When off, tapping stops at target count
                </ThemedText>
              </View>
              <Switch
                value={state.allowOverload}
                onValueChange={(value) => dispatch({ type: 'SET_ALLOW_OVERLOAD', payload: value })}
                trackColor={{ true: tintColor }}
              />
            </View>
          </FormSection>

          {/* Delete Button */}
          <View style={[styles.deleteSection, { borderTopColor: borderSecondary }]}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: errorColor }]}
              onPress={handleDelete}
            >
              <ThemedText style={[styles.deleteText, { color: errorColor }]}>
                Delete Habit
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomColor: undefined, // Set dynamically
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: FontSizes.md,
  },
  saveText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    textAlign: 'right',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  frequencyConfig: {
    marginTop: Spacing.lg,
  },
  errorText: {
    padding: Spacing.xl,
  },
  deleteSection: {
    marginTop: Spacing.xxl,
    paddingTop: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: undefined, // Set dynamically
  },
  deleteButton: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionLabel: {
    fontSize: FontSizes.md,
  },
  optionHint: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
});
