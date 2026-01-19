# OpenHabit Database Documentation

This document provides comprehensive documentation for the OpenHabit mobile app's SQLite database layer, including schema definitions, CRUD operations, migrations, and usage patterns.

## Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Schema](#schema)
4. [Database Initialization and Migrations](#database-initialization-and-migrations)
5. [CRUD Operations](#crud-operations)
6. [Query Patterns and Helper Functions](#query-patterns-and-helper-functions)
7. [Data Validation](#data-validation)
8. [React Integration](#react-integration)
9. [Development Utilities](#development-utilities)

---

## Overview

OpenHabit uses **SQLite** via `expo-sqlite` for local-first data persistence. The database is stored on-device with no cloud sync, ensuring user privacy and offline functionality.

**Key characteristics:**
- Local-only storage (no network dependency)
- Foreign key constraints enforced
- Schema versioning with migrations
- React Context-based access pattern

**Database file:** `openhabit.db`

---

## Database Architecture

### File Structure

```
database/
  index.ts              # Public exports
  database.ts           # Database initialization and migrations
  database-provider.tsx # React Context provider
  schema.ts             # SQL schema definitions
  habits.ts             # Habits CRUD operations
  completions.ts        # Completions CRUD operations
  reminders.ts          # Reminders CRUD operations
  settings.ts           # Settings CRUD operations
  seed.ts               # Test data seeding (dev only)
```

### Entity Relationship Diagram

```
+----------------+       +--------------------+
|    habits      |       |  habit_completions |
+----------------+       +--------------------+
| id (PK)        |<----->| id (PK)            |
| name           |   1:N | habit_id (FK)      |
| frequency_type |       | date               |
| target_count   |       | count              |
| frequency_days |       | skipped            |
| frequency_interval     | note               |
| frequency_start_date   | created_at         |
| missed_day_behavior    | updated_at         |
| completion_display     +--------------------+
| color          |
| icon           |       +--------------------+
| allow_overload |       |  habit_reminders   |
| sort_order     |       +--------------------+
| created_at     |<----->| id (PK)            |
| updated_at     |   1:N | habit_id (FK)      |
+----------------+       | time               |
                         | enabled            |
                         | created_at         |
+----------------+       | updated_at         |
|  app_settings  |       +--------------------+
+----------------+
| key (PK)       |
| value          |
| updated_at     |
+----------------+
```

---

## Schema

### Current Schema Version: 2

The schema uses versioned migrations. Each version adds or modifies the database structure.

### V1 Schema - Initial Structure

#### habits Table

Stores habit definitions with flexible frequency configurations.

```sql
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
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Habit display name |
| `frequency_type` | TEXT | NOT NULL, CHECK | One of: `daily`, `specific_days`, `every_n_days`, `weekly` |
| `target_count` | INTEGER | NOT NULL, DEFAULT 1, CHECK >= 1 | Target completions per period |
| `frequency_days` | TEXT | - | JSON object for specific_days: `{"1": 3, "3": 2}` (day: count) |
| `frequency_interval` | INTEGER | CHECK >= 1 or NULL | Interval for every_n_days frequency |
| `frequency_start_date` | TEXT | - | Start date for every_n_days (YYYY-MM-DD) |
| `missed_day_behavior` | TEXT | CHECK | `continue` or `reset` for every_n_days |
| `completion_display` | TEXT | NOT NULL, DEFAULT 'partial' | `partial` (progress) or `binary` (done/not done) |
| `color` | TEXT | NOT NULL | Hex color code (e.g., `#2196F3`) |
| `icon` | TEXT | - | Icon identifier |
| `sort_order` | INTEGER | NOT NULL, UNIQUE | Display order (0-indexed) |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp with offset |
| `updated_at` | TEXT | NOT NULL | ISO 8601 timestamp with offset |

#### habit_completions Table

Tracks daily completion records for each habit.

```sql
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
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `habit_id` | INTEGER | NOT NULL, FOREIGN KEY | References habits(id), CASCADE delete |
| `date` | TEXT | NOT NULL, UNIQUE with habit_id | Date (YYYY-MM-DD) |
| `count` | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Number of completions |
| `skipped` | INTEGER | NOT NULL, DEFAULT 0, CHECK 0 or 1 | Whether the day was skipped |
| `note` | TEXT | - | Optional note for the day |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp |
| `updated_at` | TEXT | NOT NULL | ISO 8601 timestamp |

**Important constraint:** `CHECK (NOT (skipped = 1 AND count != 0))` - A skipped day cannot have a non-zero count.

#### habit_reminders Table

Stores notification reminders for habits.

```sql
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
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `habit_id` | INTEGER | NOT NULL, FOREIGN KEY | References habits(id), CASCADE delete |
| `time` | TEXT | NOT NULL | Time in HH:MM format (24-hour) |
| `enabled` | INTEGER | NOT NULL, DEFAULT 1, CHECK 0 or 1 | Whether reminder is active |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp |
| `updated_at` | TEXT | NOT NULL | ISO 8601 timestamp |

#### app_settings Table

Key-value store for application-wide settings.

```sql
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Setting identifier |
| `value` | TEXT | NOT NULL | Setting value (string) |
| `updated_at` | TEXT | NOT NULL | ISO 8601 timestamp |

**Known setting keys:**
- `theme`: `'system'`, `'light'`, or `'dark'` (default: `'system'`)
- `week_start_day`: `'0'` (Sunday) or `'1'` (Monday) (default: `'1'`)
- `timezone`: IANA timezone string (default: system timezone)
- `last_export_date`: ISO 8601 timestamp
- `schema_version`: Current schema version number
- `notifications_enabled`: `'0'` or `'1'` (default: `'1'`)

### V2 Schema - Allow Overload

Adds the ability to configure whether a habit can be incremented beyond its target count.

```sql
ALTER TABLE habits ADD COLUMN allow_overload INTEGER NOT NULL DEFAULT 1 CHECK (allow_overload IN (0, 1));
```

| Value | Meaning |
|-------|---------|
| `1` | Allow exceeding target (default) |
| `0` | Cap completions at target_count |

---

## Database Initialization and Migrations

### Initialization Flow

```
App Start
    |
    v
getDatabase() -----> Opens SQLite connection
    |                Enables foreign keys
    v
initDatabase() ----> Runs pending migrations
    |                Updates schema_version
    v
Database Ready
```

### Key Functions

#### `getDatabase(): Promise<SQLiteDatabase>`

Gets or creates the database connection. Uses promise-based locking to prevent race conditions.

```typescript
import { getDatabase } from '@/database';

const db = await getDatabase();
// Foreign keys are automatically enabled
```

#### `initDatabase(): Promise<SQLiteDatabase>`

Initializes the database and runs all pending migrations.

```typescript
import { initDatabase } from '@/database';

const db = await initDatabase();
// Database is now ready with latest schema
```

#### `closeDatabase(): Promise<void>`

Closes the database connection (call on app shutdown).

```typescript
import { closeDatabase } from '@/database';

await closeDatabase();
```

### Migration System

Migrations run sequentially from the current version to `CURRENT_SCHEMA_VERSION`.

```typescript
// schema.ts
export const CURRENT_SCHEMA_VERSION = 2;

export function getSchemaForVersion(version: number): string | null {
  switch (version) {
    case 1: return SCHEMA_V1;  // Initial schema
    case 2: return SCHEMA_V2;  // Add allow_overload
    default: return null;
  }
}
```

The migration process:
1. Reads current `schema_version` from `app_settings`
2. For each version from current+1 to latest:
   - Executes the schema SQL
   - Updates `schema_version` in `app_settings`
3. Logs progress in development mode

---

## CRUD Operations

### Habits

**File:** `database/habits.ts`

#### Types

```typescript
type FrequencyType = 'daily' | 'specific_days' | 'every_n_days' | 'weekly';
type CompletionDisplay = 'partial' | 'binary';
type MissedDayBehavior = 'continue' | 'reset';

interface HabitInput {
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
  allow_overload?: 0 | 1;
}

interface Habit extends HabitInput {
  id: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

#### Operations

```typescript
import {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  reorderHabits,
} from '@/database';

// Get all habits sorted by sort_order
const habits = await getHabits(db);

// Get single habit by ID
const habit = await getHabitById(db, 1);

// Create a new habit
const newHabit = await createHabit(db, {
  name: 'Drink Water',
  frequency_type: 'daily',
  target_count: 8,
  color: '#2196F3',
  icon: 'water-drop',
});

// Update existing habit
const updated = await updateHabit(db, 1, {
  name: 'Drink More Water',
  target_count: 10,
});

// Delete habit (cascades to completions and reminders)
await deleteHabit(db, 1);

// Reorder habits
await reorderHabits(db, [3, 1, 2]); // New order by IDs
```

### Completions

**File:** `database/completions.ts`

#### Types

```typescript
interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string;      // YYYY-MM-DD
  count: number;
  skipped: 0 | 1;
  note: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Operations

```typescript
import {
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
} from '@/database';

// Get completion for specific habit and date
const completion = await getCompletionForDate(db, 1, '2026-01-15');

// Get completions within a date range
const completions = await getCompletionsInRange(db, 1, '2026-01-01', '2026-01-31');

// Get all completions for a habit (descending by date)
const allCompletions = await getAllCompletionsForHabit(db, 1);

// Get most recent non-skipped completion
const lastCompletion = await getLastCompletionForHabit(db, 1);

// Insert or update a completion
const result = await upsertCompletion(db, 1, '2026-01-15', 5, 0, 'Good day!');

// Increment today's completion by 1
const incremented = await incrementCompletion(db, 1);
// Or for a specific date
const incrementedDate = await incrementCompletion(db, 1, '2026-01-14');

// Decrement completion (minimum 0)
const decremented = await decrementCompletion(db, 1);

// Mark as skipped
const skipped = await skipCompletion(db, 1, '2026-01-15', 'Sick day');

// Update note only
const noted = await updateCompletionNote(db, 1, '2026-01-15', 'Updated note');

// Delete completion record
await deleteCompletion(db, 1, '2026-01-15');

// Get weekly completion count for a habit
const weeklyCount = await getWeeklyCompletionCount(db, 1, '2026-01-13', '2026-01-19');

// Batch queries for efficiency
const allForDate = await getAllCompletionsForDate(db, '2026-01-15');
const allInRange = await getAllCompletionsInRange(db, '2026-01-01', '2026-01-31');
```

### Reminders

**File:** `database/reminders.ts`

#### Types

```typescript
interface HabitReminder {
  id: number;
  habit_id: number;
  time: string;       // HH:MM (24-hour)
  enabled: 0 | 1;
  created_at: string;
  updated_at: string;
}
```

#### Operations

```typescript
import {
  getRemindersForHabit,
  getReminderById,
  getAllEnabledReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
  deleteAllRemindersForHabit,
} from '@/database';

// Get all reminders for a habit
const reminders = await getRemindersForHabit(db, 1);

// Get reminder by ID
const reminder = await getReminderById(db, 5);

// Get all enabled reminders (for scheduling notifications)
const enabled = await getAllEnabledReminders(db);

// Create a reminder
const newReminder = await createReminder(db, 1, '09:00', 1);

// Update reminder
const updated = await updateReminder(db, 5, {
  time: '08:30',
  enabled: 1,
});

// Toggle enabled state
const toggled = await toggleReminder(db, 5);

// Delete single reminder
await deleteReminder(db, 5);

// Delete all reminders for a habit
await deleteAllRemindersForHabit(db, 1);
```

### Settings

**File:** `database/settings.ts`

#### Types

```typescript
type SettingKey =
  | 'theme'
  | 'week_start_day'
  | 'timezone'
  | 'last_export_date'
  | 'schema_version'
  | 'notifications_enabled';

const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  theme: 'system',
  week_start_day: '1',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  last_export_date: '',
  schema_version: '2',
  notifications_enabled: '1',
};
```

#### Operations

```typescript
import {
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
} from '@/database';

// Generic get/set
const theme = await getSetting(db, 'theme');  // Returns default if not set
const weekDay = await getSettingAsNumber(db, 'week_start_day');

await setSetting(db, 'theme', 'system');

// Get all settings (with defaults applied)
const allSettings = await getAllSettings(db);

// Delete setting (resets to default)
await deleteSetting(db, 'theme');

// Convenience functions
const currentTheme = await getTheme(db);       // Returns 'system' | 'light' | 'dark'
await setTheme(db, 'system');

const startDay = await getWeekStartDay(db);    // Returns 0 or 1
await setWeekStartDay(db, 1);                  // Monday

const timezone = await getTimezone(db);        // Returns IANA timezone string

await setLastExportDate(db);                   // Sets to current timestamp
await setLastExportDate(db, '2026-01-15T10:00:00-05:00');
```

---

## Query Patterns and Helper Functions

### Date Range Queries

Completions can be efficiently queried by date range:

```typescript
// Single habit, date range
const completions = await getCompletionsInRange(db, habitId, '2026-01-01', '2026-01-31');

// All habits, single date
const allToday = await getAllCompletionsForDate(db, '2026-01-15');

// All habits, date range (most efficient for batch operations)
const allInMonth = await getAllCompletionsInRange(db, '2026-01-01', '2026-01-31');
```

### Weekly Aggregation

For weekly habits, sum completions within the week:

```typescript
const weeklyCount = await getWeeklyCompletionCount(
  db,
  habitId,
  '2026-01-13',  // Week start (Monday)
  '2026-01-19'   // Week end (Sunday)
);
```

**SQL used:**
```sql
SELECT COALESCE(SUM(count), 0) as total
FROM habit_completions
WHERE habit_id = ? AND date >= ? AND date <= ? AND skipped = 0
```

### Last Completion for Every-N-Days

For `every_n_days` habits with `reset` behavior, find the last actual completion:

```typescript
const lastCompletion = await getLastCompletionForHabit(db, habitId);
```

**SQL used:**
```sql
SELECT * FROM habit_completions
WHERE habit_id = ? AND count > 0 AND skipped = 0
ORDER BY date DESC LIMIT 1
```

### Habit Reordering with Transactions

Reordering uses a two-pass approach to avoid unique constraint violations:

```typescript
await reorderHabits(db, [3, 1, 2]);
```

**Implementation:**
```typescript
await db.withTransactionAsync(async () => {
  // First pass: set to negative values
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      'UPDATE habits SET sort_order = ?, updated_at = ? WHERE id = ?',
      [-(i + 1), timestamp, orderedIds[i]]
    );
  }
  // Second pass: set to final positive values
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      'UPDATE habits SET sort_order = ?, updated_at = ? WHERE id = ?',
      [i, timestamp, orderedIds[i]]
    );
  }
});
```

---

## Data Validation

### Habit Validation

The `validateHabit()` function enforces business rules before insert/update:

```typescript
import { validateHabit, HabitInput } from '@/database';

const input: HabitInput = {
  name: 'Exercise',
  frequency_type: 'every_n_days',
  frequency_interval: 3,
  frequency_start_date: '2026-01-01',
  missed_day_behavior: 'reset',
  color: '#4CAF50',
};

validateHabit(input); // Throws if invalid
```

**Validation rules:**

1. **Name required:**
   ```typescript
   if (!habit.name || habit.name.trim() === '') {
     throw new Error('Habit name is required');
   }
   ```

2. **every_n_days requirements:**
   ```typescript
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
   ```

3. **specific_days requirements:**
   ```typescript
   if (habit.frequency_type === 'specific_days') {
     if (!habit.frequency_days) {
       throw new Error('frequency_days required for specific_days');
     }
     // Validate JSON structure
     const days = JSON.parse(habit.frequency_days);
     for (const [day, count] of Object.entries(days)) {
       if (!/^[0-6]$/.test(day)) {
         throw new Error(`Invalid day number: ${day}`);
       }
       if (typeof count !== 'number' || count < 1) {
         throw new Error(`Invalid count for day ${day}: ${count}`);
       }
     }
   }
   ```

### Reminder Time Validation

Time format is validated on create/update:

```typescript
// In createReminder() and updateReminder()
if (!/^\d{2}:\d{2}$/.test(time)) {
  throw new Error('Time must be in HH:MM format');
}

const [hours, minutes] = time.split(':').map(Number);
if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
  throw new Error('Invalid time value');
}
```

### Completion Constraints

The database enforces:
- `count >= 0` (CHECK constraint)
- `skipped` must be 0 or 1 (CHECK constraint)
- Cannot have `skipped = 1` with `count != 0` (CHECK constraint)

Application-level validation:
```typescript
// In upsertCompletion()
if (skipped === 1 && count !== 0) {
  throw new Error('Cannot have count > 0 when skipped');
}
```

### Database-Level Constraints

The schema includes comprehensive CHECK constraints:

```sql
-- Frequency type enumeration
CHECK (frequency_type IN ('daily', 'specific_days', 'every_n_days', 'weekly'))

-- Target count must be positive
CHECK (target_count >= 1)

-- Frequency interval must be positive if set
CHECK (frequency_interval IS NULL OR frequency_interval >= 1)

-- Missed day behavior enumeration
CHECK (missed_day_behavior IN ('continue', 'reset', NULL))

-- Completion display enumeration
CHECK (completion_display IN ('partial', 'binary'))

-- Allow overload is boolean
CHECK (allow_overload IN (0, 1))

-- Completion count non-negative
CHECK (count >= 0)

-- Skipped is boolean
CHECK (skipped IN (0, 1))

-- Enabled is boolean
CHECK (enabled IN (0, 1))

-- Skipped day cannot have completions
CHECK (NOT (skipped = 1 AND count != 0))
```

---

## React Integration

### DatabaseProvider

The app uses React Context to provide database access:

```typescript
// database/database-provider.tsx

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase()
      .then(database => {
        setDb(database);
        setIsReady(true);
      })
      .catch(err => setError(err));
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}
```

### useDatabase Hook

Access the database from any component:

```typescript
import { useDatabase } from '@/database';

function HabitList() {
  const { db, isReady, error } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (isReady && db) {
      getHabits(db).then(setHabits);
    }
  }, [db, isReady]);

  if (!isReady) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <FlatList data={habits} ... />;
}
```

### App Setup

Wrap your app with the provider:

```typescript
// app/_layout.tsx
import { DatabaseProvider } from '@/database';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack>
        {/* Your screens */}
      </Stack>
    </DatabaseProvider>
  );
}
```

---

## Development Utilities

### Test Data Seeding

**File:** `database/seed.ts`

Seed the database with realistic test data for development:

```typescript
import { seedTestData, isDatabaseEmpty, getDatabaseStats } from '@/database/seed';

// Check if database needs seeding
if (await isDatabaseEmpty(db)) {
  await seedTestData(db);
}

// Get statistics
const stats = await getDatabaseStats(db);
console.log(`Habits: ${stats.habits}, Completions: ${stats.completions}, Reminders: ${stats.reminders}`);
```

**Test data includes:**
- 10 habits covering all frequency types
- 2 weeks of completion history
- 12 reminders across various habits
- Default app settings

### Database Reset (Dev Only)

```typescript
import { clearAllData, resetDatabase } from '@/database/database';

// Clear user data but keep schema
await clearAllData();

// Drop all tables and re-initialize
await resetDatabase();
```

**Warning:** These functions only work in development mode (`__DEV__ === true`).

### Generate Seed SQL

For debugging or manual testing:

```typescript
import { generateSeedSQL } from '@/data/test-data';

const sql = generateSeedSQL();
console.log(sql);
```

This outputs INSERT statements for all test data.

---

## Date and Time Conventions

| Format | Example | Usage |
|--------|---------|-------|
| Date | `YYYY-MM-DD` | `2026-01-15` | Completion dates |
| Time | `HH:MM` | `09:00` | Reminder times (24-hour) |
| Timestamp | ISO 8601 | `2026-01-15T09:00:00-05:00` | created_at, updated_at |

All timestamps include the local timezone offset for proper date boundary handling.

---

## Foreign Key Enforcement

**Critical:** Foreign keys must be enabled on every database connection.

```typescript
// This is done automatically in getDatabase()
await database.execAsync('PRAGMA foreign_keys = ON;');
```

This ensures:
- Deleting a habit cascades to its completions and reminders
- Invalid habit_id references are rejected
- Data integrity is maintained

---

## Performance Considerations

### Indexes

The schema includes strategic indexes:

```sql
-- For habit ordering
CREATE INDEX idx_habits_sort_order ON habits(sort_order);

-- For date range queries on completions
CREATE INDEX idx_completions_habit_date ON habit_completions(habit_id, date);
CREATE INDEX idx_completions_date ON habit_completions(date);

-- For reminder lookups
CREATE INDEX idx_reminders_habit ON habit_reminders(habit_id);
```

### Batch Queries

When loading data for multiple habits, prefer batch functions:

```typescript
// Inefficient: N+1 queries
for (const habit of habits) {
  const completions = await getCompletionsInRange(db, habit.id, start, end);
}

// Efficient: Single query
const allCompletions = await getAllCompletionsInRange(db, start, end);
const completionsByHabit = groupBy(allCompletions, 'habit_id');
```

### Transaction Usage

Use transactions for atomic multi-row operations:

```typescript
await db.withTransactionAsync(async () => {
  // Multiple related operations
  await db.runAsync(...);
  await db.runAsync(...);
  await db.runAsync(...);
});
```

This ensures all-or-nothing behavior and can improve performance for bulk operations.

---

*Last updated: January 2026*
