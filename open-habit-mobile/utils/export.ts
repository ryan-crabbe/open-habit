/**
 * Data Export Utilities
 *
 * Functions to gather and format habit data for export.
 */

import * as SQLite from 'expo-sqlite';
import {
  getHabits,
  getAllCompletionsForHabit,
  getRemindersForHabit,
  getAllSettings,
} from '@/database';
import { getLocalDateTimeWithOffset } from './date';
import type { Habit, HabitCompletion, HabitReminder, SettingKey } from '@/database';

export interface ExportData {
  exportDate: string;
  version: string;
  habits: Habit[];
  completions: HabitCompletion[];
  reminders: HabitReminder[];
  settings: Record<SettingKey, string>;
}

/**
 * Gather all data from the database for export
 */
export async function gatherExportData(db: SQLite.SQLiteDatabase): Promise<ExportData> {
  // Get all habits
  const habits = await getHabits(db);

  // Get all completions and reminders for each habit
  const completionsPromises = habits.map((h) => getAllCompletionsForHabit(db, h.id));
  const remindersPromises = habits.map((h) => getRemindersForHabit(db, h.id));

  const [completionsArrays, remindersArrays, settings] = await Promise.all([
    Promise.all(completionsPromises),
    Promise.all(remindersPromises),
    getAllSettings(db),
  ]);

  // Flatten arrays
  const completions = completionsArrays.flat();
  const reminders = remindersArrays.flat();

  return {
    exportDate: getLocalDateTimeWithOffset(),
    version: '1.0',
    habits,
    completions,
    reminders,
    settings,
  };
}

/**
 * Format export data as JSON
 */
export function formatAsJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format export data as CSV
 * Creates multiple sections: habits, completions, reminders
 */
export function formatAsCSV(data: ExportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`# OpenHabit Export`);
  lines.push(`# Date: ${data.exportDate}`);
  lines.push(`# Version: ${data.version}`);
  lines.push('');

  // Habits section
  lines.push('# HABITS');
  lines.push('id,name,frequency_type,target_count,frequency_days,frequency_interval,frequency_start_date,missed_day_behavior,completion_display,color,icon,sort_order,created_at,updated_at');
  for (const h of data.habits) {
    lines.push([
      h.id,
      escapeCSV(h.name),
      h.frequency_type,
      h.target_count,
      escapeCSV(h.frequency_days ?? ''),
      h.frequency_interval ?? '',
      h.frequency_start_date ?? '',
      h.missed_day_behavior ?? '',
      h.completion_display,
      h.color,
      h.icon ?? '',
      h.sort_order,
      h.created_at,
      h.updated_at,
    ].join(','));
  }
  lines.push('');

  // Completions section
  lines.push('# COMPLETIONS');
  lines.push('id,habit_id,date,count,skipped,note,created_at,updated_at');
  for (const c of data.completions) {
    lines.push([
      c.id,
      c.habit_id,
      c.date,
      c.count,
      c.skipped,
      escapeCSV(c.note ?? ''),
      c.created_at,
      c.updated_at,
    ].join(','));
  }
  lines.push('');

  // Reminders section
  lines.push('# REMINDERS');
  lines.push('id,habit_id,time,enabled,created_at,updated_at');
  for (const r of data.reminders) {
    lines.push([
      r.id,
      r.habit_id,
      r.time,
      r.enabled,
      r.created_at,
      r.updated_at,
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
