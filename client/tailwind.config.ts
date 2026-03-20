import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        foreground: '#FAFAFA',
        muted: '#27272A',
        'muted-foreground': '#A1A1AA',
        accent: '#DFE104',
        'accent-foreground': '#000000',
        border: '#3F3F46',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
