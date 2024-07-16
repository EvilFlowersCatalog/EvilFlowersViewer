const colors = require('tailwindcss/colors')
module.exports = {
  content: ['./src/**/*.tsx', './public/**/*.html'],
  theme: {
    extend: {
      boxShadow: {
        own: '0 0 5px rgba(0, 0, 0, 0.4)',
        'own-2': '0 0 20px rgba(0, 0, 0, 0.2)',
      },
      borderWidth: {
        5: '5px',
      },
      keyframes: {
        blinkBorder: {
          '0%': { border: '2px solid #00ff40' },
          '100%': { border: '2px solid gray' },
        },
        blinkIcon: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        blinking: {
          '0%, 100%': { borderColor: '#01a9e0' },
          '50%': { borderColor: 'white' },
        },
      },
      animation: {
        'blink-border': 'blinkBorder 0.5s linear',
        'blink-icon': 'blinkIcon 0.5s linear',
        blinking: 'blinking 1s linear infinite',
      },
      screens: {
        sm: '321px',
        md: '599px',
        lg: '959px',
        xl: '1240px',
        xxl: '1440px',
      },
      colors: {
        red: '#ff2129',
        green: '#77dd77',
        blue: {
          dark: '#01a9e0',
          light: '#39b3db',
        },
        gray: {
          dark: {
            medium: '#303030',
            strong: '#141414',
          },
          light: '#e3e3e3',
        },
      },
      flex: {
        2: '2 2 0%',
        3: '3 3 0%',
      },
    },
  },
  darkMode: 'class',
}
