/**
 * Database Module Exports
 */

// Core database functions
export { initDatabase, getDatabase, closeDatabase, resetDatabase } from './database';
export { DatabaseProvider, useDatabase } from './database-provider';
export { CURRENT_SCHEMA_VERSION, SCHEMA_V1 } from './schema';

// Habits CRUD
export {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  reorderHabits,
  validateHabit,
  type HabitInput,
} from './habits';

// Completions CRUD
export {
  getCompletionForDate,
  getCompletionsInRange,
  getAllCompletionsForHabit,
  getLastCompletionForHabit,
  upsertCompletion,
  incrementCompletion,
  decrementCompletion,
  skipCompletion,
  updateCompletionNote,
  deleteCompletion,
  getWeeklyCompletionCount,
  getAllCompletionsForDate,
  getAllCompletionsInRange,
} from './completions';

// Reminders CRUD
export {
  getRemindersForHabit,
  getReminderById,
  getAllEnabledReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
  deleteAllRemindersForHabit,
} from './reminders';

// Settings CRUD
export {
  getSetting,
  getSettingAsNumber,
  setSetting,
  getAllSettings,
  deleteSetting,
  getTheme,
  setTheme,
  getWeekStartDay,
  setWeekStartDay,
  getTimezone,
  setLastExportDate,
  DEFAULT_SETTINGS,
  type SettingKey,
} from './settings';

// Seeding (dev only)
export { seedTestData, isDatabaseEmpty, getDatabaseStats } from './seed';

// Re-export types
export type { Habit, HabitCompletion, HabitReminder, AppSetting, FrequencyType, CompletionDisplay, MissedDayBehavior } from '../data/test-data';
