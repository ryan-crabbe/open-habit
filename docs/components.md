# OpenHabit Mobile UI Component Documentation

This document provides comprehensive documentation for all reusable UI components in the open-habit-mobile application.

## Table of Contents

1. [Themed Components](#themed-components)
   - [ThemedText](#themedtext)
   - [ThemedView](#themedview)
2. [Core UI Components](#core-ui-components)
   - [IconSymbol](#iconsymbol)
   - [Collapsible](#collapsible)
   - [ExternalLink](#externallink)
   - [HapticTab](#haptictab)
   - [ParallaxScrollView](#parallaxscrollview)
   - [HelloWave](#hellowave)
3. [Habit Form Components](#habit-form-components)
   - [FormSection](#formsection)
   - [HabitNameInput](#habitnameinput)
   - [FrequencyTypeSelector](#frequencytypeselector)
   - [ColorPicker](#colorpicker)
   - [DailyFrequencyConfig](#dailyfrequencyconfig)
   - [WeeklyFrequencyConfig](#weeklyfrequencyconfig)
   - [SpecificDaysConfig](#specificdaysconfig)
   - [EveryNDaysConfig](#everyndaysconfig)
   - [RemindersConfig](#remindersconfig)
4. [Progress/Visualization Components](#progressvisualization-components)
   - [ContributionGraph](#contributiongraph)
   - [SkiaContributionGraph](#skiacontributiongraph)
   - [GraphCell](#graphcell)
   - [WeekColumn](#weekcolumn)
   - [HabitProgressCard](#habitprogresscard)
   - [StreakDisplay](#streakdisplay)
   - [ViewModeSelector](#viewmodeselector)
   - [CellDetailModal](#celldetailmodal)
5. [Log Components](#log-components)
   - [HabitCard](#habitcard)
6. [Theme Constants](#theme-constants)
7. [Common UI Patterns](#common-ui-patterns)

---

## Themed Components

### ThemedText

A text component that automatically adapts to the current color scheme (light/dark mode).

**Location:** `/components/themed-text.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lightColor` | `string` | - | Custom color for light mode |
| `darkColor` | `string` | - | Custom color for dark mode |
| `type` | `'default' \| 'title' \| 'defaultSemiBold' \| 'subtitle' \| 'link'` | `'default'` | Text style variant |
| `...rest` | `TextProps` | - | All standard React Native Text props |

#### Type Styles

- **default**: `fontSize: 16, lineHeight: 24`
- **title**: `fontSize: 32, fontWeight: 'bold', lineHeight: 32`
- **defaultSemiBold**: `fontSize: 16, lineHeight: 24, fontWeight: '600'`
- **subtitle**: `fontSize: 20, fontWeight: 'bold'`
- **link**: `fontSize: 16, lineHeight: 30, color: '#0a7ea4'`

#### Example Usage

```tsx
import { ThemedText } from '@/components/themed-text';

// Basic usage
<ThemedText>Hello World</ThemedText>

// With type variant
<ThemedText type="title">Page Title</ThemedText>

// With custom colors
<ThemedText lightColor="#333" darkColor="#fff">
  Custom colored text
</ThemedText>

// Combined with style
<ThemedText type="subtitle" style={{ marginBottom: 16 }}>
  Section Header
</ThemedText>
```

---

### ThemedView

A View component that automatically applies theme-appropriate background colors.

**Location:** `/components/themed-view.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lightColor` | `string` | - | Custom background color for light mode |
| `darkColor` | `string` | - | Custom background color for dark mode |
| `...rest` | `ViewProps` | - | All standard React Native View props |

#### Example Usage

```tsx
import { ThemedView } from '@/components/themed-view';

// Basic usage - applies theme background
<ThemedView style={styles.container}>
  <ThemedText>Content here</ThemedText>
</ThemedView>

// With custom theme colors
<ThemedView
  lightColor="#f5f5f5"
  darkColor="#1a1a1a"
  style={styles.card}
>
  <ThemedText>Card content</ThemedText>
</ThemedView>
```

---

## Core UI Components

### IconSymbol

Platform-adaptive icon component that uses SF Symbols on iOS and Material Icons on Android/web.

**Location:** `/components/ui/icon-symbol.tsx` (Android/web), `/components/ui/icon-symbol.ios.tsx` (iOS)

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `IconSymbolName` | - | Icon name (SF Symbol format) |
| `size` | `number` | `24` | Icon size in pixels |
| `color` | `string \| OpaqueColorValue` | - | Icon color |
| `style` | `StyleProp<ViewStyle \| TextStyle>` | - | Custom styles |
| `weight` | `SymbolWeight` | `'regular'` | Icon weight (iOS only) |

#### Available Icons (mapped)

```typescript
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
};
```

#### Example Usage

```tsx
import { IconSymbol } from '@/components/ui/icon-symbol';

<IconSymbol
  name="house.fill"
  size={24}
  color="#4CAF50"
/>

<IconSymbol
  name="chevron.right"
  size={18}
  weight="medium"
  color={theme === 'light' ? '#687076' : '#9BA1A6'}
/>
```

---

### Collapsible

An expandable/collapsible section with animated chevron indicator.

**Location:** `/components/ui/collapsible.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Section title |
| `children` | `React.ReactNode` | - | Content to show when expanded |

#### Example Usage

```tsx
import { Collapsible } from '@/components/ui/collapsible';

<Collapsible title="Advanced Settings">
  <ThemedText>Hidden content here</ThemedText>
  <ThemedText>More settings...</ThemedText>
</Collapsible>
```

---

### ExternalLink

A link component that opens URLs in an in-app browser on native platforms.

**Location:** `/components/external-link.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `Href & string` | - | URL to open |
| `...rest` | `LinkProps` | - | All expo-router Link props |

#### Example Usage

```tsx
import { ExternalLink } from '@/components/external-link';

<ExternalLink href="https://example.com">
  Visit our website
</ExternalLink>
```

---

### HapticTab

A tab bar button that provides haptic feedback on iOS.

**Location:** `/components/haptic-tab.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `...props` | `BottomTabBarButtonProps` | - | All bottom tab bar button props |

#### Behavior

- On iOS: Triggers `ImpactFeedbackStyle.Light` haptic on press
- On other platforms: Standard press behavior

#### Example Usage

```tsx
import { HapticTab } from '@/components/haptic-tab';

// In tab navigator configuration
<Tab.Navigator
  screenOptions={{
    tabBarButton: (props) => <HapticTab {...props} />,
  }}
>
```

---

### ParallaxScrollView

A scroll view with a parallax header effect.

**Location:** `/components/parallax-scroll-view.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headerImage` | `ReactElement` | - | Image element to display in header |
| `headerBackgroundColor` | `{ dark: string; light: string }` | - | Background colors for header |
| `children` | `React.ReactNode` | - | Scroll content |

#### Constants

- `HEADER_HEIGHT`: 250px

#### Example Usage

```tsx
import ParallaxScrollView from '@/components/parallax-scroll-view';

<ParallaxScrollView
  headerImage={<Image source={require('./header.png')} />}
  headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
>
  <ThemedText type="title">Welcome</ThemedText>
  <ThemedText>Page content here...</ThemedText>
</ParallaxScrollView>
```

---

### HelloWave

An animated waving hand emoji component.

**Location:** `/components/hello-wave.tsx`

#### Props

None

#### Animation

- 4 iterations of a 300ms rotation animation (25 degrees)

#### Example Usage

```tsx
import { HelloWave } from '@/components/hello-wave';

<HelloWave />
```

---

## Habit Form Components

All habit form components are exported from `/components/habit-form/index.ts`.

### FormSection

A wrapper component for form fields with a label.

**Location:** `/components/habit-form/FormSection.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Section label text |
| `children` | `React.ReactNode` | - | Form field(s) |

#### Styling Notes

- Label: uppercase, small font, 60% opacity, letter-spacing 0.5
- Bottom margin: `Spacing.xl`

#### Example Usage

```tsx
import { FormSection } from '@/components/habit-form';

<FormSection label="Habit Name">
  <HabitNameInput value={name} onChange={setName} />
</FormSection>
```

---

### HabitNameInput

Text input for habit name with validation error display.

**Location:** `/components/habit-form/HabitNameInput.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current input value |
| `onChange` | `(value: string) => void` | - | Change handler |
| `error` | `string` | - | Error message to display |

#### Features

- Max length: 100 characters
- Auto-capitalize: sentences
- Auto-correct: disabled
- Error state: red border + error text

#### Example Usage

```tsx
import { HabitNameInput } from '@/components/habit-form';

<HabitNameInput
  value={habitName}
  onChange={setHabitName}
  error={errors.name}
/>
```

---

### FrequencyTypeSelector

Segmented control for selecting habit frequency type.

**Location:** `/components/habit-form/FrequencyTypeSelector.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `FrequencyType` | - | Currently selected type |
| `onChange` | `(type: FrequencyType) => void` | - | Change handler |

#### Frequency Options

- `daily` - "Daily"
- `weekly` - "Weekly"
- `specific_days` - "Specific Days"
- `every_n_days` - "Every N Days"

#### Example Usage

```tsx
import { FrequencyTypeSelector } from '@/components/habit-form';

<FrequencyTypeSelector
  value={frequencyType}
  onChange={setFrequencyType}
/>
```

---

### ColorPicker

Grid of preset color swatches for habit color selection.

**Location:** `/components/habit-form/ColorPicker.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Currently selected color (hex) |
| `onChange` | `(color: string) => void` | - | Change handler |

#### Available Colors

From `HabitColors` constant:
- Blue (#2196F3)
- Green (#4CAF50)
- Orange (#FF9800)
- Purple (#9C27B0)
- Pink (#E91E63)
- Cyan (#00BCD4)
- Deep Orange (#FF5722)
- Blue Grey (#607D8B)

#### Example Usage

```tsx
import { ColorPicker } from '@/components/habit-form';

<ColorPicker
  value={habitColor}
  onChange={setHabitColor}
/>
```

---

### DailyFrequencyConfig

Target count input for daily habits.

**Location:** `/components/habit-form/DailyFrequencyConfig.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetCount` | `number` | - | Current target count |
| `onChange` | `(count: number) => void` | - | Change handler |

#### Constraints

- Minimum: 1
- Maximum: 99

#### Example Usage

```tsx
import { DailyFrequencyConfig } from '@/components/habit-form';

<DailyFrequencyConfig
  targetCount={dailyTarget}
  onChange={setDailyTarget}
/>
```

---

### WeeklyFrequencyConfig

Target count input for weekly habits (times per week).

**Location:** `/components/habit-form/WeeklyFrequencyConfig.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetCount` | `number` | - | Current weekly target |
| `onChange` | `(count: number) => void` | - | Change handler |

#### Constraints

- Minimum: 1
- Maximum: 7

#### Example Usage

```tsx
import { WeeklyFrequencyConfig } from '@/components/habit-form';

<WeeklyFrequencyConfig
  targetCount={weeklyTarget}
  onChange={setWeeklyTarget}
/>
```

---

### SpecificDaysConfig

Day picker with per-day target inputs for specific_days habits.

**Location:** `/components/habit-form/SpecificDaysConfig.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `frequencyDays` | `Record<string, number>` | - | Map of day key to target count |
| `onChange` | `(days: Record<string, number>) => void` | - | Change handler |

#### Day Keys

- `'0'` - Sunday
- `'1'` - Monday
- `'2'` - Tuesday
- `'3'` - Wednesday
- `'4'` - Thursday
- `'5'` - Friday
- `'6'` - Saturday

#### Example Usage

```tsx
import { SpecificDaysConfig } from '@/components/habit-form';

// Default: Monday, Wednesday, Friday with 1 count each
<SpecificDaysConfig
  frequencyDays={{ '1': 1, '3': 1, '5': 1 }}
  onChange={setFrequencyDays}
/>
```

---

### EveryNDaysConfig

Configuration for every_n_days habits: interval, start date, missed behavior.

**Location:** `/components/habit-form/EveryNDaysConfig.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `interval` | `number` | - | Days between occurrences |
| `startDate` | `string` | - | Start date (YYYY-MM-DD) |
| `missedBehavior` | `MissedDayBehavior` | - | 'continue' or 'reset' |
| `targetCount` | `number` | - | Times per occurrence |
| `onIntervalChange` | `(n: number) => void` | - | Interval change handler |
| `onStartDateChange` | `(date: string) => void` | - | Date change handler |
| `onMissedBehaviorChange` | `(behavior: MissedDayBehavior) => void` | - | Behavior change handler |
| `onTargetCountChange` | `(count: number) => void` | - | Target count change handler |

#### Constraints

- Interval: 2-365 days
- Target count: 1-99

#### Example Usage

```tsx
import { EveryNDaysConfig } from '@/components/habit-form';

<EveryNDaysConfig
  interval={3}
  startDate="2024-01-01"
  missedBehavior="continue"
  targetCount={1}
  onIntervalChange={setInterval}
  onStartDateChange={setStartDate}
  onMissedBehaviorChange={setMissedBehavior}
  onTargetCountChange={setTargetCount}
/>
```

---

### RemindersConfig

Manages reminder times with add, edit, toggle, and delete functionality.

**Location:** `/components/habit-form/RemindersConfig.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `reminders` | `ReminderState[]` | - | Array of reminders |
| `onAdd` | `(time: string) => void` | - | Add reminder handler |
| `onUpdate` | `(index: number, time: string) => void` | - | Update reminder handler |
| `onToggle` | `(index: number) => void` | - | Toggle enabled state handler |
| `onRemove` | `(index: number) => void` | - | Remove reminder handler |

#### ReminderState Interface

```typescript
interface ReminderState {
  id?: number;
  time: string; // HH:MM format
  enabled: boolean;
}
```

#### Example Usage

```tsx
import { RemindersConfig, ReminderState } from '@/components/habit-form';

const [reminders, setReminders] = useState<ReminderState[]>([]);

<RemindersConfig
  reminders={reminders}
  onAdd={(time) => setReminders([...reminders, { time, enabled: true }])}
  onUpdate={(index, time) => {
    const updated = [...reminders];
    updated[index].time = time;
    setReminders(updated);
  }}
  onToggle={(index) => {
    const updated = [...reminders];
    updated[index].enabled = !updated[index].enabled;
    setReminders(updated);
  }}
  onRemove={(index) => {
    setReminders(reminders.filter((_, i) => i !== index));
  }}
/>
```

---

## Progress/Visualization Components

All progress components are exported from `/components/progress/index.ts`.

### ContributionGraph

GitHub-style contribution graph showing habit completion data over time.

**Location:** `/components/progress/ContributionGraph.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `habit` | `Habit` | - | The habit to display |
| `completions` | `HabitCompletion[]` | - | Array of completions for date range |
| `onCellPress` | `(date: string, completion?: HabitCompletion) => void` | - | Cell press callback |
| `selectedDate` | `string \| null` | - | Currently selected date |
| `today` | `string` | Current date | Today's date (YYYY-MM-DD) |
| `year` | `number` | - | Year to display (calendar year view) |
| `scrollViewRef` | `React.RefObject<ScrollView>` | - | Ref for programmatic scrolling |
| `viewMode` | `ViewMode` | `'year'` | View mode for time range |

#### Constants

- `DEFAULT_CELL_SIZE`: 11px
- `CELL_GAP`: 3px
- `DEFAULT_WEEKS_TO_SHOW`: 52

#### Example Usage

```tsx
import { ContributionGraph } from '@/components/progress';

<ContributionGraph
  habit={habit}
  completions={completions}
  onCellPress={(date, completion) => {
    console.log('Selected:', date, completion);
  }}
  selectedDate={selectedDate}
  year={2024}
  viewMode="year"
/>
```

---

### SkiaContributionGraph

High-performance contribution graph using Skia canvas rendering.

**Location:** `/components/progress/SkiaContributionGraph.tsx`

#### Props

Same as `ContributionGraph`.

#### Performance Notes

- Renders entire graph as a single canvas instead of 364+ React components
- Uses `@shopify/react-native-skia` for GPU-accelerated rendering
- Calculates cell press position from touch coordinates

#### Example Usage

```tsx
import { SkiaContributionGraph } from '@/components/progress';

<SkiaContributionGraph
  habit={habit}
  completions={completions}
  onCellPress={handleCellPress}
  viewMode="6months"
/>
```

---

### GraphCell

Individual cell in a contribution graph.

**Location:** `/components/progress/GraphCell.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `date` | `string` | - | Date this cell represents (YYYY-MM-DD) |
| `percentage` | `number` | - | Completion percentage (0-1) |
| `habitColor` | `string` | - | Habit's color (hex) |
| `colorScheme` | `'light' \| 'dark'` | - | Color scheme for intensity |
| `selectionBorderColor` | `string` | - | Border color for selected state |
| `isSelected` | `boolean` | `false` | Whether cell is selected |
| `onPress` | `(date: string) => void` | - | Press callback |
| `size` | `number` | `11` | Cell size in pixels |

#### Performance Notes

- `colorScheme` and `selectionBorderColor` passed as props to avoid hook calls in each of 364+ cells

#### Example Usage

```tsx
import { GraphCell } from '@/components/progress';

<GraphCell
  date="2024-01-15"
  percentage={0.75}
  habitColor="#4CAF50"
  colorScheme="light"
  selectionBorderColor="#333"
  isSelected={false}
  onPress={handleCellPress}
  size={11}
/>
```

---

### WeekColumn

Renders a single week (7 days) as one component with shared touch handling.

**Location:** `/components/progress/WeekColumn.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `weekData` | `CellData[]` | - | Array of 7 cell data objects |
| `cellSize` | `number` | - | Cell size in pixels |
| `cellGap` | `number` | - | Gap between cells |
| `habitColor` | `string` | - | Habit's color (hex) |
| `colorScheme` | `'light' \| 'dark'` | - | Color scheme |
| `selectionBorderColor` | `string` | - | Border color for selected state |
| `selectedDate` | `string \| null` | - | Currently selected date |
| `onCellPress` | `(date: string) => void` | - | Cell press callback |

#### CellData Interface

```typescript
interface CellData {
  date: string;
  percentage: number;
}
```

---

### HabitProgressCard

Card showing a habit's contribution graph and streak information.

**Location:** `/components/progress/HabitProgressCard.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `habit` | `Habit` | - | The habit to display |
| `completions` | `HabitCompletion[]` | - | Completion records |
| `streak` | `StreakResult` | - | Pre-computed streak data |

#### Features

- Year navigation (prev/next arrows)
- View mode selector (Year, 6 Mo, Month, Week)
- Auto-scroll to current week
- Cell detail modal on tap
- Streak display (current/best)

#### Example Usage

```tsx
import { HabitProgressCard } from '@/components/progress';

<HabitProgressCard
  habit={habit}
  completions={completions}
  streak={calculatedStreak}
/>
```

---

### StreakDisplay

Shows current and best streak for a habit.

**Location:** `/components/progress/StreakDisplay.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `streak` | `StreakResult` | - | Streak data to display |
| `habitColor` | `string` | - | Habit color for styling |

#### StreakResult Interface

```typescript
interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  unit: 'days' | 'weeks';
}
```

#### Example Usage

```tsx
import { StreakDisplay } from '@/components/progress';

<StreakDisplay
  streak={{ currentStreak: 7, bestStreak: 21, unit: 'days' }}
  habitColor="#4CAF50"
/>
```

---

### ViewModeSelector

Segmented control for switching between graph view modes.

**Location:** `/components/progress/ViewModeSelector.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `ViewMode` | - | Currently selected mode |
| `onChange` | `(mode: ViewMode) => void` | - | Change handler |

#### View Modes

```typescript
type ViewMode = 'year' | '6months' | 'month' | 'week';

const VIEW_MODE_CONFIG = {
  year: { weeks: 52, cellSize: 11, label: 'Year' },
  '6months': { weeks: 26, cellSize: 14, label: '6 Mo' },
  month: { weeks: 5, cellSize: 24, label: 'Month' },
  week: { weeks: 1, cellSize: 40, label: 'Week' },
};
```

#### Example Usage

```tsx
import { ViewModeSelector, ViewMode } from '@/components/progress';

const [viewMode, setViewMode] = useState<ViewMode>('year');

<ViewModeSelector value={viewMode} onChange={setViewMode} />
```

---

### CellDetailModal

Modal showing details for a selected contribution graph cell.

**Location:** `/components/progress/CellDetailModal.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Whether modal is visible |
| `date` | `string \| null` | - | Selected date |
| `habit` | `Habit` | - | The habit |
| `completion` | `HabitCompletion \| undefined` | - | Completion record |
| `onClose` | `() => void` | - | Close callback |

#### Displays

- Date and habit color indicator
- Status (Completed, In Progress, Not Started, Skipped)
- Progress (count / target)
- Note (if present)

#### Example Usage

```tsx
import { CellDetailModal } from '@/components/progress';

<CellDetailModal
  visible={selectedDate !== null}
  date={selectedDate}
  habit={habit}
  completion={selectedCompletion}
  onClose={() => setSelectedDate(null)}
/>
```

---

## Log Components

### HabitCard

Displays a single habit with completion state and tap-to-increment functionality.

**Location:** `/components/log/HabitCard.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `habit` | `Habit` | - | Habit to display |
| `completion` | `HabitCompletion \| null` | - | Current completion record |
| `targetCount` | `number` | - | Target count for today |
| `onTap` | `() => void` | - | Tap handler (increment) |
| `onLongPress` | `() => void` | - | Long press handler (menu) |
| `onUndo` | `() => void` | - | Undo handler (decrement) |

#### CompletionState Type

```typescript
type CompletionState = 'not_started' | 'in_progress' | 'completed' | 'skipped';
```

#### Features

- Animated scale on press
- Haptic feedback
- Progress bar for multi-count habits
- Color indicator strip
- State-based icons and colors
- Undo button when count > 0
- Note indicator icon

#### State Icons

- `not_started`: circle
- `in_progress`: circle.lefthalf.filled
- `completed`: checkmark.circle.fill
- `skipped`: minus.circle.fill

#### Example Usage

```tsx
import { HabitCard } from '@/components/log';

<HabitCard
  habit={habit}
  completion={todayCompletion}
  targetCount={getTargetForToday(habit)}
  onTap={() => incrementCompletion(habit.id)}
  onLongPress={() => openHabitMenu(habit)}
  onUndo={() => decrementCompletion(habit.id)}
/>
```

---

## Theme Constants

All theme values are defined in `/constants/theme.ts`.

### Colors

```typescript
Colors.light / Colors.dark
├── text              // Primary text
├── textSecondary     // Secondary/muted text
├── background        // Main background
├── backgroundSecondary // Cards, inputs
├── tint              // Primary action color (green)
├── icon              // Icon color
├── tabIconDefault    // Inactive tab icon
├── tabIconSelected   // Active tab icon
├── success / successLight
├── warning / warningLight
├── error / errorLight
├── card              // Card background
├── cardBorder        // Card border
├── border            // General borders
├── borderSecondary   // Secondary borders
├── modalOverlay      // Modal backdrop
├── buttonText        // Button text
├── link              // Link text
├── habitNotStarted   // Habit state color
├── habitInProgress   // Habit state color
├── habitCompleted    // Habit state color
└── habitSkipped      // Habit state color
```

### GraphIntensity

```typescript
GraphIntensity.light / GraphIntensity.dark
├── empty   // 0% completion
├── level1  // <25%
├── level2  // <50%
├── level3  // <75%
└── level4  // >=75%
```

### HabitColors

8 preset colors for habit customization.

### FontSizes

```typescript
{ xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 }
```

### Spacing

```typescript
{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }
```

### BorderRadius

```typescript
{ sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }
```

### Shadows

```typescript
Shadows.light / Shadows.dark
├── sm  // Subtle shadow
├── md  // Medium shadow
└── lg  // Large shadow
```

---

## Common UI Patterns

### 1. Stepper Controls

Used in frequency configurations for numeric inputs:

```tsx
<View style={styles.stepper}>
  <TouchableOpacity onPress={decrement} disabled={value <= min}>
    <IconSymbol name="minus" size={20} color={iconColor} />
  </TouchableOpacity>
  <ThemedText style={styles.countText}>{value}</ThemedText>
  <TouchableOpacity onPress={increment} disabled={value >= max}>
    <IconSymbol name="plus" size={20} color={iconColor} />
  </TouchableOpacity>
</View>
```

### 2. Segmented Controls

Used for option selection (frequency type, view mode):

```tsx
<View style={[styles.container, { backgroundColor }]}>
  {options.map((option) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.option,
        isSelected && { backgroundColor: tintColor },
      ]}
      onPress={() => onChange(option.value)}
    >
      <ThemedText style={{ color: isSelected ? '#fff' : textColor }}>
        {option.label}
      </ThemedText>
    </TouchableOpacity>
  ))}
</View>
```

### 3. Themed Cards

Pattern for themed card components:

```tsx
<ThemedView
  style={[
    styles.card,
    { backgroundColor: cardBackground },
    Shadows[colorScheme].sm,
  ]}
>
  {children}
</ThemedView>
```

### 4. Color Indicator Pattern

Visual indicator for habit color:

```tsx
<View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
```

### 5. Modal Pattern

Standard modal with overlay tap-to-dismiss:

```tsx
<Modal visible={visible} transparent animationType="fade">
  <TouchableWithoutFeedback onPress={onClose}>
    <View style={styles.overlay}>
      <TouchableWithoutFeedback>
        <ThemedView style={styles.modal}>
          {/* Modal content */}
        </ThemedView>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
```

### 6. Haptic Feedback

Using expo-haptics for tactile feedback:

```tsx
import * as Haptics from 'expo-haptics';

// Light feedback for normal actions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium feedback for completion
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy feedback for important actions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

### 7. Animated Press Feedback

Using Animated API for press feedback:

```tsx
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.97,
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    useNativeDriver: true,
  }).start();
};

<Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
    {children}
  </Animated.View>
</Pressable>
```

### 8. Memoized Components

Pattern for performance-optimized components:

```tsx
function MyComponentBase({ prop1, prop2 }: Props) {
  // Component logic
}

export const MyComponent = memo(MyComponentBase);
```

### 9. useThemeColor Hook Usage

Getting theme-aware colors:

```tsx
const backgroundColor = useThemeColor({}, 'background');
const textColor = useThemeColor({ light: '#333', dark: '#fff' }, 'text');
```

### 10. Platform-Specific Rendering

Handling platform differences:

```tsx
import { Platform } from 'react-native';

// iOS-specific date picker display
display={Platform.OS === 'ios' ? 'spinner' : 'default'}

// Environment check
if (process.env.EXPO_OS === 'ios') {
  // iOS-specific logic
}
```

---

## Import Patterns

### Themed Components

```tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
```

### UI Components

```tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Collapsible } from '@/components/ui/collapsible';
```

### Habit Form (barrel export)

```tsx
import {
  FormSection,
  HabitNameInput,
  FrequencyTypeSelector,
  ColorPicker,
  DailyFrequencyConfig,
  WeeklyFrequencyConfig,
  SpecificDaysConfig,
  EveryNDaysConfig,
  RemindersConfig,
  ReminderState,
} from '@/components/habit-form';
```

### Progress Components (barrel export)

```tsx
import {
  ContributionGraph,
  SkiaContributionGraph,
  GraphCell,
  WeekColumn,
  HabitProgressCard,
  StreakDisplay,
  ViewModeSelector,
  VIEW_MODE_CONFIG,
  ViewMode,
  CellDetailModal,
} from '@/components/progress';
```

### Log Components (barrel export)

```tsx
import { HabitCard, CompletionState } from '@/components/log';
```

### Theme Constants

```tsx
import {
  Colors,
  GraphIntensity,
  HabitColors,
  FontSizes,
  Spacing,
  BorderRadius,
  Shadows,
  getGraphIntensityColor,
} from '@/constants/theme';
```

---

*Last updated: January 2026*
