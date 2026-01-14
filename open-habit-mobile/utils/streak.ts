/**
 * Streak Calculation Utilities
 *
 * Functions to calculate current and best streaks for habits.
 */

import { getLocalDate, addDays, getWeekBounds } from './date';
import { isHabitScheduledForDate, getTargetForDate } from './habit-schedule';
import type { Habit, HabitCompletion } from '@/database';

export interface StreakResult {
  /** Current consecutive streak */
  currentStreak: number;
  /** Best/longest streak ever */
  bestStreak: number;
  /** Unit of measurement */
  unit: 'days' | 'weeks';
}

/**
 * Calculates streak for daily, specific_days, and every_n_days habits.
 * Counts consecutive days where target was met.
 *
 * Today is treated as "pending" - if not yet completed, we skip it and
 * start counting from yesterday. This prevents the streak from appearing
 * broken just because the user hasn't completed today's habit yet.
 */
function calculateDailyStreak(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  today: string
): { current: number; best: number } {
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let streakBroken = false;
  let isFirstScheduledDay = true;

  // Start from today and go backwards
  let date = today;
  const maxDaysBack = 365 * 2; // Look back up to 2 years

  for (let i = 0; i < maxDaysBack; i++) {
    // Check if habit was scheduled for this date
    const isScheduled = isHabitScheduledForDate(habit, date);

    if (isScheduled) {
      const completion = completionMap.get(date);
      const target = getTargetForDate(habit, date);
      const count = completion?.count ?? 0;
      const skipped = completion?.skipped === 1;

      if (count >= target) {
        // Goal met - increment streak
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);

        if (!streakBroken) {
          currentStreak = tempStreak;
        }
        isFirstScheduledDay = false;
      } else if (skipped) {
        // Skipped day - doesn't break streak but doesn't add to it
        isFirstScheduledDay = false;
      } else {
        // Goal not met
        // If this is today (first scheduled day) and not completed yet,
        // treat as "pending" - don't break the streak
        if (isFirstScheduledDay) {
          isFirstScheduledDay = false;
          // Skip today, continue to yesterday
        } else {
          // Past day not completed - streak is broken
          if (!streakBroken) {
            streakBroken = true;
          }
          tempStreak = 0;
        }
      }
    }

    // Move to previous day
    date = addDays(date, -1);
  }

  return { current: currentStreak, best: bestStreak };
}

/**
 * Calculates streak for weekly habits.
 * Counts consecutive weeks where weekly target was met.
 *
 * The current (incomplete) week is treated as "pending" - if the target
 * isn't met yet, we skip it and start counting from the previous week.
 * This prevents the streak from appearing broken mid-week.
 */
function calculateWeeklyStreak(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  today: string,
  weekStartDay: number = 1
): { current: number; best: number } {
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let streakBroken = false;
  let isFirstWeek = true;

  const maxWeeksBack = 104; // Look back up to 2 years

  // Get the current week bounds
  let { startDate } = getWeekBounds(today, weekStartDay);

  for (let week = 0; week < maxWeeksBack; week++) {
    // Sum completions for this week
    let weeklyCount = 0;
    let currentDate = startDate;

    for (let day = 0; day < 7; day++) {
      const completion = completionMap.get(currentDate);
      weeklyCount += completion?.count ?? 0;
      currentDate = addDays(currentDate, 1);
    }

    const target = habit.target_count;

    if (weeklyCount >= target) {
      // Goal met this week
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);

      if (!streakBroken) {
        currentStreak = tempStreak;
      }
      isFirstWeek = false;
    } else {
      // Goal not met
      // If this is the current week and not complete yet,
      // treat as "pending" - don't break the streak
      if (isFirstWeek) {
        isFirstWeek = false;
        // Skip current week, continue to previous
      } else {
        // Past week not completed - streak is broken
        if (!streakBroken) {
          streakBroken = true;
        }
        tempStreak = 0;
      }
    }

    // Move to previous week
    startDate = addDays(startDate, -7);
  }

  return { current: currentStreak, best: bestStreak };
}

/**
 * Calculates current and best streaks for a habit.
 *
 * @param habit - The habit to calculate streaks for
 * @param completions - Array of completion records
 * @param today - Today's date (YYYY-MM-DD), defaults to current date
 * @param weekStartDay - Start of week (0=Sunday, 1=Monday), defaults to 1
 * @returns StreakResult with current streak, best streak, and unit
 */
export function calculateStreak(
  habit: Habit,
  completions: HabitCompletion[],
  today: string = getLocalDate(),
  weekStartDay: number = 1
): StreakResult {
  // Create completion lookup map
  const completionMap = new Map<string, HabitCompletion>();
  completions.forEach((c) => completionMap.set(c.date, c));

  // Weekly habits use week-based streaks
  if (habit.frequency_type === 'weekly') {
    const { current, best } = calculateWeeklyStreak(
      habit,
      completionMap,
      today,
      weekStartDay
    );
    return {
      currentStreak: current,
      bestStreak: best,
      unit: 'weeks',
    };
  }

  // All other habits use day-based streaks
  const { current, best } = calculateDailyStreak(habit, completionMap, today);
  return {
    currentStreak: current,
    bestStreak: best,
    unit: 'days',
  };
}
