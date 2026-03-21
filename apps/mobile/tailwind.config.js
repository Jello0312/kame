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
          DEFAULT: '#1AA39C',
          bright: '#48E6CD',
        },
        coral: {
          DEFAULT: '#FA6869',
          deep: '#CC4968',
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
        body: ['PlusJakartaSans-Regular'],
        'body-medium': ['PlusJakartaSans-Medium'],
      },
      borderRadius: {
        card: '20px',
        'card-sm': '16px',
        button: '26px',
        chip: '18px',
        input: '12px',
      },
    },
  },
  plugins: [],
};
