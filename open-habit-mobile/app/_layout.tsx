import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppThemeProvider } from '@/hooks/use-app-theme';
import { NotificationProvider } from '@/hooks/use-notifications';
import { DatabaseProvider } from '@/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Inner layout component that can safely use useColorScheme
 * because it's wrapped by AppThemeProvider
 */
function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="create-habit"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="manage-habits"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="edit-habit"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="week-start-settings"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="theme-settings"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="export-data"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <NotificationProvider>
        <AppThemeProvider>
          <RootLayoutContent />
        </AppThemeProvider>
      </NotificationProvider>
    </DatabaseProvider>
  );
}
