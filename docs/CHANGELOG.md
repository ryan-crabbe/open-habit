# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Unreleased

### Added

- **Habit Management**
  - Create new habits with customizable frequency options (daily, weekly, specific days)
  - Edit existing habits with full configuration support
  - Manage all habits from a dedicated Habits tab
  - Reminder management for habits with notification scheduling

- **Habit Logging**
  - Log tab for tracking daily habit completions
  - SQLite database for persistent local storage
  - Visual feedback for completed habits

- **Progress Tracking**
  - Progress tab with GitHub-style contribution graphs
  - Streak tracking to monitor consistency
  - Enhanced visualizations using Skia canvas for smooth performance

- **Settings & Customization**
  - Dark mode theme (set as default)
  - Light mode option with consistent theme styling
  - Export data functionality
  - Configurable week start day
  - Clear all data option

- **Notifications & Reminders**
  - Push notification support for habit reminders
  - Customizable reminder times per habit

- **User Experience**
  - Improved empty states with contextual messages and call-to-action buttons
  - Restructured navigation with Habits tab and settings button

### Changed

- Navigation restructured to feature Habits tab prominently with dedicated settings access
- Improved Habits tab and Settings screen UX
- Dark mode is now the default theme

### Fixed

- Dynamic border colors applied consistently across all settings screens
- Prevented loading spinner from appearing on tab revisit
- Fixed month label overlap in contribution graphs
- Addressed various code review issues in settings features

### Performance

- Replaced React components with Skia canvas for contribution graph rendering
- Progress screen kept mounted to speed up tab switching
- Eliminated hook overhead in GraphCell for faster tab navigation
- Optimized Progress tab loading to prevent UI blocking

## [0.0.1] - 2026-01-11

### Added

- Initial project setup
- Basic project structure with Expo and React Native
- Git repository initialization with common ignore patterns
