/**
 * Habits Tab - Habit Creation & Management
 *
 * Create and manage habits.
 */

import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, Href } from 'expo-router';
import { Freeze } from 'react-freeze';
import { useIsFocused } from '@react-navigation/native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SettingsRowProps {
  icon: string;
  title: string;
  onPress: () => void;
  showChevron?: boolean;
}

function SettingsRow({ icon, title, onPress, showChevron = true }: SettingsRowProps) {
  const iconColor = useThemeColor({}, 'icon');

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

export default function HabitsScreen() {
  const isFocused = useIsFocused();

  return (
    <Freeze freeze={!isFocused}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content}>
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
  section: {
    marginHorizontal: 16,
    marginTop: 24,
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
});
