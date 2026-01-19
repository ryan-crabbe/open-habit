# OpenHabit Mobile Architecture Documentation

This document provides a comprehensive overview of the OpenHabit mobile application architecture, a React Native/Expo habit tracking app with local-first data storage.

## Table of Contents

1. [Overview](#overview)
2. [Folder Organization](#folder-organization)
3. [Navigation Structure](#navigation-structure)
4. [State Management](#state-management)
5. [Data Layer](#data-layer)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Key Architectural Decisions](#key-architectural-decisions)
8. [Component Architecture](#component-architecture)

---

## Overview

OpenHabit Mobile is a habit tracking application built with:

- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: TypeScript 5.9
- **Navigation**: Expo Router 6 (file-based routing)
- **Database**: SQLite via `expo-sqlite` (local-first, no cloud sync)
- **State Management**: React Context + Hooks pattern
- **UI**: Custom themed components with light/dark mode support

### Core Principles

1. **Local-first**: All data stored on-device using SQLite, no cloud sync required
2. **Privacy-focused**: No user accounts, no data leaves the device
3. **Performance-optimized**: Batch queries, memoization, and lazy loading
4. **Type-safe**: Full TypeScript coverage with strict mode

---

## Folder Organization

```
open-habit-mobile/
├── app/                    # Screens and navigation (Expo Router)
│   ├── (tabs)/            # Bottom tab navigator screens
│   │   ├── _layout.tsx    # Tab navigator configuration
│   │   ├── index.tsx      # Log tab (today's habits)
│   │   ├── progress.tsx   # Progress tab (contribution graphs)
│   │   └── habits.tsx     # Habits tab (manage habits)
│   ├── _layout.tsx        # Root layout with providers
│   ├── create-habit.tsx   # Create habit form
│   ├── edit-habit.tsx     # Edit habit form
│   ├── theme-settings.tsx # Theme preferences
│   └── ...                # Other settings screens
│
├── components/            # Reusable UI components
│   ├── ui/               # Base UI primitives
│   │   ├── icon-symbol.tsx
│   │   └── collapsible.tsx
│   ├── log/              # Log screen components
│   │   └── HabitCard.tsx
│   ├── progress/         # Progress screen components
│   │   ├── HabitProgressCard.tsx
│   │   ├── SkiaContributionGraph.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── ...
│   ├── habit-form/       # Form components for create/edit
│   │   ├── FormSection.tsx
│   │   ├── FrequencyTypeSelector.tsx
│   │   ├── ColorPicker.tsx
│   │   └── ...
│   ├── themed-text.tsx   # Theme-aware text component
│   └── themed-view.tsx   # Theme-aware view component
│
├── constants/
│   └── theme.ts          # Colors, spacing, typography tokens
│
├── database/             # SQLite data layer
│   ├── index.ts          # Public API exports
│   ├── database.ts       # DB initialization and migrations
│   ├── database-provider.tsx  # React Context provider
│   ├── schema.ts         # SQL schema definitions
│   ├── habits.ts         # Habits CRUD operations
│   ├── completions.ts    # Completions CRUD operations
│   ├── reminders.ts      # Reminders CRUD operations
│   └── settings.ts       # App settings CRUD
│
├── hooks/                # Custom React hooks
│   ├── use-app-theme.tsx # Theme management context
│   ├── use-notifications.tsx  # Notification scheduling
│   ├── use-color-scheme.ts    # System color scheme
│   └── use-theme-color.ts     # Theme color helper
│
├── utils/                # Pure utility functions
│   ├── date.ts           # Date manipulation helpers
│   ├── streak.ts         # Streak calculation logic
│   ├── habit-schedule.ts # Scheduling logic
│   ├── color.ts          # Color utilities
│   └── export.ts         # Data export functionality
│
├── data/
│   └── test-data.ts      # Test fixtures and type definitions
│
└── assets/               # Images, fonts, icons
```

### Key Conventions

- **Feature-based organization**: Components grouped by feature (log, progress, habit-form)
- **Index exports**: Each folder exposes its public API via `index.ts`
- **Colocation**: Related files kept together (e.g., all progress components in `components/progress/`)

---

## Navigation Structure

### Expo Router File-Based Routing

The app uses Expo Router for file-system based navigation. Routes are automatically generated from the `app/` directory structure.

```
Navigation Hierarchy
====================

Root Stack (app/_layout.tsx)
├── (tabs)                    # Tab Navigator Group
│   ├── index         → Log Tab (Today's Habits)
│   ├── progress      → Progress Tab (Contribution Graphs)
│   └── habits        → Habits Tab (Manage/Reorder)
│
└── Stack Screens (card presentation)
    ├── create-habit          # Create new habit form
    ├── edit-habit            # Edit existing habit
    ├── app-settings          # Main settings menu
    ├── theme-settings        # Theme preferences
    ├── week-start-settings   # Week start day
    ├── notification-settings # Notification preferences
    └── export-data           # Data export options
```

### Root Layout (`app/_layout.tsx`)

The root layout establishes the provider hierarchy and configures the navigation stack:

```tsx
export default function RootLayout() {
  return (
    <DatabaseProvider>
      <NotificationProvider>
        <AppThemeProvider>
          <RootLayoutContent />
        </AppThemeProvider>
      </NotificationProvider>
    </DatabaseProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-habit" options={{ presentation: 'card' }} />
        {/* ... other screens */}
      </Stack>
    </ThemeProvider>
  );
}
```

### Tab Navigator (`app/(tabs)/_layout.tsx`)

Configures the bottom tab bar with three main screens:

```tsx
export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors[colorScheme].tint,
      headerRight: () => <SettingsButton />,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Log' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
    </Tabs>
  );
}
```

### Navigation Patterns

1. **Tab Navigation**: Primary navigation via bottom tabs
2. **Stack Navigation**: Modal/card presentation for forms and settings
3. **Programmatic Navigation**: Using `router.push()` and `router.back()`

```tsx
// Navigate to create habit
router.push('/create-habit');

// Navigate with params
router.push({ pathname: '/edit-habit', params: { id: habit.id.toString() } });

// Go back
router.back();
```

---

## State Management

The app uses a **Context + Hooks** pattern for state management, avoiding external state libraries in favor of React's built-in primitives.

### State Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Provider Tree                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  DatabaseProvider                                        │    │
│  │  ├─ db: SQLiteDatabase | null                           │    │
│  │  ├─ isReady: boolean                                    │    │
│  │  └─ error: Error | null                                 │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  NotificationProvider                            │    │    │
│  │  │  ├─ permissionStatus: 'granted' | 'denied' | ... │    │    │
│  │  │  ├─ isEnabled: boolean                           │    │    │
│  │  │  └─ rescheduleAllNotifications()                 │    │    │
│  │  │                                                   │    │    │
│  │  │  ┌───────────────────────────────────────────┐   │    │    │
│  │  │  │  AppThemeProvider                          │   │    │    │
│  │  │  │  ├─ preference: 'system' | 'light' | 'dark'│   │    │    │
│  │  │  │  ├─ colorScheme: 'light' | 'dark'          │   │    │    │
│  │  │  │  └─ setPreference()                        │   │    │    │
│  │  │  │                                             │   │    │    │
│  │  │  │  ┌───────────────────────────────────┐     │   │    │    │
│  │  │  │  │  ThemeProvider (React Navigation) │     │   │    │    │
│  │  │  │  │  └─ Navigation theme colors       │     │   │    │    │
│  │  │  │  │                                    │     │   │    │    │
│  │  │  │  │      [App Screens]                │     │   │    │    │
│  │  │  │  └───────────────────────────────────┘     │   │    │    │
│  │  │  └───────────────────────────────────────────┘   │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Context Providers

#### 1. DatabaseProvider (`database/database-provider.tsx`)

Provides SQLite database access to all components:

```tsx
interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

// Usage in components
function MyComponent() {
  const { db, isReady, error } = useDatabase();

  if (!isReady) return <Loading />;
  if (error) return <Error error={error} />;

  // Use db for queries...
}
```

#### 2. AppThemeProvider (`hooks/use-app-theme.tsx`)

Manages theme preferences with persistence:

```tsx
interface AppThemeContextValue {
  preference: 'system' | 'light' | 'dark';
  colorScheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => Promise<void>;
  isLoading: boolean;
}

// Usage
const { colorScheme, setPreference } = useAppTheme();
```

#### 3. NotificationProvider (`hooks/use-notifications.tsx`)

Handles notification permissions and scheduling:

```tsx
interface NotificationContextValue {
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  isEnabled: boolean;
  requestPermissions: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<void>;
  rescheduleAllNotifications: () => Promise<void>;
  openSettings: () => void;
}
```

### Local Component State

For screen-specific state, the app uses:

1. **useState**: Simple local state
2. **useReducer**: Complex form state (see `create-habit.tsx`)
3. **useRef**: Mutable values that shouldn't trigger re-renders
4. **useMemo/useCallback**: Memoized values and callbacks

Example of `useReducer` for form state:

```tsx
// create-habit.tsx
interface FormState {
  name: string;
  frequencyType: FrequencyType;
  targetCount: number;
  // ... other fields
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_FREQUENCY_TYPE'; payload: FrequencyType }
  // ... other actions

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    // ... other cases
  }
}

// Usage
const [state, dispatch] = useReducer(formReducer, initialState);
dispatch({ type: 'SET_NAME', payload: 'Drink Water' });
```

---

## Data Layer

### SQLite Database Architecture

The app uses SQLite for local-first data persistence with a clean separation of concerns.

#### Database Schema

```sql
-- Core Tables
┌─────────────────────┐
│       habits        │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ frequency_type      │  -- 'daily' | 'specific_days' | 'every_n_days' | 'weekly'
│ target_count        │
│ frequency_days      │  -- JSON for specific_days: {"1": 3, "3": 2}
│ frequency_interval  │  -- For every_n_days
│ frequency_start_date│
│ missed_day_behavior │  -- 'continue' | 'reset'
│ completion_display  │  -- 'partial' | 'binary'
│ color               │
│ icon                │
│ allow_overload      │  -- 0 or 1
│ sort_order          │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐     ┌─────────────────────┐
│  habit_completions  │     │   habit_reminders   │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ habit_id (FK)       │     │ habit_id (FK)       │
│ date                │     │ time                │  -- "HH:MM"
│ count               │     │ enabled             │
│ skipped             │     │ created_at          │
│ note                │     │ updated_at          │
│ created_at          │     └─────────────────────┘
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│    app_settings     │
├─────────────────────┤
│ key (PK)            │  -- 'theme', 'week_start_day', etc.
│ value               │
│ updated_at          │
└─────────────────────┘
```

#### Database Module Structure

```typescript
// database/index.ts - Public API
export { initDatabase, getDatabase, closeDatabase } from './database';
export { DatabaseProvider, useDatabase } from './database-provider';
export { getHabits, createHabit, updateHabit, deleteHabit } from './habits';
export { incrementCompletion, decrementCompletion, skipCompletion } from './completions';
export { getRemindersForHabit, createReminder } from './reminders';
export { getSetting, setSetting, getTheme, setTheme } from './settings';
```

#### Initialization and Migrations

```typescript
// database/database.ts
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await getDatabase();
  await migrate(database);  // Run pending migrations
  return database;
}

// CRITICAL: Foreign keys enabled on every connection
async function getDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}
```

#### Migration System

Schema versions are tracked in `app_settings` and migrations run sequentially:

```typescript
// database/schema.ts
export const CURRENT_SCHEMA_VERSION = 2;

export const SCHEMA_V1 = `
  CREATE TABLE IF NOT EXISTS habits (...);
  CREATE TABLE IF NOT EXISTS habit_completions (...);
  CREATE TABLE IF NOT EXISTS habit_reminders (...);
  CREATE TABLE IF NOT EXISTS app_settings (...);
`;

export const SCHEMA_V2 = `
  ALTER TABLE habits ADD COLUMN allow_overload INTEGER NOT NULL DEFAULT 1;
`;
```

### Frequency Types

The app supports four habit frequency types:

| Type | Description | Key Fields |
|------|-------------|------------|
| `daily` | Every day, N times | `target_count` |
| `specific_days` | Specific weekdays | `frequency_days` (JSON) |
| `every_n_days` | Every N days | `frequency_interval`, `frequency_start_date`, `missed_day_behavior` |
| `weekly` | N times per week | `target_count` |

Example `frequency_days` JSON for specific_days:
```json
{"1": 3, "3": 2, "5": 2}  // Mon: 3x, Wed: 2x, Fri: 2x
```

---

## Data Flow Patterns

### Pattern 1: Screen Data Loading

Screens load data on focus using `useFocusEffect` and the database context:

```
┌─────────────────────────────────────────────────────────────┐
│                    Log Screen Data Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Screen focuses                                           │
│     │                                                        │
│     ▼                                                        │
│  2. useFocusEffect triggers                                  │
│     │                                                        │
│     ▼                                                        │
│  3. loadHabits() called                                      │
│     │                                                        │
│     ├──► getHabits(db)          → Fetch all habits          │
│     │                                                        │
│     ├──► getAllCompletionsForDate(db, today)                │
│     │                            → Fetch today's completions │
│     │                                                        │
│     ├──► isHabitScheduledForDate(habit, today)              │
│     │                            → Filter scheduled habits   │
│     │                                                        │
│     └──► setHabits(scheduledHabits)                         │
│                                  → Update state, trigger     │
│                                    re-render                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```tsx
// Simplified example from Log screen
useFocusEffect(
  useCallback(() => {
    async function loadHabits() {
      const allHabits = await getHabits(db);
      const completions = await getAllCompletionsForDate(db, today);

      const scheduled = allHabits.filter(habit =>
        isHabitScheduledForDate(habit, today)
      );

      setHabits(scheduled.map(habit => ({
        habit,
        completion: completions.find(c => c.habit_id === habit.id),
        targetCount: getTargetForDate(habit, today),
      })));
    }

    if (isReady) loadHabits();
  }, [isReady, db])
);
```

### Pattern 2: User Interactions

User actions trigger database updates followed by state refresh:

```
┌─────────────────────────────────────────────────────────────┐
│               Habit Completion Flow (Tap)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User taps habit card                                        │
│     │                                                        │
│     ▼                                                        │
│  handleTap(item) called                                      │
│     │                                                        │
│     ├──► Haptic feedback                                    │
│     │                                                        │
│     ├──► incrementCompletion(db, habitId, date)             │
│     │         │                                              │
│     │         ├──► getCompletionForDate() - check existing  │
│     │         │                                              │
│     │         └──► upsertCompletion() - insert or update    │
│     │                                                        │
│     └──► loadHabits() - refresh screen state                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 3: Settings with Persistence

Settings changes are immediately persisted and reflected in the UI:

```tsx
// Theme change flow
const setPreference = async (pref: ThemePreference) => {
  // 1. Optimistic update
  setPreferenceState(pref);

  try {
    // 2. Persist to database
    if (pref === 'system') {
      await deleteSetting(db, 'theme');
    } else {
      await setSetting(db, 'theme', pref);
    }
  } catch (err) {
    // 3. Revert on error
    setPreferenceState(previousPreference);
  }
};
```

### Pattern 4: Batch Data Loading (Progress Screen)

The Progress screen optimizes performance with batch queries:

```tsx
// Single batch query instead of N+1
const loadData = async () => {
  const habits = await getHabits(db);
  const allCompletions = await getAllCompletionsInRange(db, startDate, endDate);

  // Group completions by habit_id (client-side)
  const completionsByHabit = new Map();
  allCompletions.forEach(c => {
    const list = completionsByHabit.get(c.habit_id) || [];
    list.push(c);
    completionsByHabit.set(c.habit_id, list);
  });

  // Pre-compute streaks (avoid blocking render)
  const habitsData = habits.map(habit => ({
    habit,
    completions: completionsByHabit.get(habit.id) || [],
    streak: calculateStreak(habit, completions),
  }));

  setHabitsWithCompletions(habitsData);
};
```

---

## Key Architectural Decisions

### 1. Local-First with SQLite

**Decision**: Use SQLite for all data storage, no cloud sync.

**Rationale**:
- Privacy: User data never leaves the device
- Offline-first: App works without internet
- Performance: Local reads/writes are fast
- Simplicity: No backend infrastructure needed

**Trade-offs**:
- No cross-device sync (acceptable for MVP)
- No backup unless user exports manually

### 2. Expo Router for Navigation

**Decision**: Use Expo Router (file-based routing) instead of React Navigation directly.

**Rationale**:
- Conventions over configuration
- Type-safe routes with `typedRoutes: true`
- Automatic deep linking
- Better developer experience

### 3. Context over Redux/MobX

**Decision**: Use React Context + Hooks instead of external state management.

**Rationale**:
- Simpler mental model
- Less boilerplate
- Sufficient for app complexity
- Better tree-shaking

**Pattern**: Three focused contexts (Database, Theme, Notifications) rather than one global store.

### 4. Memoization Strategy

**Decision**: Aggressive memoization for expensive computations.

Components use:
- `React.memo()` for preventing unnecessary re-renders
- `useMemo()` for expensive calculations
- `useCallback()` for stable function references
- `useRef()` for non-reactive state (load IDs, timers)

Example from Progress screen:
```tsx
// Pre-compute streaks during data load, not render
const habitsData = habits.map(habit => ({
  habit,
  completions,
  streak: calculateStreak(habit, completions), // Computed once
}));

// Memoized render function
const renderHabitCard = useCallback(
  ({ item }) => <HabitProgressCard habit={item.habit} ... />,
  []
);
```

### 5. Frequency Days Caching

**Decision**: Cache parsed `frequency_days` JSON to avoid repeated parsing.

```typescript
// utils/habit-schedule.ts
const frequencyDaysCache = new Map<string, Record<string, number>>();

function getParsedFrequencyDays(habit: Habit) {
  const cacheKey = `${habit.id}:${habit.frequency_days}`;
  if (frequencyDaysCache.has(cacheKey)) {
    return frequencyDaysCache.get(cacheKey);
  }
  const parsed = JSON.parse(habit.frequency_days);
  frequencyDaysCache.set(cacheKey, parsed);
  return parsed;
}
```

### 6. Skia for Contribution Graphs

**Decision**: Use `@shopify/react-native-skia` for rendering contribution graphs.

**Rationale**:
- Performance: Hardware-accelerated rendering
- Handles 365+ cells without jank
- Smooth scrolling and interactions

### 7. Date Conventions

**Decision**: Standardize on specific date/time formats.

| Type | Format | Example |
|------|--------|---------|
| Dates | `YYYY-MM-DD` | `2026-01-15` |
| Times | `HH:MM` | `09:30` |
| Timestamps | ISO 8601 with offset | `2026-01-15T09:30:00-05:00` |

All dates are local calendar dates, not UTC.

### 8. Haptic Feedback

**Decision**: Use haptic feedback for all user interactions.

```typescript
// Light feedback for increments
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium for completions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy for long press actions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

### 9. Screen Freezing

**Decision**: Use `react-freeze` to suspend off-screen tabs.

```tsx
import { Freeze } from 'react-freeze';
import { useIsFocused } from '@react-navigation/native';

function LogScreen() {
  const isFocused = useIsFocused();

  return (
    <Freeze freeze={!isFocused}>
      {/* Screen content */}
    </Freeze>
  );
}
```

This prevents off-screen tabs from re-rendering, improving performance.

---

## Component Architecture

### Themed Components

Base components that respond to light/dark mode:

```tsx
// components/themed-view.tsx
export function ThemedView({ style, ...props }: ThemedViewProps) {
  const backgroundColor = useThemeColor({}, 'background');
  return <View style={[{ backgroundColor }, style]} {...props} />;
}

// components/themed-text.tsx
export function ThemedText({ style, ...props }: ThemedTextProps) {
  const color = useThemeColor({}, 'text');
  return <Text style={[{ color }, style]} {...props} />;
}
```

### Feature Components

Feature-specific components are organized by screen:

```
components/
├── log/
│   └── HabitCard.tsx          # Habit card with tap-to-increment
├── progress/
│   ├── HabitProgressCard.tsx  # Container for progress visualization
│   ├── SkiaContributionGraph.tsx  # GitHub-style graph
│   ├── StreakDisplay.tsx      # Current/best streak badges
│   └── CellDetailModal.tsx    # Day detail popup
└── habit-form/
    ├── FormSection.tsx        # Form section wrapper
    ├── HabitNameInput.tsx     # Name text input
    ├── FrequencyTypeSelector.tsx  # Frequency picker
    ├── ColorPicker.tsx        # Color selection grid
    └── RemindersConfig.tsx    # Reminder time picker
```

### Component Communication

1. **Props down**: Parent passes data and callbacks to children
2. **Context across**: Shared state accessed via hooks
3. **Events up**: Child calls parent callbacks for mutations

```tsx
// Parent (LogScreen)
<HabitCard
  habit={item.habit}
  completion={item.completion}
  targetCount={item.targetCount}
  onTap={() => handleTap(item)}      // Callback prop
  onLongPress={() => handleLongPress(item)}
/>

// Child (HabitCard)
function HabitCard({ habit, completion, targetCount, onTap, onLongPress }) {
  const colorScheme = useColorScheme();  // Context access

  return (
    <Pressable
      onPress={onTap}      // Calls parent callback
      onLongPress={onLongPress}
    >
      {/* ... */}
    </Pressable>
  );
}
```

---

## Appendix: Type Definitions

### Core Types

```typescript
// data/test-data.ts
export type FrequencyType = 'daily' | 'specific_days' | 'every_n_days' | 'weekly';
export type CompletionDisplay = 'partial' | 'binary';
export type MissedDayBehavior = 'continue' | 'reset';

export interface Habit {
  id: number;
  name: string;
  frequency_type: FrequencyType;
  target_count: number;
  frequency_days: string | null;
  frequency_interval: number | null;
  frequency_start_date: string | null;
  missed_day_behavior: MissedDayBehavior | null;
  completion_display: CompletionDisplay;
  color: string;
  icon: string | null;
  allow_overload: 0 | 1;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string;
  count: number;
  skipped: 0 | 1;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitReminder {
  id: number;
  habit_id: number;
  time: string;
  enabled: 0 | 1;
  created_at: string;
  updated_at: string;
}
```

### Streak Result

```typescript
// utils/streak.ts
export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  unit: 'days' | 'weeks';
}
```

---

*Last updated: January 2026*
