// PTO Maxxing — Company Holiday Input

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { CompanyHoliday, ParsedHoliday } from '../models/types';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './theme';
import { formatMonthDay, daysBetween } from '../models/dateUtils';
import { parseHolidayText } from '../parsing/holidayTextParser';

interface Props {
  holidays: CompanyHoliday[];
  onHolidaysChange: (holidays: CompanyHoliday[]) => void;
}

export default function CompanyHolidayInput({ holidays, onHolidaysChange }: Props) {
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [detectedHolidays, setDetectedHolidays] = useState<ParsedHoliday[]>([]);

  const totalDays = holidays.reduce((sum, h) => sum + daysBetween(h.startDate, h.endDate) + 1, 0);

  const addManualHoliday = () => {
    if (!manualName.trim()) return;
    const start = manualStart.trim();
    const end = manualEnd.trim() || start;
    onHolidaysChange([
      ...holidays,
      { id: Date.now().toString(), name: manualName.trim(), startDate: start, endDate: end >= start ? end : start },
    ]);
    setManualName('');
    setManualStart('');
    setManualEnd('');
    setIsAddingManual(false);
  };

  const removeHoliday = (id: string) => {
    onHolidaysChange(holidays.filter(h => h.id !== id));
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
    onHolidaysChange([...holidays, ...newHolidays]);
    setShowImportModal(false);
    setImportText('');
    setDetectedHolidays([]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.headline}>Company Holidays</Text>
      <Text style={styles.subtitle}>Days off your company already gives you</Text>
      {totalDays > 0 && <Text style={styles.subtitle}>+{totalDays} days</Text>}

      {holidays.map(h => (
        <View key={h.id} style={styles.holidayRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.holidayName}>{h.name}</Text>
            <Text style={styles.holidayDates}>
              {formatMonthDay(h.startDate)}{h.startDate !== h.endDate ? ` - ${formatMonthDay(h.endDate)}` : ''} • {daysBetween(h.startDate, h.endDate) + 1} day(s)
            </Text>
          </View>
          <TouchableOpacity onPress={() => removeHoliday(h.id)}>
            <Text style={styles.removeButton}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {isAddingManual ? (
        <View style={styles.manualForm}>
          <Text style={styles.formTitle}>Add manually</Text>
          <TextInput style={styles.input} placeholder="Name" value={manualName} onChangeText={setManualName} />
          <TextInput style={styles.input} placeholder="Start YYYY-MM-DD" value={manualStart} onChangeText={setManualStart} />
          <TextInput style={styles.input} placeholder="End YYYY-MM-DD (optional)" value={manualEnd} onChangeText={setManualEnd} />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsAddingManual(false); setManualName(''); }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={addManualHoliday} disabled={!manualName.trim()}>
              <Text style={styles.addButtonText}>Add Holiday</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.chipButton} onPress={() => setIsAddingManual(true)}>
            <Text style={styles.chipButtonText}>+ Add Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chipButton} onPress={() => setShowImportModal(true)}>
            <Text style={styles.chipButtonText}>📋 Import from Text</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Import Modal */}
      <Modal visible={showImportModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView 
          style={styles.modal} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Company Holidays</Text>
            <TouchableOpacity onPress={() => { setShowImportModal(false); setDetectedHolidays([]); }}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {detectedHolidays.length === 0 ? (
            <View style={styles.modalContent}>
              <Text style={styles.subtitle}>Paste holiday list (each line with name + date)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                value={importText}
                onChangeText={setImportText}
                placeholder="e.g. Independence Day - July 4, 2025&#10;Winter Break - Dec 23 - Jan 2"
              />
              <TouchableOpacity style={styles.addButton} onPress={parseImportText} disabled={!importText.trim()}>
                <Text style={styles.addButtonText}>Parse Holidays</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.headline}>{detectedHolidays.length} detected</Text>
              <ScrollView>
                {detectedHolidays.map((h, i) => (
                  <View key={i} style={styles.holidayRow}>
                    <Text style={styles.holidayName}>{h.name}</Text>
                    <Text style={styles.holidayDates}>{formatMonthDay(h.startDate)} - {formatMonthDay(h.endDate)}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.addButton} onPress={importDetected}>
                <Text style={styles.addButtonText}>Import All</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  headline: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSizes.footnote, color: Colors.secondary, marginBottom: Spacing.sm },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.background,
  },
  holidayName: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  holidayDates: { fontSize: FontSizes.footnote, color: Colors.secondary },
  removeButton: { color: Colors.destructive, fontSize: 18, paddingLeft: Spacing.sm },
  manualForm: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  formTitle: { fontSize: FontSizes.subheadline, fontWeight: '600', marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: FontSizes.body,
  },
  formButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelButtonText: { color: Colors.secondary, fontWeight: '500' },
  addButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  chipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  chipButtonText: { fontSize: FontSizes.footnote, fontWeight: '500' },
  modal: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.lg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: FontSizes.title3, fontWeight: '700' },
  modalClose: { color: Colors.primary, fontSize: FontSizes.body },
  modalContent: { flex: 1 },
  textArea: {
    flex: 1,
    minHeight: 160,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSizes.body,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
});
