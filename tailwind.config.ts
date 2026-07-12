import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f1fb', 100: '#e8e1f6', 200: '#cabdea', 300: '#a892d9',
          400: '#8567c4', 500: '#6b4bab', 600: '#553a8a', 700: '#432d6c',
          800: '#33224f', 900: '#221737', 950: '#140d21',
        },
        surface: {
          light: '#faf9fc',
          dark: '#0e0a17',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 20, 60, 0.15)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        'glow': { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
