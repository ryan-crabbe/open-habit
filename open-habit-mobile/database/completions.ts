/**
 * Habit Completions CRUD Operations
 *
 * Data access functions for the habit_completions table.
 */

import * as SQLite from 'expo-sqlite';
import { getLocalDateTimeWithOffset, getLocalDate } from '../utils/date';
import type { HabitCompletion } from '../data/test-data';

// Re-export type
export type { HabitCompletion };

/**
 * Get a single completion record for a habit on a specific date
 */
export async function getCompletionForDate(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date: string
): Promise<HabitCompletion | null> {
  return db.getFirstAsync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );
}

/**
 * Get completions for a habit within a date range (inclusive)
 */
export async function getCompletionsInRange(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  return db.getAllAsync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
    [habitId, startDate, endDate]
  );
}

/**
 * Get all completions for a habit
 */
export async function getAllCompletionsForHabit(
  db: SQLite.SQLiteDatabase,
  habitId: number
): Promise<HabitCompletion[]> {
  return db.getAllAsync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
    [habitId]
  );
}

/**
 * Get the most recent completion for a habit (useful for every_n_days reset behavior)
 */
export async function getLastCompletionForHabit(
  db: SQLite.SQLiteDatabase,
  habitId: number
): Promise<HabitCompletion | null> {
  return db.getFirstAsync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND count > 0 AND skipped = 0 ORDER BY date DESC LIMIT 1',
    [habitId]
  );
}

/**
 * Insert or update a completion record
 */
export async function upsertCompletion(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date: string,
  count: number,
  skipped: 0 | 1 = 0,
  note: string | null = null
): Promise<HabitCompletion> {
  // Validate: skipped with non-zero count is invalid
  if (skipped === 1 && count !== 0) {
    throw new Error('Cannot have count > 0 when skipped');
  }

  const timestamp = getLocalDateTimeWithOffset();
  const existing = await getCompletionForDate(db, habitId, date);

  if (existing) {
    // Update
    await db.runAsync(
      `UPDATE habit_completions
       SET count = ?, skipped = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [count, skipped, note, timestamp, existing.id]
    );
    return {
      ...existing,
      count,
      skipped,
      note,
      updated_at: timestamp,
    };
  } else {
    // Insert
    const result = await db.runAsync(
      `INSERT INTO habit_completions (habit_id, date, count, skipped, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [habitId, date, count, skipped, note, timestamp, timestamp]
    );

    return {
      id: result.lastInsertRowId,
      habit_id: habitId,
      date,
      count,
      skipped,
      note,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }
}

/**
 * Increment completion count by 1
 * Creates a new record if none exists
 */
export async function incrementCompletion(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date?: string
): Promise<HabitCompletion> {
  const targetDate = date ?? getLocalDate();
  const existing = await getCompletionForDate(db, habitId, targetDate);
  const currentCount = existing?.count ?? 0;

  // If it was skipped, reset the skipped flag when incrementing
  return upsertCompletion(db, habitId, targetDate, currentCount + 1, 0, existing?.note ?? null);
}

/**
 * Decrement completion count by 1 (minimum 0)
 */
export async function decrementCompletion(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date?: string
): Promise<HabitCompletion> {
  const targetDate = date ?? getLocalDate();
  const existing = await getCompletionForDate(db, habitId, targetDate);
  const currentCount = existing?.count ?? 0;
  const newCount = Math.max(0, currentCount - 1);

  return upsertCompletion(db, habitId, targetDate, newCount, 0, existing?.note ?? null);
}

/**
 * Mark a habit as skipped for a date
 */
export async function skipCompletion(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date?: string,
  note?: string
): Promise<HabitCompletion> {
  const targetDate = date ?? getLocalDate();
  return upsertCompletion(db, habitId, targetDate, 0, 1, note ?? null);
}

/**
 * Update the note for a completion
 */
export async function updateCompletionNote(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date: string,
  note: string | null
): Promise<HabitCompletion | null> {
  const existing = await getCompletionForDate(db, habitId, date);
  if (!existing) return null;

  const timestamp = getLocalDateTimeWithOffset();
  await db.runAsync(
    'UPDATE habit_completions SET note = ?, updated_at = ? WHERE id = ?',
    [note, timestamp, existing.id]
  );

  return {
    ...existing,
    note,
    updated_at: timestamp,
  };
}

/**
 * Delete a completion record
 */
export async function deleteCompletion(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  date: string
): Promise<void> {
  await db.runAsync(
    'DELETE FROM habit_completions WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );
}

/**
 * Get completion count for a habit within a week
 * Useful for weekly habits
 */
export async function getWeeklyCompletionCount(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  weekStartDate: string,
  weekEndDate: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(count), 0) as total
     FROM habit_completions
     WHERE habit_id = ? AND date >= ? AND date <= ? AND skipped = 0`,
    [habitId, weekStartDate, weekEndDate]
  );
  return result?.total ?? 0;
}

/**
 * Get all completions for all habits on a specific date
 */
export async function getAllCompletionsForDate(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<HabitCompletion[]> {
  return db.getAllAsync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE date = ?',
    [date]
  );
}

/**
 * Get all completions for all habits within a date range (batch query)
 * More efficient than calling getCompletionsInRange for each habit
 */
export async function getAllCompletionsInRange(
  db: SQLite.SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  return db.getAllAsync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY habit_id, date ASC',
    [startDate, endDate]
  );
}
