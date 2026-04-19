// PTO Maxxing — Phase 1: Make It Yours
// Personalize without friction. Company context in under 30 seconds.

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
  TextInput,
  Modal,
} from 'react-native';
import { PlannerSettings, PTOPlan, DEFAULT_SETTINGS, PlanStrategy, WeekendPreference, CompanyHoliday } from './src/models/types';
import { generatePlans } from './src/engine/solver';
import { loadHolidays } from './src/data/holidaysData';
import { generateICS, copyPTODates } from './src/ics/icsGenerator';
import { todayStr, formatMonthDay, formatFullDay, weekdayName, weekdayIndexSun0, parseDate } from './src/models/dateUtils';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './src/ui/theme';
import { parseHolidayText } from './src/parsing/holidayTextParser';
import * as SettingsStore from './src/storage/settingsStore';

type ViewMode = 'input' | 'results';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [ptoDays, setPtoDays] = useState(15);
  const [strategy, setStrategy] = useState<PlanStrategy>('max-efficiency');
  const [weekendPref, setWeekendPref] = useState<WeekendPreference>('none');
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([]);
  const [yearStart, setYearStart] = useState(new Date().getUTCFullYear());
  const [yearEnd, setYearEnd] = useState(new Date().getUTCFullYear() + 1);
  const [plan, setPlan] = useState<PTOPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Company holiday modals
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyTab, setCompanyTab] = useState<'manual' | 'text'>('manual');
  const [manualName, setManualName] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [importText, setImportText] = useState('');
  const [detectedHolidays, setDetectedHolidays] = useState<{ name: string; startDate: string; endDate: string }[]>([]);

  // Year range modal
  const [showYearModal, setShowYearModal] = useState(false);
  const [tempYearEnd, setTempYearEnd] = useState('');

  // Holiday summary toggle
  const [showHolidaySummary, setShowHolidaySummary] = useState(false);

  // Load saved settings
  useEffect(() => {
    (async () => {
      const saved = await SettingsStore.loadSettings();
      if (saved) {
        setPtoDays(saved.ptoAvailable);
        setStrategy(saved.selectedStrategy);
        setWeekendPref(saved.weekendPreference);
        setCompanyHolidays(saved.companyHolidays);
        const startYear = new Date(saved.startDate).getUTCFullYear();
        const endYear = new Date(saved.endDate).getUTCFullYear();
        setYearStart(startYear);
        setYearEnd(endYear);
      }
    })();
  }, []);

  const calculatePlan = useCallback(() => {
    if (isCalculating) return;
    setIsCalculating(true);

    const settings: PlannerSettings = {
      ...DEFAULT_SETTINGS,
      ptoAvailable: ptoDays,
      startDate: `${yearStart}-01-01`,
      endDate: `${yearEnd}-12-31`,
      selectedStrategy: strategy,
      weekendPreference: weekendPref,
      companyHolidays,
    };

    // Save settings
    SettingsStore.saveSettings(settings);

    const holidays = loadHolidays();
    const generated = generatePlans(holidays, settings);
    setPlan(generated.length > 0 ? generated[0] : null);
    setIsCalculating(false);
    setViewMode('results');
  }, [ptoDays, strategy, weekendPref, companyHolidays, yearStart, yearEnd, isCalculating]);

  const generateRequestText = useCallback(() => {
    if (!plan) return '';
    const lines = ["Hi,", "", "I'd like to request the following days off:", ""];
    for (const brk of plan.breaks) {
      const holidayNames = brk.holidays.map(h => h.name).join(' + ');
      lines.push(`🗓️ ${brk.ptoDays.map(d => `${formatMonthDay(d)} (${weekdayName(d)})`).join(', ')} — ${holidayNames}`);
    }
    lines.push('');
    lines.push(`Total: ${plan.totalPtoUsed} PTO days for ${plan.totalDaysOff} days off.`);
    lines.push('', 'Let me know if this works!');
    return lines.join('\n');
  }, [plan]);

  const handleCopyRequest = useCallback(async () => {
    Clipboard.setString(generateRequestText());
    Alert.alert('Copied! ✅', 'Request text copied to clipboard.');
  }, [generateRequestText]);

  const handleShareICS = useCallback(async () => {
    if (!plan) return;
    await Share.share({ message: generateICS(plan), title: 'PTO Maxxing Plan' });
  }, [plan]);

  const handleCopyDates = useCallback(() => {
    if (!plan) return;
    Clipboard.setString(copyPTODates(plan));
    Alert.alert('Copied! ✅', 'PTO dates copied to clipboard.');
  }, [plan]);

  // Company holiday helpers
  const addManualHoliday = () => {
    if (!manualName.trim() || !manualStart.trim()) return;
    const end = manualEnd.trim() || manualStart.trim();
    setCompanyHolidays([...companyHolidays, {
      id: Date.now().toString(),
      name: manualName.trim(),
      startDate: manualStart.trim(),
      endDate: end >= manualStart.trim() ? end : manualStart.trim(),
    }]);
    setManualName(''); setManualStart(''); setManualEnd('');
  };

  const removeCompanyHoliday = (id: string) => {
    setCompanyHolidays(companyHolidays.filter(h => h.id !== id));
  };

  const parseImportText = () => {
    const parsed = parseHolidayText(importText);
    setDetectedHolidays(parsed);
  };

  const importDetected = () => {
    const newHolidays = detectedHolidays.map(p => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
    }));
    setCompanyHolidays([...companyHolidays, ...newHolidays]);
    setShowCompanyModal(false);
    setImportText('');
    setDetectedHolidays([]);
  };

  // Holiday weekday summary
  const getHolidayWeekdaySummary = () => {
    const holidays = loadHolidays();
    const startDate = `${yearStart}-01-01`;
    const endDate = `${yearEnd}-12-31`;
    const relevant = holidays.filter(h => h.observedDate >= startDate && h.observedDate <= endDate);

    const groups: Record<string, string[]> = {};
    for (const h of relevant) {
      const day = weekdayName(h.observedDate);
      if (!groups[day]) groups[day] = [];
      groups[day].push(h.name);
    }

    // Deduplicate names per weekday
    for (const key of Object.keys(groups)) {
      groups[key] = [...new Set(groups[key])];
    }

    return groups;
  };

  const totalCompanyDays = companyHolidays.reduce((sum, h) => {
    const start = parseDate(h.startDate);
    const end = parseDate(h.endDate);
    return sum + Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  }, 0);

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
          /* ═══ INPUT VIEW ═══ */
          <>
            {/* PTO Days */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>How many PTO days do you have?</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepperButton} onPress={() => setPtoDays(Math.max(1, ptoDays - 1))}>
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{ptoDays}</Text>
                <TouchableOpacity style={styles.stepperButton} onPress={() => setPtoDays(Math.min(60, ptoDays + 1))}>
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Strategy */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Strategy</Text>
              <View style={styles.strategyRow}>
                {([['max-efficiency', 'Efficiency'], ['max-continuous', 'Long Breaks'], ['balanced', 'Balanced']] as [PlanStrategy, string][]).map(([key, label]) => (
                  <TouchableOpacity key={key} style={[styles.strategyChip, strategy === key && styles.strategyChipActive]} onPress={() => setStrategy(key)}>
                    <Text style={[styles.strategyChipText, strategy === key && styles.strategyChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.strategyHint}>
                {strategy === 'max-efficiency' && 'Most days off per PTO day'}
                {strategy === 'max-continuous' && 'Longest uninterrupted breaks'}
                {strategy === 'balanced' && 'Mix of both, saves 1 PTO day'}
              </Text>
            </View>

            {/* Weekend Preference */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Weekend Preference</Text>
              <View style={styles.strategyRow}>
                {([['none', 'No Pref'], ['friday-heavy', 'Fri Heavy'], ['midweek', 'Midweek']] as [WeekendPreference, string][]).map(([key, label]) => (
                  <TouchableOpacity key={key} style={[styles.strategyChip, weekendPref === key && styles.strategyChipActive]} onPress={() => setWeekendPref(key)}>
                    <Text style={[styles.strategyChipText, weekendPref === key && styles.strategyChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Company Holidays */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.inputLabel}>Company Holidays</Text>
                {companyHolidays.length > 0 && (
                  <Text style={styles.badge}>+{totalCompanyDays} days</Text>
                )}
              </View>
              <Text style={styles.cardHint}>Days your company already gives you off</Text>

              {companyHolidays.length > 0 && (
                <View style={styles.companyList}>
                  {companyHolidays.map(h => (
                    <View key={h.id} style={styles.companyItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.companyItemName}>{h.name}</Text>
                        <Text style={styles.companyItemDate}>
                          {formatMonthDay(h.startDate)}{h.startDate !== h.endDate ? ` - ${formatMonthDay(h.endDate)}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeCompanyHoliday(h.id)}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.companyActions}>
                <TouchableOpacity style={styles.chipBtn} onPress={() => { setCompanyTab('manual'); setShowCompanyModal(true); }}>
                  <Text style={styles.chipBtnText}>+ Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chipBtn} onPress={() => { setCompanyTab('text'); setDetectedHolidays([]); setShowCompanyModal(true); }}>
                  <Text style={styles.chipBtnText}>📋 Paste Text</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Year Range */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.inputLabel}>Year Range</Text>
                <TouchableOpacity onPress={() => { setTempYearEnd(String(yearEnd)); setShowYearModal(true); }}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardHint}>{yearStart} – {yearEnd}</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity style={[styles.ctaButton, isCalculating && styles.ctaButtonDisabled]} onPress={calculatePlan} disabled={isCalculating}>
              <Text style={styles.ctaButtonText}>{isCalculating ? 'Calculating...' : '🔥 Show My Plan'}</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>📅 US Federal Holidays 2025-2029</Text>
          </>
        ) : (
          /* ═══ RESULTS VIEW ═══ */
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setViewMode('input')}>
              <Text style={styles.backButtonText}>← Start Over</Text>
            </TouchableOpacity>

            {plan ? (
              <>
                {/* Hero */}
                <View style={styles.heroCard}>
                  <Text style={styles.heroNumber}>{plan.totalDaysOff}</Text>
                  <Text style={styles.heroLabel}>DAYS OFF</Text>
                  <Text style={styles.heroSub}>{plan.totalPtoUsed} PTO · {plan.efficiency.toFixed(1)}x efficiency</Text>
                </View>

                {/* Holiday Weekday Summary */}
                <TouchableOpacity style={styles.summaryCard} onPress={() => setShowHolidaySummary(!showHolidaySummary)}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.summaryTitle}>📅 Holiday Weekday Summary</Text>
                    <Text style={styles.expandIcon}>{showHolidaySummary ? '▲' : '▼'}</Text>
                  </View>
                  {showHolidaySummary && (
                    <View style={styles.summaryContent}>
                      {Object.entries(getHolidayWeekdaySummary())
                        .sort(([a], [b]) => {
                          const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                          return order.indexOf(a) - order.indexOf(b);
                        })
                        .filter(([day]) => !['Sat', 'Sun'].includes(day))
                        .map(([day, names]) => (
                          <View key={day} style={styles.summaryRow}>
                            <Text style={styles.summaryDay}>{day}:</Text>
                            <Text style={styles.summaryNames}>{names.join(', ')}</Text>
                          </View>
                        ))
                      }
                    </View>
                  )}
                </TouchableOpacity>

                {/* Break Cards */}
                {plan.breaks.map((brk, i) => {
                  const holidayNames = brk.holidays.map(h => h.name).join(' + ');
                  const holidayWeekdays = brk.holidays.map(h => weekdayName(h.observedDate)).join(', ');
                  return (
                    <View key={`break-${i}`} style={styles.breakCard}>
                      <View style={styles.breakHeader}>
                        <Text style={styles.breakEmoji}>{brk.totalDaysOff >= 7 ? '🔵' : brk.totalDaysOff >= 4 ? '🟢' : '🟡'}</Text>
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
                            <Text style={styles.ptoDayChipText}>{formatMonthDay(d)} ({weekdayName(d)})</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {/* Actions */}
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
                <Text style={styles.emptyHint}>Try increasing PTO days, adding company holidays, or switching strategy.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ═══ COMPANY HOLIDAY MODAL ═══ */}
      <Modal visible={showCompanyModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Company Holidays</Text>
            <TouchableOpacity onPress={() => { setShowCompanyModal(false); setDetectedHolidays([]); setImportText(''); }}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Tab selector */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, companyTab === 'manual' && styles.tabActive]} onPress={() => setCompanyTab('manual')}>
              <Text style={[styles.tabText, companyTab === 'manual' && styles.tabTextActive]}>Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, companyTab === 'text' && styles.tabActive]} onPress={() => { setCompanyTab('text'); setDetectedHolidays([]); }}>
              <Text style={[styles.tabText, companyTab === 'text' && styles.tabTextActive]}>Paste Text</Text>
            </TouchableOpacity>
          </View>

          {companyTab === 'manual' ? (
            <View style={styles.modalContent}>
              <Text style={styles.cardHint}>Add your company's paid holidays one at a time.</Text>
              <TextInput style={styles.input} placeholder="Holiday name" value={manualName} onChangeText={setManualName} />
              <TextInput style={styles.input} placeholder="Start date (YYYY-MM-DD)" value={manualStart} onChangeText={setManualStart} />
              <TextInput style={styles.input} placeholder="End date (optional, YYYY-MM-DD)" value={manualEnd} onChangeText={setManualEnd} />
              <TouchableOpacity style={[styles.modalBtn, !manualName.trim() && styles.modalBtnDisabled]} onPress={addManualHoliday} disabled={!manualName.trim()}>
                <Text style={styles.modalBtnText}>Add Holiday</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.modalContent}>
              {detectedHolidays.length === 0 ? (
                <>
                  <Text style={styles.cardHint}>Paste your company holiday list. Each line should have a name + date.</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    value={importText}
                    onChangeText={setImportText}
                    placeholder={"Winter Break - Dec 23 - Jan 2\nIndependence Day - July 4\nLabor Day - Sep 1"}
                  />
                  <TouchableOpacity style={[styles.modalBtn, !importText.trim() && styles.modalBtnDisabled]} onPress={parseImportText} disabled={!importText.trim()}>
                    <Text style={styles.modalBtnText}>Parse Holidays</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.detectedTitle}>{detectedHolidays.length} holidays detected</Text>
                  <ScrollView style={styles.detectedList}>
                    {detectedHolidays.map((h, i) => (
                      <View key={i} style={styles.detectedItem}>
                        <Text style={styles.companyItemName}>{h.name}</Text>
                        <Text style={styles.companyItemDate}>{formatMonthDay(h.startDate)}{h.startDate !== h.endDate ? ` - ${formatMonthDay(h.endDate)}` : ''}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalBtn} onPress={importDetected}>
                    <Text style={styles.modalBtnText}>Import All</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ═══ YEAR RANGE MODAL ═══ */}
      <Modal visible={showYearModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Year Range</Text>
            <TouchableOpacity onPress={() => setShowYearModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.cardHint}>Plan your PTO across multiple years.</Text>
            <Text style={styles.inputLabel}>Start year: {yearStart}</Text>
            <Text style={styles.inputLabel}>End year:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempYearEnd}
              onChangeText={setTempYearEnd}
              placeholder={String(yearEnd)}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={() => {
              const y = parseInt(tempYearEnd);
              if (y >= yearStart && y <= 2030) {
                setYearEnd(y);
                setShowYearModal(false);
              } else {
                Alert.alert('Invalid year', `End year must be between ${yearStart} and 2030.`);
              }
            }}>
              <Text style={styles.modalBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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

  // Shared
  card: {
    backgroundColor: Colors.card, borderRadius: BORDER_RADIUS,
    padding: Spacing.lg, marginBottom: Spacing.md, ...CARD_SHADOW,
  },
  inputLabel: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.sm },
  cardHint: { fontSize: FontSizes.footnote, color: Colors.secondary, marginBottom: Spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    backgroundColor: Colors.success, borderRadius: 10,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    color: '#fff', fontSize: FontSizes.caption, fontWeight: '700',
  },
  editLink: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '600' },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  stepperButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { fontSize: 28, color: Colors.primary, fontWeight: '600' },
  stepperValue: { fontSize: 40, fontWeight: '800', minWidth: 70, textAlign: 'center' },

  // Strategy / Preference chips
  strategyRow: { flexDirection: 'row', gap: Spacing.sm },
  strategyChip: { flex: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center' },
  strategyChipActive: { backgroundColor: Colors.primary },
  strategyChipText: { fontSize: FontSizes.footnote, fontWeight: '500', color: Colors.secondary },
  strategyChipTextActive: { color: '#fff' },
  strategyHint: { fontSize: FontSizes.caption, color: Colors.secondary, marginTop: Spacing.sm, textAlign: 'center' },

  // Company holidays
  companyList: { marginBottom: Spacing.sm },
  companyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.background },
  companyItemName: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  companyItemDate: { fontSize: FontSizes.footnote, color: Colors.secondary },
  removeBtn: { color: Colors.destructive, fontSize: 16, paddingLeft: Spacing.sm },
  companyActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  chipBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: 8, backgroundColor: Colors.background },
  chipBtnText: { fontSize: FontSizes.footnote, fontWeight: '500' },

  // CTA
  ctaButton: { backgroundColor: Colors.primary, borderRadius: 14, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '700' },
  footerText: { fontSize: FontSizes.caption, color: Colors.secondary, textAlign: 'center', marginTop: Spacing.lg },

  // Results
  backButton: { marginBottom: Spacing.md },
  backButtonText: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '500' },

  // Hero
  heroCard: { backgroundColor: Colors.primary, borderRadius: BORDER_RADIUS, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  heroNumber: { fontSize: 56, fontWeight: '900', color: '#fff' },
  heroLabel: { fontSize: FontSizes.footnote, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  heroSub: { fontSize: FontSizes.subheadline, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.xs },

  // Holiday summary
  summaryCard: { backgroundColor: Colors.card, borderRadius: BORDER_RADIUS, padding: Spacing.md, marginBottom: Spacing.md, ...CARD_SHADOW },
  summaryTitle: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  expandIcon: { fontSize: FontSizes.caption, color: Colors.secondary },
  summaryContent: { marginTop: Spacing.sm },
  summaryRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  summaryDay: { fontSize: FontSizes.footnote, fontWeight: '700', width: 45 },
  summaryNames: { fontSize: FontSizes.footnote, color: Colors.secondary, flex: 1 },

  // Break cards
  breakCard: { backgroundColor: Colors.card, borderRadius: BORDER_RADIUS, padding: Spacing.lg, marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.primary, ...CARD_SHADOW },
  breakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  breakEmoji: { fontSize: 20, marginRight: Spacing.sm },
  breakTitleArea: { flex: 1 },
  breakTitle: { fontSize: FontSizes.body, fontWeight: '700' },
  breakWeekday: { fontSize: FontSizes.footnote, color: Colors.secondary },
  breakAction: { fontSize: FontSizes.subheadline, fontWeight: '600', color: Colors.primary, marginBottom: Spacing.xs },
  breakDetail: { fontSize: FontSizes.footnote, color: Colors.secondary, marginBottom: Spacing.sm },
  ptoDaysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  ptoDayChip: { backgroundColor: Colors.pto, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  ptoDayChipText: { fontSize: FontSizes.caption, fontWeight: '600', color: Colors.primary },

  // Actions
  actionsSection: { marginTop: Spacing.lg, gap: Spacing.sm },
  primaryAction: { backgroundColor: Colors.primary, borderRadius: 14, padding: Spacing.lg, alignItems: 'center' },
  primaryActionText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: Spacing.sm },
  secondaryAction: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.background },
  secondaryActionText: { fontSize: FontSizes.footnote, fontWeight: '600' },

  // Empty
  emptyCard: { backgroundColor: Colors.card, borderRadius: BORDER_RADIUS, padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSizes.body, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.sm },
  emptyHint: { fontSize: FontSizes.footnote, color: Colors.secondary, textAlign: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.card },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  modalTitle: { fontSize: FontSizes.title3, fontWeight: '700' },
  modalClose: { color: Colors.primary, fontSize: FontSizes.body, fontWeight: '500' },
  modalContent: { flex: 1, padding: Spacing.lg },
  input: { backgroundColor: Colors.background, borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.sm, fontSize: FontSizes.body },
  textArea: { minHeight: 160, backgroundColor: Colors.background, borderRadius: 12, padding: Spacing.md, fontSize: FontSizes.body, textAlignVertical: 'top', marginBottom: Spacing.md },
  modalBtn: { backgroundColor: Colors.primary, borderRadius: 8, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.body },

  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSizes.footnote, fontWeight: '500', color: Colors.secondary },
  tabTextActive: { color: '#fff' },

  // Detected
  detectedTitle: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.md },
  detectedList: { flex: 1, marginBottom: Spacing.md },
  detectedItem: { paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.background },
});
