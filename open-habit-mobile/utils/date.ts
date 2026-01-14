/**
 * Date/Time Utilities
 *
 * Helper functions for date handling following docs/data-model.md conventions:
 * - Dates: YYYY-MM-DD local calendar date
 * - Times: HH:MM 24-hour local time
 * - Timestamps: ISO 8601 with local offset
 */

/**
 * Gets today's local date in YYYY-MM-DD format
 */
export function getLocalDate(): string {
  return new Date().toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
}

/**
 * Gets local datetime with timezone offset
 * Format: YYYY-MM-DDTHH:MM:SS+HH:MM
 *
 * Use this for created_at/updated_at timestamps
 */
export function getLocalDateTimeWithOffset(): string {
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mins = String(Math.abs(offset) % 60).padStart(2, '0');
  return now.toISOString().slice(0, -1).split('.')[0] + sign + hours + ':' + mins;
}

/**
 * Formats a date for display
 * Example: "Mon Jan 12"
 */
export function formatDisplayDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Gets the start and end dates of the week containing the given date
 *
 * @param date - The date to get week bounds for (YYYY-MM-DD or Date)
 * @param weekStartDay - 0 = Sunday, 1 = Monday (default: 1)
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function getWeekBounds(
  date: string | Date,
  weekStartDay: number = 1
): { startDate: string; endDate: string } {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  const currentDay = d.getDay();

  // Calculate days to subtract to get to week start
  let daysToStart = currentDay - weekStartDay;
  if (daysToStart < 0) {
    daysToStart += 7;
  }

  const startDate = new Date(d);
  startDate.setDate(d.getDate() - daysToStart);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    startDate: startDate.toLocaleDateString('en-CA'),
    endDate: endDate.toLocaleDateString('en-CA'),
  };
}

/**
 * Gets the day of week (0-6) for a date
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export function getDayOfWeek(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.getDay();
}

/**
 * Adds days to a date
 */
export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
}

/**
 * Subtracts days from a date
 */
export function subtractDays(date: string | Date, days: number): string {
  return addDays(date, -days);
}

/**
 * Calculates the difference in days between two dates
 * Returns positive if date1 is after date2
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1 + 'T00:00:00') : new Date(date1);
  const d2 = typeof date2 === 'string' ? new Date(date2 + 'T00:00:00') : new Date(date2);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if two dates are the same calendar day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? date1 : date1.toLocaleDateString('en-CA');
  const d2 = typeof date2 === 'string' ? date2 : date2.toLocaleDateString('en-CA');
  return d1 === d2;
}

/**
 * Parses a YYYY-MM-DD date string to a Date object
 * Creates the date at midnight local time
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Gets a date range as an array of YYYY-MM-DD strings
 * Inclusive of both start and end
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;

  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}
