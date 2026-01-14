# OpenHabit Mobile

Expo React Native habit tracking app. Local-first using SQLite (expo-sqlite).

## Quick Start

```bash
npm install
npx expo start --tunnel
```

## Architecture

- **Router:** Expo Router (file-based routing in `app/`)
- **Database:** Expo SQLite with local storage only (no cloud sync)
- **Navigation:** Bottom tabs - Log | Progress | Settings

## Key Directories

```
app/           # Screens and navigation (file-based routing)
  (tabs)/      # Bottom tab screens
components/    # Reusable UI components
constants/     # Theme and config values
hooks/         # Custom React hooks
docs/          # Data model and UI plans
```

## Data Model

See `docs/data-model.md` for full schema. Key tables:

- **habits** - Habit definitions (name, frequency, color, etc.)
- **habit_completions** - Daily completion records
- **habit_reminders** - Notification times per habit
- **app_settings** - Key-value app configuration

### Frequency Types

1. `daily` - Every day, N times (target_count)
2. `specific_days` - Specific weekdays with per-day targets (frequency_days JSON)
3. `every_n_days` - Every N days with continue/reset behavior
4. `weekly` - N times per week (target_count)

### Date Conventions

- Dates: `YYYY-MM-DD` local calendar date
- Times: `HH:MM` 24-hour local time
- Timestamps: ISO 8601 with local offset

## Database Notes

**Foreign keys must be enabled on every connection:**
```javascript
await db.execAsync('PRAGMA foreign_keys = ON;');
```

## Test Data

Test fixtures available in `data/test-data.ts` for development.

## Implementation Workflow

Follow `docs/implementation-roadmap.md` for the build plan.

**Rules:**
1. Work through epics in order (Epic 0 → Epic 1 → etc.)
2. Complete all tasks/subtasks within an epic before moving on
3. Mark checkboxes in the roadmap as you complete items
4. **STOP after finishing each epic** - wait for user to continue
5. **Ask user before updating the roadmap** with new tasks or changes
