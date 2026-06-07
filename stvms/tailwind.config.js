/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:         'var(--color-bg)',
        surface:    'var(--color-surface)',
        'surface-2':'var(--color-surface-2)',
        border:     'var(--color-border)',
        primary:    'var(--color-primary)',
        accent:     'var(--color-accent)',
        safe:       'var(--color-safe)',
        warn:       'var(--color-warn)',
        info:       'var(--color-info)',
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
      },
      fontFamily: {
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        shimmer:   'shimmer 1.6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.35s ease forwards',
        'slide-in':'slideIn 0.3s ease forwards',
        'scale-in':'scaleIn 0.25s ease forwards',
      },
      keyframes: {
        shimmer:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        fadeIn:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:  { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
