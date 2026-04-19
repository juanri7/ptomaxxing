// PTO Maxxing — Planner View (Main Input Screen)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { PlannerSettings, PlanStrategy, WeekendPreference } from '../models/types';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './theme';
import CompanyHolidayInput from './CompanyHolidayInput';

interface Props {
  settings: PlannerSettings;
  onSettingsChange: (settings: PlannerSettings) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export default function PlannerView({ settings, onSettingsChange, onCalculate, isCalculating }: Props) {
  const updateSetting = <K extends keyof PlannerSettings>(key: K, value: PlannerSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* PTO Available */}
      <View style={styles.section}>
        <Text style={styles.headline}>How many PTO days do you have?</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => updateSetting('ptoAvailable', Math.max(1, settings.ptoAvailable - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{settings.ptoAvailable}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => updateSetting('ptoAvailable', Math.min(60, settings.ptoAvailable + 1))}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Range */}
      <View style={styles.section}>
        <Text style={styles.headline}>Date Range</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Start</Text>
          <TextInput
            style={styles.dateInput}
            value={settings.startDate}
            onChangeText={(v) => {
              updateSetting('startDate', v);
              if (v > settings.endDate) updateSetting('endDate', v);
            }}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>End</Text>
          <TextInput
            style={styles.dateInput}
            value={settings.endDate}
            onChangeText={(v) => updateSetting('endDate', v)}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      {/* Strategy */}
      <View style={styles.section}>
        <Text style={styles.headline}>Planning Strategy</Text>
        <View style={styles.strategyRow}>
          {(['max-efficiency', 'max-continuous', 'balanced'] as PlanStrategy[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.strategyChip, settings.selectedStrategy === s && styles.strategyChipActive]}
              onPress={() => updateSetting('selectedStrategy', s)}
            >
              <Text style={[styles.strategyChipText, settings.selectedStrategy === s && styles.strategyChipTextActive]}>
                {s === 'max-efficiency' ? 'Efficiency' : s === 'max-continuous' ? 'Continuous' : 'Balanced'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Weekend Preference */}
      <View style={styles.section}>
        <Text style={styles.headline}>Weekend Preference</Text>
        <View style={styles.strategyRow}>
          {(['none', 'friday-heavy', 'midweek'] as WeekendPreference[]).map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.strategyChip, settings.weekendPreference === w && styles.strategyChipActive]}
              onPress={() => updateSetting('weekendPreference', w)}
            >
              <Text style={[styles.strategyChipText, settings.weekendPreference === w && styles.strategyChipTextActive]}>
                {w === 'none' ? 'No Preference' : w === 'friday-heavy' ? 'Friday Heavy' : 'Midweek'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Company Holidays */}
      <CompanyHolidayInput
        holidays={settings.companyHolidays}
        onHolidaysChange={(h) => updateSetting('companyHolidays', h)}
      />

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaButton, isCalculating && styles.ctaButtonDisabled]}
        onPress={onCalculate}
        disabled={isCalculating}
      >
        <Text style={styles.ctaButtonText}>
          {isCalculating ? 'Calculating...' : 'Generate My Plan'}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Using U.S. Federal Holidays (2025–2029)</Text>
        <Text style={styles.footerText}>Works offline • No sign-in required • 100% private</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  headline: {
    fontSize: FontSizes.headline,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 24, color: Colors.primary, fontWeight: '600' },
  stepperValue: { fontSize: 32, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateLabel: {
    fontSize: FontSizes.subheadline,
    width: 60,
    color: Colors.secondary,
  },
  dateInput: {
    flex: 1,
    fontSize: FontSizes.body,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  strategyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  strategyChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  strategyChipActive: { backgroundColor: Colors.primary },
  strategyChipText: {
    fontSize: FontSizes.footnote,
    fontWeight: '500',
    color: Colors.secondary,
  },
  strategyChipTextActive: { color: '#fff' },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '600' },
  footer: { marginTop: Spacing.lg, alignItems: 'center' },
  footerText: { fontSize: FontSizes.caption, color: Colors.secondary, textAlign: 'center' },
});
