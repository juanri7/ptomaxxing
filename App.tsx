// PTO Maxxing — Main App

import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { PlannerSettings, PTOPlan, DEFAULT_SETTINGS } from './src/models/types';
import { generatePlans } from './src/engine/solver';
import { loadHolidays } from './src/data/holidaysData';
import * as SettingsStore from './src/storage/settingsStore';
import { todayStr } from './src/models/dateUtils';
import PlannerView from './src/ui/PlannerView';
import ResultsView from './src/ui/ResultsView';
import SettingsView from './src/ui/SettingsView';
import { Colors, Spacing, FontSizes } from './src/ui/theme';

type Mode = 'planner' | 'results' | 'settings';

export default function App() {
  const [mode, setMode] = useState<Mode>('planner');
  const [settings, setSettings] = useState<PlannerSettings>({
    ...DEFAULT_SETTINGS,
    startDate: todayStr(),
  });
  const [plans, setPlans] = useState<PTOPlan[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    (async () => {
      const saved = await SettingsStore.loadSettings();
      if (saved) setSettings(saved);
    })();
  }, []);

  const calculatePlans = useCallback(() => {
    if (isCalculating) return;
    setIsCalculating(true);

    // Save settings
    SettingsStore.saveSettings(settings);

    // Generate plans
    const holidays = loadHolidays();
    const generated = generatePlans(holidays, settings);

    setPlans(generated);
    SettingsStore.saveLastResults(generated);
    setIsCalculating(false);
    setMode('results');
  }, [settings, isCalculating]);

  const handleSettingsCleared = () => {
    setSettings({ ...DEFAULT_SETTINGS, startDate: todayStr() });
    setPlans([]);
    setMode('planner');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {mode !== 'planner' && (
            <TouchableOpacity style={styles.headerBack} onPress={() => setMode('planner')}>
              <Text style={styles.headerBackText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerTitle}>
            <Text style={styles.appTitle}>PTO Maxxing</Text>
            <Text style={styles.appSubtitle}>Get the most out of your time off.</Text>
          </View>
          {mode === 'planner' && (
            <TouchableOpacity style={styles.settingsButton} onPress={() => setMode('settings')}>
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {mode === 'planner' && (
            <PlannerView
              settings={settings}
              onSettingsChange={setSettings}
              onCalculate={calculatePlans}
              isCalculating={isCalculating}
            />
          )}
          {mode === 'results' && (
            <ResultsView plans={plans} onBack={() => setMode('planner')} />
          )}
          {mode === 'settings' && (
            <SettingsView onBack={() => setMode('planner')} onSettingsCleared={handleSettingsCleared} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerBack: { paddingRight: Spacing.md },
  headerBackText: { fontSize: FontSizes.subheadline, color: Colors.primary, fontWeight: '500' },
  headerTitle: { flex: 1 },
  appTitle: { fontSize: FontSizes.title2, fontWeight: '700' },
  appSubtitle: { fontSize: FontSizes.caption, color: Colors.secondary },
  settingsButton: { padding: Spacing.sm },
  settingsButtonText: { fontSize: 22 },
  content: { flex: 1 },
});
