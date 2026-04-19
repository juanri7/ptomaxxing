// Skeleton.tsx
// Loading skeleton for cards and content

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BORDER_RADIUS } from './theme';

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.headerSkeleton} />
      <View style={styles.textSkeleton} />
      <View style={styles.textSkeletonShort} />
      <View style={styles.chipRow}>
        <View style={styles.chipSkeleton} />
        <View style={styles.chipSkeleton} />
      </View>
    </View>
  );
}

export function SkeletonHero() {
  return (
    <View style={[styles.card, styles.hero]}>
      <View style={styles.heroNumberSkeleton} />
      <View style={styles.heroLabelSkeleton} />
      <View style={styles.chipRow}>
        <View style={styles.chipSkeleton} />
        <View style={styles.chipSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BORDER_RADIUS * 1.5,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
  },
  headerSkeleton: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 8,
    height: 20,
    width: '60%',
    marginBottom: Spacing.md,
  },
  textSkeleton: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 6,
    height: 16,
    width: '90%',
    marginBottom: Spacing.sm,
  },
  textSkeletonShort: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 6,
    height: 16,
    width: '70%',
    marginBottom: Spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chipSkeleton: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 20,
    height: 32,
    width: 100,
  },
  heroNumberSkeleton: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    height: 56,
    width: 120,
    marginBottom: Spacing.md,
  },
  heroLabelSkeleton: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 6,
    height: 16,
    width: '40%',
    marginBottom: Spacing.lg,
  },
});