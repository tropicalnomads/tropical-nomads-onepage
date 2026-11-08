import type { Config } from 'tailwindcss';
import { palette } from './src/theme/palette';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ozora: {
          navy: palette.brand.navy,
          green: palette.brand.green,
          yellow: palette.brand.yellow,
          coral: palette.brand.coral,
          turquoise: palette.brand.turquoise,
          pink: palette.brand.pink,
          cream: palette.brand.cream,
          ink: palette.brand.ink,
        },
      },
      fontFamily: {
        sans: [
          '"Outfit Variable"',
          'Outfit',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: `0 0 0 2px ${palette.brand.yellow}E6, 0 0 24px ${palette.brand.yellow}73`,
      },
    },
  },
  plugins: [],
} satisfies Config;
