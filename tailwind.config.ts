// tailwind.config.ts  (only if you actually need custom theme/plugins)
import type { Config } from "tailwindcss"

const config: Config = {
  // Tailwind v4 doesn't require `content` or `postcss` config.
  // You can keep this file only to extend the theme or add plugins.
  theme: {
    extend: {
      colors: {
        brand: "hsl(var(--primary))",
        "brand-foreground": "hsl(var(--primary-foreground))",
      },
    },
  },
  plugins: [],
}

export default config
