/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'on-tertiary': '#680008', 'inverse-on-surface': '#313030', 'inverse-primary': '#875200',
        'on-tertiary-fixed-variant': '#930010', 'on-secondary': '#003916', 'primary-fixed-dim': '#ffb867',
        'surface-container-low': '#1c1b1b', 'surface-tint': '#ffb867', 'on-tertiary-fixed': '#410003',
        'on-secondary-container': '#003112', 'tertiary-fixed': '#ffdad6', 'on-primary-container': '#683e00',
        'surface-bright': '#393939', 'secondary-container': '#13a650', 'on-secondary-fixed-variant': '#005323',
        'on-surface-variant': '#d9c3ad', 'surface-container-lowest': '#0e0e0e', 'on-primary-fixed-variant': '#673d00',
        'primary-fixed': '#ffddba', surface: '#131313', 'surface-dim': '#131313', 'on-surface': '#e5e2e1',
        outline: '#a18d7a', error: '#ffb4ab', 'on-error-container': '#ffdad6', 'primary-container': '#ffa116',
        'tertiary-container': '#ff9b92', background: '#131313', tertiary: '#ffc3be', 'on-tertiary-container': '#940010',
        secondary: '#5edf81', primary: '#ffc78b', 'surface-container': '#20201f', 'secondary-fixed': '#7cfc9b',
        'error-container': '#93000a', 'surface-container-high': '#2a2a2a', 'secondary-fixed-dim': '#5edf81',
        'on-background': '#e5e2e1', 'inverse-surface': '#e5e2e1', 'on-secondary-fixed': '#00210a',
        'surface-container-highest': '#353535', 'on-error': '#690005', 'on-primary': '#482900',
        'outline-variant': '#544434', 'on-primary-fixed': '#2b1700', 'surface-variant': '#353535',
        'tertiary-fixed-dim': '#ffb3ac'
      },
      borderRadius: { DEFAULT: '0.125rem', lg: '0.25rem', xl: '0.5rem', '2xl': '0.75rem', full: '9999px' },
      fontFamily: { headline: ['Inter', 'sans-serif'], body: ['Inter', 'sans-serif'], label: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')]
};
