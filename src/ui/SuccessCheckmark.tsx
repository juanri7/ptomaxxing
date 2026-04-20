// SuccessCheckmark.tsx
// Micro‑celebration for successful actions (copy, save, etc.)

import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Colors } from './theme';

interface SuccessCheckmarkProps {
  active: boolean;
  size?: number;
  duration?: number;
}

export default function SuccessCheckmark({ active, size = 60, duration = 800 }: SuccessCheckmarkProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (active) {
      // Reset and animate
      scale.setValue(0);
      opacity.setValue(0);
      
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [active, scale, opacity, duration]);
  
  if (!active) return null;
  
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Animated.View style={[styles.circle, { transform: [{ scale }], opacity }]}>
        {/* Checkmark SVG-like using CSS triangles */}
        <View style={styles.checkmark}>
          <View style={styles.checkmarkStem} />
          <View style={styles.checkmarkKick} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmark: {
    width: 24,
    height: 24,
    transform: [{ rotate: '45deg' }],
    marginTop: 4,
  },
  checkmarkStem: {
    position: 'absolute',
    width: 3,
    height: 16,
    backgroundColor: '#FFFFFF',
    left: 11,
    top: 2,
    borderRadius: 2,
  },
  checkmarkKick: {
    position: 'absolute',
    width: 8,
    height: 3,
    backgroundColor: '#FFFFFF',
    left: 6,
    top: 13,
    borderRadius: 2,
  },
});