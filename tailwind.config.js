/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  // Global preflight is disabled so the library never resets the host app's
  // `*`, body, headings, buttons or inputs. A scoped equivalent lives in
  // src/assets/main.css under `.efv-viewer`.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      keyframes: {
        blinkBorder: {
          '0%': { border: '4px solid #0077CC' },
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
        width: 'width',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Bind Tailwind colour utilities to the CSS design tokens so the whole
        // UI themes from one place (see main.css).
        secondary: 'var(--efv-primary)',
        'secondary-strong': 'var(--efv-primary-strong)',
        primary: '#1A2130',
        'viewer-bg': 'var(--efv-viewer-bg)',
        'topbar-bg': 'var(--efv-topbar-bg)',
        surface: 'var(--efv-surface)',
        'efv-border': 'var(--efv-border)',
        'efv-text': 'var(--efv-text)',
        'efv-muted': 'var(--efv-text-muted)',
        red: '#ff0000',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
