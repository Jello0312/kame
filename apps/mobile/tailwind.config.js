/** @type {import('tailwindcss').Config} */
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
        warmWhite: '#F5F0E8',
        teal: {
          DEFAULT: '#48E6CD', // #1AA39C is RETIRED per Brand Kit v2
          bright: '#48E6CD',  // kept for backward compat
        },
        coral: {
          DEFAULT: '#FA6869',
          deep: '#CC4968',
        },
        body: {
          DEFAULT: '#5A5A58', // Body/paragraph text — warm neutral gray
          light: '#7A7A78',   // Captions, placeholders, secondary text
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
