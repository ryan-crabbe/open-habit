/**
 * Test Data Seeding
 *
 * Functions to populate the database with test data for development.
 * Only use in development mode!
 */

import * as SQLite from 'expo-sqlite';
import { TEST_DATA, generateSeedSQL } from '../data/test-data';
import { getLocalDateTimeWithOffset } from '../utils/date';

/**
 * Seeds the database with test data
 *
 * This clears existing data and inserts the test fixtures.
 * Only call this in development mode!
 * Uses a transaction to ensure atomicity - partial failures will rollback.
 */
export async function seedTestData(db: SQLite.SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    throw new Error('seedTestData() can only be called in development mode');
  }

  console.log('Starting test data seed...');

  try {
    await db.withTransactionAsync(async () => {
      // Clear existing data (in order to respect foreign keys)
      await db.execAsync(`
        DELETE FROM habit_completions;
        DELETE FROM habit_reminders;
        DELETE FROM habits;
        DELETE FROM app_settings WHERE key != 'schema_version';
      `);

      console.log('Cleared existing data');

      // Insert habits
      for (const habit of TEST_DATA.habits) {
        await db.runAsync(
          `INSERT INTO habits (
            id, name, frequency_type, target_count, frequency_days, frequency_interval,
            frequency_start_date, missed_day_behavior, completion_display, color, icon,
            sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            habit.id,
            habit.name,
            habit.frequency_type,
            habit.target_count,
            habit.frequency_days,
            habit.frequency_interval,
            habit.frequency_start_date,
            habit.missed_day_behavior,
            habit.completion_display,
            habit.color,
            habit.icon,
            habit.sort_order,
            habit.created_at,
            habit.updated_at,
          ]
        );
      }
      console.log(`Inserted ${TEST_DATA.habits.length} habits`);

      // Insert completions
      for (const completion of TEST_DATA.completions) {
        await db.runAsync(
          `INSERT INTO habit_completions (
            id, habit_id, date, count, skipped, note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            completion.id,
            completion.habit_id,
            completion.date,
            completion.count,
            completion.skipped,
            completion.note,
            completion.created_at,
            completion.updated_at,
          ]
        );
      }
      console.log(`Inserted ${TEST_DATA.completions.length} completions`);

      // Insert reminders
      for (const reminder of TEST_DATA.reminders) {
        await db.runAsync(
          `INSERT INTO habit_reminders (
            id, habit_id, time, enabled, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            reminder.id,
            reminder.habit_id,
            reminder.time,
            reminder.enabled,
            reminder.created_at,
            reminder.updated_at,
          ]
        );
      }
      console.log(`Inserted ${TEST_DATA.reminders.length} reminders`);

      // Insert settings (except schema_version which we preserve)
      const timestamp = getLocalDateTimeWithOffset();
      for (const setting of TEST_DATA.settings) {
        if (setting.key !== 'schema_version') {
          await db.runAsync(
            `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
            [setting.key, setting.value, timestamp]
          );
        }
      }
      console.log(`Inserted ${TEST_DATA.settings.length - 1} settings`);
    });

    console.log('Test data seed complete!');
  } catch (err) {
    console.error('Test data seed failed, transaction rolled back:', err);
    throw err;
  }
}

/**
 * Checks if the database has any habits
 * Useful to determine if we should offer to seed test data
 */
export async function isDatabaseEmpty(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM habits'
  );
  return (result?.count ?? 0) === 0;
}

/**
 * Gets statistics about the current database
 */
export async function getDatabaseStats(db: SQLite.SQLiteDatabase): Promise<{
  habits: number;
  completions: number;
  reminders: number;
}> {
  const [habits, completions, reminders] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habit_completions'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habit_reminders'),
  ]);

  return {
    habits: habits?.count ?? 0,
    completions: completions?.count ?? 0,
    reminders: reminders?.count ?? 0,
  };
}
