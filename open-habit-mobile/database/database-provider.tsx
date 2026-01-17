/**
 * Database Provider and Context
 *
 * Provides database access throughout the app via React Context.
 * Initializes database on mount and handles loading state.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './database';

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Database Provider Component
 *
 * Wraps the app and provides database access to all children.
 * Shows loading state until database is initialized.
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        const database = await initDatabase();
        if (mounted) {
          setDb(database);
          setIsReady(true);
        }
      } catch (err) {
        if (__DEV__) console.error('Failed to initialize database:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    setup();

    // Note: We intentionally do NOT close the database on unmount.
    // The database should persist for the app's lifetime.
    // Closing on unmount causes issues with:
    // - Hot-reload during development
    // - React StrictMode double-mounting
    // - Multiple components using the provider
    // The database will be closed when the app terminates.
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to access the database
 *
 * Returns the database instance, ready state, and any initialization error.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { db, isReady, error } = useDatabase();
 *
 *   if (!isReady) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   // Use db for queries...
 * }
 * ```
 */
export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }

  return context;
}
