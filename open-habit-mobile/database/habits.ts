/**
 * Habits CRUD Operations
 *
 * Data access functions for the habits table.
 */

import * as SQLite from 'expo-sqlite';
import { getLocalDateTimeWithOffset } from '../utils/date';
import type { Habit, FrequencyType, CompletionDisplay, MissedDayBehavior } from '../data/test-data';

// Re-export types for convenience
export type { Habit, FrequencyType, CompletionDisplay, MissedDayBehavior };

// Input type for creating/updating habits (without auto-generated fields)
export interface HabitInput {
  name: string;
  frequency_type: FrequencyType;
  target_count?: number;
  frequency_days?: string | null;
  frequency_interval?: number | null;
  frequency_start_date?: string | null;
  missed_day_behavior?: MissedDayBehavior | null;
  completion_display?: CompletionDisplay;
  color: string;
  icon?: string | null;
  allow_overload?: 0 | 1;  // 1 = allow exceeding target (default), 0 = cap at target
}

/**
 * Validates a habit before insert/update
 * Throws if validation fails
 */
export function validateHabit(habit: HabitInput): void {
  if (!habit.name || habit.name.trim() === '') {
    throw new Error('Habit name is required');
  }

  if (habit.frequency_type === 'every_n_days') {
    if (!habit.frequency_interval) {
      throw new Error('frequency_interval required for every_n_days');
    }
    if (!habit.frequency_start_date) {
      throw new Error('frequency_start_date required for every_n_days');
    }
    if (!habit.missed_day_behavior) {
      throw new Error('missed_day_behavior required for every_n_days');
    }
  }

  if (habit.frequency_type === 'specific_days') {
    if (!habit.frequency_days) {
      throw new Error('frequency_days required for specific_days');
    }
    // Validate JSON structure
    try {
      const days = JSON.parse(habit.frequency_days);
      for (const [day, count] of Object.entries(days)) {
        if (!/^[0-6]$/.test(day)) {
          throw new Error(`Invalid day number: ${day}`);
        }
        if (typeof count !== 'number' || count < 1) {
          throw new Error(`Invalid count for day ${day}: ${count}`);
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('frequency_days must be valid JSON');
      }
      throw e;
    }
  }
}

/**
 * Fetch all habits sorted by sort_order
 */
export async function getHabits(db: SQLite.SQLiteDatabase): Promise<Habit[]> {
  return db.getAllAsync<Habit>('SELECT * FROM habits ORDER BY sort_order ASC');
}

/**
 * Fetch a single habit by ID
 */
export async function getHabitById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Habit | null> {
  return db.getFirstAsync<Habit>('SELECT * FROM habits WHERE id = ?', [id]);
}

/**
 * Get the next available sort_order
 */
async function getNextSortOrder(db: SQLite.SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM habits'
  );
  return (result?.max_order ?? -1) + 1;
}

/**
 * Create a new habit
 * Returns the created habit with its ID
 */
export async function createHabit(
  db: SQLite.SQLiteDatabase,
  input: HabitInput
): Promise<Habit> {
  validateHabit(input);

  const timestamp = getLocalDateTimeWithOffset();
  const sortOrder = await getNextSortOrder(db);

  const result = await db.runAsync(
    `INSERT INTO habits (
      name, frequency_type, target_count, frequency_days, frequency_interval,
      frequency_start_date, missed_day_behavior, completion_display, color, icon,
      allow_overload, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.frequency_type,
      input.target_count ?? 1,
      input.frequency_days ?? null,
      input.frequency_interval ?? null,
      input.frequency_start_date ?? null,
      input.missed_day_behavior ?? null,
      input.completion_display ?? 'partial',
      input.color,
      input.icon ?? null,
      input.allow_overload ?? 1,
      sortOrder,
      timestamp,
      timestamp,
    ]
  );

  const habit = await getHabitById(db, result.lastInsertRowId);
  if (!habit) {
    throw new Error('Failed to retrieve created habit');
  }
  return habit;
}

/**
 * Update an existing habit
 * Returns the updated habit
 */
export async function updateHabit(
  db: SQLite.SQLiteDatabase,
  id: number,
  input: Partial<HabitInput>
): Promise<Habit> {
  const existing = await getHabitById(db, id);
  if (!existing) {
    throw new Error(`Habit with id ${id} not found`);
  }

  // Merge existing with updates for validation
  const merged: HabitInput = {
    name: input.name ?? existing.name,
    frequency_type: input.frequency_type ?? existing.frequency_type,
    target_count: input.target_count ?? existing.target_count,
    frequency_days: input.frequency_days !== undefined ? input.frequency_days : existing.frequency_days,
    frequency_interval: input.frequency_interval !== undefined ? input.frequency_interval : existing.frequency_interval,
    frequency_start_date: input.frequency_start_date !== undefined ? input.frequency_start_date : existing.frequency_start_date,
    missed_day_behavior: input.missed_day_behavior !== undefined ? input.missed_day_behavior : existing.missed_day_behavior,
    completion_display: input.completion_display ?? existing.completion_display,
    color: input.color ?? existing.color,
    icon: input.icon !== undefined ? input.icon : existing.icon,
    allow_overload: input.allow_overload !== undefined ? input.allow_overload : existing.allow_overload,
  };

  validateHabit(merged);

  const timestamp = getLocalDateTimeWithOffset();

  await db.runAsync(
    `UPDATE habits SET
      name = ?, frequency_type = ?, target_count = ?, frequency_days = ?,
      frequency_interval = ?, frequency_start_date = ?, missed_day_behavior = ?,
      completion_display = ?, color = ?, icon = ?, allow_overload = ?, updated_at = ?
    WHERE id = ?`,
    [
      merged.name,
      merged.frequency_type,
      merged.target_count ?? 1,
      merged.frequency_days ?? null,
      merged.frequency_interval ?? null,
      merged.frequency_start_date ?? null,
      merged.missed_day_behavior ?? null,
      merged.completion_display ?? 'partial',
      merged.color,
      merged.icon ?? null,
      merged.allow_overload ?? 1,
      timestamp,
      id,
    ]
  );

  const updated = await getHabitById(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated habit');
  }
  return updated;
}

/**
 * Delete a habit by ID
 * Cascades to delete related completions and reminders
 */
export async function deleteHabit(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

/**
 * Reorder habits
 * Takes an array of habit IDs in the desired order
 */
export async function reorderHabits(
  db: SQLite.SQLiteDatabase,
  orderedIds: number[]
): Promise<void> {
  const timestamp = getLocalDateTimeWithOffset();

  // Use a transaction to update all sort_orders atomically
  await db.withTransactionAsync(async () => {
    // First, set all sort_orders to negative values to avoid unique constraint violations
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        'UPDATE habits SET sort_order = ?, updated_at = ? WHERE id = ?',
        [-(i + 1), timestamp, orderedIds[i]]
      );
    }

    // Then set to positive values in order
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        'UPDATE habits SET sort_order = ?, updated_at = ? WHERE id = ?',
        [i, timestamp, orderedIds[i]]
      );
    }
  });
}
