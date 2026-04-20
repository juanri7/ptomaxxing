// SpringButton.tsx
// Button component with spring physics

import React, { useRef } from 'react';
import { Animated, Text, TouchableWithoutFeedback, ViewStyle, TextStyle } from 'react-native';
import { Colors } from './theme';

interface SpringButtonProps {
  title: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function SpringButton({ 
  title, 
  onPress, 
  primary = true, 
  disabled = false,
  style,
  textStyle 
}: SpringButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.92,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setTimeout(() => onPress(), 50); // Slight delay feels better
  };
  
  const buttonStyle: ViewStyle = {
    backgroundColor: primary ? Colors.primary : Colors.surfaceSubtle,
    borderRadius: primary ? 24 : 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: primary ? 0 : 2,
    borderColor: Colors.background,
    opacity: disabled ? 0.5 : 1,
  };
  
  const defaultTextStyle: TextStyle = {
    color: primary ? Colors.onPrimary : Colors.textPrimary,
    fontSize: primary ? 20 : 17,
    fontWeight: primary ? '900' : '600',
  };
  
  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[{ transform: [{ scale }] }, buttonStyle, style]}>
        <Text style={[defaultTextStyle, textStyle]}>{title}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}