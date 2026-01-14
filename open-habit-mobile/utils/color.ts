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
