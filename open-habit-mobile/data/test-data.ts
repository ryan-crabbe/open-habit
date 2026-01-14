/**
 * Test data fixtures for OpenHabit
 *
 * This data follows the schema defined in docs/data-model.md
 * Use for development, testing, and seeding the database
 */

// ============================================================================
// Types
// ============================================================================

export type FrequencyType = 'daily' | 'specific_days' | 'every_n_days' | 'weekly';
export type CompletionDisplay = 'partial' | 'binary';
export type MissedDayBehavior = 'continue' | 'reset';

export interface Habit {
  id: number;
  name: string;
  frequency_type: FrequencyType;
  target_count: number;
  frequency_days: string | null;  // JSON string: {"1": 3, "3": 1, "5": 2}
  frequency_interval: number | null;
  frequency_start_date: string | null;  // YYYY-MM-DD
  missed_day_behavior: MissedDayBehavior | null;
  completion_display: CompletionDisplay;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string;  // YYYY-MM-DD
  count: number;
  skipped: 0 | 1;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitReminder {
  id: number;
  habit_id: number;
  time: string;  // HH:MM
  enabled: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

// ============================================================================
// Test Habits
// ============================================================================

export const TEST_HABITS: Habit[] = [
  // Daily habit: Drink Water (8x per day)
  {
    id: 1,
    name: 'Drink Water',
    frequency_type: 'daily',
    target_count: 8,
    frequency_days: null,
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'partial',
    color: '#2196F3',
    icon: 'water-drop',
    sort_order: 0,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Daily habit: Morning Meditation (1x per day)
  {
    id: 2,
    name: 'Morning Meditation',
    frequency_type: 'daily',
    target_count: 1,
    frequency_days: null,
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'binary',
    color: '#9C27B0',
    icon: 'meditation',
    sort_order: 1,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Daily habit: Read (1x per day)
  {
    id: 3,
    name: 'Read',
    frequency_type: 'daily',
    target_count: 1,
    frequency_days: null,
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'binary',
    color: '#FF5722',
    icon: 'book',
    sort_order: 2,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Specific days: Gym (Mon 3x, Wed 2x, Fri 2x)
  {
    id: 4,
    name: 'Gym',
    frequency_type: 'specific_days',
    target_count: 1,  // Not used for specific_days, targets in frequency_days
    frequency_days: '{"1": 3, "3": 2, "5": 2}',
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'binary',
    color: '#4CAF50',
    icon: 'dumbbell',
    sort_order: 3,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Specific days: Piano Practice (Tue, Thu, Sat)
  {
    id: 5,
    name: 'Piano Practice',
    frequency_type: 'specific_days',
    target_count: 1,
    frequency_days: '{"2": 1, "4": 1, "6": 1}',
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'binary',
    color: '#607D8B',
    icon: 'piano',
    sort_order: 4,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Every N days: Deep Clean (Every 3 days, reset on miss)
  {
    id: 6,
    name: 'Deep Clean',
    frequency_type: 'every_n_days',
    target_count: 1,
    frequency_days: null,
    frequency_interval: 3,
    frequency_start_date: '2026-01-01',
    missed_day_behavior: 'reset',
    completion_display: 'binary',
    color: '#FF9800',
    icon: 'broom',
    sort_order: 5,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Every N days: Laundry (Every 5 days, continue on miss)
  {
    id: 7,
    name: 'Laundry',
    frequency_type: 'every_n_days',
    target_count: 1,
    frequency_days: null,
    frequency_interval: 5,
    frequency_start_date: '2026-01-01',
    missed_day_behavior: 'continue',
    completion_display: 'binary',
    color: '#00BCD4',
    icon: 'washing-machine',
    sort_order: 6,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Weekly: Exercise (3x per week)
  {
    id: 8,
    name: 'Exercise',
    frequency_type: 'weekly',
    target_count: 3,
    frequency_days: null,
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'binary',
    color: '#E91E63',
    icon: 'running',
    sort_order: 7,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Weekly: Call Family (2x per week)
  {
    id: 9,
    name: 'Call Family',
    frequency_type: 'weekly',
    target_count: 2,
    frequency_days: null,
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'partial',
    color: '#673AB7',
    icon: 'phone',
    sort_order: 8,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
  // Daily habit: Vitamins (2x per day - morning and evening)
  {
    id: 10,
    name: 'Vitamins',
    frequency_type: 'daily',
    target_count: 2,
    frequency_days: null,
    frequency_interval: null,
    frequency_start_date: null,
    missed_day_behavior: null,
    completion_display: 'binary',
    color: '#8BC34A',
    icon: 'pill',
    sort_order: 9,
    created_at: '2026-01-01T08:00:00-05:00',
    updated_at: '2026-01-01T08:00:00-05:00',
  },
];

// ============================================================================
// Test Completions (past 2 weeks of data)
// ============================================================================

// Helper to generate dates
function getDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function getTimestamp(daysAgo: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mins = String(Math.abs(offset) % 60).padStart(2, '0');
  return d.toISOString().slice(0, -1).split('.')[0] + sign + hours + ':' + mins;
}

let completionId = 1;

export const TEST_COMPLETIONS: HabitCompletion[] = [
  // Drink Water (habit_id: 1) - daily, partial tracking
  ...Array.from({ length: 14 }, (_, i) => ({
    id: completionId++,
    habit_id: 1,
    date: getDate(13 - i),
    count: Math.floor(Math.random() * 5) + 4, // 4-8 glasses
    skipped: 0 as const,
    note: i === 3 ? 'Busy day, forgot to track' : null,
    created_at: getTimestamp(13 - i, 8),
    updated_at: getTimestamp(13 - i, 22),
  })),

  // Morning Meditation (habit_id: 2) - daily, some misses
  ...Array.from({ length: 14 }, (_, i) => {
    const skipped = [2, 7, 11].includes(i) ? 1 : 0;
    return {
      id: completionId++,
      habit_id: 2,
      date: getDate(13 - i),
      count: skipped ? 0 : 1,
      skipped: skipped as 0 | 1,
      note: skipped ? 'Overslept' : null,
      created_at: getTimestamp(13 - i, 7),
      updated_at: getTimestamp(13 - i, 7),
    };
  }),

  // Read (habit_id: 3) - daily, good streak
  ...Array.from({ length: 14 }, (_, i) => ({
    id: completionId++,
    habit_id: 3,
    date: getDate(13 - i),
    count: i === 5 ? 0 : 1,
    skipped: (i === 5 ? 1 : 0) as 0 | 1,
    note: i === 0 ? 'Finished The Great Gatsby!' : null,
    created_at: getTimestamp(13 - i, 21),
    updated_at: getTimestamp(13 - i, 21),
  })),

  // Gym (habit_id: 4) - Mon/Wed/Fri only
  // Week 1: Mon (day 13), Wed (day 11), Fri (day 9)
  // Week 2: Mon (day 6), Wed (day 4), Fri (day 2)
  { id: completionId++, habit_id: 4, date: getDate(13), count: 3, skipped: 0, note: 'Leg day', created_at: getTimestamp(13, 18), updated_at: getTimestamp(13, 18) },
  { id: completionId++, habit_id: 4, date: getDate(11), count: 2, skipped: 0, note: null, created_at: getTimestamp(11, 18), updated_at: getTimestamp(11, 18) },
  { id: completionId++, habit_id: 4, date: getDate(9), count: 2, skipped: 0, note: 'PR on bench!', created_at: getTimestamp(9, 18), updated_at: getTimestamp(9, 18) },
  { id: completionId++, habit_id: 4, date: getDate(6), count: 3, skipped: 0, note: null, created_at: getTimestamp(6, 18), updated_at: getTimestamp(6, 18) },
  { id: completionId++, habit_id: 4, date: getDate(4), count: 0, skipped: 1, note: 'Sick', created_at: getTimestamp(4, 18), updated_at: getTimestamp(4, 18) },
  { id: completionId++, habit_id: 4, date: getDate(2), count: 2, skipped: 0, note: null, created_at: getTimestamp(2, 18), updated_at: getTimestamp(2, 18) },

  // Piano Practice (habit_id: 5) - Tue/Thu/Sat
  { id: completionId++, habit_id: 5, date: getDate(12), count: 1, skipped: 0, note: 'Worked on scales', created_at: getTimestamp(12, 19), updated_at: getTimestamp(12, 19) },
  { id: completionId++, habit_id: 5, date: getDate(10), count: 1, skipped: 0, note: null, created_at: getTimestamp(10, 19), updated_at: getTimestamp(10, 19) },
  { id: completionId++, habit_id: 5, date: getDate(8), count: 1, skipped: 0, note: 'Learning Chopin', created_at: getTimestamp(8, 19), updated_at: getTimestamp(8, 19) },
  { id: completionId++, habit_id: 5, date: getDate(5), count: 1, skipped: 0, note: null, created_at: getTimestamp(5, 19), updated_at: getTimestamp(5, 19) },
  { id: completionId++, habit_id: 5, date: getDate(3), count: 1, skipped: 0, note: null, created_at: getTimestamp(3, 19), updated_at: getTimestamp(3, 19) },
  { id: completionId++, habit_id: 5, date: getDate(1), count: 1, skipped: 0, note: 'Great session!', created_at: getTimestamp(1, 19), updated_at: getTimestamp(1, 19) },

  // Deep Clean (habit_id: 6) - every 3 days from Jan 1
  { id: completionId++, habit_id: 6, date: getDate(12), count: 1, skipped: 0, note: null, created_at: getTimestamp(12, 10), updated_at: getTimestamp(12, 10) },
  { id: completionId++, habit_id: 6, date: getDate(9), count: 1, skipped: 0, note: 'Deep cleaned bathroom', created_at: getTimestamp(9, 10), updated_at: getTimestamp(9, 10) },
  { id: completionId++, habit_id: 6, date: getDate(6), count: 0, skipped: 1, note: 'Too tired', created_at: getTimestamp(6, 10), updated_at: getTimestamp(6, 10) },
  { id: completionId++, habit_id: 6, date: getDate(3), count: 1, skipped: 0, note: null, created_at: getTimestamp(3, 10), updated_at: getTimestamp(3, 10) },
  { id: completionId++, habit_id: 6, date: getDate(0), count: 1, skipped: 0, note: 'Kitchen and living room', created_at: getTimestamp(0, 10), updated_at: getTimestamp(0, 10) },

  // Laundry (habit_id: 7) - every 5 days
  { id: completionId++, habit_id: 7, date: getDate(13), count: 1, skipped: 0, note: null, created_at: getTimestamp(13, 14), updated_at: getTimestamp(13, 14) },
  { id: completionId++, habit_id: 7, date: getDate(8), count: 1, skipped: 0, note: 'Washed bedding too', created_at: getTimestamp(8, 14), updated_at: getTimestamp(8, 14) },
  { id: completionId++, habit_id: 7, date: getDate(3), count: 1, skipped: 0, note: null, created_at: getTimestamp(3, 14), updated_at: getTimestamp(3, 14) },

  // Exercise (habit_id: 8) - weekly, 3x per week target
  // Week 1 completions
  { id: completionId++, habit_id: 8, date: getDate(13), count: 1, skipped: 0, note: 'Morning jog', created_at: getTimestamp(13, 7), updated_at: getTimestamp(13, 7) },
  { id: completionId++, habit_id: 8, date: getDate(11), count: 1, skipped: 0, note: 'HIIT workout', created_at: getTimestamp(11, 18), updated_at: getTimestamp(11, 18) },
  { id: completionId++, habit_id: 8, date: getDate(9), count: 1, skipped: 0, note: null, created_at: getTimestamp(9, 7), updated_at: getTimestamp(9, 7) },
  // Week 2 completions
  { id: completionId++, habit_id: 8, date: getDate(6), count: 1, skipped: 0, note: null, created_at: getTimestamp(6, 7), updated_at: getTimestamp(6, 7) },
  { id: completionId++, habit_id: 8, date: getDate(4), count: 1, skipped: 0, note: 'Yoga', created_at: getTimestamp(4, 19), updated_at: getTimestamp(4, 19) },
  { id: completionId++, habit_id: 8, date: getDate(1), count: 1, skipped: 0, note: 'Long run', created_at: getTimestamp(1, 8), updated_at: getTimestamp(1, 8) },

  // Call Family (habit_id: 9) - weekly, 2x per week
  { id: completionId++, habit_id: 9, date: getDate(12), count: 1, skipped: 0, note: 'Called mom', created_at: getTimestamp(12, 20), updated_at: getTimestamp(12, 20) },
  { id: completionId++, habit_id: 9, date: getDate(10), count: 1, skipped: 0, note: 'Video call with sister', created_at: getTimestamp(10, 19), updated_at: getTimestamp(10, 19) },
  { id: completionId++, habit_id: 9, date: getDate(5), count: 1, skipped: 0, note: null, created_at: getTimestamp(5, 20), updated_at: getTimestamp(5, 20) },
  { id: completionId++, habit_id: 9, date: getDate(2), count: 1, skipped: 0, note: 'Family group call', created_at: getTimestamp(2, 18), updated_at: getTimestamp(2, 18) },

  // Vitamins (habit_id: 10) - daily, 2x per day
  ...Array.from({ length: 14 }, (_, i) => ({
    id: completionId++,
    habit_id: 10,
    date: getDate(13 - i),
    count: [3, 8].includes(i) ? 1 : 2, // Missed one dose on 2 days
    skipped: 0 as const,
    note: null,
    created_at: getTimestamp(13 - i, 8),
    updated_at: getTimestamp(13 - i, 20),
  })),
];

// ============================================================================
// Test Reminders
// ============================================================================

export const TEST_REMINDERS: HabitReminder[] = [
  // Drink Water - multiple reminders throughout the day
  { id: 1, habit_id: 1, time: '09:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },
  { id: 2, habit_id: 1, time: '12:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },
  { id: 3, habit_id: 1, time: '15:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },
  { id: 4, habit_id: 1, time: '18:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },

  // Morning Meditation - single morning reminder
  { id: 5, habit_id: 2, time: '07:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },

  // Read - evening reminder
  { id: 6, habit_id: 3, time: '21:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },

  // Gym - afternoon reminder (disabled)
  { id: 7, habit_id: 4, time: '17:00', enabled: 0, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-05T10:00:00-05:00' },

  // Piano Practice - evening reminder
  { id: 8, habit_id: 5, time: '19:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },

  // Deep Clean - morning reminder
  { id: 9, habit_id: 6, time: '10:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },

  // Laundry - morning reminder
  { id: 10, habit_id: 7, time: '09:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },

  // Vitamins - morning and evening
  { id: 11, habit_id: 10, time: '08:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },
  { id: 12, habit_id: 10, time: '20:00', enabled: 1, created_at: '2026-01-01T08:00:00-05:00', updated_at: '2026-01-01T08:00:00-05:00' },
];

// ============================================================================
// App Settings
// ============================================================================

export const TEST_SETTINGS: AppSetting[] = [
  { key: 'theme', value: 'light', updated_at: '2026-01-01T08:00:00-05:00' },
  { key: 'week_start_day', value: '1', updated_at: '2026-01-01T08:00:00-05:00' }, // Monday
  { key: 'timezone', value: 'America/New_York', updated_at: '2026-01-01T08:00:00-05:00' },
  { key: 'schema_version', value: '1', updated_at: '2026-01-01T08:00:00-05:00' },
];

// ============================================================================
// Database Seeding Helper
// ============================================================================

/**
 * Escapes a string for safe use in SQL literals.
 * Only handles single quotes since this is for predefined test data.
 */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Wraps a value as a SQL literal (NULL or 'escaped string')
 */
function sqlLiteral(value: string | null): string {
  return value === null ? 'NULL' : `'${escapeSqlString(value)}'`;
}

/**
 * Generates SQL INSERT statements for seeding the database
 *
 * WARNING: FOR DEVELOPMENT USE ONLY!
 * This function uses string concatenation for SQL generation which is NOT safe
 * for arbitrary user input. Only use with the predefined TEST_* fixtures.
 * For runtime database seeding, use seedTestData() which uses parameterized queries.
 *
 * @throws Error if called outside of development mode
 */
export function generateSeedSQL(): string {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    throw new Error('generateSeedSQL() can only be called in development mode');
  }

  const lines: string[] = [
    '-- OpenHabit Test Data Seed',
    '-- Generated from data/test-data.ts',
    '',
    '-- Clear existing data',
    'DELETE FROM habit_completions;',
    'DELETE FROM habit_reminders;',
    'DELETE FROM habits;',
    'DELETE FROM app_settings;',
    '',
    '-- Insert habits',
  ];

  for (const h of TEST_HABITS) {
    lines.push(
      `INSERT INTO habits (id, name, frequency_type, target_count, frequency_days, frequency_interval, frequency_start_date, missed_day_behavior, completion_display, color, icon, sort_order, created_at, updated_at) VALUES (${h.id}, ${sqlLiteral(h.name)}, ${sqlLiteral(h.frequency_type)}, ${h.target_count}, ${sqlLiteral(h.frequency_days)}, ${h.frequency_interval ?? 'NULL'}, ${sqlLiteral(h.frequency_start_date)}, ${sqlLiteral(h.missed_day_behavior)}, ${sqlLiteral(h.completion_display)}, ${sqlLiteral(h.color)}, ${sqlLiteral(h.icon)}, ${h.sort_order}, ${sqlLiteral(h.created_at)}, ${sqlLiteral(h.updated_at)});`
    );
  }

  lines.push('', '-- Insert completions');
  for (const c of TEST_COMPLETIONS) {
    lines.push(
      `INSERT INTO habit_completions (id, habit_id, date, count, skipped, note, created_at, updated_at) VALUES (${c.id}, ${c.habit_id}, ${sqlLiteral(c.date)}, ${c.count}, ${c.skipped}, ${sqlLiteral(c.note)}, ${sqlLiteral(c.created_at)}, ${sqlLiteral(c.updated_at)});`
    );
  }

  lines.push('', '-- Insert reminders');
  for (const r of TEST_REMINDERS) {
    lines.push(
      `INSERT INTO habit_reminders (id, habit_id, time, enabled, created_at, updated_at) VALUES (${r.id}, ${r.habit_id}, ${sqlLiteral(r.time)}, ${r.enabled}, ${sqlLiteral(r.created_at)}, ${sqlLiteral(r.updated_at)});`
    );
  }

  lines.push('', '-- Insert app settings');
  for (const s of TEST_SETTINGS) {
    lines.push(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (${sqlLiteral(s.key)}, ${sqlLiteral(s.value)}, ${sqlLiteral(s.updated_at)});`
    );
  }

  return lines.join('\n');
}

// ============================================================================
// Export all test data as a single object
// ============================================================================

export const TEST_DATA = {
  habits: TEST_HABITS,
  completions: TEST_COMPLETIONS,
  reminders: TEST_REMINDERS,
  settings: TEST_SETTINGS,
  generateSeedSQL,
};

export default TEST_DATA;
