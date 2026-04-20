// PTO Maxxing — Gen Z Redesign
// Bright, energetic, mobile‑first, snackable ⚡

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
  Linking,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import { PlannerSettings, PTOPlan, DEFAULT_SETTINGS, CompanyHoliday } from './src/models/types';
import { generatePlans } from './src/engine/solver';
import { loadHolidays } from './src/data/holidaysData';
import { generateICS, copyPTODates } from './src/ics/icsGenerator';
import { getCalendarLinks } from './src/utils/calendarLinks';
import { todayStr, formatMonthDay, weekdayName } from './src/models/dateUtils';
import { Colors, TextColors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW, HERO_SHADOW } from './src/ui/theme';
import CalendarActions from './src/ui/CalendarActions';
import Confetti from './src/ui/Confetti';
import { SkeletonCard, SkeletonHero } from './src/ui/Skeleton';
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
  const [copyFeedback, setCopyFeedback] = useState<'' | 'request' | 'dates'>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1)); // For transitions
  const [pulseAnim] = useState(new Animated.Value(1)); // For loading pulse

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

  // Android back button handling
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (viewMode === 'results') {
          setViewMode('input');
          return true; // Prevent default back behavior
        }
        return false; // Allow default
      });
      return () => backHandler.remove();
    }
  }, [viewMode]);

  // Pulse animation for loading text
  useEffect(() => {
    if (isCalculating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isCalculating, pulseAnim]);

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
    
    // Fade transition to results
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setViewMode('results');
    
    // Trigger confetti celebration
    if (generated.length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000); // Auto‑hide after 2s
    }
  }, [ptoDays, companyHolidays, isCalculating]);

  const generateRequestText = useCallback(() => {
    if (!plan) return '';
    const lines = ["Hey 👋", "", "I’m planning my time off — can I grab these dates?", ""];
    for (const brk of plan.breaks) {
      const holidayNames = brk.holidays.map(h => h.name).join(' + ');
      const ptoList = brk.ptoDays.map(d => `${formatMonthDay(d)} (${weekdayName(d)})`).join(', ');
      lines.push(`🗓️ ${ptoList} — ${holidayNames}`);
    }
    lines.push('');
    lines.push(`Total: ${plan.totalPtoUsed} PTO days → ${plan.totalDaysOff} days off (${plan.efficiency.toFixed(1)}× efficiency).`);
    lines.push('', 'Cool? Let me know!');
    return lines.join('\n');
  }, [plan]);

  const handleCopyRequest = useCallback(() => {
    Clipboard.setString(generateRequestText());
    setCopyFeedback('request');
    setTimeout(() => setCopyFeedback(''), 2000);
  }, [generateRequestText]);

  const handleShareICS = useCallback(async () => {
    if (!plan) return;
    await Share.share({ message: generateICS(plan), title: 'My PTO Maxxing Plan' });
  }, [plan]);

  const handleCopyDates = useCallback(() => {
    if (!plan) return;
    Clipboard.setString(copyPTODates(plan));
    setCopyFeedback('dates');
    setTimeout(() => setCopyFeedback(''), 2000);
  }, [plan]);

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

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={Platform.OS === 'android' ? Colors.background : 'transparent'}
      />
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>PTO Maxxing ⚡</Text>
          <Text style={styles.appSubtitle}>Hack your time off. More days, less PTO.</Text>
        </View>

        {viewMode === 'input' ? (
          // ---------- INPUT VIEW ----------
          <>
            {/* Hero stepper */}
            <View style={[styles.card, styles.heroCard]} accessibilityLabel="PTO days selector" accessibilityRole="adjustable">
              <Text style={styles.inputLabel}>How many PTO days do you have?</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setPtoDays(Math.max(1, ptoDays - 1))}
                  accessibilityLabel="Decrease PTO days"
                  accessibilityHint="Reduces PTO days count by one"
                  accessibilityRole="button"
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepperValueWrapper} accessibilityLabel={`${ptoDays} PTO days selected`}>
                  <Text style={styles.stepperValue}>{ptoDays}</Text>
                  <Text style={styles.stepperLabel}>days</Text>
                </View>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setPtoDays(Math.min(60, ptoDays + 1))}
                  accessibilityLabel="Increase PTO days"
                  accessibilityHint="Adds one PTO day to count"
                  accessibilityRole="button"
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.stepperHint}>Tap ± to adjust</Text>
            </View>

            {/* Company holidays */}
            {showCompanyBlock ? (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.inputLabel}>Company Holidays</Text>
                  <TouchableOpacity onPress={() => setShowCompanyModal(true)} style={styles.chipBtn}>
                    <Text style={styles.chipBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardHint}>Days your company already gives you off</Text>
                {companyHolidays.length > 0 && (
                  <View style={styles.companyList}>
                    {companyHolidays.map(h => (
                      <View key={h.id} style={styles.companyItem}>
                        <View style={styles.companyItemText}>
                          <Text style={styles.companyItemName}>{h.name}</Text>
                          <Text style={styles.companyItemDate}>{formatMonthDay(h.startDate)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setCompanyHolidays(companyHolidays.filter(ch => ch.id !== h.id))}>
                          <Text style={styles.removeBtn}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.card} onPress={() => setShowCompanyBlock(true)}>
                <Text style={styles.addHolidayTitle}>➕ Add company holidays</Text>
                <Text style={styles.addHolidayHint}>Optional – days your company already gives you off</Text>
              </TouchableOpacity>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, isCalculating && styles.ctaButtonDisabled]}
              onPress={calculatePlan}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <Animated.Text style={[styles.ctaButtonText, { opacity: pulseAnim }]}>
                  Optimizing… ✨
                </Animated.Text>
              ) : (
                <Text style={styles.ctaButtonText}>
                  🔥 Show My Optimized Plan
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>📅 US Federal Holidays 2025‑2029 · Strategy: Maximum Efficiency</Text>
          </>
        ) : (
          // ---------- RESULTS VIEW ----------
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setViewMode('input')}>
              <Text style={styles.backButtonText}>← Start Over</Text>
            </TouchableOpacity>

            {isCalculating ? (
              // Loading skeletons
              <>
                <SkeletonHero />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : plan ? (
              <>
                {/* Hero stat */}
                <View style={[styles.card, styles.resultHero]} accessibilityLabel="Plan summary" accessibilityHint={`${plan.totalDaysOff} days off using ${plan.totalPtoUsed} PTO days`}>
                  <Text style={styles.heroNumber}>{plan.totalDaysOff}</Text>
                  <Text style={styles.heroLabel}>DAYS OFF</Text>
                  <View style={styles.heroSubRow}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{plan.totalPtoUsed} PTO days</Text>
                    </View>
                    <Text style={styles.heroEfficiency}>{plan.efficiency.toFixed(1)}× efficiency</Text>
                  </View>
                  <Text style={styles.heroHint}>That’s how you hack your time off 💪</Text>
                </View>

                {/* Holiday weekday summary */}
                <TouchableOpacity
                  style={styles.summaryCard}
                  onPress={() => setShowHolidaySummary(!showHolidaySummary)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.summaryTitle}>📅 Holiday Weekday Summary</Text>
                    <Text style={styles.expandIcon}>{showHolidaySummary ? '▲' : '▼'}</Text>
                  </View>
                  {showHolidaySummary && (
                    <View style={styles.summaryGrid}>
                      {Object.entries(getHolidayWeekdaySummary())
                        .sort(([a], [b]) => ['Mon','Tue','Wed','Thu','Fri'].indexOf(a) - ['Mon','Tue','Wed','Thu','Fri'].indexOf(b))
                        .filter(([day]) => !['Sat','Sun'].includes(day))
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
                  const borderColor = brk.totalDaysOff >= 7 ? '#44C29C' : brk.totalDaysOff >= 4 ? '#4340BC' : '#C32077';
                  const emoji = brk.totalDaysOff >= 7 ? '🔵' : brk.totalDaysOff >= 4 ? '🟢' : '🟡';
                  return (
                    <View key={`break-${i}`} style={[styles.breakCard, { borderLeftColor: borderColor }]}>
                      <View style={styles.breakHeader}>
                        <Text style={styles.breakEmoji}>{emoji}</Text>
                        <View style={styles.breakTitleArea}>
                          <Text style={styles.breakTitle}>{holidayNames}</Text>
                          <Text style={styles.breakWeekday}>({holidayWeekdays})</Text>
                        </View>
                      </View>
                      <Text style={styles.breakAction}>
                        Take {brk.ptoDays.length} day{brk.ptoDays.length !== 1 ? 's' : ''} off → {brk.totalDaysOff} day{brk.totalDaysOff !== 1 ? 's' : ''} off
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
                  <TouchableOpacity 
                    style={styles.primaryAction} 
                    onPress={handleCopyRequest}
                    accessibilityLabel="Copy request text"
                    accessibilityHint="Copies formatted message to send to your manager"
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryActionText}>
                      {copyFeedback === 'request' ? '✅ Copied!' : '📋 Copy Request Text'}
                    </Text>
                  </TouchableOpacity>

                  {/* Calendar dropdown */}
                  <CalendarActions plan={plan} />

                  <TouchableOpacity 
                    style={styles.secondaryAction} 
                    onPress={handleCopyDates}
                    accessibilityLabel="Copy dates only"
                    accessibilityHint="Copies just the PTO dates without holiday names"
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryActionText}>
                      {copyFeedback === 'dates' ? '✅ Dates copied!' : '📋 Copy Dates Only'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : !plan ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>💡 No plans found.</Text>
                <Text style={styles.emptyHint}>Try increasing PTO days or adding company holidays.</Text>
              </View>
            ) : null}
          </>
        )}
        </ScrollView>
      </Animated.View>

      {/* Confetti celebration */}
      <Confetti active={showConfetti} />

      {/* Company holidays modal */}
      <Modal visible={showCompanyModal} animationType="slide" presentationStyle="pageSheet">
        <CompanyHolidayModal
          onClose={() => setShowCompanyModal(false)}
          onAdd={(list) => {
            setCompanyHolidays([...companyHolidays, ...list]);
            setShowCompanyModal(false);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ----- Modal Component -----
const CompanyHolidayModal: React.FC<{
  onClose: () => void;
  onAdd: (holidays: CompanyHoliday[]) => void;
}> = ({ onClose, onAdd }) => {
  const [tab, setTab] = useState<'manual' | 'import'>('manual');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [importText, setImportText] = useState('');

  const addManual = () => {
    if (!name.trim() || !date.trim()) return;
    onAdd([{
      id: Date.now().toString(),
      name: name.trim(),
      startDate: date.trim(),
      endDate: date.trim(),
    }]);
    setName('');
    setDate('');
  };

  const importParse = () => {
    const parsed = parseHolidayText(importText);
    const holidays = parsed.map(p => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
    }));
    onAdd(holidays);
  };

  return (
    <SafeAreaView style={styles.modalSafeArea}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Company Holidays</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalClose}>Done</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'manual' && styles.tabActive]} onPress={() => setTab('manual')}>
          <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>➕ Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'import' && styles.tabActive]} onPress={() => setTab('import')}>
          <Text style={[styles.tabText, tab === 'import' && styles.tabTextActive]}>📋 Paste Text</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
        {tab === 'manual' ? (
          <>
            <TextInput style={styles.input} placeholder="Holiday name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Date (YYYY‑MM‑DD)" value={date} onChangeText={setDate} />
            <TouchableOpacity style={[styles.modalBtn, (!name.trim() || !date.trim()) && styles.modalBtnDisabled]} onPress={addManual} disabled={!name.trim() || !date.trim()}>
              <Text style={styles.modalBtnText}>Add Holiday</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder={"Winter Break – Dec 23 – Jan 2\nIndependence Day – July 4\nLabor Day – Sep 1"}
              value={importText}
              onChangeText={setImportText}
            />
            <TouchableOpacity style={[styles.modalBtn, !importText.trim() && styles.modalBtnDisabled]} onPress={importParse} disabled={!importText.trim()}>
              <Text style={styles.modalBtnText}>Import Holidays</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ----- Stylesheet -----
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { 
    padding: Spacing.lg, 
    paddingBottom: Spacing.xxl,
    maxWidth: 600, // Better readability on tablets/desktop
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: { marginBottom: Spacing.xl, paddingTop: Spacing.md },
  appTitle: { fontSize: FontSizes.title1, fontWeight: '900', color: Colors.textPrimary },
  appSubtitle: { fontSize: FontSizes.subheadline, color: Colors.textSecondary, marginTop: Spacing.xs },

  // Cards
  card: { backgroundColor: Colors.surface, borderRadius: BORDER_RADIUS * 1.5, padding: Spacing.xl, marginBottom: Spacing.xl, ...CARD_SHADOW },
  heroCard: { alignItems: 'center', backgroundColor: Colors.surfaceSubtle, borderWidth: 2, borderColor: Colors.secondary }, // Secondary border for input container
  resultHero: { ...HERO_SHADOW, alignItems: 'center', backgroundColor: Colors.holiday }, // Dark green for holiday cards (accessibility)
  summaryCard: { backgroundColor: Colors.surface, borderRadius: BORDER_RADIUS, padding: Spacing.lg, marginBottom: Spacing.xl, ...CARD_SHADOW },
  breakCard: { backgroundColor: Colors.surface, borderRadius: BORDER_RADIUS, padding: Spacing.lg, marginBottom: Spacing.lg, borderLeftWidth: 6, ...CARD_SHADOW },

  // Input
  inputLabel: { fontSize: FontSizes.title3, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  cardHint: { fontSize: FontSizes.footnote, color: Colors.textHint, textAlign: 'center', marginBottom: Spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xxl },
  stepperButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { fontSize: FontSizes.title1, fontWeight: '900', color: '#FFFFFF' },
  stepperValueWrapper: { alignItems: 'center', justifyContent: 'center', minWidth: 100 },
  stepperValue: { fontSize: 56, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  stepperLabel: { fontSize: FontSizes.body, color: Colors.textSecondary, marginTop: -Spacing.sm },
  stepperHint: { fontSize: FontSizes.caption, color: Colors.textSecondary, marginTop: Spacing.lg, textAlign: 'center' },

  // Company holidays
  chipBtn: { backgroundColor: Colors.accent, borderRadius: 20, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  chipBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: FontSizes.footnote },
  companyList: { marginTop: Spacing.md },
  companyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.background },
  companyItemText: { flex: 1 },
  companyItemName: { fontSize: FontSizes.subheadline, fontWeight: '600', color: Colors.textPrimary },
  companyItemDate: { fontSize: FontSizes.footnote, color: Colors.textSecondary },
  removeBtn: { color: Colors.destructive, fontSize: 18, paddingLeft: Spacing.md },
  addHolidayTitle: { fontSize: FontSizes.headline, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  addHolidayHint: { fontSize: FontSizes.footnote, color: Colors.textSecondary, textAlign: 'center' },

  // CTA
  ctaButton: { backgroundColor: Colors.primary, borderRadius: 24, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm, ...HERO_SHADOW },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: '#FFFFFF', fontSize: FontSizes.title3, fontWeight: '900' },
  footerText: { fontSize: FontSizes.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg },

  // Results
  backButton: { marginBottom: Spacing.lg },
  backButtonText: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '600' },

  // Hero result
  heroNumber: { fontSize: 56, fontWeight: '900', color: '#FFFFFF' },
  heroLabel: { fontSize: FontSizes.footnote, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 2, marginTop: Spacing.xs },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.md },
  chip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  chipText: { color: '#FFFFFF', fontWeight: '600', fontSize: FontSizes.footnote },
  heroEfficiency: { color: 'rgba(255,255,255,0.9)', fontSize: FontSizes.subheadline, fontWeight: '600' },
  heroHint: { marginTop: Spacing.lg, fontSize: FontSizes.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  // Summary
  summaryTitle: { fontSize: FontSizes.headline, fontWeight: '700', color: Colors.textPrimary },
  expandIcon: { fontSize: FontSizes.caption, color: Colors.textSecondary },
  summaryGrid: { marginTop: Spacing.lg },
  summaryRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  summaryDay: { fontSize: FontSizes.footnote, fontWeight: '700', color: Colors.textPrimary, width: 45 },
  summaryNames: { fontSize: FontSizes.footnote, color: Colors.textSecondary, flex: 1 },

  // Break card
  breakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  breakEmoji: { fontSize: 24, marginRight: Spacing.md },
  breakTitleArea: { flex: 1 },
  breakTitle: { fontSize: FontSizes.headline, fontWeight: '700', color: Colors.textPrimary },
  breakWeekday: { fontSize: FontSizes.footnote, color: Colors.textSecondary },
  breakAction: { fontSize: FontSizes.title3, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.xs },
  breakDetail: { fontSize: FontSizes.footnote, color: Colors.textSecondary, marginBottom: Spacing.md },
  ptoDaysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  ptoDayChip: { backgroundColor: '#E4FAF5', borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  ptoDayChipText: { fontSize: FontSizes.caption, fontWeight: '600', color: Colors.primary },

  // Actions
  actionsSection: { marginTop: Spacing.lg, gap: Spacing.lg },
  primaryAction: { backgroundColor: Colors.primary, borderRadius: 24, padding: Spacing.lg, alignItems: 'center', ...HERO_SHADOW },
  primaryActionText: { color: Colors.onPrimary, fontSize: FontSizes.title3, fontWeight: '900' },
  secondaryAction: { backgroundColor: Colors.surfaceSubtle, borderRadius: 20, padding: Spacing.lg, alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
  secondaryActionText: { fontSize: FontSizes.subheadline, fontWeight: '600', color: Colors.textPrimary },

  // Empty
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BORDER_RADIUS, padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSizes.title2, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  emptyHint: { fontSize: FontSizes.footnote, color: Colors.textSecondary, textAlign: 'center' },

  // Modal
  modalSafeArea: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl },
  modalTitle: { fontSize: FontSizes.title2, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: FontSizes.body, color: Colors.primary, fontWeight: '600' },
  modalScroll: { flex: 1 },
  modalContent: { padding: Spacing.xl },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, gap: Spacing.md },
  tab: { flex: 1, paddingVertical: Spacing.md, borderRadius: BORDER_RADIUS, backgroundColor: Colors.background, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSizes.subheadline, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: Spacing.lg, fontSize: FontSizes.body, marginBottom: Spacing.md },
  textArea: { minHeight: 200, backgroundColor: Colors.background, borderRadius: 12, padding: Spacing.lg, fontSize: FontSizes.body, textAlignVertical: 'top', marginBottom: Spacing.md },
  modalBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { color: '#FFFFFF', fontSize: FontSizes.body, fontWeight: '700' },
});