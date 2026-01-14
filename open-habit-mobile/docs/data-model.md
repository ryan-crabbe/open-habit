# OpenHabit Data Model

SQLite database using Expo SQLite. Local-first MVP with no cloud sync.

---

## Database Connection Requirements

**Foreign keys must be explicitly enabled on every connection:**

```javascript
// Must run on every database connection
await db.execAsync('PRAGMA foreign_keys = ON;');
```

Without this, `ON DELETE CASCADE` and other FK constraints are ignored.

---

## Date/Time Conventions

All dates and times follow these rules:

| Field Type | Format | Timezone | Example |
|------------|--------|----------|---------|
| `date` | `YYYY-MM-DD` | **Local calendar date** | `"2026-01-13"` |
| `time` | `HH:MM` | **Local device time** | `"09:00"` |
| `created_at`, `updated_at` | ISO 8601 | **Local with offset** | `"2026-01-13T18:00:00-05:00"` |

**Why local dates matter:** When a user completes a habit at 11pm, it counts for *that* day regardless of UTC. The `date` field represents the user's calendar day, not a UTC timestamp.

**Timezone storage:** User's timezone is stored in `app_settings` as an IANA zone (e.g., `America/New_York`), not an offset. Dates are always stored as local calendar dates.

**Travel behavior:** Completions are logged using the device's current timezone. A user traveling across timezones may experience "short" or "long" days. Streaks are calculated based on the timezone at time of logging, not a fixed home timezone.

**JS formatting gotcha:** `new Date().toISOString()` returns UTC (`Z`), not local with offset. Use this instead:

```javascript
// Get local date (YYYY-MM-DD)
function getLocalDate() {
    return new Date().toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
}

// Get local datetime with offset (for created_at/updated_at)
function getLocalDateTimeWithOffset() {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const mins = String(Math.abs(offset) % 60).padStart(2, '0');
    return now.toISOString().slice(0, -1) + sign + hours + ':' + mins;
}
```

---

## Tables Overview

```
┌──────────────────┐       ┌──────────────────────┐
│     habits       │───────│  habit_completions   │
└──────────────────┘       └──────────────────────┘
         │
         │
         ▼
┌──────────────────┐       ┌──────────────────────┐
│ habit_reminders  │       │    app_settings      │
└──────────────────┘       └──────────────────────┘
```

---

## Table: `habits`

Stores habit definitions and configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Habit name (e.g., "Morning Meditation") |
| `frequency_type` | TEXT | NOT NULL | One of: `daily`, `specific_days`, `every_n_days`, `weekly` |
| `target_count` | INTEGER | NOT NULL DEFAULT 1, >= 1 | Times per occurrence (for daily/every_n_days/weekly) |
| `frequency_days` | TEXT | NULL | JSON for specific_days: `{"1": 3, "3": 1, "5": 2}` (day -> count) |
| `frequency_interval` | INTEGER | NULL, >= 1 | N value for every_n_days frequency |
| `frequency_start_date` | TEXT | NULL | Local date for every_n_days cycle start |
| `missed_day_behavior` | TEXT | NULL | For every_n_days: `continue` or `reset` |
| `completion_display` | TEXT | NOT NULL DEFAULT 'partial' | Graph mode: `partial` (5/8=62%) or `binary` (done/not) |
| `color` | TEXT | NOT NULL | Hex color (e.g., "#4CAF50") |
| `icon` | TEXT | NULL | Icon identifier (optional) |
| `sort_order` | INTEGER | NOT NULL, UNIQUE | Position in habit list (no duplicates) |
| `created_at` | TEXT | NOT NULL | ISO datetime with offset |
| `updated_at` | TEXT | NOT NULL | ISO datetime with offset |

### Frequency Type Details

**`daily`**
- Uses `target_count` for times per day
- Example: Drink water 8x/day → `target_count = 8`

**`specific_days`**
- Uses `frequency_days` JSON object mapping day number to target count
- Day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
- Example: Mon 3x, Wed 1x, Fri 1x → `frequency_days = '{"1": 3, "3": 1, "5": 1}'`
- **Note:** JSON structure validated in application code, not DB constraints

**`every_n_days`**
- Uses `frequency_interval` for N value (required when type is `every_n_days`)
- Uses `frequency_start_date` for cycle start (required when type is `every_n_days`)
- Uses `missed_day_behavior`:
  - `continue`: Next occurrence stays on schedule (missed days don't shift cycle)
  - `reset`: Next occurrence is N days from last completion
- Uses `target_count` for times per occurrence
- Example: Every 3 days, 1x → `frequency_interval = 3, target_count = 1`

**`weekly`**
- Uses `target_count` for times per week (total across all days)
- User can log multiple counts on any day within the week
- Week boundaries determined by `week_start_day` setting (default: Monday)
- Progress = SUM(count) for all completions in that week
- Graph shows weeks instead of days

### SQL

```sql
CREATE TABLE habits (
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

CREATE INDEX idx_habits_sort_order ON habits(sort_order);
```

### Application-Level Validation

These constraints can't be cleanly expressed in SQLite CHECK and must be enforced in code:

```javascript
// Before INSERT/UPDATE on habits:
function validateHabit(habit) {
    if (habit.frequency_type === 'every_n_days') {
        if (!habit.frequency_interval) throw new Error('frequency_interval required for every_n_days');
        if (!habit.frequency_start_date) throw new Error('frequency_start_date required for every_n_days');
        if (!habit.missed_day_behavior) throw new Error('missed_day_behavior required for every_n_days');
    }

    if (habit.frequency_type === 'specific_days') {
        if (!habit.frequency_days) throw new Error('frequency_days required for specific_days');
        // Validate JSON structure: {"0": 1, "1": 3, ...} with valid day keys and positive counts
        const days = JSON.parse(habit.frequency_days);
        for (const [day, count] of Object.entries(days)) {
            if (!/^[0-6]$/.test(day)) throw new Error('Invalid day number');
            if (typeof count !== 'number' || count < 1) throw new Error('Invalid count');
        }
    }
}
```

---

## Table: `habit_completions`

Stores daily completion records for each habit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `habit_id` | INTEGER | NOT NULL, FK → habits(id) | Associated habit |
| `date` | TEXT | NOT NULL | Local calendar date (YYYY-MM-DD) |
| `count` | INTEGER | NOT NULL DEFAULT 0, >= 0 | Actual completions (0 if skipped) |
| `skipped` | INTEGER | NOT NULL DEFAULT 0 | 1 if skipped, 0 otherwise |
| `note` | TEXT | NULL | Optional note for this day |
| `created_at` | TEXT | NOT NULL | ISO datetime with offset |
| `updated_at` | TEXT | NOT NULL | ISO datetime with offset |

### Behavior

- **One record per habit per day** (enforced by unique constraint)
- **Skipped days**: `skipped = 1`, `count = 0` — breaks streak, shows as missed on graph
- **Partial completion**: `count < target` — graph intensity based on `completion_display` setting
- **No record for a day**: Habit wasn't due OR user hasn't interacted yet
- **Weekly habits**: Multiple rows in same week are summed for weekly progress

### SQL

```sql
CREATE TABLE habit_completions (
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

CREATE INDEX idx_completions_habit_date ON habit_completions(habit_id, date);
CREATE INDEX idx_completions_date ON habit_completions(date);
```

---

## Table: `habit_reminders`

Stores reminder times for each habit. Multiple reminders per habit supported.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `habit_id` | INTEGER | NOT NULL, FK → habits(id) | Associated habit |
| `time` | TEXT | NOT NULL | Local time in 24h format (e.g., "09:00", "14:30") |
| `enabled` | INTEGER | NOT NULL DEFAULT 1 | 1 if active, 0 if disabled |
| `created_at` | TEXT | NOT NULL | ISO datetime with offset |
| `updated_at` | TEXT | NOT NULL | ISO datetime with offset |

### Behavior

- Reminders only fire on days when the habit is scheduled
- User can disable a reminder without deleting it
- Multiple reminders allow different times (e.g., morning and evening)
- **Timezone note:** Time is interpreted as local device time. If user travels to a different timezone, reminders fire at the same local time in the new zone.

### SQL

```sql
CREATE TABLE habit_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    time TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE INDEX idx_reminders_habit ON habit_reminders(habit_id);
```

---

## Table: `app_settings`

Key-value store for app-wide settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Setting name |
| `value` | TEXT | NOT NULL | Setting value |
| `updated_at` | TEXT | NOT NULL | ISO datetime with offset |

### Known Keys

| Key | Values | Default | Description |
|-----|--------|---------|-------------|
| `theme` | `light`, `dark` | `light` | App color theme |
| `week_start_day` | `0`-`6` (0=Sun, 1=Mon) | `1` | First day of week for weekly habits |
| `timezone` | IANA timezone | Device default | User's timezone (e.g., "America/New_York") |
| `last_export_date` | ISO datetime | NULL | Last data export timestamp |

### SQL

```sql
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

---

## Calculated Values (Not Stored)

These are computed on-the-fly from completion data:

### Streaks

- **Current streak**: Count consecutive scheduled days with `count >= target` (not skipped)
- **Best streak**: Maximum streak ever achieved
- Calculated per habit when displaying progress
- For weekly habits: streak counts consecutive weeks meeting target

### Graph Intensity

For each cell in the GitHub-style graph:

```
If completion_display = 'partial':
    intensity = count / target_for_that_day

If completion_display = 'binary':
    intensity = 1 if count >= target else 0
```

### Weekly Habit Progress

```sql
-- Get weekly progress for a weekly habit
SELECT
    strftime('%Y-%W', date) as week,
    SUM(count) as total_count
FROM habit_completions
WHERE habit_id = ?
GROUP BY week;
```

Week boundaries use `week_start_day` setting. Application code must adjust the week calculation accordingly.

---

## Example Data

### Habit: "Drink Water" (8x daily)

```json
{
    "id": 1,
    "name": "Drink Water",
    "frequency_type": "daily",
    "target_count": 8,
    "frequency_days": null,
    "frequency_interval": null,
    "frequency_start_date": null,
    "missed_day_behavior": null,
    "completion_display": "partial",
    "color": "#2196F3",
    "icon": "water-drop",
    "sort_order": 0,
    "created_at": "2026-01-01T10:00:00-05:00",
    "updated_at": "2026-01-01T10:00:00-05:00"
}
```

### Habit: "Gym" (Mon 3x, Wed 2x, Fri 2x)

```json
{
    "id": 2,
    "name": "Gym",
    "frequency_type": "specific_days",
    "target_count": 1,
    "frequency_days": "{\"1\": 3, \"3\": 2, \"5\": 2}",
    "frequency_interval": null,
    "frequency_start_date": null,
    "missed_day_behavior": null,
    "completion_display": "binary",
    "color": "#4CAF50",
    "icon": "dumbbell",
    "sort_order": 1,
    "created_at": "2026-01-01T10:00:00-05:00",
    "updated_at": "2026-01-01T10:00:00-05:00"
}
```

### Habit: "Deep Clean" (Every 3 days, reset on miss)

```json
{
    "id": 3,
    "name": "Deep Clean",
    "frequency_type": "every_n_days",
    "target_count": 1,
    "frequency_days": null,
    "frequency_interval": 3,
    "frequency_start_date": "2026-01-01",
    "missed_day_behavior": "reset",
    "completion_display": "binary",
    "color": "#FF9800",
    "icon": "broom",
    "sort_order": 2,
    "created_at": "2026-01-01T10:00:00-05:00",
    "updated_at": "2026-01-01T10:00:00-05:00"
}
```

### Habit: "Exercise" (3x per week)

```json
{
    "id": 4,
    "name": "Exercise",
    "frequency_type": "weekly",
    "target_count": 3,
    "frequency_days": null,
    "frequency_interval": null,
    "frequency_start_date": null,
    "missed_day_behavior": null,
    "completion_display": "binary",
    "color": "#E91E63",
    "icon": "running",
    "sort_order": 3,
    "created_at": "2026-01-01T10:00:00-05:00",
    "updated_at": "2026-01-01T10:00:00-05:00"
}
```

### Completion Record

```json
{
    "id": 1,
    "habit_id": 1,
    "date": "2026-01-13",
    "count": 5,
    "skipped": 0,
    "note": "Busy day, didn't hit target",
    "created_at": "2026-01-13T18:00:00-05:00",
    "updated_at": "2026-01-13T22:00:00-05:00"
}
```

### Reminder

```json
{
    "id": 1,
    "habit_id": 1,
    "time": "09:00",
    "enabled": 1,
    "created_at": "2026-01-01T10:00:00-05:00",
    "updated_at": "2026-01-01T10:00:00-05:00"
}
```

---

## Migration Strategy

For future schema changes:

1. Use a `schema_version` in `app_settings`
2. Run migrations sequentially on app startup
3. Expo SQLite supports `execAsync` for migration scripts

```javascript
const CURRENT_SCHEMA_VERSION = 1;

async function initDatabase(db) {
    // CRITICAL: Enable foreign keys on every connection
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await migrate(db);
}

async function migrate(db) {
    const version = await getSchemaVersion(db);

    if (version < 1) {
        // Initial schema
        await db.execAsync(SCHEMA_V1);
        await setSchemaVersion(db, 1);
    }

    // Future migrations...
    // if (version < 2) { ... }
}
```

---

## Design Trade-offs

### JSON for `frequency_days`

**Pros:**
- Simple schema, no join tables
- Easy to read/write entire habit config
- Flexible structure

**Cons:**
- Can't query "all habits due on Wednesday" efficiently in SQL
- Structure validation must be in app code
- No referential integrity on day numbers

**Alternative for later:** Normalize to `habit_schedule_days(habit_id, weekday, target_count)` if query performance becomes an issue.

### Hard Deletes (No Archive)

Habits are permanently deleted with cascading removal of completions and reminders. This is intentional for MVP simplicity. If history preservation becomes important, add `archived_at DATETIME NULL` to habits table.
