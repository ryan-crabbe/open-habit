/**
 * Notification Context
 *
 * Provides notification management with permission handling,
 * global toggle, and scheduling functions for habit reminders.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, AppState, Linking } from 'react-native';
import { router } from 'expo-router';

import {
  useDatabase,
  getSetting,
  setSetting,
  getAllEnabledReminders,
  getHabits,
} from '@/database';
import { isHabitScheduledForDate } from '@/utils/habit-schedule';
import { getLocalDate, addDays } from '@/utils/date';
import type { HabitReminder, Habit } from '@/database';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface NotificationContextValue {
  /** Current permission status */
  permissionStatus: PermissionStatus;
  /** Whether notifications are globally enabled in app settings */
  isEnabled: boolean;
  /** Whether the provider is still loading */
  isLoading: boolean;
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Toggle global notification setting */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Reschedule all notifications (call after reminder/habit changes) */
  rescheduleAllNotifications: () => Promise<void>;
  /** Open system settings for notifications */
  openSettings: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Configure notification handler (how notifications appear when app is foregrounded)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Map expo-notifications permission status to our simplified type
 */
function mapPermissionStatus(
  status: Notifications.PermissionStatus
): PermissionStatus {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}

/**
 * Get an encouraging message for a notification
 */
function getEncouragingMessage(habit: Habit): string {
  const messages = [
    `Time to ${habit.name.toLowerCase()}!`,
    `Don't forget: ${habit.name}`,
    `Ready to complete ${habit.name}?`,
    `Your reminder for ${habit.name}`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { db, isReady } = useDatabase();
  const appState = useRef(AppState.currentState);
  const hasInitialized = useRef(false);

  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('undetermined');
  const [isEnabled, setIsEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check current notification permissions
   */
  const checkPermissions = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(mapPermissionStatus(status));
  }, []);

  // Check permissions on mount and when app returns from background
  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Re-check permissions when returning from background
      // (user may have changed in system settings)
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkPermissions();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [checkPermissions]);

  // Load global enabled setting from database
  useEffect(() => {
    async function loadSettings() {
      if (!db) return;
      try {
        const enabled = await getSetting(db, 'notifications_enabled');
        setIsEnabledState(enabled !== '0');
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      loadSettings();
    }
  }, [db, isReady]);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    const mappedStatus = mapPermissionStatus(status);
    setPermissionStatus(mappedStatus);
    return mappedStatus === 'granted';
  }, []);

  /**
   * Schedule a notification for a specific reminder on a specific date
   */
  const scheduleNotificationForReminder = useCallback(
    async (reminder: HabitReminder, habit: Habit, date: string) => {
      // Validate time format
      const timeParts = reminder.time.split(':');
      if (timeParts.length !== 2) {
        if (__DEV__) console.warn(`Invalid reminder time format: ${reminder.time}`);
        return;
      }

      const [hours, minutes] = timeParts.map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        if (__DEV__) console.warn(`Invalid reminder time values: ${reminder.time}`);
        return;
      }

      // Parse the date and set the time
      const triggerDate = new Date(date + 'T00:00:00');
      triggerDate.setHours(hours, minutes, 0, 0);

      // Skip if the trigger time has already passed
      if (triggerDate.getTime() <= Date.now()) {
        return;
      }

      // Create unique identifier for this notification
      const identifier = `reminder-${reminder.id}-${date}`;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: habit.name,
          body: getEncouragingMessage(habit),
          data: {
            habitId: habit.id,
            reminderId: reminder.id,
            date,
            screen: 'log',
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    },
    []
  );

  /**
   * Reschedule all notifications for the next 7 days
   */
  const rescheduleAllNotifications = useCallback(async () => {
    if (!db || !isEnabled || permissionStatus !== 'granted') {
      return;
    }

    try {
      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Batch fetch all data to avoid N+1 queries
      const [reminders, habits] = await Promise.all([
        getAllEnabledReminders(db),
        getHabits(db),
      ]);

      // Create habit lookup map for O(1) access
      const habitMap = new Map(habits.map((h) => [h.id, h]));

      // Schedule notifications for the next 7 days
      const today = getLocalDate();

      for (const reminder of reminders) {
        const habit = habitMap.get(reminder.habit_id);
        if (!habit) continue;

        // Schedule for each day in the next week where habit is due
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const date = addDays(today, dayOffset);

          if (isHabitScheduledForDate(habit, date)) {
            try {
              await scheduleNotificationForReminder(reminder, habit, date);
            } catch (err) {
              // Log but continue scheduling other notifications
              if (__DEV__) {
                console.error(`Failed to schedule reminder ${reminder.id} for ${date}:`, err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to reschedule notifications:', err);
    }
  }, [db, isEnabled, permissionStatus, scheduleNotificationForReminder]);

  /**
   * Toggle global notification setting
   */
  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (!db) return;

      const previousEnabled = isEnabled;
      setIsEnabledState(enabled);

      try {
        await setSetting(db, 'notifications_enabled', enabled ? '1' : '0');

        if (enabled) {
          await rescheduleAllNotifications();
        } else {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      } catch (err) {
        console.error('Failed to save notification setting:', err);
        // Revert on error
        setIsEnabledState(previousEnabled);
      }
    },
    [db, isEnabled, rescheduleAllNotifications]
  );

  /**
   * Open system settings for notifications
   */
  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  // Handle notification taps (deep linking)
  useEffect(() => {
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          screen?: string;
          habitId?: number;
        };

        if (data?.screen === 'log') {
          // Navigate to Log tab
          router.navigate('/(tabs)');
        }
      });

    // Handle received notifications (when app is in foreground)
    const notificationSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        // Could show in-app notification UI here if needed
        if (__DEV__) {
          console.log('Notification received:', notification.request.identifier);
        }
      });

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, []);

  // Initialize notifications on first launch
  useEffect(() => {
    async function initializeNotifications() {
      if (!isReady || isLoading) return;
      if (hasInitialized.current) return;

      // Only request on first launch (permission undetermined)
      if (permissionStatus === 'undetermined' && isEnabled) {
        const granted = await requestPermissions();
        if (granted) {
          hasInitialized.current = true;
          await rescheduleAllNotifications();
        }
        return;
      }

      // Schedule notifications if everything is ready
      if (permissionStatus === 'granted' && isEnabled) {
        hasInitialized.current = true;
        await rescheduleAllNotifications();
      }
    }

    initializeNotifications();
  }, [isReady, isLoading, permissionStatus, isEnabled, requestPermissions, rescheduleAllNotifications]);

  const value = useMemo(
    () => ({
      permissionStatus,
      isEnabled,
      isLoading,
      requestPermissions,
      setEnabled,
      rescheduleAllNotifications,
      openSettings,
    }),
    [
      permissionStatus,
      isEnabled,
      isLoading,
      requestPermissions,
      setEnabled,
      rescheduleAllNotifications,
      openSettings,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}
