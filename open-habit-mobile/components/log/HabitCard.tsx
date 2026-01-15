/**
 * HabitCard Component
 *
 * Displays a single habit with completion state and tap-to-increment functionality.
 * Shows habit name, color indicator, progress, and visual state.
 */

import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { hexToRgba } from '@/utils/color';
import type { Habit, HabitCompletion } from '@/database';

export type CompletionState = 'not_started' | 'in_progress' | 'completed' | 'skipped';

interface HabitCardProps {
  habit: Habit;
  completion: HabitCompletion | null;
  targetCount: number;
  onTap: () => void;
  onLongPress: () => void;
  onUndo?: () => void;
}

/**
 * Determines the completion state based on count and target
 */
function getCompletionState(
  count: number,
  target: number,
  skipped: boolean
): CompletionState {
  if (skipped) return 'skipped';
  if (count === 0) return 'not_started';
  if (count >= target) return 'completed';
  return 'in_progress';
}

/**
 * Gets the icon for a completion state
 */
function getStateIcon(state: CompletionState): string {
  switch (state) {
    case 'completed':
      return 'checkmark.circle.fill';
    case 'in_progress':
      return 'circle.lefthalf.filled';
    case 'skipped':
      return 'minus.circle.fill';
    case 'not_started':
    default:
      return 'circle';
  }
}

export function HabitCard({
  habit,
  completion,
  targetCount,
  onTap,
  onLongPress,
  onUndo,
}: HabitCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Cleanup animations on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      scaleAnim.stopAnimation();
    };
  }, [scaleAnim]);

  const count = completion?.count ?? 0;
  const skipped = completion?.skipped === 1;
  const hasNote = !!completion?.note;
  const state = getCompletionState(count, targetCount, skipped);

  const animatePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const animatePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(async () => {
    // Pulse animation on tap
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 10,
      }),
    ]).start();

    if (state !== 'completed') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onTap();
  }, [state, onTap, scaleAnim]);

  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  }, [onLongPress]);

  const handleUndo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUndo?.();
  }, [onUndo]);

  // State-based styling
  const stateColors = Colors[colorScheme];
  let stateIconColor: string;
  let cardOpacity = 1;

  switch (state) {
    case 'completed':
      stateIconColor = stateColors.habitCompleted;
      break;
    case 'in_progress':
      stateIconColor = stateColors.habitInProgress;
      break;
    case 'skipped':
      stateIconColor = stateColors.habitSkipped;
      cardOpacity = 0.6;
      break;
    case 'not_started':
    default:
      stateIconColor = stateColors.habitNotStarted;
  }

  // Progress display for multi-count habits
  const showProgress = targetCount > 1;
  const progressText = showProgress ? `${count}/${targetCount}` : '';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={animatePressIn}
      onPressOut={animatePressOut}
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: cardBackground, opacity: cardOpacity, transform: [{ scale: scaleAnim }] },
          Shadows[colorScheme].sm,
        ]}
      >
        {/* Color indicator */}
        <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.mainRow}>
            {/* Status icon */}
            <IconSymbol
              name={getStateIcon(state) as any}
              size={28}
              color={stateIconColor}
              style={styles.statusIcon}
            />

            {/* Habit name */}
            <ThemedText
              style={[
                styles.habitName,
                state === 'skipped' && styles.skippedText,
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </ThemedText>

            {/* Progress/count */}
            <View style={styles.rightSection}>
              {hasNote && (
                <IconSymbol
                  name="note.text"
                  size={16}
                  color={textSecondary}
                  style={styles.noteIcon}
                />
              )}
              {showProgress ? (
                <ThemedText style={[styles.progressText, { color: textSecondary }]}>
                  {progressText}
                </ThemedText>
              ) : (
                state === 'completed' && (
                  <IconSymbol
                    name="checkmark"
                    size={18}
                    color={stateColors.habitCompleted}
                  />
                )
              )}
              {/* Undo button - shown when count > 0 */}
              {count > 0 && onUndo && (
                <TouchableOpacity
                  onPress={handleUndo}
                  style={styles.undoButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <IconSymbol
                    name="arrow.uturn.backward"
                    size={16}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress bar for multi-count habits */}
          {showProgress && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarBackground,
                  { backgroundColor: hexToRgba(habit.color, 0.2) },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: habit.color,
                      width: `${Math.min((count / targetCount) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
  },
  colorIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: Spacing.md,
  },
  habitName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  skippedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  undoButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  noteIcon: {
    opacity: 0.7,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    marginTop: Spacing.sm,
    marginLeft: 40, // Align with text after icon
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
