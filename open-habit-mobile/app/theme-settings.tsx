/**
 * Theme Settings Screen
 *
 * Allows user to select theme preference: System, Light, or Dark.
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppTheme, ThemePreference } from '@/hooks/use-app-theme';
import { Spacing, FontSizes } from '@/constants/theme';

interface OptionRowProps {
  label: string;
  description?: string;
  isSelected: boolean;
  onPress: () => void;
}

function OptionRow({ label, description, isSelected, onPress }: OptionRowProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.optionContent}>
        <ThemedText style={styles.optionLabel}>{label}</ThemedText>
        {description && (
          <ThemedText style={[styles.optionDescription, { color: textSecondary }]}>
            {description}
          </ThemedText>
        )}
      </View>
      {isSelected && <IconSymbol name="checkmark" size={20} color={tintColor} />}
    </TouchableOpacity>
  );
}

export default function ThemeSettingsScreen() {
  const { preference, setPreference, isLoading } = useAppTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');

  const handleSelect = async (pref: ThemePreference) => {
    if (pref === preference) return;
    await setPreference(pref);
    router.back();
  };

  if (isLoading) {
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
        <ThemedText style={styles.headerTitle}>Theme</ThemedText>
        <View style={styles.headerButton} />
      </View>

      {/* Options */}
      <View style={styles.content}>
        <ThemedView style={[styles.optionsContainer, { backgroundColor: cardBackground }]}>
          <OptionRow
            label="System"
            description="Match device settings"
            isSelected={preference === 'system'}
            onPress={() => handleSelect('system')}
          />
          <View style={styles.separator} />
          <OptionRow
            label="Light"
            isSelected={preference === 'light'}
            onPress={() => handleSelect('light')}
          />
          <View style={styles.separator} />
          <OptionRow
            label="Dark"
            isSelected={preference === 'dark'}
            onPress={() => handleSelect('dark')}
          />
        </ThemedView>
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
    borderBottomColor: undefined,
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
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSizes.md,
  },
  optionDescription: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: undefined,
    marginLeft: Spacing.lg,
  },
});
