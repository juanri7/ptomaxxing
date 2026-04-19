// PTO Maxxing — Settings Persistence (AsyncStorage)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlannerSettings, PTOPlan, DEFAULT_SETTINGS } from '../models/types';

const SETTINGS_KEY = 'pto-maxxing-settings';
const RESULTS_KEY = 'pto-maxxing-last-results';

export async function saveSettings(settings: PlannerSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('SettingsStore.saveSettings error:', e);
  }
}

export async function loadSettings(): Promise<PlannerSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlannerSettings;
  } catch (e) {
    console.warn('SettingsStore.loadSettings error:', e);
    return null;
  }
}

export async function clearSettings(): Promise<void> {
  await AsyncStorage.removeItem(SETTINGS_KEY);
  await AsyncStorage.removeItem(RESULTS_KEY);
}

export async function saveLastResults(results: PTOPlan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.warn('SettingsStore.saveLastResults error:', e);
  }
}

export async function loadLastResults(): Promise<PTOPlan[] | null> {
  try {
    const raw = await AsyncStorage.getItem(RESULTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PTOPlan[];
  } catch (e) {
    console.warn('SettingsStore.loadLastResults error:', e);
    return null;
  }
}

export async function exportConfig(): Promise<string> {
  const settings = await loadSettings();
  const results = await loadLastResults();
  const bundle = {
    settings: settings || DEFAULT_SETTINGS,
    results,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(bundle, null, 2);
}

export async function importConfig(json: string): Promise<boolean> {
  try {
    const bundle = JSON.parse(json);
    if (!bundle.settings) return false;
    await saveSettings(bundle.settings);
    if (bundle.results) await saveLastResults(bundle.results);
    return true;
  } catch {
    return false;
  }
}
