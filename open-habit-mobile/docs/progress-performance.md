# Progress Tab Performance Optimization Plan

## Problem Statement
The Progress tab takes too long to load and blocks the entire UI (can't click other tabs) while loading.

## Root Causes Identified

1. **Main thread blocking**: Synchronous computations in useMemo during render
2. **Excessive data**: Loading 3 years of completions for all habits upfront
3. **N+1 queries**: One query per habit instead of batched
4. **Hot path JSON parsing**: `frequency_days` parsed repeatedly per cell
5. **No virtualization**: 364 cells rendered immediately per habit

---

## Phase 1: Fix UI Blocking (Critical)

### 1.1 Use InteractionManager for Deferred Loading
**File:** `app/(tabs)/progress.tsx`

```typescript
import { InteractionManager } from 'react-native';

useFocusEffect(
  useCallback(() => {
    let isMounted = true;

    // Wait for navigation animation to complete
    const task = InteractionManager.runAfterInteractions(async () => {
      if (!isReady || !isMounted) return;
      setIsLoading(true);
      await loadData();
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      task.cancel();
    };
  }, [isReady, loadData])
);
```

### 1.2 Progressive Habit Loading
**File:** `app/(tabs)/progress.tsx`

Load habits one at a time with yielding:

```typescript
const loadData = useCallback(async () => {
  if (!db) return;

  const habits = await getHabits(db);
  const endDate = getLocalDate();
  const startDate = `${new Date().getFullYear()}-01-01`; // Current year only

  // Load progressively, yielding between each habit
  for (const habit of habits) {
    await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop
    const completions = await getCompletionsInRange(db, habit.id, startDate, endDate);
    setHabitsWithCompletions(prev => [...prev, { habit, completions }]);
  }
}, [db]);
```

### 1.3 Move Streak Calculation Out of Render
**File:** `app/(tabs)/progress.tsx`

Pre-compute streaks during data load, not during render:

```typescript
interface HabitWithCompletions {
  habit: Habit;
  completions: HabitCompletion[];
  streak: StreakInfo; // Pre-computed
}

// During load:
const streak = calculateStreak(habit, completions);
return { habit, completions, streak };
```

**File:** `components/progress/HabitProgressCard.tsx`

Remove useMemo streak calculation, receive as prop:

```typescript
interface HabitProgressCardProps {
  habit: Habit;
  completions: HabitCompletion[];
  streak: StreakInfo; // Pre-computed
}
```

---

## Phase 2: Reduce Data Volume

### 2.1 Load Current Year Only by Default
**File:** `app/(tabs)/progress.tsx`

Change from 3 years to current year:

```typescript
// Before: loads 3 years
const startDate = `${currentYear - 2}-01-01`;

// After: load current year only
const startDate = `${currentYear}-01-01`;
```

### 2.2 Batch Database Query (Remove N+1)
**File:** `database/completions.ts`

Add new function to get all completions in date range:

```typescript
export async function getAllCompletionsInRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  return await db.getAllAsync<HabitCompletion>(
    `SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY habit_id, date ASC`,
    [startDate, endDate]
  );
}
```

**File:** `app/(tabs)/progress.tsx`

Use single query and group by habit:

```typescript
const allCompletions = await getAllCompletionsInRange(db, startDate, endDate);

// Group by habit_id
const completionsByHabit = new Map<number, HabitCompletion[]>();
allCompletions.forEach(c => {
  const list = completionsByHabit.get(c.habit_id) || [];
  list.push(c);
  completionsByHabit.set(c.habit_id, list);
});
```

### 2.3 Lazy Load Previous Years
**File:** `components/progress/HabitProgressCard.tsx`

Only fetch additional year data when user navigates:

```typescript
const handlePrevYear = useCallback(async () => {
  const newYear = selectedYear - 1;
  // Check if we need to load this year's data
  if (!loadedYears.has(newYear)) {
    onRequestYearData?.(newYear); // Callback to parent
  }
  setSelectedYear(newYear);
}, [selectedYear, loadedYears, onRequestYearData]);
```

---

## Phase 3: Optimize Hot Paths

### 3.1 Cache Parsed frequency_days on Habit
**File:** `database/habits.ts`

Add parsed field to Habit type and parse once:

```typescript
export interface Habit {
  // ... existing
  _parsedFrequencyDays?: Record<string, number> | number[];
}

export function getParsedFrequencyDays(habit: Habit) {
  if (!habit._parsedFrequencyDays) {
    habit._parsedFrequencyDays = JSON.parse(habit.frequency_days);
  }
  return habit._parsedFrequencyDays;
}
```

**File:** `utils/habit-schedule.ts`

Use cached version:

```typescript
// Before
const days = JSON.parse(habit.frequency_days);

// After
const days = getParsedFrequencyDays(habit);
```

### 3.2 Memoize Color Calculations
**File:** `utils/color.ts`

Add caching for getHabitIntensityColor:

```typescript
const colorCache = new Map<string, string>();

export function getHabitIntensityColor(
  percentage: number,
  habitColor: string,
  colorScheme: 'light' | 'dark'
): string {
  const key = `${percentage.toFixed(2)}-${habitColor}-${colorScheme}`;

  if (colorCache.has(key)) {
    return colorCache.get(key)!;
  }

  const result = calculateColor(percentage, habitColor, colorScheme);
  colorCache.set(key, result);
  return result;
}
```

### 3.3 Pre-compute Cell Data Outside Render
**File:** `components/progress/ContributionGraph.tsx`

Generate all cell data once during data load, not during render:

```typescript
// Move weeks generation to parent and pass as prop
interface ContributionGraphProps {
  weeks: CellData[][]; // Pre-computed
  // ... rest
}
```

---

## Phase 4: FlatList & Virtualization

### 4.1 Add FlatList Optimization Props
**File:** `app/(tabs)/progress.tsx`

```typescript
<FlatList
  data={habitsWithCompletions}
  renderItem={renderHabitCard}
  keyExtractor={keyExtractor}
  contentContainerStyle={styles.listContent}
  showsVerticalScrollIndicator={false}
  // ADD THESE:
  windowSize={5}
  maxToRenderPerBatch={3}
  updateCellsBatchingPeriod={100}
  removeClippedSubviews={true}
  initialNumToRender={3}
  getItemLayout={(data, index) => ({
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index + Spacing.lg,
    index,
  })}
  refreshControl={...}
/>
```

### 4.2 Estimate Card Height
**File:** `app/(tabs)/progress.tsx`

Add constant for card height estimation:

```typescript
// Approximate height based on view mode
const CARD_HEIGHT = 280; // Header + selector + year nav + graph + streak
```

---

## Implementation Order

1. **Phase 1.1** - InteractionManager (immediate UI improvement)
2. **Phase 2.1** - Current year only (reduce data 3x)
3. **Phase 2.2** - Batch query (reduce queries from N+1 to 2)
4. **Phase 1.3** - Move streak out of render (remove render blocking)
5. **Phase 3.1** - Cache frequency_days (reduce JSON parsing)
6. **Phase 4.1** - FlatList props (improve scroll perf)
7. **Phase 1.2** - Progressive loading (smoother UX)
8. **Phase 3.2** - Color caching (micro-optimization)
9. **Phase 2.3** - Lazy load years (on-demand data)

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Initial load time | 2-5s (blocking) | <500ms (non-blocking) |
| Data loaded | 3 years × N habits | 1 year, batched |
| DB queries | N+1 | 2 |
| JSON parses per render | 728+ | 0 (cached) |
| UI responsiveness | Frozen | Smooth |

---

## Files to Modify

```
app/(tabs)/progress.tsx           # Loading, FlatList, InteractionManager
components/progress/HabitProgressCard.tsx  # Remove streak useMemo, receive as prop
database/completions.ts           # Add batch query function
database/habits.ts                # Add parsed frequency cache
utils/habit-schedule.ts           # Use cached frequency
utils/color.ts                    # Add color caching
```
