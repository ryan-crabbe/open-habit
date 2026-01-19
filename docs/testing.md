# Testing Documentation

## Current Testing Status

**No automated tests exist yet.** The project is in early development and does not have a test runner configured or any test files written. This document outlines the testing strategy to be implemented.

### What's Missing
- No Jest or Vitest configuration
- No test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`)
- No `__tests__` directories
- No test script in `package.json`

---

## Testing Philosophy

OpenHabit follows a **practical testing approach** focused on:

1. **Business Logic First** - Prioritize testing utility functions that handle date calculations, streak logic, and habit scheduling since these contain complex logic that's easy to get wrong.

2. **Database Layer Second** - Test database operations to ensure data integrity, especially for CRUD operations on habits and completions.

3. **Component Testing Third** - Test React Native components for critical user interactions, but avoid over-testing presentational details.

4. **Manual Testing for UX** - Use manual testing checklists for user flows that are difficult to automate reliably in React Native.

---

## Setting Up Tests (Future Implementation)

### Recommended Test Framework

For Expo/React Native projects, use **Jest** with the Expo preset:

```bash
npm install --save-dev jest jest-expo @types/jest ts-jest
```

### Configuration

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
    ],
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"]
  }
}
```

Create `jest.setup.ts`:

```typescript
// Mock expo-sqlite for unit tests
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));
```

---

## Test File Conventions

### File Naming
- Unit tests: `[filename].test.ts` or `[filename].test.tsx`
- Integration tests: `[filename].integration.test.ts`
- Place tests alongside source files or in `__tests__` directories

### Directory Structure
```
utils/
  date.ts
  date.test.ts          # Unit tests for date utilities
  streak.ts
  streak.test.ts        # Unit tests for streak calculations
database/
  habits.ts
  habits.test.ts        # Database operation tests
components/
  HabitCard/
    index.tsx
    HabitCard.test.tsx  # Component tests
```

### Test Organization
```typescript
describe('functionName', () => {
  describe('when condition', () => {
    it('should do expected behavior', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## Testing Utilities

### Test Data

Test fixtures are available in `data/test-data.ts`:

```typescript
import {
  TEST_HABITS,
  TEST_COMPLETIONS,
  TEST_REMINDERS,
  TEST_SETTINGS,
  TEST_DATA,
  generateSeedSQL
} from '@/data/test-data';
```

#### Available Test Data

| Export | Description |
|--------|-------------|
| `TEST_HABITS` | 10 sample habits covering all frequency types |
| `TEST_COMPLETIONS` | 2 weeks of completion records |
| `TEST_REMINDERS` | Reminder configurations for habits |
| `TEST_SETTINGS` | Default app settings |
| `generateSeedSQL()` | Generates SQL to seed database (dev only) |

#### Test Habit Examples
- **Daily habits**: Drink Water (8x), Morning Meditation (1x), Read (1x), Vitamins (2x)
- **Specific days**: Gym (Mon/Wed/Fri), Piano Practice (Tue/Thu/Sat)
- **Every N days**: Deep Clean (every 3 days), Laundry (every 5 days)
- **Weekly**: Exercise (3x/week), Call Family (2x/week)

### Helper Functions in Test Data

```typescript
// Date helpers (internal to test-data.ts but pattern to follow)
function getDate(daysAgo: number): string  // Returns YYYY-MM-DD
function getTimestamp(daysAgo: number, hour?: number): string  // Returns ISO timestamp
```

---

## What Should Be Tested

### High Priority - Utility Functions

#### `utils/date.ts`
| Function | Test Cases |
|----------|------------|
| `getLocalDate()` | Returns YYYY-MM-DD format |
| `getLocalDateTimeWithOffset()` | Includes timezone offset |
| `getWeekBounds()` | Handles Sunday/Monday week start, edge cases |
| `getDayOfWeek()` | Returns 0-6 correctly |
| `addDays()` / `subtractDays()` | Handles month/year boundaries |
| `daysBetween()` | Positive/negative differences, same day |
| `isSameDay()` | String and Date comparisons |
| `getDateRange()` | Inclusive range, single day |

#### `utils/habit-schedule.ts`
| Function | Test Cases |
|----------|------------|
| `isHabitScheduledForDate()` | All frequency types, edge cases |
| `getTargetForDate()` | Each frequency type returns correct target |
| `getWeeklyTarget()` | Weekly vs summed daily targets |
| `getNextScheduledDate()` | Finds next occurrence, handles no match |
| `isCompleted()` | Threshold comparisons |
| `getCompletionPercentage()` | Capped at 1, handles 0 target |

#### `utils/streak.ts`
| Function | Test Cases |
|----------|------------|
| `calculateStreak()` | Daily streaks with gaps |
| | Weekly streaks across weeks |
| | Skipped days don't break streak |
| | Today pending behavior |
| | Best streak tracking |

#### `utils/color.ts`
Test color manipulation functions for theme support.

#### `utils/export.ts`
Test data export formatting and file generation.

### Medium Priority - Database Operations

#### `database/habits.ts`
- Create habit with all frequency types
- Update habit fields
- Delete habit cascades to completions/reminders
- Get habits sorted by `sort_order`
- Reorder habits

#### `database/completions.ts`
- Create/update completion for date
- Get completions for date range
- Handle `allow_overload` constraint
- Unique constraint on (habit_id, date)

#### `database/reminders.ts`
- Create/update/delete reminders
- Toggle enabled state
- Get reminders for habit

#### `database/settings.ts`
- Get/set settings
- Default values
- Schema version tracking

### Lower Priority - Components

Test critical interactions, not visuals:

| Component | Test Cases |
|-----------|------------|
| `HabitCard` | Increment/decrement, tap to complete |
| `HabitForm` | Validation, frequency type switching |
| `ProgressGrid` | Date range calculation |

---

## Example Test Cases

### Date Utility Tests

```typescript
// utils/date.test.ts
import { getWeekBounds, addDays, daysBetween } from './date';

describe('getWeekBounds', () => {
  describe('with Monday week start', () => {
    it('should return Monday to Sunday for a Wednesday', () => {
      const result = getWeekBounds('2026-01-21', 1); // Wednesday
      expect(result).toEqual({
        startDate: '2026-01-19', // Monday
        endDate: '2026-01-25',   // Sunday
      });
    });

    it('should handle week start day being the same as input', () => {
      const result = getWeekBounds('2026-01-19', 1); // Monday
      expect(result.startDate).toBe('2026-01-19');
    });
  });

  describe('with Sunday week start', () => {
    it('should return Sunday to Saturday', () => {
      const result = getWeekBounds('2026-01-21', 0); // Wednesday
      expect(result).toEqual({
        startDate: '2026-01-18', // Sunday
        endDate: '2026-01-24',   // Saturday
      });
    });
  });
});

describe('daysBetween', () => {
  it('should return 0 for the same date', () => {
    expect(daysBetween('2026-01-15', '2026-01-15')).toBe(0);
  });

  it('should return positive when first date is after second', () => {
    expect(daysBetween('2026-01-15', '2026-01-10')).toBe(5);
  });

  it('should return negative when first date is before second', () => {
    expect(daysBetween('2026-01-10', '2026-01-15')).toBe(-5);
  });
});
```

### Habit Schedule Tests

```typescript
// utils/habit-schedule.test.ts
import { isHabitScheduledForDate, getTargetForDate } from './habit-schedule';
import { TEST_HABITS } from '@/data/test-data';

describe('isHabitScheduledForDate', () => {
  const dailyHabit = TEST_HABITS.find(h => h.frequency_type === 'daily')!;
  const specificDaysHabit = TEST_HABITS.find(h => h.frequency_type === 'specific_days')!;
  const everyNDaysHabit = TEST_HABITS.find(h => h.frequency_type === 'every_n_days')!;

  describe('daily habits', () => {
    it('should always return true', () => {
      expect(isHabitScheduledForDate(dailyHabit, '2026-01-15')).toBe(true);
      expect(isHabitScheduledForDate(dailyHabit, '2026-01-16')).toBe(true);
    });
  });

  describe('specific_days habits', () => {
    // Gym habit: Mon(1), Wed(3), Fri(5)
    it('should return true for scheduled days', () => {
      expect(isHabitScheduledForDate(specificDaysHabit, '2026-01-20')).toBe(true); // Monday
    });

    it('should return false for non-scheduled days', () => {
      expect(isHabitScheduledForDate(specificDaysHabit, '2026-01-21')).toBe(false); // Tuesday
    });
  });

  describe('every_n_days habits', () => {
    it('should return true on interval days from start', () => {
      // Deep Clean: every 3 days from 2026-01-01
      expect(isHabitScheduledForDate(everyNDaysHabit, '2026-01-01')).toBe(true); // Day 0
      expect(isHabitScheduledForDate(everyNDaysHabit, '2026-01-04')).toBe(true); // Day 3
    });

    it('should return false on non-interval days', () => {
      expect(isHabitScheduledForDate(everyNDaysHabit, '2026-01-02')).toBe(false);
    });
  });
});
```

### Streak Calculation Tests

```typescript
// utils/streak.test.ts
import { calculateStreak } from './streak';
import { TEST_HABITS } from '@/data/test-data';

describe('calculateStreak', () => {
  const dailyHabit = TEST_HABITS.find(h => h.name === 'Morning Meditation')!;

  it('should count consecutive completed days', () => {
    const completions = [
      { date: '2026-01-15', count: 1, skipped: 0 },
      { date: '2026-01-14', count: 1, skipped: 0 },
      { date: '2026-01-13', count: 1, skipped: 0 },
    ];

    const result = calculateStreak(dailyHabit, completions, '2026-01-15');
    expect(result.currentStreak).toBe(3);
  });

  it('should not break streak for skipped days', () => {
    const completions = [
      { date: '2026-01-15', count: 1, skipped: 0 },
      { date: '2026-01-14', count: 0, skipped: 1 }, // Skipped
      { date: '2026-01-13', count: 1, skipped: 0 },
    ];

    const result = calculateStreak(dailyHabit, completions, '2026-01-15');
    expect(result.currentStreak).toBe(2); // Skip doesn't add but doesn't break
  });

  it('should treat incomplete today as pending', () => {
    const completions = [
      // No completion for today (2026-01-15)
      { date: '2026-01-14', count: 1, skipped: 0 },
      { date: '2026-01-13', count: 1, skipped: 0 },
    ];

    const result = calculateStreak(dailyHabit, completions, '2026-01-15');
    expect(result.currentStreak).toBe(2); // Streak not broken by pending today
  });
});
```

---

## Manual Testing Checklist

Use these checklists when testing builds before release.

### Core Habit Flow

- [ ] **Create Habit**
  - [ ] Daily habit with target > 1
  - [ ] Specific days habit (select multiple days)
  - [ ] Every N days habit with reset behavior
  - [ ] Weekly habit
  - [ ] Verify color picker works
  - [ ] Verify icon selection works

- [ ] **Log Tab**
  - [ ] Tap to increment habit completion
  - [ ] Long press shows options menu
  - [ ] Swipe to navigate dates
  - [ ] Today button returns to current date
  - [ ] Habits show correct scheduled status per day
  - [ ] Completion ring fills progressively
  - [ ] "Completed" visual state at target

- [ ] **Edit Habit**
  - [ ] Navigate from long press menu
  - [ ] Change all fields and save
  - [ ] Delete habit with confirmation
  - [ ] Verify completions deleted with habit

- [ ] **Reorder Habits**
  - [ ] Long press and drag to reorder
  - [ ] Order persists after app restart

### Progress Tab

- [ ] **Yearly Grid View**
  - [ ] Shows last 364 days
  - [ ] Correct colors for completion levels
  - [ ] Tap cell shows date tooltip

- [ ] **Statistics**
  - [ ] Current streak accurate
  - [ ] Best streak accurate
  - [ ] Completion rate percentage correct

- [ ] **Filter by Habit**
  - [ ] Dropdown shows all habits
  - [ ] Grid updates when habit selected

### Settings Tab

- [ ] **Theme Settings**
  - [ ] Light/Dark/System options work
  - [ ] Theme persists after restart

- [ ] **Week Start Day**
  - [ ] Sunday/Monday options
  - [ ] Affects week boundaries in progress view

- [ ] **Notifications**
  - [ ] Permission request on first enable
  - [ ] Enable/disable per habit
  - [ ] Add/remove reminder times

- [ ] **Data Export**
  - [ ] JSON export includes all data
  - [ ] Share sheet opens with file

### Edge Cases

- [ ] **Offline Usage**
  - [ ] All features work without network
  - [ ] Data persists after force close

- [ ] **Date Boundary**
  - [ ] Midnight rollover handled correctly
  - [ ] Week boundary transitions

- [ ] **Large Data**
  - [ ] Performance with 10+ habits
  - [ ] Performance with 1 year of completions

### Platform-Specific

**iOS**
- [ ] Haptic feedback on increment
- [ ] Status bar style matches theme
- [ ] Safe area respected on notch devices

**Android**
- [ ] Back button behavior correct
- [ ] Navigation bar theming
- [ ] Works on various screen sizes

---

## Running Tests (Future)

Once tests are configured:

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- utils/date.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="getWeekBounds"
```

---

## Continuous Integration (Future)

Recommended GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: coverage/lcov.info
```
