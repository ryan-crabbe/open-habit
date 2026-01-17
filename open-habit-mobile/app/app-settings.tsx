/**
 * App Settings Screen
 *
 * Accessible from gear icon in header. Contains app configuration options.
 */

import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, FontSizes, BorderRadius, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SettingsRowProps {
  icon: string;
  title: string;
  onPress: () => void;
}

function SettingsRow({ icon, title, onPress }: SettingsRowProps) {
  const iconColor = useThemeColor({}, 'icon');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <IconSymbol name={icon as any} size={24} color={iconColor} />
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color={iconColor} />
    </TouchableOpacity>
  );
}

function Separator() {
  const borderSecondary = useThemeColor({}, 'borderSecondary');
  return <View style={[styles.separator, { backgroundColor: borderSecondary }]} />;
}

export default function AppSettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const borderSecondary = Colors[colorScheme].borderSecondary;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderSecondary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={tintColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <ThemedView style={styles.section}>
            <SettingsRow
              icon="bell.fill"
              title="Notifications"
              onPress={() => router.push('/notification-settings')}
            />
            <Separator />
            <SettingsRow
              icon="moon.fill"
              title="Theme"
              onPress={() => router.push('/theme-settings')}
            />
            <Separator />
            <SettingsRow
              icon="square.and.arrow.up"
              title="Export Data"
              onPress={() => router.push('/export-data')}
            />
            <Separator />
            <SettingsRow
              icon="calendar"
              title="Week Starts On"
              onPress={() => router.push('/week-start-settings')}
            />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowTitle: {
    fontSize: FontSizes.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
});
