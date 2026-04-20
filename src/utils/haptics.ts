// haptics.ts
// Cross‑platform haptic feedback for mobile polish

import { Platform } from 'react-native';

export function triggerHaptic() {
  if (Platform.OS === 'ios') {
    // iOS: Use ImpactFeedbackStyle
    // In a real app, you'd import React Native Haptics
    // For now, we'll leave as placeholder
    return;
  }
  
  if (Platform.OS === 'android') {
    // Android vibration
    // In a real app, you'd use Vibration.vibrate()
    return;
  }
}

export function triggerSuccessHaptic() {
  if (Platform.OS === 'ios') {
    // iOS success haptic
    return;
  }
}

export function triggerErrorHaptic() {
  if (Platform.OS === 'ios') {
    // iOS error/warning haptic
    return;
  }
}