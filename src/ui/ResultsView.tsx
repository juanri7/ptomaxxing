// PTO Maxxing — Results View (Plan Display)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { PTOPlan, Break } from '../models/types';
import { Colors, Spacing, FontSizes, BORDER_RADIUS, CARD_SHADOW } from './theme';
import { formatMonthDay, formatFullDay } from '../models/dateUtils';
import { generateICS, copyPTODates } from '../ics/icsGenerator';

interface Props {
  plans: PTOPlan[];
  onBack: () => void;
}

export default function ResultsView({ plans, onBack }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  if (plans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No plans could be generated with your settings.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Adjust Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.chipButton} onPress={onBack}>
          <Text style={styles.chipButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleChip, viewMode === 'list' && styles.toggleChipActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, viewMode === 'calendar' && styles.toggleChipActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.planTitle}>Your {plans[0].name} Plan</Text>

      {plans.map(plan => (
        <View key={plan.type} style={styles.planCard}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Days Off</Text>
              <Text style={styles.statValue}>{plan.totalDaysOff}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>PTO Used</Text>
              <Text style={styles.statValue}>{plan.totalPtoUsed}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Efficiency</Text>
              <Text style={styles.statValue}>{plan.efficiency.toFixed(1)}x</Text>
            </View>
          </View>

          {/* Breaks */}
          <Text style={styles.breaksTitle}>Breaks</Text>
          {plan.breaks.map((brk, i) => (
            <View key={`${brk.oooStart}-${i}`} style={styles.breakCard}>
              <Text style={styles.breakSummary}>
                {formatMonthDay(brk.oooStart)} – {formatMonthDay(brk.oooEnd)} • {brk.holidays.map(h => h.name).join(' + ')}
              </Text>
              <Text style={styles.breakDetail}>{brk.totalDaysOff} days off • {brk.ptoUsed} PTO days</Text>
            </View>
          ))}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                const ics = generateICS(plan);
                await Share.share({ message: ics, title: 'PTO Maxxing Plan' });
              }}
            >
              <Text style={styles.actionButtonText}>📅 Add to Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                const text = copyPTODates(plan);
                Alert.alert('Copied!', 'PTO dates copied to clipboard');
              }}
            >
              <Text style={styles.actionButtonText}>📋 Copy Dates</Text>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Why this plan?</Text>
            <Text style={styles.detailsText}>Efficiency: {plan.efficiency.toFixed(2)} days off per PTO day</Text>
            <Text style={styles.detailsText}>Longest break: {plan.longestBreak} consecutive days</Text>
            <Text style={styles.detailsText}>Number of breaks: {plan.breaks.length}</Text>
            <Text style={styles.detailsTitle}>PTO days to request:</Text>
            {plan.breaks.flatMap(b => b.ptoDays).sort().map((day, i) => (
              <Text key={`${day}-${i}`} style={styles.detailsText}>• {formatFullDay(day)}</Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSizes.headline, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.lg },
  backButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  backButtonText: { color: '#fff', fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  chipButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: 8, backgroundColor: Colors.background },
  chipButtonText: { fontSize: FontSizes.subheadline, fontWeight: '500' },
  viewToggle: { flexDirection: 'row', gap: Spacing.xs },
  toggleChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: 8, backgroundColor: Colors.background },
  toggleChipActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: FontSizes.footnote, fontWeight: '500', color: Colors.secondary },
  toggleTextActive: { color: '#fff' },
  planTitle: { fontSize: FontSizes.title3, fontWeight: '700', marginBottom: Spacing.lg },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...CARD_SHADOW,
  },
  statsRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  stat: { flex: 1 },
  statLabel: { fontSize: FontSizes.caption, color: Colors.secondary },
  statValue: { fontSize: FontSizes.title3, fontWeight: '700' },
  breaksTitle: { fontSize: FontSizes.headline, fontWeight: '600', marginBottom: Spacing.sm },
  breakCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  breakSummary: { fontSize: FontSizes.subheadline, fontWeight: '600' },
  breakDetail: { fontSize: FontSizes.footnote, color: Colors.secondary },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  actionButtonText: { fontSize: FontSizes.footnote, fontWeight: '500' },
  detailsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.background,
  },
  detailsTitle: { fontSize: FontSizes.subheadline, fontWeight: '600', marginTop: Spacing.sm },
  detailsText: { fontSize: FontSizes.footnote, color: Colors.secondary, marginTop: Spacing.xs },
});
