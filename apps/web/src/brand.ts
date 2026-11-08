import { palette } from '../../one-pager/src/theme/palette.ts';

function channels(hexColor: string): string {
  const clean = hexColor.replace('#', '').trim();
  const normalized = clean.length === 3 ? clean.split('').map((char) => `${char}${char}`).join('') : clean;
  const asNumber = Number.parseInt(normalized, 16);
  const red = (asNumber >> 16) & 255;
  const green = (asNumber >> 8) & 255;
  const blue = asNumber & 255;
  return `${red} ${green} ${blue}`;
}

export const brandVariables: Readonly<Record<string, string>> = {
  '--tn-color-brand-navy': palette.brand.navy,
  '--tn-color-brand-navy-rgb': channels(palette.brand.navy),
  '--tn-color-brand-navy-elevated': palette.brand.navyElevated,
  '--tn-color-brand-navy-deep': palette.brand.navyDeep,
  '--tn-color-brand-turquoise-rgb': channels(palette.brand.turquoise),
  '--tn-color-brand-pink-rgb': channels(palette.brand.pink),
  '--tn-color-brand-yellow-rgb': channels(palette.brand.yellow),
  '--tn-color-text-primary': palette.brand.cream,
  '--tn-color-text-primary-rgb': channels(palette.brand.cream),
  '--tn-color-shadow-rgb': '0 0 0',
};

export function brandStyleText(): string {
  const declarations = Object.entries(brandVariables)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
  return `:root{${declarations}}`;
}
