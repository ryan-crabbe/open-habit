# OpenHabit Mobile

A privacy-first, local-only habit tracking app built with Expo and React Native. Track your daily habits, visualize progress with GitHub-style contribution graphs, and build lasting routines without your data ever leaving your device.

## Features

### Habit Tracking
- **Flexible Frequency Options**: Daily, weekly, specific days, or every N days scheduling
- **Tap-to-Complete**: Quick one-tap logging with support for multiple completions per day
- **Skip Days**: Mark days as intentionally skipped without breaking streaks
- **Notes**: Add contextual notes to any completion
- **Custom Colors**: Choose from 8 preset colors for easy habit identification

### Progress Visualization
- **GitHub-Style Contribution Graphs**: See your activity patterns at a glance
- **Streak Tracking**: Current and best streak calculations for motivation
- **Yearly Overview**: View your entire year's progress in one screen

### Habit Management
- **Drag-to-Reorder**: Organize habits in your preferred order
- **Flexible Targets**: Set custom completion targets per habit
- **Overload Control**: Choose whether habits can be incremented beyond targets

### Notifications
- **Custom Reminders**: Set multiple reminder times per habit
- **Smart Scheduling**: Notifications only fire on days the habit is scheduled
- **Global Toggle**: Easily disable all notifications when needed

### Settings & Data
- **Theme Support**: Light, dark, or system-following themes
- **Week Start Preference**: Choose Monday or Sunday as your week start
- **Data Export**: Export all data as JSON or CSV
- **Privacy First**: All data stored locally using SQLite - no cloud sync, no accounts

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Expo](https://expo.dev) ~54.0 |
| UI | [React Native](https://reactnative.dev) 0.81 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| Database | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| Graphics | [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/) |
| Gestures | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| Lists | [React Native Draggable FlatList](https://github.com/computerjazz/react-native-draggable-flatlist) |
| Notifications | [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| Language | TypeScript 5.9 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS) or Android Emulator, or a physical device with [Expo Go](https://expo.dev/go)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ryan-crabbe/open-habit.git
   cd open-habit/open-habit-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

   For tunnel mode (useful when devices are on different networks):
   ```bash
   npx expo start --tunnel
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `i` for iOS simulator / `a` for Android emulator

### Development Builds

For features requiring native code (like notifications), create a development build:

```bash
# iOS (requires macOS with Xcode)
npx expo run:ios

# Android
npx expo run:android

# Or use EAS Build
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Project Structure

```
open-habit-mobile/
├── app/                    # Screens and navigation (Expo Router)
│   ├── (tabs)/            # Bottom tab screens
│   │   ├── index.tsx      # Log tab - today's habits
│   │   ├── progress.tsx   # Progress tab - contribution graphs
│   │   └── habits.tsx     # Habits tab - manage habits
│   ├── _layout.tsx        # Root layout with providers
│   ├── create-habit.tsx   # Create new habit screen
│   ├── edit-habit.tsx     # Edit existing habit screen
│   ├── app-settings.tsx   # Settings hub
│   └── ...                # Other settings screens
├── components/            # Reusable UI components
│   ├── habit-form/        # Habit form components
│   ├── log/               # Log screen components
│   ├── progress/          # Progress visualization components
│   └── ui/                # Generic UI components
├── constants/             # Theme and configuration
│   └── theme.ts           # Colors, typography, spacing
├── database/              # SQLite database layer
│   ├── schema.ts          # Database schema definitions
│   ├── habits.ts          # Habit CRUD operations
│   ├── completions.ts     # Completion tracking
│   ├── reminders.ts       # Notification reminders
│   ├── settings.ts        # App settings storage
│   └── database-provider.tsx  # React context provider
├── hooks/                 # Custom React hooks
│   ├── use-app-theme.tsx  # Theme management
│   ├── use-notifications.tsx  # Notification handling
│   └── ...
├── utils/                 # Utility functions
│   ├── date.ts            # Date formatting and manipulation
│   ├── streak.ts          # Streak calculation logic
│   ├── habit-schedule.ts  # Habit scheduling logic
│   ├── export.ts          # Data export utilities
│   └── color.ts           # Color utilities
├── data/                  # Test data and fixtures
├── assets/                # Images and fonts
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json           # Dependencies and scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Start on iOS simulator |
| `npm run android` | Start on Android emulator |
| `npm run web` | Start web version |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Reset to blank project (moves code to app-example) |

## Database Schema

The app uses SQLite for local data storage with the following tables:

- **habits** - Habit definitions (name, frequency, color, targets, etc.)
- **habit_completions** - Daily completion records with counts and notes
- **habit_reminders** - Notification times per habit
- **app_settings** - Key-value configuration storage

### Frequency Types

| Type | Description |
|------|-------------|
| `daily` | Every day, with optional multiple completions |
| `weekly` | N times per week, any days |
| `specific_days` | Specific weekdays with per-day targets |
| `every_n_days` | Recurring interval (e.g., every 3 days) |

### Date Conventions

- Dates: `YYYY-MM-DD` (local calendar date)
- Times: `HH:MM` (24-hour local time)
- Timestamps: ISO 8601 with local offset

## Documentation

Additional documentation can be found in the `CLAUDE.md` file, which contains:
- Quick start guide
- Architecture overview
- Data model details
- Implementation notes

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the existing code style
4. **Test your changes** on both iOS and Android
5. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions (kebab-case for files, PascalCase for components)
- Use the existing theme constants for colors, spacing, and typography
- Keep components focused and single-purpose
- Add JSDoc comments for public functions and components

### Reporting Issues

When reporting bugs, please include:
- Device/emulator information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

This project is open source. See the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Contribution graph inspired by GitHub
- Icons from SF Symbols via [@expo/vector-icons](https://icons.expo.fyi/)
