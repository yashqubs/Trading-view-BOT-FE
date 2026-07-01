/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // `rgb(var(--x-rgb) / <alpha-value>)` (rather than a plain `var(--x)` hex
        // reference) is required for Tailwind's `/opacity` modifiers (e.g.
        // `border-danger/30`) to work — Tailwind needs numeric channels to blend
        // in the alpha at build time. Keep each `--x-rgb` in sync in index.css.
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-soft': 'var(--accent-soft)',
        'accent-foreground': 'rgb(var(--accent-foreground-rgb) / <alpha-value>)',
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        'stat-violet': 'rgb(var(--stat-violet-rgb) / <alpha-value>)',
        'stat-indigo': 'rgb(var(--stat-indigo-rgb) / <alpha-value>)',
        'stat-blue': 'rgb(var(--stat-blue-rgb) / <alpha-value>)',
        'stat-sky': 'rgb(var(--stat-sky-rgb) / <alpha-value>)',
        'stat-teal': 'rgb(var(--stat-teal-rgb) / <alpha-value>)',
        'stat-orange': 'rgb(var(--stat-orange-rgb) / <alpha-value>)',
        'stat-rose': 'rgb(var(--stat-rose-rgb) / <alpha-value>)',
      },
      borderRadius: {
        card: '14px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
      },
      keyframes: {
        'fade-slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.35)' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 200ms ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
