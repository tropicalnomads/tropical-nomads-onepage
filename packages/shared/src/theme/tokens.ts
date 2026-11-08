export interface TypeStep {
  size: string;
  lineHeight: string;
}

export const tokens = {
  color: {
    brand: {
      navy: '#042f2e',
      navyDeep: '#021d1c',
      navyElevated: '#053b38',
      green: '#009B77',
      yellow: '#FAD02E',
      coral: '#FF7F50',
      turquoise: '#2EC4B6',
      pink: '#FF4FA3',
      cream: '#FFF8E7',
      ink: '#111827',
    },
    feedback: {
      success: '#009B77',
      info: '#2EC4B6',
      offline: '#FF7F50',
      warning: '#FAD02E',
    },
    fallback: {
      stageBackground: '#0B2A3C',
      stageText: '#FFFFFF',
    },
  },
  font: {
    sans: '"Outfit Variable", Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
    size: {
      xs: { size: '0.75rem', lineHeight: '1rem' },
      sm: { size: '0.875rem', lineHeight: '1.25rem' },
      base: { size: '1rem', lineHeight: '1.5rem' },
      lg: { size: '1.125rem', lineHeight: '1.75rem' },
      xl: { size: '1.25rem', lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem', lineHeight: '2rem' },
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
      '5xl': { size: '3rem', lineHeight: '1' },
      '6xl': { size: '3.75rem', lineHeight: '1' },
      '7xl': { size: '4.5rem', lineHeight: '1' },
      '8xl': { size: '6rem', lineHeight: '1' },
      '9xl': { size: '8rem', lineHeight: '1' },
    } satisfies Record<string, TypeStep>,
  },
} as const;

export function hasToken(path: string): boolean {
  const parts = path.split('.');
  let current: unknown = tokens;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' || (typeof current === 'object' && current !== null);
}
