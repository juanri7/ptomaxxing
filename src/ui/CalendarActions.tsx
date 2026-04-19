// CalendarActions.tsx
// Bundled calendar actions dropdown component

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, Linking, StyleSheet } from 'react-native';
import { PTOPlan } from '../models/types';
import { getCalendarLinks } from '../utils/calendarLinks';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './theme';

type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ics';

const providerConfig: Record<CalendarProvider, { label: string; emoji: string; description: string }> = {
  google: { label: 'Google Calendar', emoji: '📅', description: 'Opens Google Calendar with event prefilled' },
  outlook: { label: 'Outlook', emoji: '📧', description: 'Opens Outlook.com with event prefilled' },
  apple: { label: 'Apple Calendar', emoji: '🍎', description: 'Download ICS file for Apple Calendar' },
  ics: { label: 'ICS File', emoji: '📥', description: 'Generic ICS calendar file (works anywhere)' },
};

export default function CalendarActions({ plan }: { plan: PTOPlan }) {
  const [expanded, setExpanded] = useState(false);

  const handleProviderSelect = (provider: CalendarProvider) => {
    const links = getCalendarLinks(plan);
    setExpanded(false);

    switch (provider) {
      case 'google':
        Linking.openURL(links.google).catch(() => Alert.alert('Cannot open Google Calendar'));
        break;
      case 'outlook':
        Linking.openURL(links.outlook).catch(() => Alert.alert('Cannot open Outlook'));
        break;
      case 'apple':
        Share.share({ message: links.ics, title: 'PTO Maxxing Calendar' });
        break;
      case 'ics':
        Share.share({ message: links.ics, title: 'PTO Maxxing ICS File' });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setExpanded(!expanded)}
        accessibilityLabel="Add to calendar options"
        accessibilityHint="Expands menu with Google Calendar, Outlook, Apple Calendar, and ICS file options"
        accessibilityRole="button"
      >
        <Text style={styles.triggerText}>📅 Add to Calendar</Text>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dropdown}>
          {(['google', 'outlook', 'apple', 'ics'] as CalendarProvider[]).map((provider) => (
            <TouchableOpacity
              key={provider}
              style={styles.option}
              onPress={() => handleProviderSelect(provider)}
              accessibilityLabel={`Add to ${providerConfig[provider].label}`}
              accessibilityHint={providerConfig[provider].description}
              accessibilityRole="button"
            >
              <Text style={styles.optionEmoji}>{providerConfig[provider].emoji}</Text>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>{providerConfig[provider].label}</Text>
                <Text style={styles.optionDescription}>{providerConfig[provider].description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  triggerButton: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.background,
  },
  triggerText: {
    fontSize: FontSizes.subheadline,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  expandIcon: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
  },
  dropdown: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BORDER_RADIUS,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    ...CARD_SHADOW,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 32,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSizes.footnote,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
  },
});