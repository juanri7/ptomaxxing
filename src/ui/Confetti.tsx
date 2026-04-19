// Confetti.tsx
// Lightweight micro‑confetti animation for celebration moments

import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from './theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 30;
const CONFETTI_COLORS = [Colors.primary, Colors.secondary, Colors.accent, Colors.success, Colors.warning];

export default function Confetti({ active = false }: { active: boolean }) {
  const confettiAnimations = useRef<Animated.Value[]>(
    Array(CONFETTI_COUNT).fill(0).map(() => new Animated.Value(0))
  ).current;
  const confettiStyles = useRef<Array<{ color: string; size: number; startX: number; rotation: number }>>([]);

  // Initialize confetti properties once
  if (confettiStyles.current.length === 0) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      confettiStyles.current.push({
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 10,
        startX: Math.random() * SCREEN_WIDTH,
        rotation: Math.random() * 360,
      });
    }
  }

  useEffect(() => {
    if (!active) {
      // Reset confetti
      confettiAnimations.forEach(anim => anim.setValue(0));
      return;
    }

    const animations = confettiAnimations.map((anim, i) => {
      return Animated.sequence([
        Animated.delay(i * 30), // Staggered start
        Animated.parallel([
          // Fall down
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200 + Math.random() * 800,
            useNativeDriver: true,
          }),
          // Sway side‑to‑side
          Animated.sequence([
            Animated.timing(new Animated.Value(0), {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(new Animated.Value(1), {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  }, [active, confettiAnimations]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {confettiAnimations.map((anim, i) => {
        const style = confettiStyles.current[i];
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SCREEN_HEIGHT * 0.7],
        });
        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50],
        });
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${style.rotation}deg`, `${style.rotation + 360}deg`],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.View
            key={`confetti-${i}`}
            style={[
              styles.confetti,
              {
                backgroundColor: style.color,
                width: style.size,
                height: style.size,
                left: style.startX,
                borderRadius: style.size / 2,
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  confetti: {
    position: 'absolute',
    top: -20,
  },
});