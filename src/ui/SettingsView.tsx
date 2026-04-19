// PTO Maxxing — Settings View

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './theme';
import * as SettingsStore from '../storage/settingsStore';
import { DEFAULT_SETTINGS } from '../models/types';

interface Props {
  onBack: () => void;
  onSettingsCleared: () => void;
}

export default function SettingsView({ onBack, onSettingsCleared }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    try {
      const json = await SettingsStore.exportConfig();
      await Share.share({ message: json, title: 'PTO Maxxing Config' });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const handleClear = () => {
    Alert.alert('Clear All Data?', 'This will remove all saved settings and results.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await SettingsStore.clearSettings();
          onSettingsCleared();
          setStatus('success');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.headline}>Data Management</Text>

        <View style={styles.item}>
          <Text style={styles.itemTitle}>Export Configuration</Text>
          <Text style={styles.itemSubtitle}>Download your settings as JSON</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExport}>
            <Text style={styles.actionBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.item}>
          <Text style={styles.itemTitle}>Clear All Data</Text>
          <Text style={styles.itemSubtitle}>Remove all saved settings</Text>
          <TouchableOpacity style={[styles.actionBtn, styles.destructiveBtn]} onPress={handleClear}>
            <Text style={[styles.actionBtnText, styles.destructiveBtnText]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.headline}>Privacy</Text>
        <Text style={styles.privacyText}>
          All your data stays on your device. PTO Maxxing doesn't require sign-in, doesn't track you, and never sends your data to any server. Your PTO plans are 100% private.
        </Text>
      </View>

      {status === 'success' && <Text style={styles.statusText}>Done.</Text>}
      {status === 'error' && <Text style={[styles.statusText, { color: Colors.destructive }]}>Something went wrong.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg },
  backButton: { marginBottom: Spacing.lg },
  backButtonText: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '500' },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  headline: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.md },
  item: { marginBottom: Spacing.lg },
  itemTitle: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  itemSubtitle: { fontSize: FontSizes.footnote, color: Colors.secondary, marginBottom: Spacing.sm },
  actionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  destructiveBtn: { backgroundColor: Colors.background },
  destructiveBtnText: { color: Colors.destructive },
  privacyText: { fontSize: FontSizes.footnote, color: Colors.secondary, lineHeight: 20 },
  statusText: { fontSize: FontSizes.footnote, color: Colors.success, marginTop: Spacing.sm },
});
