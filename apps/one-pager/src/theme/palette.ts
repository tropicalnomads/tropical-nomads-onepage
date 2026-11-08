export interface ColorPair {
  color: string;
  textColor: string;
}

export interface GenreColor extends ColorPair {
  label: string;
}

export const palette = {
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
  stageColors: {
    'ozora-stage': { color: '#FF7F50', textColor: '#111827' },
    pumpui: { color: '#2EC4B6', textColor: '#111827' },
    'the-dome': { color: '#7C3AED', textColor: '#FFFFFF' },
    'dragon-nest': { color: '#22C55E', textColor: '#052E16' },
    'cooking-groove': { color: '#F59E0B', textColor: '#111827' },
    'visium-garden': { color: '#F97316', textColor: '#111827' },
    'y2k-retro': { color: '#EC4899', textColor: '#111827' },
    'the-hive': { color: '#F59E0B', textColor: '#111827' },
    'the-swamp': { color: '#2EC4B6', textColor: '#111827' },
    'the-seed': { color: '#84CC16', textColor: '#111827' },
    'main-floor': { color: '#F97316', textColor: '#111827' },
    '303-stage': { color: '#FACC15', textColor: '#111827' },
    tropikalien: { color: '#A855F7', textColor: '#FFFFFF' },
    'up-beach-club': { color: '#2EC4B6', textColor: '#111827' },
    'palco-paralello-chillout': { color: '#38BDF8', textColor: '#111827' },
    circulou: { color: '#84CC16', textColor: '#111827' },
    artboat: { color: '#EC4899', textColor: '#111827' },
  } as Record<string, ColorPair>,
  genreColors: {
    'psybient-psychill-downtempo': {
      label: 'Psy-bient / Psy-chill / Downtempo',
      color: '#C9DAF8',
      textColor: '#111827',
    },
    'progressive-psy': { label: 'Progressive Psy', color: '#FFE599', textColor: '#111827' },
    'full-on': { label: 'Full-on', color: '#F9CB9C', textColor: '#111827' },
    'twilight-full-on': { label: 'Twilight Full-on', color: '#6FA8DC', textColor: '#111827' },
    'night-full-on': { label: 'Night Full-on', color: '#FFFFFF', textColor: '#111827' },
    'dark-psy': { label: 'Dark Psy', color: '#434343', textColor: '#FFFFFF' },
    'forest-psy': { label: 'Forest Psy', color: '#93C47D', textColor: '#111827' },
    'hi-tech': { label: 'Hi-Tech', color: '#EA9999', textColor: '#111827' },
    'goa-neo-goa': { label: 'Goa / Neo-Goa', color: '#8E7CC3', textColor: '#FFFFFF' },
    house: { label: 'House', color: '#D9EAD3', textColor: '#111827' },
    'progressive-house-melodic-techno': {
      label: 'Progressive House / Melodic Techno',
      color: '#D9D2E9',
      textColor: '#111827',
    },
    techno: { label: 'Techno', color: '#A2C4C9', textColor: '#111827' },
    'psy-techno': { label: 'Psy-Techno', color: '#EAD1DC', textColor: '#111827' },
    'hard-trance': { label: 'Hard Trance', color: '#A64D79', textColor: '#FFFFFF' },
    'prog-dark-zenonesque': {
      label: 'Prog-Dark / Zenonesque',
      color: '#999999',
      textColor: '#FFFFFF',
    },
    others: {
      label: 'Others (Experimental, Electro, Tribal, D&B, ...)',
      color: '#FFF2CC',
      textColor: '#111827',
    },
  } as Record<string, GenreColor>,
} as const;

function hexToRgbChannels(hexColor: string): string {
  const clean = hexColor.replace('#', '').trim();
  const normalized = clean.length === 3 ? clean.split('').map((char) => `${char}${char}`).join('') : clean;
  const asNumber = Number.parseInt(normalized, 16);
  const r = (asNumber >> 16) & 255;
  const g = (asNumber >> 8) & 255;
  const b = asNumber & 255;
  return `${r} ${g} ${b}`;
}

export function applyPaletteCssVariables(target: HTMLElement = document.documentElement): void {
  const vars: Record<string, string> = {
    '--tn-color-brand-navy': palette.brand.navy,
    '--tn-color-brand-navy-rgb': hexToRgbChannels(palette.brand.navy),
    '--tn-color-brand-navy-elevated': palette.brand.navyElevated,
    '--tn-color-brand-navy-deep': palette.brand.navyDeep,
    '--tn-color-brand-turquoise-rgb': hexToRgbChannels(palette.brand.turquoise),
    '--tn-color-brand-pink-rgb': hexToRgbChannels(palette.brand.pink),
    '--tn-color-brand-yellow-rgb': hexToRgbChannels(palette.brand.yellow),
    '--tn-color-text-primary': palette.brand.cream,
    '--tn-color-text-primary-rgb': hexToRgbChannels(palette.brand.cream),
    '--tn-color-shadow-rgb': '0 0 0',
  };

  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value);
  }
}
