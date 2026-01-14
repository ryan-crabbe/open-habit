/**
 * Export Data Screen
 *
 * Allows users to export their habit data as JSON or CSV.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useDatabase, setLastExportDate } from '@/database';
import { gatherExportData, formatAsJSON, formatAsCSV } from '@/utils/export';
import { getLocalDate } from '@/utils/date';
import { Spacing, FontSizes } from '@/constants/theme';

type ExportFormat = 'json' | 'csv';

interface FormatOptionProps {
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

function FormatOption({ label, description, isSelected, onPress }: FormatOptionProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = isSelected ? tintColor : 'rgba(128, 128, 128, 0.3)';

  return (
    <TouchableOpacity
      style={[styles.formatOption, { borderColor, borderWidth: isSelected ? 2 : 1 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.formatContent}>
        <View style={styles.formatHeader}>
          <ThemedText style={styles.formatLabel}>{label}</ThemedText>
          {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color={tintColor} />}
        </View>
        <ThemedText style={[styles.formatDescription, { color: textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function ExportDataScreen() {
  const { db, isReady } = useDatabase();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');

  const handleExport = async () => {
    if (!db) return;

    setIsExporting(true);
    let file: File | null = null;

    try {
      // Gather all data
      const data = await gatherExportData(db);

      // Format based on selection
      const content = selectedFormat === 'json' ? formatAsJSON(data) : formatAsCSV(data);
      const extension = selectedFormat === 'json' ? 'json' : 'csv';
      const mimeType = selectedFormat === 'json' ? 'application/json' : 'text/csv';

      // Create filename with date
      const filename = `openhabit-${getLocalDate()}.${extension}`;
      file = new File(Paths.cache, filename);

      // Write file
      await file.write(content);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the file
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: 'Export OpenHabit Data',
      });

      // Record export date
      await setLastExportDate(db);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
      // Clean up temp file
      if (file) {
        try {
          await file.delete();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  };

  if (!isReady) {
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
        <ThemedText style={styles.headerTitle}>Export Data</ThemedText>
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={styles.sectionTitle}>Select Format</ThemedText>

        <ThemedView style={[styles.optionsContainer, { backgroundColor: cardBackground }]}>
          <FormatOption
            label="JSON"
            description="Full data export with all details. Best for backups and importing to other apps."
            isSelected={selectedFormat === 'json'}
            onPress={() => setSelectedFormat('json')}
          />
          <FormatOption
            label="CSV"
            description="Spreadsheet format. Good for viewing in Excel or Google Sheets."
            isSelected={selectedFormat === 'csv'}
            onPress={() => setSelectedFormat('csv')}
          />
        </ThemedView>

        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: tintColor }]}
          onPress={handleExport}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="square.and.arrow.up" size={20} color="#fff" />
              <ThemedText style={styles.exportButtonText}>Export {selectedFormat.toUpperCase()}</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <ThemedText style={styles.note}>
          Your data will be saved to a file that you can share, save to Files, or send via email.
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
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  formatOption: {
    borderRadius: 10,
    padding: Spacing.md,
  },
  formatContent: {
    gap: 4,
  },
  formatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  formatDescription: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: Spacing.xl,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  note: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
