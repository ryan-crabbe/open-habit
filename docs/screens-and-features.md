# OpenHabit Mobile - Screens and Features Documentation

This document provides a comprehensive overview of all screens, features, and user flows in the OpenHabit mobile application.

---

## Table of Contents

1. [App Overview](#app-overview)
2. [Navigation Structure](#navigation-structure)
3. [Tab Screens](#tab-screens)
   - [Log Tab (Today's Habits)](#log-tab-todays-habits)
   - [Progress Tab](#progress-tab)
   - [Habits Tab](#habits-tab)
4. [Modal Screens](#modal-screens)
   - [Create Habit](#create-habit-screen)
   - [Edit Habit](#edit-habit-screen)
5. [Settings Screens](#settings-screens)
   - [App Settings](#app-settings-screen)
   - [Theme Settings](#theme-settings-screen)
   - [Notification Settings](#notification-settings-screen)
   - [Week Start Settings](#week-start-settings-screen)
   - [Export Data](#export-data-screen)
6. [User Flows](#user-flows)
7. [Feature List](#feature-list)

---

## App Overview

OpenHabit is a local-first habit tracking mobile application built with React Native and Expo. It stores all data locally using SQLite, prioritizing user privacy with no cloud sync or account requirements.

### Core Philosophy

- **Local-first**: All data stays on the device
- **Privacy-focused**: No accounts, no cloud sync, no tracking
- **Minimal and focused**: Simple interface for daily habit logging

---

## Navigation Structure

The app uses a bottom tab navigation with three primary tabs, plus additional screens accessible via card-style navigation.

```
+--------------------------------------------------+
|                    Header                         |
|  [Screen Title]                      [Settings]   |
+--------------------------------------------------+
|                                                   |
|                 Screen Content                    |
|                                                   |
|                                                   |
+--------------------------------------------------+
|   [Log]        [Progress]        [Habits]        |
|    (o)            (o)              (o)           |
+--------------------------------------------------+
```

### Tab Bar Icons

| Tab | Icon | Purpose |
|-----|------|---------|
| Log | checkmark.circle.fill | Daily habit logging |
| Progress | chart.bar.fill | Progress visualization |
| Habits | square.grid.2x2.fill | Habit management |

### Settings Access

A gear icon (gearshape.fill) in the header right provides access to app settings from any tab.

---

## Tab Screens

### Log Tab (Today's Habits)

**File:** `open-habit-mobile/app/(tabs)/index.tsx`

The main screen for daily habit tracking. Shows habits scheduled for today and allows users to log completions with a tap.

#### Screen Layout

```
+--------------------------------------------------+
|  Today's Habits                    [Date: Jan 18] |
+--------------------------------------------------+
|                                                   |
|  +----------------------------------------------+ |
|  | [o] Habit Name                    1/3   [<-] | |
|  | ====================================-------- | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  | [x] Completed Habit                    [<-]  | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  | [-] Skipped Habit                            | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

#### Features

1. **Habit Cards**
   - Color indicator on left edge (habit's assigned color)
   - Status icon showing completion state:
     - Empty circle: Not started
     - Half-filled circle: In progress
     - Checkmark circle: Completed
     - Minus circle: Skipped
   - Progress counter for multi-count habits (e.g., "2/5")
   - Progress bar for habits with target_count > 1
   - Note indicator icon when a note is attached
   - Quick undo button (arrow) when count > 0

2. **Tap Interactions**
   - **Single tap**: Increment completion count
   - **Long press**: Open action sheet with more options

3. **Action Sheet (Long Press)**
   - **Undo Last**: Decrement the completion count
   - **Skip Today**: Mark habit as skipped for the day
   - **Add/Edit Note**: Attach a note to today's completion

4. **Note Modal**
   - Multiline text input for adding context to a completion
   - Save and Cancel buttons

5. **Empty States**
   - No habits created: Shows "No habits yet" with a "Create Habit" button
   - All habits done: Shows "All done for today!" message

6. **Pull to Refresh**
   - Swipe down to reload habit data

7. **Midnight Crossover Handling**
   - Automatically updates the date when the screen gains focus

#### Completion States

| State | Visual | Description |
|-------|--------|-------------|
| not_started | Empty circle | count = 0, not skipped |
| in_progress | Half circle | 0 < count < target |
| completed | Checkmark | count >= target |
| skipped | Minus circle | Marked as skipped |

---

### Progress Tab

**File:** `open-habit-mobile/app/(tabs)/progress.tsx`

Displays GitHub-style contribution graphs and streak information for each habit.

#### Screen Layout

```
+--------------------------------------------------+
|  Progress                            [Settings]   |
+--------------------------------------------------+
|                                                   |
|  +----------------------------------------------+ |
|  | [*] Habit Name                               | |
|  |  [Year] [Month] [3 Months]                   | |
|  |        < 2025 >                              | |
|  |  S                                           | |
|  |  M  [][][][][][][][][][][][][][][]...       | |
|  |  T                                           | |
|  |  W  Jan   Feb   Mar   Apr ...                | |
|  |  T                                           | |
|  |  F                                           | |
|  |  S                                           | |
|  |                                              | |
|  |  Current Streak: 15 days                     | |
|  |  Longest Streak: 42 days                     | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

#### Features

1. **Habit Progress Cards**
   - Header with habit color indicator and name
   - View mode selector: Year / Month / 3 Months
   - Year navigation (for year view mode)
   - Contribution graph (Skia-rendered for performance)
   - Streak display (current and longest)

2. **Contribution Graph**
   - GitHub-style heatmap visualization
   - Day-of-week labels (S, M, T, W, T, F, S)
   - Month labels
   - Color intensity based on completion percentage
   - Tappable cells for detail view
   - Horizontal scrolling for year view

3. **View Modes**
   - **Year**: Full calendar year (Jan 1 - Dec 31)
   - **Month**: Rolling 4-week view
   - **3 Months**: Rolling 13-week view

4. **Cell Detail Modal**
   - Shows date and completion details when a cell is tapped

5. **Streak Display**
   - Current streak count with flame icon
   - Longest streak count with trophy icon

6. **Performance Optimizations**
   - Skia canvas rendering for smooth scrolling
   - Lazy loading with FlatList virtualization
   - Pre-computed streaks during data load
   - `react-freeze` to pause rendering when tab is not focused

---

### Habits Tab

**File:** `open-habit-mobile/app/(tabs)/habits.tsx`

Displays all habits with drag-to-reorder functionality and quick access to create or edit habits.

#### Screen Layout

```
+--------------------------------------------------+
|  Habits                              [Settings]   |
+--------------------------------------------------+
|                                                   |
|  +----------------------------------------------+ |
|  |  + Create New Habit                          | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  | [|] Habit Name                          [=]  | |
|  |     Daily                                    | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  | [|] Another Habit                       [=]  | |
|  |     3x per week                              | |
|  +----------------------------------------------+ |
|                                                   |
|  Long press and drag to reorder                  |
+--------------------------------------------------+
```

#### Features

1. **Create New Habit Button**
   - Prominent button at the top of the list
   - Navigates to create habit screen

2. **Habit List Items**
   - Color indicator strip on left
   - Habit name
   - Frequency description (e.g., "Daily", "3x per week", "Every 2 days")
   - Drag handle icon on right

3. **Drag to Reorder**
   - Long press (150ms) to initiate drag
   - Visual feedback with scale animation
   - Order persisted to database

4. **Tap to Edit**
   - Tapping a habit opens the edit screen

5. **Empty State**
   - Shows "No habits yet" with icon and create button

#### Frequency Labels

| Frequency Type | Display Format |
|---------------|----------------|
| daily (1x) | "Daily" |
| daily (Nx) | "Nx daily" |
| weekly (1x) | "Weekly" |
| weekly (Nx) | "Nx per week" |
| specific_days | "N days/week" |
| every_n_days | "Every N days" |

---

## Modal Screens

### Create Habit Screen

**File:** `open-habit-mobile/app/create-habit.tsx`

Full-screen form for creating a new habit with comprehensive configuration options.

#### Screen Layout

```
+--------------------------------------------------+
|  Cancel        Create Habit              Save     |
+--------------------------------------------------+
|                                                   |
|  NAME                                             |
|  +----------------------------------------------+ |
|  | [Text input: habit name]                     | |
|  +----------------------------------------------+ |
|                                                   |
|  FREQUENCY                                        |
|  +----------------------------------------------+ |
|  | [Daily] [Weekly] [Specific Days] [Every N]   | |
|  +----------------------------------------------+ |
|                                                   |
|  [Frequency-specific configuration]               |
|                                                   |
|  COLOR                                            |
|  +----------------------------------------------+ |
|  | [*] [*] [*] [*] [*] [*] [*] [*]             | |
|  +----------------------------------------------+ |
|                                                   |
|  OPTIONS                                          |
|  +----------------------------------------------+ |
|  | Allow exceeding target              [toggle] | |
|  +----------------------------------------------+ |
|                                                   |
|  REMINDERS                                        |
|  +----------------------------------------------+ |
|  | + Add Reminder                               | |
|  | 9:00 AM                          [x]         | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

#### Form Sections

1. **Name Input**
   - Required field
   - Text input with placeholder

2. **Frequency Type Selector**
   - Segmented control with 4 options:
     - **Daily**: Complete N times every day
     - **Weekly**: Complete N times per week (any days)
     - **Specific Days**: Choose specific weekdays with individual targets
     - **Every N Days**: Repeating interval (e.g., every 2 days)

3. **Frequency Configuration** (varies by type)

   **Daily:**
   - Target count stepper (1-99)

   **Weekly:**
   - Target count stepper (1-7)

   **Specific Days:**
   - Day picker (Sun-Sat checkboxes)
   - Per-day target count

   **Every N Days:**
   - Interval stepper (2-365)
   - Start date picker
   - Missed day behavior selector:
     - Continue: Keep the same schedule
     - Reset: Start fresh from next completion
   - Target count per scheduled day

4. **Color Picker**
   - 8-12 predefined colors
   - Circular color swatches with checkmark for selected

5. **Options**
   - **Allow exceeding target**: Toggle switch
     - ON (default): Can log more than target
     - OFF: Capped at target count

6. **Reminders**
   - Add reminder button
   - Time picker for each reminder
   - Toggle to enable/disable individual reminders
   - Delete button for each reminder

#### Actions

- **Cancel**: Discard changes and go back
- **Save**: Validate and create the habit

---

### Edit Habit Screen

**File:** `open-habit-mobile/app/edit-habit.tsx`

Similar to create habit but for editing existing habits, with an additional delete option.

#### Additional Features

- Pre-populated with existing habit data
- Delete Habit button at the bottom (with confirmation)
- Preserves completion history when editing

#### Delete Confirmation

```
+--------------------------------------+
|          Delete Habit                |
|                                      |
| Are you sure you want to delete      |
| "Habit Name"? This will also delete  |
| all completion history.              |
|                                      |
|      [Cancel]     [Delete]           |
+--------------------------------------+
```

---

## Settings Screens

### App Settings Screen

**File:** `open-habit-mobile/app/app-settings.tsx`

Main settings hub accessible from the gear icon in any tab's header.

#### Screen Layout

```
+--------------------------------------------------+
|  [<]            Settings                          |
+--------------------------------------------------+
|                                                   |
|  +----------------------------------------------+ |
|  | [bell]       Notifications              [>]  | |
|  +----------------------------------------------+ |
|  | [moon]       Theme                      [>]  | |
|  +----------------------------------------------+ |
|  | [export]     Export Data                [>]  | |
|  +----------------------------------------------+ |
|  | [calendar]   Week Starts On             [>]  | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

#### Settings Options

| Setting | Icon | Description |
|---------|------|-------------|
| Notifications | bell.fill | Global notifications and per-habit reminders |
| Theme | moon.fill | Light/Dark/System theme preference |
| Export Data | square.and.arrow.up | Export habits and completions |
| Week Starts On | calendar | Sunday or Monday |

---

### Theme Settings Screen

**File:** `open-habit-mobile/app/theme-settings.tsx`

Allows users to select their theme preference.

#### Options

```
+--------------------------------------------------+
|  Back           Theme                             |
+--------------------------------------------------+
|                                                   |
|  +----------------------------------------------+ |
|  | System                                   [x] | |
|  | Match device settings                        | |
|  +----------------------------------------------+ |
|  | Light                                        | |
|  +----------------------------------------------+ |
|  | Dark                                         | |
|  +----------------------------------------------+ |
|                                                   |
+--------------------------------------------------+
```

- **System**: Follows device light/dark mode setting
- **Light**: Always light mode
- **Dark**: Always dark mode

---

### Notification Settings Screen

**File:** `open-habit-mobile/app/notification-settings.tsx`

Global notification toggle and per-habit reminder overview.

#### Screen Layout

```
+--------------------------------------------------+
|  Back        Notifications                        |
+--------------------------------------------------+
|                                                   |
|  [!] Notifications are disabled in system         |
|      settings. Tap to open settings.              |
|                                                   |
|  GENERAL                                          |
|  +----------------------------------------------+ |
|  | Enable Notifications              [toggle]   | |
|  | Receive reminders for your habits            | |
|  +----------------------------------------------+ |
|                                                   |
|  HABIT REMINDERS                                  |
|  +----------------------------------------------+ |
|  | [*] Habit Name                          [>]  | |
|  |     2 of 3 reminders active                  | |
|  +----------------------------------------------+ |
|  | [*] Another Habit                       [>]  | |
|  |     No reminders                             | |
|  +----------------------------------------------+ |
|                                                   |
|  Tap a habit to manage its reminders.             |
|                                                   |
+--------------------------------------------------+
```

#### Features

1. **Permission Warning Banner**
   - Shown when system notifications are denied
   - Tappable to open system settings

2. **Global Toggle**
   - Master switch for all notifications
   - Handles permission requests

3. **Per-Habit Reminders List**
   - Shows each habit with its reminder count
   - Tapping navigates to edit-habit screen

---

### Week Start Settings Screen

**File:** `open-habit-mobile/app/week-start-settings.tsx`

Configure which day the week starts on.

#### Options

```
+--------------------------------------------------+
|  Back        Week Starts On                       |
+--------------------------------------------------+
|                                                   |
|  +----------------------------------------------+ |
|  | Sunday                                       | |
|  +----------------------------------------------+ |
|  | Monday                                   [x] | |
|  +----------------------------------------------+ |
|                                                   |
|  This affects how weekly habits and streaks       |
|  are calculated.                                  |
|                                                   |
+--------------------------------------------------+
```

- Affects weekly habit calculations
- Affects contribution graph week columns
- Affects streak calculations

---

### Export Data Screen

**File:** `open-habit-mobile/app/export-data.tsx`

Export all habit data for backup or analysis.

#### Screen Layout

```
+--------------------------------------------------+
|  Back         Export Data                         |
+--------------------------------------------------+
|                                                   |
|  Select Format                                    |
|                                                   |
|  +----------------------------------------------+ |
|  | JSON                                     [x] | |
|  | Full data export with all details.           | |
|  | Best for backups and importing.              | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  | CSV                                          | |
|  | Spreadsheet format. Good for viewing         | |
|  | in Excel or Google Sheets.                   | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  |            [^] Export JSON                   | |
|  +----------------------------------------------+ |
|                                                   |
|  Your data will be saved to a file that you       |
|  can share, save to Files, or send via email.     |
|                                                   |
+--------------------------------------------------+
```

#### Export Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| JSON | Complete data structure | Backups, data portability |
| CSV | Tabular spreadsheet format | Analysis in Excel/Sheets |

#### Export Contents

- All habits with their configurations
- All completion records
- Reminders
- App settings

---

## User Flows

### 1. Creating a New Habit

```
[Log Tab] or [Habits Tab]
    |
    v
[Create Habit Button]
    |
    v
[Create Habit Screen]
    |
    +-- Enter habit name
    +-- Select frequency type
    +-- Configure frequency options
    +-- Choose color
    +-- Set options (allow overload)
    +-- Add reminders (optional)
    |
    v
[Save]
    |
    v
[Return to previous screen - habit appears in list]
```

### 2. Logging Daily Completions

```
[Open App / Log Tab]
    |
    v
[View today's scheduled habits]
    |
    +-- [Tap habit card] --> Increment count
    |       |
    |       v
    |   [Haptic feedback + animation]
    |       |
    |       v
    |   [Progress bar/count updates]
    |
    +-- [Long press habit card]
            |
            v
        [Action Sheet]
            |
            +-- [Undo Last] --> Decrement count
            +-- [Skip Today] --> Mark as skipped
            +-- [Add Note] --> Open note modal
                    |
                    v
                [Enter note text]
                    |
                    v
                [Save note]
```

### 3. Viewing Progress

```
[Progress Tab]
    |
    v
[Scroll through habit progress cards]
    |
    +-- [Switch view mode] --> Year/Month/3 Months
    +-- [Navigate year] --> Previous/Next year
    +-- [Tap graph cell] --> View cell details
    +-- [View streaks] --> Current and longest
```

### 4. Editing a Habit

```
[Habits Tab]
    |
    v
[Tap habit row]
    |
    v
[Edit Habit Screen]
    |
    +-- Modify any setting
    +-- [Save] --> Update habit
    +-- [Delete Habit]
            |
            v
        [Confirmation dialog]
            |
            +-- [Cancel] --> Stay on screen
            +-- [Delete] --> Remove habit + history
```

### 5. Reordering Habits

```
[Habits Tab]
    |
    v
[Long press habit row (150ms)]
    |
    v
[Drag to new position]
    |
    v
[Release] --> Order saved
```

### 6. Managing Reminders

```
[Settings] --> [Notifications]
    |
    v
[View habits with reminders]
    |
    v
[Tap habit]
    |
    v
[Edit Habit Screen - Reminders section]
    |
    +-- [Add Reminder] --> Pick time
    +-- [Toggle reminder] --> Enable/Disable
    +-- [Remove reminder] --> Delete
```

### 7. Exporting Data

```
[Settings] --> [Export Data]
    |
    v
[Select format (JSON/CSV)]
    |
    v
[Tap Export]
    |
    v
[Share sheet opens]
    |
    +-- Save to Files
    +-- Share via AirDrop
    +-- Send via email
    +-- Other share options
```

---

## Feature List

### Habit Tracking

| Feature | Description |
|---------|-------------|
| Multiple frequency types | Daily, Weekly, Specific Days, Every N Days |
| Multi-count habits | Track habits that need multiple completions per day |
| Skip functionality | Mark a habit as skipped without affecting streaks |
| Completion notes | Add context to any completion |
| Allow/prevent overload | Option to cap completions at target |
| Custom colors | 8-12 color options per habit |

### Progress Visualization

| Feature | Description |
|---------|-------------|
| Contribution graph | GitHub-style heatmap |
| Multiple view modes | Year, Month, 3 Months |
| Streak tracking | Current and longest streaks |
| Year navigation | View historical data |
| Cell details | Tap for completion info |

### Habit Management

| Feature | Description |
|---------|-------------|
| Drag-to-reorder | Customize habit order |
| Edit all properties | Modify name, frequency, color, etc. |
| Delete with confirmation | Remove habits and their history |

### Reminders

| Feature | Description |
|---------|-------------|
| Multiple reminders per habit | Set different times |
| Individual enable/disable | Toggle specific reminders |
| Permission handling | Graceful handling of notification permissions |

### Data Management

| Feature | Description |
|---------|-------------|
| Local-first storage | SQLite database on device |
| JSON export | Complete data backup |
| CSV export | Spreadsheet-compatible format |
| No account required | Privacy-focused design |

### Customization

| Feature | Description |
|---------|-------------|
| Theme selection | System, Light, Dark |
| Week start day | Sunday or Monday |

### User Experience

| Feature | Description |
|---------|-------------|
| Haptic feedback | Touch feedback on interactions |
| Animations | Press, scale, and transition animations |
| Pull to refresh | Reload data on Log tab |
| Empty states | Helpful guidance when no data |
| Dark mode support | Full theme support |

---

## Technical Notes

### Data Persistence

- All data stored in local SQLite database
- Automatic timestamps on all records
- Foreign key cascading for data integrity

### Performance

- Skia canvas for contribution graphs
- FlatList virtualization for long lists
- `react-freeze` for inactive tab optimization
- Pre-computed streaks during data load

### Date Handling

- Dates stored as `YYYY-MM-DD` strings (local calendar date)
- Times stored as `HH:MM` (24-hour format)
- Timestamps use ISO 8601 with local timezone offset

---

*Last updated: January 2026*
