/**
 * Week Start Settings Screen
 *
 * Allows user to select which day the week starts on (Sunday or Monday).
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useDatabase, getWeekStartDay, setWeekStartDay } from '@/database';
import { Spacing, FontSizes } from '@/constants/theme';

type WeekStartDay = 0 | 1;

interface OptionRowProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function OptionRow({ label, isSelected, onPress }: OptionRowProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      {isSelected && <IconSymbol name="checkmark" size={20} color={tintColor} />}
    </TouchableOpacity>
  );
}

export default function WeekStartSettingsScreen() {
  const { db, isReady } = useDatabase();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');

  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load current setting
  useEffect(() => {
    async function load() {
      if (!db) return;
      try {
        const day = await getWeekStartDay(db);
        setWeekStartDayState(day === 0 ? 0 : 1);
      } catch (err) {
        console.error('Failed to load week start day:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      load();
    }
  }, [db, isReady]);

  const handleSelect = async (day: WeekStartDay) => {
    if (!db || day === weekStartDay) return;

    setWeekStartDayState(day);
    try {
      await setWeekStartDay(db, day);
      router.back();
    } catch (err) {
      console.error('Failed to save week start day:', err);
      // Revert on error
      setWeekStartDayState(weekStartDay);
    }
  };

  if (!isReady || isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Week Starts On</ThemedText>
        <View style={styles.headerButton} />
      </View>

      {/* Options */}
      <View style={styles.content}>
        <ThemedView style={[styles.optionsContainer, { backgroundColor: cardBackground }]}>
          <OptionRow
            label="Sunday"
            isSelected={weekStartDay === 0}
            onPress={() => handleSelect(0)}
          />
          <View style={styles.separator} />
          <OptionRow
            label="Monday"
            isSelected={weekStartDay === 1}
            onPress={() => handleSelect(1)}
          />
        </ThemedView>

        <ThemedText style={styles.hint}>
          This affects how weekly habits and streaks are calculated.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  backText: {
    fontSize: FontSizes.md,
  },
  content: {
    padding: Spacing.lg,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  optionLabel: {
    fontSize: FontSizes.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginLeft: Spacing.lg,
  },
  hint: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
});
