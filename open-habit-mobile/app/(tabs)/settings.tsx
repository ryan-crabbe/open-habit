/**
 * Settings Tab - Habit Management & App Configuration
 *
 * Create habits and manage app settings.
 */

import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { router, Href } from 'expo-router';
import { Freeze } from 'react-freeze';
import { useIsFocused } from '@react-navigation/native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useDatabase, seedTestData, getDatabaseStats, clearAllData } from '@/database';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SettingsRowProps {
  icon: string;
  title: string;
  onPress: () => void;
  showChevron?: boolean;
}

function SettingsRow({ icon, title, onPress, showChevron = true }: SettingsRowProps) {
  const iconColor = useThemeColor({}, 'icon');
  const borderSecondary = useThemeColor({}, 'borderSecondary');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <IconSymbol name={icon as any} size={24} color={iconColor} />
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
      </View>
      {showChevron && (
        <IconSymbol name="chevron.right" size={20} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}

function Separator() {
  const borderSecondary = useThemeColor({}, 'borderSecondary');
  return <View style={[styles.separator, { backgroundColor: borderSecondary }]} />;
}

export default function SettingsScreen() {
  const { db, isReady, error } = useDatabase();
  const colorScheme = useColorScheme();
  const errorColor = Colors[colorScheme ?? 'light'].error;
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const isFocused = useIsFocused();

  const handleSeedTestData = async () => {
    if (!db) return;

    Alert.alert(
      'Seed Test Data',
      'This will clear all existing data and replace it with test data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed Data',
          style: 'destructive',
          onPress: async () => {
            setIsSeeding(true);
            try {
              await seedTestData(db);
              const stats = await getDatabaseStats(db);
              Alert.alert(
                'Success',
                `Seeded ${stats.habits} habits, ${stats.completions} completions, ${stats.reminders} reminders`
              );
            } catch (err) {
              console.error('Failed to seed data:', err);
              Alert.alert('Error', 'Failed to seed test data');
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ]
    );
  };

  const handleShowStats = async () => {
    if (!db) return;
    try {
      const stats = await getDatabaseStats(db);
      Alert.alert(
        'Database Stats',
        `Habits: ${stats.habits}\nCompletions: ${stats.completions}\nReminders: ${stats.reminders}`
      );
    } catch (err) {
      console.error('Failed to get stats:', err);
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all habits, completions, and reminders. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (err) {
              console.error('Failed to clear data:', err);
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          Failed to initialize database: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isReady) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <Freeze freeze={!isFocused}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content}>
          {/* Habits Section */}
          <ThemedText style={styles.sectionHeader}>HABITS</ThemedText>
          <ThemedView style={styles.section}>
            <SettingsRow
              icon="plus.circle.fill"
              title="Create New Habit"
              onPress={() => router.push('/create-habit')}
            />
            <Separator />
            <SettingsRow
              icon="list.bullet"
              title="Manage Habits"
              onPress={() => router.push('/manage-habits' as Href)}
            />
          </ThemedView>

          {/* App Settings Section */}
          <ThemedText style={styles.sectionHeader}>APP SETTINGS</ThemedText>
          <ThemedView style={styles.section}>
            <SettingsRow
              icon="bell.fill"
              title="Notifications"
              onPress={() => router.push('/notification-settings' as Href)}
            />
            <Separator />
            <SettingsRow
              icon="moon.fill"
              title="Theme"
              onPress={() => router.push('/theme-settings' as Href)}
            />
            <Separator />
            <SettingsRow
              icon="square.and.arrow.up"
              title="Export Data"
              onPress={() => router.push('/export-data' as Href)}
            />
            <Separator />
            <SettingsRow
              icon="calendar"
              title="Week Starts On"
              onPress={() => router.push('/week-start-settings' as Href)}
            />
          </ThemedView>

          {/* Dev Section - Only in development */}
          {__DEV__ && (
            <>
              <ThemedText style={styles.sectionHeader}>DEVELOPER</ThemedText>
              <ThemedView style={styles.section}>
                <SettingsRow
                  icon="hammer.fill"
                  title={isSeeding ? 'Seeding...' : 'Seed Test Data'}
                  onPress={handleSeedTestData}
                  showChevron={false}
                />
                <Separator />
                <SettingsRow
                  icon="info.circle.fill"
                  title="Database Stats"
                  onPress={handleShowStats}
                  showChevron={false}
                />
                <Separator />
                <SettingsRow
                  icon="trash.fill"
                  title={isClearing ? 'Clearing...' : 'Clear All Data'}
                  onPress={handleClearData}
                  showChevron={false}
                />
              </ThemedView>
            </>
          )}
        </ScrollView>
      </ThemedView>
    </Freeze>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 17,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  errorText: {
    padding: 20,
  },
});
