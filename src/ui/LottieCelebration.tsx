// LottieCelebration.tsx
// Wrapper for Lottie animations with fallback to our existing confetti

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import Confetti from './Confetti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CelebrationType = 'confetti' | 'success' | 'sparkle';

interface LottieCelebrationProps {
  type: CelebrationType;
  active: boolean;
  loop?: boolean;
  onComplete?: () => void;
}

export default function LottieCelebration({ 
  type, 
  active, 
  loop = false,
  onComplete 
}: LottieCelebrationProps) {
  const animationRef = useRef<LottieView>(null);
  
  useEffect(() => {
    if (active && animationRef.current) {
      animationRef.current.play();
    } else if (animationRef.current) {
      animationRef.current.reset();
    }
  }, [active]);
  
  // For now, fall back to our existing confetti for 'confetti' type
  // In a production app, you'd replace with actual Lottie JSON files
  if (type === 'confetti') {
    return <Confetti active={active} />;
  }
  
  // Placeholder for Lottie animations we'll add later
  if (!active) return null;
  
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.placeholder}>
        {/* In production, you'd load actual Lottie JSON:
        <LottieView
          ref={animationRef}
          source={require(`../assets/lottie/${type}.json`)}
          autoPlay={active}
          loop={loop}
          onAnimationFinish={onComplete}
          style={styles.animation}
        />
        */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  placeholder: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(68, 194, 156, 0.1)',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});