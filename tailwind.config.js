/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        blinkBorder: {
          '0%': { border: '4px solid #36BA98' },
          '100%': { border: '4px solid white' },
        },
        blinkIcon: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      },
      animation: {
        'blink-border': 'blinkBorder 0.5s ease-out',
        'blink-icon': 'blinkIcon 0.5s ease-out',
      },
      transitionProperty: {
        height: 'height',
        left: 'left',
        top: 'top',
      },
      colors: {
        secondary: '#36BA98',
        primary: '#1A2130',
        red: '#ff0000',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
