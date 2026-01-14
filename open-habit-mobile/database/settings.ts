/**
 * App Settings Operations
 *
 * Data access functions for the app_settings table.
 * Key-value store for app-wide configuration.
 */

import * as SQLite from 'expo-sqlite';
import { getLocalDateTimeWithOffset } from '../utils/date';
import type { AppSetting } from '../data/test-data';

// Re-export type
export type { AppSetting };

// Known setting keys with their types
export type SettingKey = 'theme' | 'week_start_day' | 'timezone' | 'last_export_date' | 'schema_version';

// Array of valid setting keys for runtime validation
const VALID_SETTING_KEYS: readonly SettingKey[] = ['theme', 'week_start_day', 'timezone', 'last_export_date', 'schema_version'] as const;

/**
 * Type guard to check if a string is a valid SettingKey
 */
function isSettingKey(key: string): key is SettingKey {
  return VALID_SETTING_KEYS.includes(key as SettingKey);
}

// Default values for settings
export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  theme: 'light',
  week_start_day: '1', // Monday
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  last_export_date: '',
  schema_version: '1',
};

/**
 * Get a single setting value
 * Returns the default value if not set
 */
export async function getSetting(
  db: SQLite.SQLiteDatabase,
  key: SettingKey
): Promise<string> {
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return result?.value ?? DEFAULT_SETTINGS[key] ?? '';
}

/**
 * Get a setting as a number
 */
export async function getSettingAsNumber(
  db: SQLite.SQLiteDatabase,
  key: SettingKey
): Promise<number> {
  const value = await getSetting(db, key);
  return parseInt(value, 10) || 0;
}

/**
 * Set a setting value (upsert)
 */
export async function setSetting(
  db: SQLite.SQLiteDatabase,
  key: SettingKey,
  value: string
): Promise<void> {
  const timestamp = getLocalDateTimeWithOffset();
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)`,
    [key, value, timestamp]
  );
}

/**
 * Get all settings as an object
 */
export async function getAllSettings(
  db: SQLite.SQLiteDatabase
): Promise<Record<SettingKey, string>> {
  const rows = await db.getAllAsync<AppSetting>('SELECT * FROM app_settings');

  // Start with defaults
  const settings: Record<SettingKey, string> = { ...DEFAULT_SETTINGS };

  // Override with stored values (only for known setting keys)
  for (const row of rows) {
    if (isSettingKey(row.key)) {
      settings[row.key] = row.value;
    }
  }

  return settings;
}

/**
 * Delete a setting (resets to default)
 */
export async function deleteSetting(
  db: SQLite.SQLiteDatabase,
  key: SettingKey
): Promise<void> {
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', [key]);
}

// ============================================================================
// Convenience functions for specific settings
// ============================================================================

/**
 * Get the current theme setting
 */
export async function getTheme(db: SQLite.SQLiteDatabase): Promise<'light' | 'dark'> {
  const theme = await getSetting(db, 'theme');
  return theme === 'dark' ? 'dark' : 'light';
}

/**
 * Set the theme
 */
export async function setTheme(
  db: SQLite.SQLiteDatabase,
  theme: 'light' | 'dark'
): Promise<void> {
  await setSetting(db, 'theme', theme);
}

/**
 * Get the week start day (0 = Sunday, 1 = Monday)
 */
export async function getWeekStartDay(db: SQLite.SQLiteDatabase): Promise<number> {
  return getSettingAsNumber(db, 'week_start_day');
}

/**
 * Set the week start day
 */
export async function setWeekStartDay(
  db: SQLite.SQLiteDatabase,
  day: 0 | 1
): Promise<void> {
  await setSetting(db, 'week_start_day', day.toString());
}

/**
 * Get the user's timezone
 */
export async function getTimezone(db: SQLite.SQLiteDatabase): Promise<string> {
  return getSetting(db, 'timezone');
}

/**
 * Record the last export date
 */
export async function setLastExportDate(
  db: SQLite.SQLiteDatabase,
  date?: string
): Promise<void> {
  const timestamp = date ?? getLocalDateTimeWithOffset();
  await setSetting(db, 'last_export_date', timestamp);
}
