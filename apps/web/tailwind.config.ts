import type { Config } from 'tailwindcss';
import onePager from '../one-pager/tailwind.config';

const config: Config = {
  ...onePager,
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../one-pager/src/components/EmptyState.tsx',
    '../one-pager/src/components/SiteHeader.tsx',
    '../one-pager/src/components/Footer.tsx',
    '../one-pager/src/components/HeroSection.tsx',
  ],
};

export default config;
