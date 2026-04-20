// useResponsive.ts
// Simple responsive hooks for mobile‑first polish

import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export function useScreenDimensions() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isLandscape: dimensions.width > dimensions.height,
    isTablet: dimensions.width >= 768, // iPad mini width
  };
}

export function useResponsivePadding() {
  const { isTablet } = useScreenDimensions();
  // Tablet gets more horizontal padding for better readability
  return isTablet ? { paddingHorizontal: 32 } : { paddingHorizontal: 16 };
}