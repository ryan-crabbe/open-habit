/**
 * OpenHabit Theme Configuration
 *
 * Color palette, typography, spacing, and design tokens for the app.
 */

import { Platform } from 'react-native';

// ============================================================================
// Primary Colors
// ============================================================================

const tintColorLight = '#4CAF50'; // Green - primary action color
const tintColorDark = '#81C784'; // Lighter green for dark mode

export const Colors = {
  light: {
    // Base colors
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    // Semantic colors
    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    error: '#F44336',
    errorLight: '#FFEBEE',

    // Card & Surface
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',

    // UI Elements
    border: 'rgba(128, 128, 128, 0.2)',
    borderSecondary: 'rgba(128, 128, 128, 0.3)',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    buttonText: '#FFFFFF',
    link: '#0a7ea4',

    // Habit states
    habitNotStarted: '#E0E0E0',
    habitInProgress: '#FFC107',
    habitCompleted: '#4CAF50',
    habitSkipped: '#9E9E9E',
  },
  dark: {
    // Base colors
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // Semantic colors
    success: '#81C784',
    successLight: '#1B3D20',
    warning: '#FFB74D',
    warningLight: '#3D2E0F',
    error: '#E57373',
    errorLight: '#3D1F1F',

    // Card & Surface
    card: '#1E1E1E',
    cardBorder: '#333333',

    // UI Elements
    border: 'rgba(255, 255, 255, 0.1)',
    borderSecondary: 'rgba(255, 255, 255, 0.15)',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    buttonText: '#FFFFFF',
    link: '#58a6ff',

    // Habit states
    habitNotStarted: '#424242',
    habitInProgress: '#FFA000',
    habitCompleted: '#81C784',
    habitSkipped: '#616161',
  },
};

// ============================================================================
// Graph Intensity Colors
// ============================================================================

// Graph intensity gradient (5 levels: 0%, 25%, 50%, 75%, 100%)
export const GraphIntensity = {
  light: {
    empty: '#EBEDF0',
    level1: '#C6E48B',
    level2: '#7BC96F',
    level3: '#239A3B',
    level4: '#196127',
  },
  dark: {
    empty: '#161B22',
    level1: '#0E4429',
    level2: '#006D32',
    level3: '#26A641',
    level4: '#39D353',
  },
};

/**
 * Gets the graph intensity color based on completion percentage
 * @param percentage - Completion percentage (0-1)
 * @param colorScheme - 'light' or 'dark'
 */
export function getGraphIntensityColor(
  percentage: number,
  colorScheme: 'light' | 'dark'
): string {
  const colors = GraphIntensity[colorScheme];
  if (percentage === 0) return colors.empty;
  if (percentage < 0.25) return colors.level1;
  if (percentage < 0.5) return colors.level2;
  if (percentage < 0.75) return colors.level3;
  return colors.level4;
}

// ============================================================================
// Preset Habit Colors
// ============================================================================

export const HabitColors = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Grey
];

// ============================================================================
// Typography
// ============================================================================

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================================
// Spacing
// ============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ============================================================================
// Border Radius
// ============================================================================

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================================
// Shadows
// ============================================================================

export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
