/**
 * Database Initialization and Migration Module
 *
 * Handles SQLite database setup, migrations, and provides the database instance.
 * Foreign keys are enabled on every connection per docs/data-model.md requirements.
 */

import * as SQLite from 'expo-sqlite';
import { CURRENT_SCHEMA_VERSION, getSchemaForVersion } from './schema';
import { getLocalDateTimeWithOffset } from '../utils/date';

const DATABASE_NAME = 'openhabit.db';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Gets or creates the database connection
 * Uses promise-based locking to prevent race conditions during initialization
 * CRITICAL: Foreign keys are enabled on every connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  // Prevent race condition: if initialization is in progress, wait for it
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
      const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
      // CRITICAL: Enable foreign keys on every connection
      await database.execAsync('PRAGMA foreign_keys = ON;');
      db = database;
      return database;
    } catch (error) {
      // Reset promise on error to allow retry attempts
      throw error;
    } finally {
      dbPromise = null;
    }
  })();

  return dbPromise;
}

/**
 * Gets the current schema version from app_settings
 */
async function getSchemaVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await database.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'schema_version'"
    );
    return result ? parseInt(result.value, 10) : 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Sets the schema version in app_settings
 */
async function setSchemaVersion(
  database: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  const timestamp = getLocalDateTimeWithOffset();
  await database.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', ?, ?)`,
    [version.toString(), timestamp]
  );
}

/**
 * Runs database migrations
 * Executes each migration version sequentially from current to latest
 */
async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  let version = await getSchemaVersion(database);

  while (version < CURRENT_SCHEMA_VERSION) {
    const nextVersion = version + 1;
    const schema = getSchemaForVersion(nextVersion);

    if (!schema) {
      throw new Error(`Missing schema for version ${nextVersion}`);
    }

    if (__DEV__) console.log(`Running migration to version ${nextVersion}...`);
    await database.execAsync(schema);
    await setSchemaVersion(database, nextVersion);
    version = nextVersion;
    if (__DEV__) console.log(`Migration to version ${nextVersion} complete`);
  }
}

/**
 * Initializes the database
 * - Opens connection
 * - Enables foreign keys
 * - Runs migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await getDatabase();
  await migrate(database);
  if (__DEV__) console.log('Database initialized successfully');
  return database;
}

/**
 * Closes the database connection
 * Call this when the app is shutting down
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Clears all user data from the database (dev only)
 * Deletes all habits, completions, reminders but keeps schema intact
 */
export async function clearAllData(): Promise<void> {
  if (!__DEV__) {
    throw new Error('clearAllData() can only be called in development mode');
  }

  const database = await getDatabase();

  // Delete data in order to respect foreign keys
  await database.execAsync(`
    DELETE FROM habit_completions;
    DELETE FROM habit_reminders;
    DELETE FROM habits;
    DELETE FROM app_settings WHERE key != 'schema_version' AND key != 'theme';
  `);
}

/**
 * Resets the database (dev only)
 * Drops all tables and recreates from scratch
 * WARNING: This will delete all user data!
 */
export async function resetDatabase(): Promise<void> {
  if (!__DEV__) {
    throw new Error('resetDatabase() can only be called in development mode');
  }

  const database = await getDatabase();

  // Drop all tables in reverse dependency order
  await database.execAsync(`
    DROP TABLE IF EXISTS habit_completions;
    DROP TABLE IF EXISTS habit_reminders;
    DROP TABLE IF EXISTS habits;
    DROP TABLE IF EXISTS app_settings;
  `);

  // Reset the cached instance to force re-migration
  db = null;

  // Re-initialize
  await initDatabase();
}
