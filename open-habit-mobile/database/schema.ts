/**
 * Database Schema - V1
 *
 * Defines the SQL schema for OpenHabit following docs/data-model.md
 */

export const CURRENT_SCHEMA_VERSION = 2;

/**
 * V1 Schema - Initial database structure
 * Tables: habits, habit_completions, habit_reminders, app_settings
 */
export const SCHEMA_V1 = `
-- Habits table
CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'specific_days', 'every_n_days', 'weekly')),
    target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count >= 1),
    frequency_days TEXT,
    frequency_interval INTEGER CHECK (frequency_interval IS NULL OR frequency_interval >= 1),
    frequency_start_date TEXT,
    missed_day_behavior TEXT CHECK (missed_day_behavior IN ('continue', 'reset', NULL)),
    completion_display TEXT NOT NULL DEFAULT 'partial' CHECK (completion_display IN ('partial', 'binary')),
    color TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(sort_order);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    skipped INTEGER NOT NULL DEFAULT 0 CHECK (skipped IN (0, 1)),
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE (habit_id, date),
    CHECK (NOT (skipped = 1 AND count != 0))
);

CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON habit_completions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date);

-- Habit reminders table
CREATE TABLE IF NOT EXISTS habit_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    time TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminders_habit ON habit_reminders(habit_id);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
`;

/**
 * V2 Schema - Add allow_overload column to habits
 * Allows users to configure whether a habit can be incremented beyond target_count
 */
export const SCHEMA_V2 = `
-- Add allow_overload column: 1 = allow (default), 0 = cap at target
ALTER TABLE habits ADD COLUMN allow_overload INTEGER NOT NULL DEFAULT 1 CHECK (allow_overload IN (0, 1));
`;

/**
 * Gets the schema SQL for a specific version
 */
export function getSchemaForVersion(version: number): string | null {
  switch (version) {
    case 1:
      return SCHEMA_V1;
    case 2:
      return SCHEMA_V2;
    default:
      return null;
  }
}
