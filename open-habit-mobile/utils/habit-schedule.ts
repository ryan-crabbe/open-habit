/**
 * Habit Scheduling Utilities
 *
 * Functions to determine if a habit is scheduled for a given date
 * and calculate targets for different frequency types.
 */

import { getDayOfWeek, daysBetween, addDays, getWeekBounds } from './date';
import type { Habit } from '../data/test-data';

// Cache for parsed frequency_days to avoid repeated JSON.parse calls
// Keyed by habit.id + frequency_days string to handle updates
const frequencyDaysCache = new Map<string, Record<string, number>>();

/**
 * Get parsed frequency_days with caching
 * Avoids repeated JSON.parse calls in hot paths (e.g., rendering 364 cells)
 */
function getParsedFrequencyDays(habit: Habit): Record<string, number> | null {
  if (!habit.frequency_days) return null;

  // Cache key combines id and the actual JSON string (in case it's updated)
  const cacheKey = `${habit.id}:${habit.frequency_days}`;

  const cached = frequencyDaysCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const parsed = JSON.parse(habit.frequency_days) as Record<string, number>;
    frequencyDaysCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error(`Failed to parse frequency_days for habit ${habit.id}:`, err);
    return null;
  }
}

/**
 * Checks if a habit is scheduled for a specific date
 *
 * @param habit - The habit to check
 * @param date - The date to check (YYYY-MM-DD)
 * @param lastCompletionDate - For 'reset' behavior, the last completion date (optional)
 * @returns true if the habit is due on the given date
 */
export function isHabitScheduledForDate(
  habit: Habit,
  date: string,
  lastCompletionDate?: string
): boolean {
  switch (habit.frequency_type) {
    case 'daily':
      // Daily habits are always scheduled
      return true;

    case 'specific_days': {
      // Check if today's day of week is in frequency_days
      const dayOfWeek = getDayOfWeek(date);
      const days = getParsedFrequencyDays(habit);
      if (!days) return false;
      return dayOfWeek.toString() in days;
    }

    case 'every_n_days': {
      if (!habit.frequency_interval || !habit.frequency_start_date) return false;

      if (habit.missed_day_behavior === 'reset' && lastCompletionDate) {
        // Reset behavior: count from last completion
        const daysSinceCompletion = daysBetween(date, lastCompletionDate);
        return daysSinceCompletion >= 0 && daysSinceCompletion % habit.frequency_interval === 0;
      } else {
        // Continue behavior: count from start date
        const daysSinceStart = daysBetween(date, habit.frequency_start_date);
        // Only scheduled on or after start date
        if (daysSinceStart < 0) return false;
        return daysSinceStart % habit.frequency_interval === 0;
      }
    }

    case 'weekly':
      // Weekly habits can be completed on any day within the week
      // Always "scheduled" but tracking is per-week not per-day
      return true;

    default:
      return false;
  }
}

/**
 * Gets the target completion count for a habit on a specific date
 *
 * @param habit - The habit to check
 * @param date - The date to check (YYYY-MM-DD)
 * @returns The target count for that day, or 0 if not scheduled
 */
export function getTargetForDate(habit: Habit, date: string): number {
  switch (habit.frequency_type) {
    case 'daily':
      return habit.target_count;

    case 'specific_days': {
      const dayOfWeek = getDayOfWeek(date);
      const days = getParsedFrequencyDays(habit);
      if (!days) return 0;
      return days[dayOfWeek.toString()] ?? 0;
    }

    case 'every_n_days':
      // Return 0 if not properly configured
      if (!habit.frequency_interval || !habit.frequency_start_date) return 0;
      return habit.target_count;

    case 'weekly':
      // For weekly habits, the target is for the whole week
      // This returns the weekly target, not a daily target
      return habit.target_count;

    default:
      return 0;
  }
}

/**
 * Gets the weekly target for a habit
 * For weekly habits, returns target_count
 * For other habits, sums the daily targets for the week
 *
 * @param habit - The habit
 * @param weekStartDate - First day of the week (YYYY-MM-DD)
 * @param weekStartDay - 0 = Sunday, 1 = Monday
 */
export function getWeeklyTarget(
  habit: Habit,
  weekStartDate: string,
  weekStartDay: number = 1
): number {
  if (habit.frequency_type === 'weekly') {
    return habit.target_count;
  }

  // For other types, sum daily targets
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStartDate, i);
    if (isHabitScheduledForDate(habit, date)) {
      total += getTargetForDate(habit, date);
    }
  }
  return total;
}

/**
 * Gets the next scheduled date for a habit
 *
 * @param habit - The habit
 * @param fromDate - Start searching from this date (YYYY-MM-DD)
 * @param lastCompletionDate - For 'reset' behavior (optional)
 * @returns The next scheduled date in YYYY-MM-DD format, or null if none found within 365 days
 */
export function getNextScheduledDate(
  habit: Habit,
  fromDate: string,
  lastCompletionDate?: string
): string | null {
  // Search up to a year ahead
  for (let i = 0; i < 365; i++) {
    const date = addDays(fromDate, i);
    if (isHabitScheduledForDate(habit, date, lastCompletionDate)) {
      return date;
    }
  }
  return null;
}

/**
 * Checks if a habit has been completed for the given date/period
 *
 * @param completionCount - The actual completion count
 * @param targetCount - The target count
 * @returns true if completionCount >= targetCount
 */
export function isCompleted(completionCount: number, targetCount: number): boolean {
  return completionCount >= targetCount;
}

/**
 * Calculates completion percentage
 *
 * @param completionCount - The actual completion count
 * @param targetCount - The target count
 * @returns Percentage as a number between 0 and 1 (capped at 1)
 */
export function getCompletionPercentage(completionCount: number, targetCount: number): number {
  if (targetCount <= 0) return 0;
  return Math.min(completionCount / targetCount, 1);
}
