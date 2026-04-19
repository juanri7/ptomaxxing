// PTO Maxxing — Clean Flow
// PTO days → Generate plan (Efficiency default). Company holidays optional, collapsed.

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
import { PlannerSettings, PTOPlan, DEFAULT_SETTINGS, PlanStrategy, CompanyHoliday } from './src/models/types';
import { generatePlans } from './src/engine/solver';
import { loadHolidays } from './src/data/holidaysData';
import { generateICS, copyPTODates } from './src/ics/icsGenerator';
import { todayStr, formatMonthDay, weekdayName, parseDate } from './src/models/dateUtils';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './src/ui/theme';
import { parseHolidayText } from './src/parsing/holidayTextParser';
import * as SettingsStore from './src/storage/settingsStore';

type ViewMode = 'input' | 'results';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [ptoDays, setPtoDays] = useState(15);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([]);
  const [showCompanyBlock, setShowCompanyBlock] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [plan, setPlan] = useState<PTOPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showHolidaySummary, setShowHolidaySummary] = useState(false);

  const loadSettings = async () => {
    const saved = await SettingsStore.loadSettings();
    if (saved) {
      setPtoDays(saved.ptoAvailable);
      if (saved.companyHolidays.length > 0) {
        setCompanyHolidays(saved.companyHolidays);
        setShowCompanyBlock(true);
      }
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const calculatePlan = useCallback(() => {
    if (isCalculating) return;
    setIsCalculating(true);

    const year = new Date().getUTCFullYear();
    const settings: PlannerSettings = {
      ...DEFAULT_SETTINGS,
      ptoAvailable: ptoDays,
      startDate: todayStr(),
      endDate: `${year + 1}-12-31`,
      selectedStrategy: 'max-efficiency',
      companyHolidays,
    };

    SettingsStore.saveSettings(settings);

    const holidays = loadHolidays();
    const generated = generatePlans(holidays, settings);
    setPlan(generated.length > 0 ? generated[0] : null);
    setIsCalculating(false);
    setViewMode('results');
  }, [ptoDays, companyHolidays, isCalculating]);

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

  const handleCopyRequest = useCallback(() => {
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

  const addManualHoliday = (name: string, date: string) => {
    if (!name.trim() || !date.trim()) return;
    setCompanyHolidays([...companyHolidays, {
      id: Date.now().toString(),
      name: name.trim(),
      startDate: date.trim(),
      endDate: date.trim(),
    }]);
  };

  const removeCompanyHoliday = (id: string) => {
    setCompanyHolidays(companyHolidays.filter(h => h.id !== id));
  };

  const getHolidayWeekdaySummary = () => {
    const holidays = loadHolidays();
    const year = new Date().getUTCFullYear();
    const start = `${year}-01-01`;
    const end = `${year + 1}-12-31`;
    const relevant = holidays.filter(h => h.observedDate >= start && h.observedDate <= end);

    const groups: Record<string, string[]> = {};
    for (const h of relevant) {
      const day = weekdayName(h.observedDate);
      if (!groups[day]) groups[day] = [];
      groups[day].push(h.name);
    }
    for (const key of Object.keys(groups)) groups[key] = [...new Set(groups[key])];
    return groups;
  };

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
          /* ─── INPUT ─── */
          <>
            {/* PTO days */}
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

            {/* Company holidays — optional, collapsed */}
            {showCompanyBlock ? (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.inputLabel}>Company Holidays</Text>
                  <TouchableOpacity onPress={() => setShowCompanyModal(true)}>
                    <Text style={styles.editLink}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {companyHolidays.length > 0 && (
                  <View style={styles.companyList}>
                    {companyHolidays.map(h => (
                      <View key={h.id} style={styles.companyItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.companyItemName}>{h.name}</Text>
                          <Text style={styles.companyItemDate}>{formatMonthDay(h.startDate)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeCompanyHoliday(h.id)}>
                          <Text style={styles.removeBtn}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.card} onPress={() => setShowCompanyBlock(true)}>
                <Text style={styles.addHolidayText}>➕ Add company holidays (optional)</Text>
                <Text style={styles.addHolidayHint}>Days your company already gives you off</Text>
              </TouchableOpacity>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, isCalculating && styles.ctaButtonDisabled]}
              onPress={calculatePlan}
              disabled={isCalculating}
            >
              <Text style={styles.ctaButtonText}>
                {isCalculating ? 'Calculating...' : '🔥 Show My Plan'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>📅 US Federal Holidays 2025‑2029</Text>
            <Text style={styles.footerHint}>Strategy: Maximum Efficiency (most days off per PTO day)</Text>
          </>
        ) : (
          /* ─── RESULTS ─── */
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

                {/* Holiday weekday summary */}
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

                {/* Break cards */}
                {plan.breaks.map((brk, i) => {
                  const holidayNames = brk.holidays.map(h => h.name).join(' + ');
                  const holidayWeekdays = brk.holidays.map(h => weekdayName(h.observedDate)).join(', ');
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
                <Text style={styles.emptyHint}>Try increasing PTO days or adding company holidays.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Company holidays modal (simple) */}
      <Modal visible={showCompanyModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Company Holidays</Text>
            <TouchableOpacity onPress={() => setShowCompanyModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.cardHint}>Add your company's paid holidays.</Text>
            <CompanyHolidayModalContent
              companyHolidays={companyHolidays}
              onAdd={addManualHoliday}
              onImport={(text) => {
                const parsed = parseHolidayText(text);
                for (const h of parsed) addManualHoliday(h.name, h.startDate);
                setShowCompanyModal(false);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Simple modal content component
const CompanyHolidayModalContent: React.FC<{
  companyHolidays: CompanyHoliday[];
  onAdd: (name: string, date: string) => void;
  onImport: (text: string) => void;
}> = ({ onAdd, onImport }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [importText, setImportText] = useState('');
  const [tab, setTab] = useState<'manual' | 'text'>('manual');

  return (
    <>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'manual' && styles.tabActive]} onPress={() => setTab('manual')}>
          <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'text' && styles.tabActive]} onPress={() => setTab('text')}>
          <Text style={[styles.tabText, tab === 'text' && styles.tabTextActive]}>Paste Text</Text>
        </TouchableOpacity>
      </View>

      {tab === 'manual' ? (
        <>
          <TextInput style={styles.input} placeholder="Holiday name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Date (YYYY‑MM‑DD)" value={date} onChangeText={setDate} />
          <TouchableOpacity
            style={[styles.modalBtn, (!name.trim() || !date.trim()) && styles.modalBtnDisabled]}
            onPress={() => { onAdd(name, date); setName(''); setDate(''); }}
            disabled={!name.trim() || !date.trim()}
          >
            <Text style={styles.modalBtnText}>Add Holiday</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.textArea}
            multiline
            value={importText}
            onChangeText={setImportText}
            placeholder={"Winter Break - Dec 23 - Jan 2\nIndependence Day - July 4\nLabor Day - Sep 1"}
          />
          <TouchableOpacity
            style={[styles.modalBtn, !importText.trim() && styles.modalBtnDisabled]}
            onPress={() => onImport(importText)}
            disabled={!importText.trim()}
          >
            <Text style={styles.modalBtnText}>Import Holidays</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // Header
  header: { marginBottom: Spacing.xl, paddingTop: Spacing.md },
  appTitle: { fontSize: 28, fontWeight: '800' },
  appSubtitle: { fontSize: FontSizes.subheadline, color: Colors.secondary, marginTop: 2 },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  inputLabel: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.md },
  cardHint: { fontSize: FontSizes.footnote, color: Colors.secondary, marginBottom: Spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '600' },

  // Add holidays
  addHolidayText: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: 4 },
  addHolidayHint: { fontSize: FontSizes.caption, color: Colors.secondary },

  // Company list
  companyList: { marginTop: Spacing.sm },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.background,
  },
  companyItemName: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  companyItemDate: { fontSize: FontSizes.footnote, color: Colors.secondary },
  removeBtn: { color: Colors.destructive, fontSize: 16, paddingLeft: Spacing.sm },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 28, color: Colors.primary, fontWeight: '600' },
  stepperValue: { fontSize: 40, fontWeight: '800', minWidth: 70, textAlign: 'center' },

  // CTA
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '700' },

  // Footer
  footerText: { fontSize: FontSizes.caption, color: Colors.secondary, textAlign: 'center', marginTop: Spacing.lg },
  footerHint: { fontSize: FontSizes.caption, color: Colors.secondary, textAlign: 'center', marginTop: 2 },

  // Results
  backButton: { marginBottom: Spacing.md },
  backButtonText: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '500' },

  // Hero
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroNumber: { fontSize: 56, fontWeight: '900', color: '#fff' },
  heroLabel: { fontSize: FontSizes.footnote, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  heroSub: { fontSize: FontSizes.subheadline, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.xs },

  // Holiday summary
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  summaryTitle: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  expandIcon: { fontSize: FontSizes.caption, color: Colors.secondary },
  summaryContent: { marginTop: Spacing.sm },
  summaryRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  summaryDay: { fontSize: FontSizes.footnote, fontWeight: '700', width: 45 },
  summaryNames: { fontSize: FontSizes.footnote, color: Colors.secondary, flex: 1 },

  // Break cards
  breakCard: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
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
    backgroundColor: Colors.pto,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  ptoDayChipText: { fontSize: FontSizes.caption, fontWeight: '600', color: Colors.primary },

  // Actions
  actionsSection: { marginTop: Spacing.lg, gap: Spacing.sm },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  primaryActionText: { color: '#fff', fontSize: FontSizes.body, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: Spacing.sm },
  secondaryAction: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.background,
  },
  secondaryActionText: { fontSize: FontSizes.footnote, fontWeight: '600' },

  // Empty
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: { fontSize: FontSizes.body, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.sm },
  emptyHint: { fontSize: FontSizes.footnote, color: Colors.secondary, textAlign: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.card },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  modalTitle: { fontSize: FontSizes.title3, fontWeight: '700' },
  modalClose: { color: Colors.primary, fontSize: FontSizes.body, fontWeight: '500' },
  modalContent: { flex: 1, padding: Spacing.lg },

  // Inputs
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    fontSize: FontSizes.body,
  },
  textArea: {
    minHeight: 160,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  modalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.body },

  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSizes.footnote, fontWeight: '500', color: Colors.secondary },
  tabTextActive: { color: '#fff' },
});