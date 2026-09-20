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
  card: '#EEF2FB',
  cardText: '#0B1F55',
  cardMuted: '#6B7899',
  // Heatmap sits on a light card so more study time reads as a darker cell.
  heat: ['#DCE3F4', '#A9BCE8', '#6F8FD6', '#2F57B5', '#113485', '#081A47'],
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
export const MIN_MINUTES = 5;

export const DISTRACTIONS = ['Instagram', 'YouTube', 'X'];
