/**
 * Progress Tab - Habit Visualization
 *
 * GitHub-style contribution graphs and streak visualization.
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useDatabase } from '@/database';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProgressScreen() {
  const { db, isReady, error } = useDatabase();
  const colorScheme = useColorScheme();
  const errorColor = Colors[colorScheme ?? 'light'].error;

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
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No progress data yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Start logging habits to see your progress graphs
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  errorText: {
    padding: 20,
  },
});
