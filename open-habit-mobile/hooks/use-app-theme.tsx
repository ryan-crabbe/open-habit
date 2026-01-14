/**
 * App Theme Context
 *
 * Provides theme management with support for system/light/dark preferences.
 * Reads and persists preference to the database.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useDatabase, getSetting, setSetting, deleteSetting } from '@/database';

export type ThemePreference = 'system' | 'light' | 'dark';

interface AppThemeContextValue {
  /** User's selected preference */
  preference: ThemePreference;
  /** Resolved color scheme to use */
  colorScheme: 'light' | 'dark';
  /** Set the theme preference */
  setPreference: (pref: ThemePreference) => Promise<void>;
  /** Whether theme is still loading from database */
  isLoading: boolean;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

/**
 * Resolve the actual color scheme based on preference and system setting
 */
function resolveColorScheme(
  preference: ThemePreference,
  systemColorScheme: 'light' | 'dark' | null | undefined
): 'light' | 'dark' {
  if (preference === 'system') {
    return systemColorScheme ?? 'light';
  }
  return preference;
}

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const { db, isReady } = useDatabase();
  const systemColorScheme = useSystemColorScheme();

  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from database
  useEffect(() => {
    async function loadTheme() {
      if (!db) return;

      try {
        const stored = await getSetting(db, 'theme');
        // If no stored value or empty, use 'system'
        if (!stored || stored === '') {
          setPreferenceState('system');
        } else if (stored === 'light' || stored === 'dark') {
          setPreferenceState(stored);
        } else {
          // Unknown value, default to system
          setPreferenceState('system');
        }
      } catch (err) {
        console.error('Failed to load theme preference:', err);
        setPreferenceState('system');
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      loadTheme();
    }
  }, [db, isReady]);

  // Set theme preference
  const setPreference = useCallback(
    async (pref: ThemePreference) => {
      if (!db) return;

      const previousPreference = preference;
      setPreferenceState(pref);

      try {
        if (pref === 'system') {
          // Delete the setting to use system default
          await deleteSetting(db, 'theme');
        } else {
          // Store light or dark
          await setSetting(db, 'theme', pref);
        }
      } catch (err) {
        console.error('Failed to save theme preference:', err);
        // Revert on error
        setPreferenceState(previousPreference);
      }
    },
    [db, preference]
  );

  // Compute resolved color scheme
  const colorScheme = useMemo(
    () => resolveColorScheme(preference, systemColorScheme),
    [preference, systemColorScheme]
  );

  const value = useMemo(
    () => ({
      preference,
      colorScheme,
      setPreference,
      isLoading,
    }),
    [preference, colorScheme, setPreference, isLoading]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

/**
 * Hook to access theme context
 */
export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}

/**
 * Hook to get the current color scheme
 * This replaces the default React Native useColorScheme
 */
export function useColorScheme(): 'light' | 'dark' {
  const context = useContext(AppThemeContext);
  const systemColorScheme = useSystemColorScheme();

  // If not in provider context (e.g., during initial render), fall back to system
  if (!context) {
    return systemColorScheme ?? 'light';
  }

  return context.colorScheme;
}
