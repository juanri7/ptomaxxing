// ConfettiV2.tsx
// Enhanced confetti with better physics, more shapes, and smoother animation

import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from './theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 40;
const SHAPE_TYPES = ['circle', 'square', 'triangle'];

type Particle = {
  id: number;
  color: string;
  size: number;
  startX: number;
  rotation: number;
  shape: string;
  delay: number;
  swayAmplitude: number;
};

export default function ConfettiV2({ active = false, duration = 2000 }: { active: boolean; duration?: number }) {
  const particles = useRef<Particle[]>([]);
  const animations = useRef<Animated.Value[]>([]);
  
  // Initialize particles once
  if (particles.current.length === 0) {
    const colors = [Colors.primary, Colors.secondary, Colors.accent, Colors.success, Colors.warning];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 12,
        startX: Math.random() * SCREEN_WIDTH,
        rotation: Math.random() * 360,
        shape: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
        delay: i * 20,
        swayAmplitude: 30 + Math.random() * 70,
      });
      animations.current[i] = new Animated.Value(0);
    }
  }
  
  useEffect(() => {
    if (!active) {
      // Reset all animations
      animations.current.forEach(anim => anim.setValue(0));
      return;
    }
    
    const anims = particles.current.map((p, i) => {
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          // Fall down with easing
          Animated.timing(animations.current[i], {
            toValue: 1,
            duration: duration + Math.random() * 500,
            useNativeDriver: true,
          }),
          // Sway side-to-side
          Animated.sequence([
            Animated.timing(new Animated.Value(0), {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(new Animated.Value(1), {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });
    
    Animated.parallel(anims).start();
  }, [active, duration]);
  
  if (!active) return null;
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.current.map((p, i) => {
        const anim = animations.current[i];
        
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, SCREEN_HEIGHT * 0.8],
        });
        
        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, p.swayAmplitude * (Math.random() - 0.5), p.swayAmplitude * (Math.random() - 0.5) * 0.5],
        });
        
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${p.rotation}deg`, `${p.rotation + 720}deg`],
        });
        
        const opacity = anim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });
        
        const scale = anim.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, 1, 1, 0.8],
        });
        
        let shapeStyle;
        switch (p.shape) {
          case 'square':
            shapeStyle = { borderRadius: 2 };
            break;
          case 'triangle':
            // Triangle via border hack
            shapeStyle = {
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderStyle: 'solid' as const,
              borderLeftWidth: p.size / 2,
              borderRightWidth: p.size / 2,
              borderBottomWidth: p.size,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: p.color,
            };
            break;
          default: // circle
            shapeStyle = { borderRadius: p.size / 2 };
        }
        
        if (p.shape === 'triangle') {
          return (
            <Animated.View
              key={`confetti-${p.id}`}
              style={[
                styles.particle,
                shapeStyle,
                {
                  left: p.startX,
                  transform: [{ translateY }, { translateX }, { rotate }, { scale }],
                  opacity,
                },
              ]}
            />
          );
        }
        
        return (
          <Animated.View
            key={`confetti-${p.id}`}
            style={[
              styles.particle,
              shapeStyle,
              {
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                left: p.startX,
                transform: [{ translateY }, { translateX }, { rotate }, { scale }],
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
  particle: {
    position: 'absolute',
    top: -30,
  },
});