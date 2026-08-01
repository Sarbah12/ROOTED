export type AppTheme = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSoft: string;
  border: string;
  primary: string;
  primarySoft: string;
  primarySoftStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  chipBg: string;
  chipText: string;
  glow: string;
};

export const APP_THEMES: Record<'light' | 'dark', AppTheme> = {
  light: {
    background: '#F4F1EA',
    surface: '#FEFDF9',
    surfaceAlt: '#EEF4EF',
    surfaceSoft: '#F7FAF8',
    border: '#D7E0DA',
    primary: '#2E6A5C',
    primarySoft: '#DCEAE3',
    primarySoftStrong: '#BED8CC',
    text: '#16211C',
    textSecondary: '#5B6961',
    textMuted: '#7D8A83',
    chipBg: '#E8F1EC',
    chipText: '#24584D',
    glow: 'rgba(46, 106, 92, 0.14)',
  },
  dark: {
    background: '#0C1210',
    surface: '#13201B',
    surfaceAlt: '#182922',
    surfaceSoft: '#15231D',
    border: '#294036',
    primary: '#79C3B0',
    primarySoft: '#1E3931',
    primarySoftStrong: '#2A5447',
    text: '#F2F5F1',
    textSecondary: '#C0CDC6',
    textMuted: '#8A9A93',
    chipBg: '#20372F',
    chipText: '#B5E5D9',
    glow: 'rgba(121, 195, 176, 0.14)',
  },
};
