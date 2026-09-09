// Aggie maroon carries the identity; the three macro colors do the work.
export const colors = {
  bg: '#FBFAF8',
  surface: '#FFFFFF',
  ink: '#1C1917',
  muted: '#78716C',
  line: '#E7E3DE',
  maroon: '#500000',
  maroonSoft: '#F3E6E6',
  protein: '#500000',
  carbs: '#B8860B',
  fat: '#2A6F6B',
  danger: '#B42318',
  estimate: '#8A5A00',
  estimateBg: '#FFF4DC',
};

export const type = {
  display: { fontSize: 44, fontWeight: '700', letterSpacing: -1.5, color: colors.ink },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '600', color: colors.ink },
  body: { fontSize: 16, color: colors.ink, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted, lineHeight: 18 },
};

export const space = (n) => n * 4;
export const radius = { sm: 6, md: 10, lg: 16 };
