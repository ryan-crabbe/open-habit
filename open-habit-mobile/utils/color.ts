/**
 * Color Utilities
 *
 * Helper functions for color manipulation.
 */

/**
 * Converts a hex color to rgba with the specified opacity.
 * Handles 3-digit (#RGB) and 6-digit (#RRGGBB) hex colors.
 *
 * @param hex - Hex color string (e.g., "#FF0000" or "#F00")
 * @param opacity - Opacity value between 0 and 1
 * @returns rgba color string
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex
  let r: number, g: number, b: number;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else {
    // Fallback for invalid hex - return transparent
    return `rgba(0, 0, 0, ${opacity})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Returns a color with reduced opacity for disabled states.
 *
 * @param color - Hex color string
 * @returns rgba color with 25% opacity
 */
export function withDisabledOpacity(color: string): string {
  return hexToRgba(color, 0.25);
}

/**
 * Empty cell colors for contribution graphs
 */
const EMPTY_CELL_COLORS = {
  light: '#EBEDF0',
  dark: '#161B22',
};

/**
 * Gets a habit-specific intensity color based on completion percentage.
 * Uses the habit's own color with varying opacity levels.
 *
 * @param percentage - Completion percentage (0-1)
 * @param habitColor - The habit's hex color (e.g., "#2196F3")
 * @param colorScheme - 'light' or 'dark'
 * @returns Color string (hex for empty, rgba for others)
 */
export function getHabitIntensityColor(
  percentage: number,
  habitColor: string,
  colorScheme: 'light' | 'dark'
): string {
  if (percentage === 0) {
    return EMPTY_CELL_COLORS[colorScheme];
  }
  if (percentage < 0.25) {
    return hexToRgba(habitColor, 0.25);
  }
  if (percentage < 0.5) {
    return hexToRgba(habitColor, 0.5);
  }
  if (percentage < 0.75) {
    return hexToRgba(habitColor, 0.75);
  }
  return habitColor; // 100% opacity for 75%+ completion
}
