/**
 * Create Habit Screen
 *
 * Form for creating a new habit with frequency configuration and color selection.
 */

import React, { useReducer, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useDatabase, createHabit, validateHabit } from '@/database';
import { HabitColors, Spacing, BorderRadius, FontSizes, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getLocalDate } from '@/utils/date';
import type { FrequencyType, MissedDayBehavior, HabitInput } from '@/database/habits';

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
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'RESET_ERRORS' }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialState: FormState = {
  name: '',
  frequencyType: 'daily',
  targetCount: 1,
  frequencyDays: {},
  frequencyInterval: 2,
  frequencyStartDate: getLocalDate(),
  missedDayBehavior: 'continue',
  color: HabitColors[0],
  errors: {},
  isSubmitting: false,
};

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
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'RESET_ERRORS':
      return { ...state, errors: {} };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    default:
      return state;
  }
}

export default function CreateHabitScreen() {
  const { db, isReady, error } = useDatabase();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const isSubmittingRef = useRef(false);
  const colorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const errorColor = Colors[colorScheme ?? 'light'].error;

  const handleSave = async () => {
    // Use ref to prevent double-submission (state check may be stale)
    if (!db || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    dispatch({ type: 'RESET_ERRORS' });
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    // Build HabitInput based on frequencyType
    const input: HabitInput = {
      name: state.name.trim(),
      frequency_type: state.frequencyType,
      color: state.color,
    };

    // Add type-specific fields
    switch (state.frequencyType) {
      case 'daily':
        input.target_count = state.targetCount;
        break;
      case 'specific_days':
        input.frequency_days = JSON.stringify(state.frequencyDays);
        input.target_count = 1; // Per-day targets are in frequency_days
        break;
      case 'every_n_days':
        input.frequency_interval = state.frequencyInterval;
        input.frequency_start_date = state.frequencyStartDate;
        input.missed_day_behavior = state.missedDayBehavior;
        input.target_count = state.targetCount;
        break;
      case 'weekly':
        input.target_count = state.targetCount;
        break;
    }

    try {
      validateHabit(input);
      await createHabit(db, input);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create habit';
      Alert.alert('Validation Error', message);
    } finally {
      // Always reset to allow retry, even if an unexpected error occurs
      isSubmittingRef.current = false;
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  // Validate form state for enabling Save button
  const hasValidFrequencyConfig = () => {
    if (state.frequencyType === 'specific_days') {
      return Object.keys(state.frequencyDays).length > 0;
    }
    return true;
  };

  const canSave = state.name.trim().length > 0 && !state.isSubmitting && hasValidFrequencyConfig();

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          Failed to initialize database: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isReady) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Create Habit</ThemedText>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
});
