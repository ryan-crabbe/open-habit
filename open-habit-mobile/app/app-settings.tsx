/**
 * App Settings Screen
 *
 * Accessible from gear icon in header. Contains app configuration options.
 */

import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
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

export default function AppSettingsScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const borderSecondary = Colors[colorScheme ?? 'light'].borderSecondary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content}>
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
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  backText: {
    fontSize: 17,
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
});
