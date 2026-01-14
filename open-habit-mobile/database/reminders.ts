/**
 * Habit Reminders CRUD Operations
 *
 * Data access functions for the habit_reminders table.
 */

import * as SQLite from 'expo-sqlite';
import { getLocalDateTimeWithOffset } from '../utils/date';
import type { HabitReminder } from '../data/test-data';

// Re-export type
export type { HabitReminder };

/**
 * Get all reminders for a habit
 */
export async function getRemindersForHabit(
  db: SQLite.SQLiteDatabase,
  habitId: number
): Promise<HabitReminder[]> {
  return db.getAllAsync<HabitReminder>(
    'SELECT * FROM habit_reminders WHERE habit_id = ? ORDER BY time ASC',
    [habitId]
  );
}

/**
 * Get a reminder by ID
 */
export async function getReminderById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<HabitReminder | null> {
  return db.getFirstAsync<HabitReminder>(
    'SELECT * FROM habit_reminders WHERE id = ?',
    [id]
  );
}

/**
 * Get all enabled reminders
 */
export async function getAllEnabledReminders(
  db: SQLite.SQLiteDatabase
): Promise<HabitReminder[]> {
  return db.getAllAsync<HabitReminder>(
    'SELECT * FROM habit_reminders WHERE enabled = 1 ORDER BY time ASC'
  );
}

/**
 * Create a new reminder for a habit
 *
 * @param db - Database instance
 * @param habitId - The habit ID
 * @param time - Time in HH:MM format (24-hour)
 * @param enabled - Whether the reminder is enabled (default: true)
 */
export async function createReminder(
  db: SQLite.SQLiteDatabase,
  habitId: number,
  time: string,
  enabled: 0 | 1 = 1
): Promise<HabitReminder> {
  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Time must be in HH:MM format');
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time value');
  }

  const timestamp = getLocalDateTimeWithOffset();

  const result = await db.runAsync(
    `INSERT INTO habit_reminders (habit_id, time, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [habitId, time, enabled, timestamp, timestamp]
  );

  return {
    id: result.lastInsertRowId,
    habit_id: habitId,
    time,
    enabled,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/**
 * Update a reminder's time and/or enabled status
 */
export async function updateReminder(
  db: SQLite.SQLiteDatabase,
  id: number,
  updates: { time?: string; enabled?: 0 | 1 }
): Promise<HabitReminder | null> {
  const existing = await getReminderById(db, id);
  if (!existing) return null;

  // Validate time if provided
  if (updates.time !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(updates.time)) {
      throw new Error('Time must be in HH:MM format');
    }
    const [hours, minutes] = updates.time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time value');
    }
  }

  const timestamp = getLocalDateTimeWithOffset();
  const newTime = updates.time ?? existing.time;
  const newEnabled = updates.enabled ?? existing.enabled;

  await db.runAsync(
    'UPDATE habit_reminders SET time = ?, enabled = ?, updated_at = ? WHERE id = ?',
    [newTime, newEnabled, timestamp, id]
  );

  return {
    ...existing,
    time: newTime,
    enabled: newEnabled,
    updated_at: timestamp,
  };
}

/**
 * Toggle a reminder's enabled status
 */
export async function toggleReminder(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<HabitReminder | null> {
  const existing = await getReminderById(db, id);
  if (!existing) return null;

  const newEnabled = existing.enabled === 1 ? 0 : 1;
  return updateReminder(db, id, { enabled: newEnabled as 0 | 1 });
}

/**
 * Delete a reminder
 */
export async function deleteReminder(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM habit_reminders WHERE id = ?', [id]);
}

/**
 * Delete all reminders for a habit
 */
export async function deleteAllRemindersForHabit(
  db: SQLite.SQLiteDatabase,
  habitId: number
): Promise<void> {
  await db.runAsync('DELETE FROM habit_reminders WHERE habit_id = ?', [habitId]);
}
