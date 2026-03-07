/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        kame: {
          navy: '#1A2B3D',
          teal: '#00BFA5',
          coral: '#FF4D6A',
          gray: '#6B7280',
          'light-gray': '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
