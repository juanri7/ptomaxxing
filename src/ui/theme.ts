// PTO Maxxing — Gen Z Theme & Constants
// Inspired by Refero search of Duolingo + modern dashboards

export const Colors = {
  primary: '#44C29C',           // Duolingo green — energetic growth
  primaryDark: '#2A9D7F',       // Darker green for better contrast on white text
  secondary: '#4340BC',         // Duolingo purple — smart trust
  accent: '#C32077',            // Duolingo pink — playful attention
  background: '#F9FAFF',        // calm light grey-blue
  card: '#FFFFFF',
  pto: '#E4FAF5',               // light green tint
  ptoBorder: '#44C29C',
  holiday: '#2A9D7F',           // Use darker green for accessibility
  holidayText: '#FFFFFF',
  oooSpan: 'rgba(68, 194, 156, 0.1)',
  weekendBreak: 'rgba(67, 64, 188, 0.08)',
  destructive: '#FF375F',
  success: '#44C29C',
  warning: '#FF9500',
  textPrimary: '#1B1C3B',       // navy for high contrast
  textSecondary: '#667583',     // subtle grey
  textHint: '#A5A7A7',          // placeholder grey
  surface: '#F2F4F8',           // light surface for cards/backgrounds
  onPrimary: '#FFFFFF',         // Text on primary color (guaranteed contrast)
  onSecondary: '#FFFFFF',       // Text on secondary
  onAccent: '#FFFFFF',          // Text on accent
};

// Shortcuts for common usage
export const TextColors = {
  primary: Colors.textPrimary,
  secondary: Colors.textSecondary,
  hint: Colors.textHint,
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
};

// Spacing scale (8‑step grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Typography (Gen‑Z friendly clean sans‑serif)
export const FontSizes = {
  caption: 12,
  footnote: 13,
  subheadline: 15,
  body: 17,
  headline: 18,
  title3: 20,
  title2: 24,
  title1: 32,
  hero: 56,               // big hero numbers
};

// Font weight numbers (React‑native expects numeric strings or numbers)
export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

type FontWeightKey = keyof typeof FontWeights;
export function fontWeight(key: FontWeightKey): any {
  return FontWeights[key];
}

export const BORDER_RADIUS = 16;
export const CARD_SHADOW = {
  shadowColor: '#1B1C3B',   // deeper shadow tint
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,             // more pronounced on Android
};

// Component-specific shadows
export const HERO_SHADOW = {
  shadowColor: '#44C29C',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
};