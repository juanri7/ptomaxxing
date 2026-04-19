// PTO Maxxing — Phase 0 MVP: The Instant Answer
// Single-screen flow: Input → Result → Action

import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { PlannerSettings, PTOPlan, DEFAULT_SETTINGS, PlanStrategy } from './src/models/types';
import { generatePlans } from './src/engine/solver';
import { loadHolidays } from './src/data/holidaysData';
import { generateICS, copyPTODates } from './src/ics/icsGenerator';
import { todayStr, formatMonthDay, formatFullDay, weekdayName } from './src/models/dateUtils';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './src/ui/theme';

type ViewMode = 'input' | 'results';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [ptoDays, setPtoDays] = useState(15);
  const [strategy, setStrategy] = useState<PlanStrategy>('max-efficiency');
  const [plan, setPlan] = useState<PTOPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePlan = useCallback(() => {
    if (isCalculating) return;
    setIsCalculating(true);

    const year = new Date().getUTCFullYear();
    const settings: PlannerSettings = {
      ...DEFAULT_SETTINGS,
      ptoAvailable: ptoDays,
      startDate: todayStr(),
      endDate: `${year + 1}-12-31`,
      selectedStrategy: strategy,
    };

    const holidays = loadHolidays();
    const generated = generatePlans(holidays, settings);
    setPlan(generated.length > 0 ? generated[0] : null);
    setIsCalculating(false);
    setViewMode('results');
  }, [ptoDays, strategy, isCalculating]);

  const generateRequestText = useCallback(() => {
    if (!plan) return '';
    const lines: string[] = [
      "Hi,",
      "",
      "I'd like to request the following days off:",
      "",
    ];

    for (const brk of plan.breaks) {
      const holidayNames = brk.holidays.map(h => h.name).join(' + ');
      lines.push(`🗓️ ${brk.ptoDays.map(d => `${formatMonthDay(d)} (${weekdayName(d)})`).join(', ')} — ${holidayNames}`);
    }

    lines.push('');
    lines.push(`Total: ${plan.totalPtoUsed} PTO days for ${plan.totalDaysOff} days off.`);
    lines.push('');
    lines.push('Let me know if this works!');
    return lines.join('\n');
  }, [plan]);

  const handleCopyRequest = useCallback(async () => {
    const text = generateRequestText();
    Clipboard.setString(text);
    Alert.alert('Copied! ✅', 'Request text copied to clipboard — paste it in your message to your manager.');
  }, [generateRequestText]);

  const handleShareICS = useCallback(async () => {
    if (!plan) return;
    const ics = generateICS(plan);
    await Share.share({ message: ics, title: 'PTO Maxxing Plan' });
  }, [plan]);

  const handleCopyDates = useCallback(() => {
    if (!plan) return;
    const text = copyPTODates(plan);
    Clipboard.setString(text);
    Alert.alert('Copied! ✅', 'PTO dates copied to clipboard.');
  }, [plan]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>PTO Maxxing ⚡</Text>
          <Text style={styles.appSubtitle}>Get the most out of your time off.</Text>
        </View>

        {viewMode === 'input' ? (
          /* ─── INPUT VIEW ─── */
          <>
            <View style={styles.card}>
              <Text style={styles.inputLabel}>How many PTO days do you have?</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setPtoDays(Math.max(1, ptoDays - 1))}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{ptoDays}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setPtoDays(Math.min(60, ptoDays + 1))}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>Strategy</Text>
              <View style={styles.strategyRow}>
                {([
                  ['max-efficiency', 'Efficiency'],
                  ['max-continuous', 'Long Breaks'],
                  ['balanced', 'Balanced'],
                ] as [PlanStrategy, string][]).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.strategyChip, strategy === key && styles.strategyChipActive]}
                    onPress={() => setStrategy(key)}
                  >
                    <Text style={[styles.strategyChipText, strategy === key && styles.strategyChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.strategyHint}>
                {strategy === 'max-efficiency' && 'Most days off per PTO day'}
                {strategy === 'max-continuous' && 'Longest uninterrupted breaks'}
                {strategy === 'balanced' && 'Mix of both, saves 1 PTO day'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.ctaButton, isCalculating && styles.ctaButtonDisabled]}
              onPress={calculatePlan}
              disabled={isCalculating}
            >
              <Text style={styles.ctaButtonText}>
                {isCalculating ? 'Calculating...' : '🔥 Show My Plan'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>📅 2025-2026 US Federal Holidays</Text>
          </>
        ) : (
          /* ─── RESULTS VIEW ─── */
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setViewMode('input')}>
              <Text style={styles.backButtonText}>← Start Over</Text>
            </TouchableOpacity>

            {plan ? (
              <>
                {/* Hero Stat */}
                <View style={styles.heroCard}>
                  <Text style={styles.heroNumber}>{plan.totalDaysOff}</Text>
                  <Text style={styles.heroLabel}>DAYS OFF</Text>
                  <Text style={styles.heroSub}>
                    {plan.totalPtoUsed} PTO · {plan.efficiency.toFixed(1)}x efficiency
                  </Text>
                </View>

                {/* Break Cards */}
                {plan.breaks.map((brk, i) => {
                  const holidayNames = brk.holidays.map(h => h.name).join(' + ');
                  const holidayWeekdays = brk.holidays.map(h => weekdayName(h.observedDate)).join(', ');
                  const ptoWeekdayNames = brk.ptoDays.map(d => weekdayName(d));

                  return (
                    <View key={`break-${i}`} style={styles.breakCard}>
                      <View style={styles.breakHeader}>
                        <Text style={styles.breakEmoji}>
                          {brk.totalDaysOff >= 7 ? '🔵' : brk.totalDaysOff >= 4 ? '🟢' : '🟡'}
                        </Text>
                        <View style={styles.breakTitleArea}>
                          <Text style={styles.breakTitle}>{holidayNames}</Text>
                          <Text style={styles.breakWeekday}>({holidayWeekdays})</Text>
                        </View>
                      </View>
                      <Text style={styles.breakAction}>
                        Take {brk.ptoDays.length === 1 ? '1 day' : `${brk.ptoDays.length} days`} off → {brk.totalDaysOff} day{brk.totalDaysOff !== 1 ? 's' : ''} off
                      </Text>
                      <Text style={styles.breakDetail}>
                        {formatMonthDay(brk.oooStart)} – {formatMonthDay(brk.oooEnd)} · {brk.ptoUsed} PTO
                      </Text>
                      <View style={styles.ptoDaysRow}>
                        {brk.ptoDays.map((d, j) => (
                          <View key={j} style={styles.ptoDayChip}>
                            <Text style={styles.ptoDayChipText}>
                              {formatMonthDay(d)} ({weekdayName(d)})
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                  <TouchableOpacity style={styles.primaryAction} onPress={handleCopyRequest}>
                    <Text style={styles.primaryActionText}>📋 Copy Request Text</Text>
                  </TouchableOpacity>
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity style={styles.secondaryAction} onPress={handleShareICS}>
                      <Text style={styles.secondaryActionText}>📅 Calendar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryAction} onPress={handleCopyDates}>
                      <Text style={styles.secondaryActionText}>📋 Copy Dates</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No plans could be generated with your settings.</Text>
                <Text style={styles.emptyHint}>Try increasing your PTO days or switching strategy.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // Header
  header: { marginBottom: Spacing.xl, paddingTop: Spacing.md },
  appTitle: { fontSize: 28, fontWeight: '800' },
  appSubtitle: { fontSize: FontSizes.subheadline, color: Colors.secondary, marginTop: 2 },

  // Input
  card: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  inputLabel: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.md },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  stepperButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 28, color: Colors.primary, fontWeight: '600' },
  stepperValue: { fontSize: 40, fontWeight: '800', minWidth: 70, textAlign: 'center' },
  strategyRow: { flexDirection: 'row', gap: Spacing.sm },
  strategyChip: {
    flex: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center',
  },
  strategyChipActive: { backgroundColor: Colors.primary },
  strategyChipText: { fontSize: FontSizes.footnote, fontWeight: '500', color: Colors.secondary },
  strategyChipTextActive: { color: '#fff' },
  strategyHint: { fontSize: FontSizes.caption, color: Colors.secondary, marginTop: Spacing.sm, textAlign: 'center' },

  // CTA
  ctaButton: {
    backgroundColor: Colors.primary, borderRadius: 14,
    padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '700' },
  footerText: { fontSize: FontSizes.caption, color: Colors.secondary, textAlign: 'center', marginTop: Spacing.lg },

  // Results
  backButton: { marginBottom: Spacing.md },
  backButtonText: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '500' },

  // Hero
  heroCard: {
    backgroundColor: Colors.primary, borderRadius: BORDER_RADIUS,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg,
  },
  heroNumber: { fontSize: 56, fontWeight: '900', color: '#fff' },
  heroLabel: { fontSize: FontSizes.footnote, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  heroSub: { fontSize: FontSizes.subheadline, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.xs },

  // Breaks
  breakCard: {
    backgroundColor: Colors.card, borderRadius: BORDER_RADIUS,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    ...CARD_SHADOW,
  },
  breakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  breakEmoji: { fontSize: 20, marginRight: Spacing.sm },
  breakTitleArea: { flex: 1 },
  breakTitle: { fontSize: FontSizes.body, fontWeight: '700' },
  breakWeekday: { fontSize: FontSizes.footnote, color: Colors.secondary },
  breakAction: { fontSize: FontSizes.subheadline, fontWeight: '600', color: Colors.primary, marginBottom: Spacing.xs },
  breakDetail: { fontSize: FontSizes.footnote, color: Colors.secondary, marginBottom: Spacing.sm },
  ptoDaysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  ptoDayChip: {
    backgroundColor: Colors.pto, borderRadius: 6,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  ptoDayChipText: { fontSize: FontSizes.caption, fontWeight: '600', color: Colors.primary },

  // Actions
  actionsSection: { marginTop: Spacing.lg, gap: Spacing.sm },
  primaryAction: {
    backgroundColor: Colors.primary, borderRadius: 14,
    padding: Spacing.lg, alignItems: 'center',
  },
  primaryActionText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: Spacing.sm },
  secondaryAction: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.background,
  },
  secondaryActionText: { fontSize: FontSizes.footnote, fontWeight: '600' },

  // Empty
  emptyCard: {
    backgroundColor: Colors.card, borderRadius: BORDER_RADIUS,
    padding: Spacing.xl, alignItems: 'center',
  },
  emptyText: { fontSize: FontSizes.body, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.sm },
  emptyHint: { fontSize: FontSizes.footnote, color: Colors.secondary, textAlign: 'center' },
});
