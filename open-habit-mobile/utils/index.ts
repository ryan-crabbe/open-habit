/**
 * Utilities Module Exports
 */

// Date utilities
export {
  getLocalDate,
  getLocalDateTimeWithOffset,
  formatDisplayDate,
  getWeekBounds,
  getDayOfWeek,
  addDays,
  subtractDays,
  daysBetween,
  isSameDay,
  parseLocalDate,
  getDateRange,
} from './date';

// Habit scheduling utilities
export {
  isHabitScheduledForDate,
  getTargetForDate,
  getWeeklyTarget,
  getNextScheduledDate,
  isCompleted,
  getCompletionPercentage,
} from './habit-schedule';

// Color utilities
export { hexToRgba, withDisabledOpacity } from './color';
