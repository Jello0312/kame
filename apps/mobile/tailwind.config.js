/**
 * Kame Mobile App — Tailwind / NativeWind Config
 * Color tokens synced from live landing page (kame-ai.com) — Brand Audit March 23, 2026.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        warmWhite: '#FAF9F7', // Updated from #F5F0E8 per brand audit
        teal: {
          DEFAULT: '#48E6CD', // Bright teal — headlines, CTAs, interactive
          bright: '#48E6CD',  // kept for backward compat
        },
        coral: {
          DEFAULT: '#FA6869',
          deep: '#CC4968',    // CTA gradient — keep unchanged
        },
        body: {
          DEFAULT: '#444842', // Body text — warm green-gray (updated from #5A5A58)
          light: '#6E726C',   // Captions, placeholders (updated from #7A7A78)
        },
        gold: '#F7C13D',
        kame: {
          green: '#289B62',
          red: '#E3393C',
          purple: '#744DA6',
        },
        gray: {
          100: '#F8F9FB',
          200: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          700: '#374151',
        },
      },
      fontFamily: {
        heading: ['PlusJakartaSans-Bold'],
        'heading-semi': ['PlusJakartaSans-SemiBold'],
        'heading-extra': ['PlusJakartaSans-ExtraBold'],
        body: ['PlusJakartaSans-Regular'],
        'body-medium': ['PlusJakartaSans-Medium'],
      },
      borderRadius: {
        card: '20px',
        'card-sm': '16px',
        button: '26px',
        chip: '14px', // updated from 18px per Brand Kit v2
        input: '12px',
      },
    },
  },
  plugins: [],
};
