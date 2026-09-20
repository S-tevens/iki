export const colors = {
  primary: '#113485',
  primaryBright: '#3D63C9',
  bg: '#0A1633',
  surface: '#101F45',
  surfaceHigh: '#17295A',
  text: '#EEF2FB',
  textMuted: '#8C9AC0',
  textFaint: '#56648C',
  danger: '#E26D6D',
  card: '#101F45',
  cardBorder: 'rgba(238,242,251,0.07)',
  cardText: '#EEF2FB',
  cardMuted: '#8C9AC0',
  // On a dark card the scale has to climb toward light, or heavy days would sink into the background.
  heat: ['#16244C', '#1E3A7A', '#2F57B5', '#4C7BE0', '#7DA6FF', '#B6CDFF'],
};

export function heatLevel(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  if (minutes < 120) return 4;
  return 5;
}

export const fonts = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };

export const MAX_MINUTES = 120;

export const DISTRACTIONS = ['Instagram', 'YouTube', 'X'];
