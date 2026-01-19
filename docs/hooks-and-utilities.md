# Hooks and Utilities Documentation

This document provides comprehensive documentation for all custom React hooks and utility functions in the OpenHabit mobile application.

## Table of Contents

- [Custom React Hooks](#custom-react-hooks)
  - [Theme Hooks](#theme-hooks)
  - [Notification Hooks](#notification-hooks)
  - [Database Hooks](#database-hooks)
- [Utility Functions](#utility-functions)
  - [Date Utilities](#date-utilities)
  - [Habit Schedule Utilities](#habit-schedule-utilities)
  - [Color Utilities](#color-utilities)
  - [Streak Utilities](#streak-utilities)
  - [Export Utilities](#export-utilities)
- [Theme System](#theme-system)
- [Database Context](#database-context)
- [Common Patterns](#common-patterns)

---

## Custom React Hooks

### Theme Hooks

#### `useAppTheme`

**Location:** `/hooks/use-app-theme.tsx`

Provides full theme management including user preference handling, persistence, and system theme detection.

**Returns:**

```typescript
interface AppThemeContextValue {
  /** User's selected preference: 'system' | 'light' | 'dark' */
  preference: ThemePreference;
  /** Resolved color scheme to use: 'light' | 'dark' */
  colorScheme: 'light' | 'dark';
  /** Set the theme preference */
  setPreference: (pref: ThemePreference) => Promise<void>;
  /** Whether theme is still loading from database */
  isLoading: boolean;
}
```

**Usage:**

```tsx
import { useAppTheme } from '@/hooks/use-app-theme';

function SettingsScreen() {
  const { preference, colorScheme, setPreference, isLoading } = useAppTheme();

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      <Text>Current theme: {colorScheme}</Text>
      <Button title="Use System" onPress={() => setPreference('system')} />
      <Button title="Light Mode" onPress={() => setPreference('light')} />
      <Button title="Dark Mode" onPress={() => setPreference('dark')} />
    </View>
  );
}
```

**Requirements:**
- Must be used within an `AppThemeProvider`
- Throws error if used outside provider context

---

#### `useColorScheme`

**Location:** `/hooks/use-color-scheme.ts` (re-exports from `use-app-theme.tsx`)

Returns the resolved color scheme (`'light'` or `'dark'`). This is a drop-in replacement for React Native's built-in `useColorScheme` that respects user preferences stored in the database.

**Returns:** `'light' | 'dark'`

**Usage:**

```tsx
import { useColorScheme } from '@/hooks/use-color-scheme';

function MyComponent() {
  const colorScheme = useColorScheme();

  return (
    <View style={{
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF'
    }}>
      <Text>Current mode: {colorScheme}</Text>
    </View>
  );
}
```

**Note:** Falls back to system preference if used outside `AppThemeProvider` context.

---

#### `useColorScheme` (Web)

**Location:** `/hooks/use-color-scheme.web.ts`

Platform-specific implementation for web that handles SSR hydration issues.

**Behavior:**
- Returns `'light'` during initial render to support static rendering
- After hydration, returns the actual system color scheme

---

#### `useThemeColor`

**Location:** `/hooks/use-theme-color.ts`

Retrieves theme-aware colors from the theme configuration.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `props` | `{ light?: string; dark?: string }` | Optional override colors |
| `colorName` | `keyof Colors.light & keyof Colors.dark` | Color name from theme |

**Returns:** `string` - The appropriate color for the current theme

**Usage:**

```tsx
import { useThemeColor } from '@/hooks/use-theme-color';

function ThemedCard() {
  // Use theme color with optional overrides
  const backgroundColor = useThemeColor(
    { light: '#fff', dark: '#1a1a1a' }, // optional overrides
    'card'                               // fallback to theme's 'card' color
  );

  const textColor = useThemeColor({}, 'text');

  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Themed content</Text>
    </View>
  );
}
```

---

### Notification Hooks

#### `useNotifications`

**Location:** `/hooks/use-notifications.tsx`

Provides comprehensive notification management including permissions, scheduling, and global toggle.

**Returns:**

```typescript
interface NotificationContextValue {
  /** Current permission status: 'undetermined' | 'granted' | 'denied' */
  permissionStatus: PermissionStatus;
  /** Whether notifications are globally enabled in app settings */
  isEnabled: boolean;
  /** Whether the provider is still loading */
  isLoading: boolean;
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Toggle global notification setting */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Reschedule all notifications (call after reminder/habit changes) */
  rescheduleAllNotifications: () => Promise<void>;
  /** Open system settings for notifications */
  openSettings: () => void;
}
```

**Usage:**

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function NotificationSettings() {
  const {
    permissionStatus,
    isEnabled,
    requestPermissions,
    setEnabled,
    openSettings
  } = useNotifications();

  const handleToggle = async () => {
    if (permissionStatus === 'denied') {
      openSettings();
      return;
    }

    if (permissionStatus === 'undetermined') {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    await setEnabled(!isEnabled);
  };

  return (
    <Switch value={isEnabled} onValueChange={handleToggle} />
  );
}
```

**Features:**
- Automatic permission checking on app foreground
- Schedules notifications for the next 7 days
- Deep linking from notification taps to the Log tab
- Persists global enable/disable setting to database

**Requirements:**
- Must be used within a `NotificationProvider`

---

### Database Hooks

#### `useDatabase`

**Location:** `/database/database-provider.tsx`

Provides access to the SQLite database instance throughout the app.

**Returns:**

```typescript
interface DatabaseContextValue {
  /** The SQLite database instance (null before initialization) */
  db: SQLite.SQLiteDatabase | null;
  /** Whether the database is ready for queries */
  isReady: boolean;
  /** Any initialization error that occurred */
  error: Error | null;
}
```

**Usage:**

```tsx
import { useDatabase } from '@/database';

function HabitList() {
  const { db, isReady, error } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    async function loadHabits() {
      if (!db || !isReady) return;
      const data = await getHabits(db);
      setHabits(data);
    }
    loadHabits();
  }, [db, isReady]);

  if (error) return <ErrorMessage error={error} />;
  if (!isReady) return <LoadingSpinner />;

  return (
    <FlatList data={habits} renderItem={({ item }) => <HabitRow habit={item} />} />
  );
}
```

**Requirements:**
- Must be used within a `DatabaseProvider`

---

## Utility Functions

### Date Utilities

**Location:** `/utils/date.ts`

All date utilities follow these conventions:
- Dates: `YYYY-MM-DD` local calendar date
- Times: `HH:MM` 24-hour local time
- Timestamps: ISO 8601 with local timezone offset

#### `getLocalDate`

Returns today's local date in `YYYY-MM-DD` format.

```typescript
function getLocalDate(): string
```

**Example:**

```typescript
import { getLocalDate } from '@/utils';

const today = getLocalDate(); // "2025-01-18"
```

---

#### `getLocalDateTimeWithOffset`

Returns current local datetime with timezone offset for timestamps.

```typescript
function getLocalDateTimeWithOffset(): string
```

**Returns:** `YYYY-MM-DDTHH:MM:SS+HH:MM`

**Example:**

```typescript
import { getLocalDateTimeWithOffset } from '@/utils';

const timestamp = getLocalDateTimeWithOffset();
// "2025-01-18T14:30:00-08:00"
```

**Use for:** `created_at` and `updated_at` fields

---

#### `formatDisplayDate`

Formats a date for user-friendly display.

```typescript
function formatDisplayDate(date: string | Date): string
```

**Example:**

```typescript
import { formatDisplayDate } from '@/utils';

formatDisplayDate('2025-01-18'); // "Sat Jan 18"
formatDisplayDate(new Date());   // "Sat Jan 18"
```

---

#### `getWeekBounds`

Gets the start and end dates of the week containing a given date.

```typescript
function getWeekBounds(
  date: string | Date,
  weekStartDay?: number  // 0 = Sunday, 1 = Monday (default)
): { startDate: string; endDate: string }
```

**Example:**

```typescript
import { getWeekBounds } from '@/utils';

const { startDate, endDate } = getWeekBounds('2025-01-18');
// { startDate: "2025-01-13", endDate: "2025-01-19" }

const sundayWeek = getWeekBounds('2025-01-18', 0);
// { startDate: "2025-01-12", endDate: "2025-01-18" }
```

---

#### `getDayOfWeek`

Gets the day of week (0-6) for a date.

```typescript
function getDayOfWeek(date: string | Date): number
// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
```

---

#### `addDays` / `subtractDays`

Add or subtract days from a date.

```typescript
function addDays(date: string | Date, days: number): string
function subtractDays(date: string | Date, days: number): string
```

**Example:**

```typescript
import { addDays, subtractDays } from '@/utils';

addDays('2025-01-18', 7);      // "2025-01-25"
subtractDays('2025-01-18', 7); // "2025-01-11"
```

---

#### `daysBetween`

Calculates the difference in days between two dates.

```typescript
function daysBetween(date1: string | Date, date2: string | Date): number
// Returns positive if date1 is after date2
```

**Example:**

```typescript
import { daysBetween } from '@/utils';

daysBetween('2025-01-25', '2025-01-18'); // 7
daysBetween('2025-01-18', '2025-01-25'); // -7
```

---

#### `isSameDay`

Checks if two dates are the same calendar day.

```typescript
function isSameDay(date1: string | Date, date2: string | Date): boolean
```

---

#### `parseLocalDate`

Parses a `YYYY-MM-DD` string to a Date object at midnight local time.

```typescript
function parseLocalDate(dateStr: string): Date
```

---

#### `getDateRange`

Gets an array of date strings between start and end (inclusive).

```typescript
function getDateRange(startDate: string, endDate: string): string[]
```

**Example:**

```typescript
import { getDateRange } from '@/utils';

getDateRange('2025-01-15', '2025-01-18');
// ["2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18"]
```

---

### Habit Schedule Utilities

**Location:** `/utils/habit-schedule.ts`

Functions to determine if a habit is scheduled for a given date and calculate targets.

#### `isHabitScheduledForDate`

Checks if a habit is scheduled for a specific date based on its frequency type.

```typescript
function isHabitScheduledForDate(
  habit: Habit,
  date: string,
  lastCompletionDate?: string  // For 'reset' behavior in every_n_days
): boolean
```

**Frequency Type Behavior:**

| Frequency Type | Behavior |
|---------------|----------|
| `daily` | Always returns `true` |
| `specific_days` | Checks if day of week is in `frequency_days` JSON |
| `every_n_days` | Calculates from `frequency_start_date` or last completion |
| `weekly` | Always returns `true` (tracking is per-week) |

**Example:**

```typescript
import { isHabitScheduledForDate } from '@/utils';

// Daily habit
isHabitScheduledForDate(dailyHabit, '2025-01-18'); // true

// Specific days habit (Mon, Wed, Fri)
isHabitScheduledForDate(mwfHabit, '2025-01-17'); // true (Friday)
isHabitScheduledForDate(mwfHabit, '2025-01-18'); // false (Saturday)
```

---

#### `getTargetForDate`

Gets the target completion count for a habit on a specific date.

```typescript
function getTargetForDate(habit: Habit, date: string): number
```

**Example:**

```typescript
import { getTargetForDate } from '@/utils';

// Daily habit with target_count = 3
getTargetForDate(dailyHabit, '2025-01-18'); // 3

// Specific days with per-day targets: { "1": 2, "3": 2, "5": 1 }
getTargetForDate(specificDaysHabit, '2025-01-17'); // 1 (Friday = day 5)
```

---

#### `getWeeklyTarget`

Gets the total target for a habit over a week.

```typescript
function getWeeklyTarget(
  habit: Habit,
  weekStartDate: string,
  weekStartDay?: number  // 0 = Sunday, 1 = Monday (default)
): number
```

**Example:**

```typescript
import { getWeeklyTarget } from '@/utils';

// Weekly habit with target_count = 5
getWeeklyTarget(weeklyHabit, '2025-01-13'); // 5

// Daily habit (sums 7 days)
getWeeklyTarget(dailyHabit, '2025-01-13'); // 21 (3 per day * 7)
```

---

#### `getNextScheduledDate`

Finds the next scheduled date for a habit.

```typescript
function getNextScheduledDate(
  habit: Habit,
  fromDate: string,
  lastCompletionDate?: string
): string | null  // null if none found within 365 days
```

---

#### `isCompleted` / `getCompletionPercentage`

Helper functions for completion status.

```typescript
function isCompleted(completionCount: number, targetCount: number): boolean

function getCompletionPercentage(
  completionCount: number,
  targetCount: number
): number  // 0 to 1, capped at 1
```

---

### Color Utilities

**Location:** `/utils/color.ts`

#### `hexToRgba`

Converts a hex color to rgba with specified opacity.

```typescript
function hexToRgba(hex: string, opacity: number): string
```

**Supported formats:** `#RGB`, `#RRGGBB`

**Example:**

```typescript
import { hexToRgba } from '@/utils';

hexToRgba('#FF0000', 0.5);  // "rgba(255, 0, 0, 0.5)"
hexToRgba('#F00', 0.5);     // "rgba(255, 0, 0, 0.5)"
```

---

#### `withDisabledOpacity`

Returns a color with 25% opacity for disabled states.

```typescript
function withDisabledOpacity(color: string): string
```

**Example:**

```typescript
import { withDisabledOpacity } from '@/utils';

withDisabledOpacity('#2196F3'); // "rgba(33, 150, 243, 0.25)"
```

---

#### `getHabitIntensityColor`

Gets a habit-specific intensity color based on completion percentage for contribution graphs.

```typescript
function getHabitIntensityColor(
  percentage: number,        // 0 to 1
  habitColor: string,        // Habit's hex color
  colorScheme: 'light' | 'dark'
): string
```

**Intensity Levels:**

| Percentage | Opacity |
|------------|---------|
| 0% | Empty cell color |
| 1-24% | 25% opacity |
| 25-49% | 50% opacity |
| 50-74% | 75% opacity |
| 75-100% | 100% opacity |

---

### Streak Utilities

**Location:** `/utils/streak.ts`

#### `calculateStreak`

Calculates current and best streaks for a habit.

```typescript
interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  unit: 'days' | 'weeks';
}

function calculateStreak(
  habit: Habit,
  completions: HabitCompletion[],
  today?: string,           // Defaults to getLocalDate()
  weekStartDay?: number     // 0 = Sunday, 1 = Monday (default)
): StreakResult
```

**Behavior:**
- **Daily/Specific Days/Every N Days:** Counts consecutive days where target was met
- **Weekly:** Counts consecutive weeks where weekly target was met
- **Today/Current Week:** Treated as "pending" - doesn't break streak if incomplete

**Example:**

```typescript
import { calculateStreak } from '@/utils/streak';

const streak = calculateStreak(habit, completions);
console.log(`Current streak: ${streak.currentStreak} ${streak.unit}`);
console.log(`Best streak: ${streak.bestStreak} ${streak.unit}`);
```

---

### Export Utilities

**Location:** `/utils/export.ts`

#### `gatherExportData`

Collects all data from the database for export.

```typescript
interface ExportData {
  exportDate: string;
  version: string;
  habits: Habit[];
  completions: HabitCompletion[];
  reminders: HabitReminder[];
  settings: Record<SettingKey, string>;
}

async function gatherExportData(db: SQLite.SQLiteDatabase): Promise<ExportData>
```

---

#### `formatAsJSON` / `formatAsCSV`

Format export data for download.

```typescript
function formatAsJSON(data: ExportData): string
function formatAsCSV(data: ExportData): string
```

---

## Theme System

**Location:** `/constants/theme.ts`

### Colors

The theme provides comprehensive color tokens for both light and dark modes:

```typescript
import { Colors } from '@/constants/theme';

// Access colors
Colors.light.text       // "#11181C"
Colors.dark.text        // "#ECEDEE"
Colors.light.background // "#FFFFFF"
Colors.dark.background  // "#121212"
```

**Available Color Tokens:**

| Token | Description |
|-------|-------------|
| `text` | Primary text color |
| `textSecondary` | Secondary/muted text |
| `background` | Main background |
| `backgroundSecondary` | Elevated surface background |
| `tint` | Primary accent color |
| `success`, `warning`, `error` | Semantic colors |
| `card`, `cardBorder` | Card styling |
| `habitNotStarted`, `habitInProgress`, `habitCompleted`, `habitSkipped` | Habit state colors |

### Graph Intensity Colors

For contribution graphs:

```typescript
import { GraphIntensity, getGraphIntensityColor } from '@/constants/theme';

// Get color based on completion percentage
const color = getGraphIntensityColor(0.75, 'dark'); // Level 4 color
```

### Habit Colors

Preset colors for habits:

```typescript
import { HabitColors } from '@/constants/theme';

// ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FF5722', '#607D8B']
```

### Typography

```typescript
import { Fonts, FontSizes, FontWeights } from '@/constants/theme';

// Font sizes
FontSizes.xs   // 12
FontSizes.sm   // 14
FontSizes.md   // 16
FontSizes.lg   // 18
FontSizes.xl   // 20
FontSizes.xxl  // 24
FontSizes.xxxl // 32

// Font weights
FontWeights.regular  // '400'
FontWeights.medium   // '500'
FontWeights.semibold // '600'
FontWeights.bold     // '700'
```

### Spacing & Border Radius

```typescript
import { Spacing, BorderRadius } from '@/constants/theme';

Spacing.xs  // 4
Spacing.sm  // 8
Spacing.md  // 12
Spacing.lg  // 16
Spacing.xl  // 24
Spacing.xxl // 32

BorderRadius.sm   // 4
BorderRadius.md   // 8
BorderRadius.lg   // 12
BorderRadius.xl   // 16
BorderRadius.full // 9999
```

### Shadows

```typescript
import { Shadows } from '@/constants/theme';

// Use with StyleSheet
const styles = StyleSheet.create({
  card: {
    ...Shadows.light.md,
    // or for dark mode:
    ...Shadows.dark.md,
  },
});
```

---

## Database Context

### Provider Setup

Wrap your app with the required providers:

```tsx
import { DatabaseProvider } from '@/database';
import { AppThemeProvider } from '@/hooks/use-app-theme';
import { NotificationProvider } from '@/hooks/use-notifications';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AppThemeProvider>
        <NotificationProvider>
          <Stack />
        </NotificationProvider>
      </AppThemeProvider>
    </DatabaseProvider>
  );
}
```

### Database Functions

All database functions are exported from `@/database`:

**Habits:**
- `getHabits(db)` - Get all habits sorted by sort_order
- `getHabitById(db, id)` - Get single habit
- `createHabit(db, input)` - Create new habit
- `updateHabit(db, id, input)` - Update existing habit
- `deleteHabit(db, id)` - Delete habit (cascades to completions/reminders)
- `reorderHabits(db, orderedIds)` - Reorder habits

**Completions:**
- `getCompletionForDate(db, habitId, date)` - Get single completion
- `getCompletionsInRange(db, habitId, startDate, endDate)` - Get completions in range
- `getAllCompletionsForHabit(db, habitId)` - Get all completions for habit
- `incrementCompletion(db, habitId, date?)` - Increment count by 1
- `decrementCompletion(db, habitId, date?)` - Decrement count by 1
- `skipCompletion(db, habitId, date?, note?)` - Mark as skipped
- `upsertCompletion(db, habitId, date, count, skipped, note)` - Full upsert

**Reminders:**
- `getRemindersForHabit(db, habitId)` - Get reminders for habit
- `createReminder(db, habitId, time, enabled?)` - Create reminder
- `updateReminder(db, id, updates)` - Update reminder
- `toggleReminder(db, id)` - Toggle enabled status
- `deleteReminder(db, id)` - Delete reminder

**Settings:**
- `getSetting(db, key)` - Get setting value
- `setSetting(db, key, value)` - Set setting value
- `getTheme(db)` / `setTheme(db, theme)` - Theme helpers
- `getWeekStartDay(db)` / `setWeekStartDay(db, day)` - Week start helpers

---

## Common Patterns

### Loading State Pattern

```tsx
function MyScreen() {
  const { db, isReady, error } = useDatabase();
  const [data, setData] = useState<MyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!db || !isReady) return;
      try {
        const result = await fetchData(db);
        setData(result);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [db, isReady]);

  if (error) return <ErrorScreen error={error} />;
  if (loading || !isReady) return <LoadingSpinner />;

  return <DataList data={data} />;
}
```

### Theme-Aware Styling

```tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Shadows } from '@/constants/theme';

function ThemedComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const shadows = Shadows[colorScheme];

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.card },
      shadows.md
    ]}>
      <Text style={{ color: colors.text }}>Themed text</Text>
    </View>
  );
}
```

### Habit Completion Tracking

```tsx
import { useDatabase, incrementCompletion, getCompletionForDate } from '@/database';
import { getLocalDate, getTargetForDate, isCompleted } from '@/utils';

function HabitTracker({ habit }: { habit: Habit }) {
  const { db } = useDatabase();
  const [completion, setCompletion] = useState<HabitCompletion | null>(null);

  const today = getLocalDate();
  const target = getTargetForDate(habit, today);
  const count = completion?.count ?? 0;
  const completed = isCompleted(count, target);

  const handleIncrement = async () => {
    if (!db) return;
    const updated = await incrementCompletion(db, habit.id);
    setCompletion(updated);
  };

  return (
    <TouchableOpacity onPress={handleIncrement}>
      <Text>{count} / {target}</Text>
      {completed && <CheckIcon />}
    </TouchableOpacity>
  );
}
```

### Rescheduling Notifications After Changes

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function ReminderEditor({ habitId }: { habitId: number }) {
  const { rescheduleAllNotifications } = useNotifications();

  const handleSaveReminder = async () => {
    // ... save reminder to database

    // Reschedule all notifications to include the new reminder
    await rescheduleAllNotifications();
  };

  return (/* ... */);
}
```

---

*Last updated: January 2026*
