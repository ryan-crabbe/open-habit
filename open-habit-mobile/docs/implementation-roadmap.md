# OpenHabit Implementation Roadmap

Epics, tasks, and subtasks for building the mobile app.

---

## Epic 0: Foundation & Infrastructure

Setup core architecture, database, and navigation shell.

### Task 0.1: Database Layer
- [x] **0.1.1** Create database initialization module
  - Initialize expo-sqlite connection
  - Run `PRAGMA foreign_keys = ON;` on connection
  - Implement schema version tracking
- [x] **0.1.2** Implement schema migration system
  - Create V1 schema (habits, habit_completions, habit_reminders, app_settings)
  - Add migration runner that executes on app startup
- [x] **0.1.3** Create database hooks/context
  - `useDatabase()` hook for accessing db connection
  - Database provider component wrapping app

### Task 0.2: Data Access Layer
- [x] **0.2.1** Habits CRUD operations
  - `getHabits()` - fetch all habits sorted by sort_order
  - `getHabitById(id)` - fetch single habit
  - `createHabit(habit)` - insert with validation
  - `updateHabit(id, habit)` - update with validation
  - `deleteHabit(id)` - cascade delete
  - `reorderHabits(ids)` - update sort_order
- [x] **0.2.2** Completions CRUD operations
  - `getCompletionsForDate(habitId, date)` - single day
  - `getCompletionsInRange(habitId, startDate, endDate)` - date range
  - `upsertCompletion(habitId, date, count, skipped, note)` - insert or update
  - `incrementCompletion(habitId, date)` - add 1 to count
  - `decrementCompletion(habitId, date)` - subtract 1 from count
- [x] **0.2.3** Reminders CRUD operations
  - `getRemindersForHabit(habitId)`
  - `createReminder(habitId, time)`
  - `updateReminder(id, time, enabled)`
  - `deleteReminder(id)`
- [x] **0.2.4** App settings operations
  - `getSetting(key)` - get single setting
  - `setSetting(key, value)` - upsert setting
  - `getAllSettings()` - fetch all as object

### Task 0.3: Date/Time Utilities
- [x] **0.3.1** Create date helper functions
  - `getLocalDate()` - returns YYYY-MM-DD
  - `getLocalDateTimeWithOffset()` - returns ISO with offset
  - `formatDisplayDate(date)` - "Mon Jan 12" format
  - `getWeekBounds(date, weekStartDay)` - week start/end dates
- [x] **0.3.2** Habit scheduling utilities
  - `isHabitScheduledForDate(habit, date)` - checks if habit is due
  - `getTargetForDate(habit, date)` - returns target count for day
  - `getNextScheduledDate(habit, fromDate)` - next occurrence

### Task 0.4: Navigation Shell
- [x] **0.4.1** Setup Expo Router tab navigation
  - Configure `app/(tabs)/_layout.tsx` with 3 tabs
  - Set tab icons and labels
  - Style tab bar appearance
- [x] **0.4.2** Create placeholder screens
  - `app/(tabs)/index.tsx` - Log tab (default)
  - `app/(tabs)/progress.tsx` - Progress tab
  - `app/(tabs)/settings.tsx` - Settings tab

### Task 0.5: Theming & Design System
- [x] **0.5.1** Define color palette
  - Primary colors
  - Success/completed green tones
  - Graph intensity gradient (4-5 levels)
  - Light/dark mode variants
- [x] **0.5.2** Create theme context
  - `useTheme()` hook
  - ThemeProvider component
  - Persist theme preference to app_settings
- [x] **0.5.3** Base component styles
  - Typography scale
  - Spacing constants
  - Card/container styles
  - Button styles

### Task 0.6: Test Data Seeding (Dev Only)
- [x] **0.6.1** Implement dev seed function
  - Use test-data.ts fixtures
  - Add dev-only button or startup flag
  - Clear existing data option

---

## Epic 1: Log Tab

Daily habit logging interface.

### Task 1.1: Today's Habits List
- [x] **1.1.1** Create habit card component
  - Display habit name and color indicator
  - Show target vs current count (e.g., "2/8")
  - Visual states: not started (○), in progress (●), completed (✓)
  - Style based on habit color
- [x] **1.1.2** Build habits list screen
  - Header with "Today's Habits" and current date
  - Fetch habits scheduled for today
  - Filter using `isHabitScheduledForDate()`
  - Sort by sort_order
  - Empty state when no habits scheduled
- [x] **1.1.3** Connect to database
  - Load habits on screen focus
  - Load today's completions
  - Real-time count display

### Task 1.2: Tap to Increment
- [x] **1.2.1** Implement tap gesture
  - Tap card to increment completion count
  - Call `incrementCompletion(habitId, today)`
  - Haptic feedback on tap
- [x] **1.2.2** Visual feedback on increment
  - Animate count change
  - Pulse/highlight effect on card
  - Transition to completed state when target met
- [x] **1.2.3** Handle multi-count habits
  - Show progress indicator (e.g., progress bar or fraction)
  - Different completed animation for multi-count

### Task 1.3: Long Press Actions
- [x] **1.3.1** Create action sheet/bottom sheet
  - "Skip today" option
  - "Add note" option
  - "Undo last" option (decrement)
  - "View details" option
- [x] **1.3.2** Implement skip functionality
  - Set `skipped = 1, count = 0`
  - Visual indicator for skipped habits
  - Confirm dialog before skipping
- [x] **1.3.3** Implement note functionality
  - Text input modal
  - Save note to completion record
  - Show note indicator on card if note exists

### Task 1.4: Completion States & Animations
- [x] **1.4.1** Define visual states
  - Not started: empty circle, muted colors
  - In progress: filled circle, show count
  - Completed: checkmark, success colors
  - Skipped: different icon, muted/strikethrough
- [x] **1.4.2** State transition animations
  - Smooth transitions between states
  - Celebration effect on completion (subtle)
  - Card reorder animation if needed

### Task 1.5: Pull to Refresh & Loading
- [x] **1.5.1** Implement pull to refresh
  - Refresh habits and completions
  - Loading indicator
- [-] **1.5.2** Loading skeleton
  - Skeleton cards while loading
  - Smooth transition to content

---

## Epic 2: Progress Tab

GitHub-style contribution graphs and streak visualization.

### Task 2.1: Contribution Graph Component
- [ ] **2.1.1** Build graph grid component
  - Render 52x7 grid for yearly view
  - Calculate cell positions
  - Handle scrolling for large grids
- [ ] **2.1.2** Implement intensity coloring
  - Map completion percentage to color intensity
  - Support `partial` vs `binary` display modes
  - Use habit's color with varying opacity/lightness
- [ ] **2.1.3** Add month/week labels
  - Month labels along top
  - Day labels along side (S M T W T F S)

### Task 2.2: View Modes
- [ ] **2.2.1** Yearly view (default)
  - 52 weeks x 7 days grid
  - Scroll horizontally through year
  - Current week highlighted
- [ ] **2.2.2** Monthly view
  - 4-5 weeks detailed view
  - Larger cells with count visible
  - Month navigation (prev/next)
- [ ] **2.2.3** Weekly view
  - 7 large cells with full details
  - Show completion count per day
  - Week navigation (prev/next)
- [ ] **2.2.4** View mode dropdown/selector
  - Picker in header
  - Persist selection per session

### Task 2.3: Weekly Habits Special View
- [ ] **2.3.1** Weeks-per-year grid
  - Each cell = 1 week
  - 52 cells per year
  - Aggregate weekly completions
- [ ] **2.3.2** Weekly progress calculation
  - Sum completions within week bounds
  - Use `week_start_day` setting
  - Compare to weekly target

### Task 2.4: Streak Calculation & Display
- [ ] **2.4.1** Implement streak calculator
  - Current streak (consecutive days/weeks meeting target)
  - Best streak (all-time maximum)
  - Handle different frequency types
- [ ] **2.4.2** Streak display component
  - "Current streak: X days" text
  - "Best: Y days" text
  - Optional streak badge/icon

### Task 2.5: Cell Tap Details
- [ ] **2.5.1** Create detail modal/tooltip
  - Show date
  - Show completion count vs target
  - Show note if exists
  - Quick actions (edit, add note)
- [ ] **2.5.2** Implement tap gesture on cells
  - Single tap to show details
  - Highlight selected cell

### Task 2.6: Progress List Screen
- [ ] **2.6.1** Build scrollable habit list
  - Each habit has its own graph section
  - Habit name header with color
  - Collapsible sections (optional)
- [ ] **2.6.2** Loading and performance
  - Lazy load graphs as user scrolls
  - Virtualized list for many habits
  - Cache computed graph data

---

## Epic 3: Settings Tab

Habit management and app configuration.

### Task 3.1: Settings Home Screen
- [x] **3.1.1** Build settings list layout
  - "HABITS" section header
  - "Create New Habit" button
  - "Manage Habits" row
  - "APP SETTINGS" section header
  - Settings rows (Notifications, Theme, Export)
- [x] **3.1.2** Navigation to sub-screens
  - Link to create habit screen
  - Link to manage habits screen
  - Link to individual settings screens

### Task 3.2: Create Habit Screen
- [x] **3.2.1** Form layout
  - Header with back button and Save button
  - Scrollable form content
- [x] **3.2.2** Habit name input
  - Text input with placeholder
  - Validation (required, non-empty)
- [x] **3.2.3** Frequency type selector
  - Radio button group
  - Options: Daily, Multiple times/day, Specific days, Every N days, Weekly
  - Show/hide conditional fields based on selection
- [x] **3.2.4** Conditional frequency fields
  - **Daily**: target_count input (default 1)
  - **Multiple times/day**: target_count input
  - **Specific days**: day picker (M T W T F S S), per-day target inputs
  - **Every N days**: interval input, missed behavior toggle (continue/reset), start date
  - **Weekly**: times per week input
- [x] **3.2.5** Color picker
  - Preset color swatches (6-8 colors)
  - Visual selection indicator
- [-] **3.2.6** Icon picker (optional)
  - Icon grid modal
  - Search/filter icons
  - Clear selection option
- [-] **3.2.7** Reminders section (deferred to Epic 4)
  - List of existing reminders
  - Add reminder button
  - Time picker for each reminder
  - Enable/disable toggle per reminder
  - Delete reminder button
- [x] **3.2.8** Save/validation logic
  - Validate all required fields
  - Run habit validation from data model
  - Insert habit to database
  - Navigate back on success
  - Show errors on failure

### Task 3.3: Edit Habit Screen
- [x] **3.3.1** Reuse create habit form
  - Pre-populate fields with existing data
  - Change header to "Edit Habit"
- [x] **3.3.2** Update logic
  - Update habit in database
  - Handle frequency type changes
- [x] **3.3.3** Delete habit option
  - Delete button (danger style)
  - Confirmation dialog
  - Cascade delete completions/reminders

### Task 3.4: Manage Habits Screen
- [x] **3.4.1** Habits list
  - Show all habits with name and color
  - Display frequency type summary
- [x] **3.4.2** Drag to reorder
  - Draggable list items
  - Update sort_order on drop
  - Visual drag handle
- [-] **3.4.3** Swipe to delete
  - Swipe left reveals delete button
  - Confirmation before delete
- [x] **3.4.4** Tap to edit
  - Navigate to edit habit screen

### Task 3.5: Theme Settings
- [ ] **3.5.1** Theme selector screen
  - Light/Dark toggle or radio
  - Preview of each theme
  - Save to app_settings
- [ ] **3.5.2** Apply theme app-wide
  - Update theme context on change
  - Persist across app restarts

### Task 3.6: Export Data
- [ ] **3.6.1** Export options screen
  - Export format selection (JSON, CSV)
  - Date range selection (optional)
- [ ] **3.6.2** Generate export file
  - Query all data from database
  - Format as JSON or CSV
  - Use expo-file-system and expo-sharing
- [ ] **3.6.3** Share/save export
  - Native share sheet
  - Update `last_export_date` setting

### Task 3.7: Week Start Day Setting
- [ ] **3.7.1** Add to settings screen
  - Picker: Sunday or Monday
  - Save to app_settings
- [ ] **3.7.2** Use in calculations
  - Weekly habit week bounds
  - Calendar displays

---

## Epic 4: Notifications & Reminders

Push notification integration for habit reminders.

### Task 4.1: Notification Setup
- [ ] **4.1.1** Configure expo-notifications
  - Request permissions on first launch
  - Handle permission denied gracefully
- [ ] **4.1.2** Register notification handlers
  - Foreground notification handling
  - Background notification handling
  - Notification tap to open app

### Task 4.2: Schedule Reminders
- [ ] **4.2.1** Create reminder scheduling logic
  - Schedule notification for each enabled reminder
  - Check if habit is scheduled for that day
  - Handle timezone correctly
- [ ] **4.2.2** Reschedule on changes
  - Update notifications when reminder edited
  - Cancel notifications when reminder deleted
  - Reschedule when habit frequency changes
- [ ] **4.2.3** Daily rescheduling
  - Reschedule upcoming week's notifications
  - Handle `every_n_days` dynamic scheduling

### Task 4.3: Notification Content
- [ ] **4.3.1** Notification text
  - Habit name in title
  - Encouraging message in body
  - Action buttons (optional): "Log" / "Skip"
- [ ] **4.3.2** Deep linking
  - Tap notification opens Log tab
  - Scroll to/highlight relevant habit

### Task 4.4: Notification Settings Screen
- [ ] **4.4.1** Global notification toggle
  - Enable/disable all notifications
  - Link to system settings if denied
- [ ] **4.4.2** Per-habit reminder management
  - Link to habit's reminders from settings
  - Quick enable/disable toggles

---

## Epic 5: Polish & Edge Cases

Refinements, edge cases, and quality of life.

### Task 5.1: Empty States
- [ ] **5.1.1** No habits created
  - Friendly message on Log tab
  - "Create your first habit" CTA
- [ ] **5.1.2** No habits scheduled today
  - "No habits due today" message
  - Option to view all habits
- [ ] **5.1.3** No progress data
  - Empty graph placeholder
  - "Start logging to see progress"

### Task 5.2: Error Handling
- [ ] **5.2.1** Database errors
  - Toast/alert on save failures
  - Retry logic where appropriate
- [ ] **5.2.2** Validation errors
  - Inline form validation messages
  - Highlight invalid fields

### Task 5.3: Performance Optimization
- [ ] **5.3.1** Query optimization
  - Index usage verification
  - Batch queries where possible
- [ ] **5.3.2** Render optimization
  - Memoize expensive computations
  - Virtualized lists
  - Lazy loading

### Task 5.4: Accessibility
- [ ] **5.4.1** Screen reader support
  - Accessible labels on all interactive elements
  - Announce state changes
- [ ] **5.4.2** Touch targets
  - Minimum 44x44pt touch targets
  - Adequate spacing between elements

### Task 5.5: Offline Support
- [ ] **5.5.1** Verify offline functionality
  - All features work without network
  - No network calls in core flows
- [ ] **5.5.2** Handle app backgrounding
  - Persist state correctly
  - Resume without data loss

---

## Implementation Order Recommendation

1. **Epic 0** - Foundation (required for everything)
2. **Epic 3.2** - Create Habit (need habits to log)
3. **Epic 1** - Log Tab (core daily interaction)
4. **Epic 3.4** - Manage Habits (edit/delete)
5. **Epic 2** - Progress Tab (visualization)
6. **Epic 3.5-3.7** - Remaining settings
7. **Epic 4** - Notifications
8. **Epic 5** - Polish

---

## Checklist Legend

- [ ] Not started
- [x] Completed
- [~] In progress
- [-] Blocked/deferred
