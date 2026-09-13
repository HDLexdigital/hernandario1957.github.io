/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#d9e6ff', 200: '#b3cdff', 300: '#7da8ff',
          400: '#4d84ff', 500: '#1e5eff', 600: '#0047AB', 700: '#003a8c',
          800: '#002e70', 900: '#002354', 950: '#001433'
        },
        ink: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617'
        },
        accent: { DEFAULT: '#c9a227', soft: '#e6c766' },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          muted:   'rgb(var(--surface-muted) / <alpha-value>)',
          raised:  'rgb(var(--surface-raised) / <alpha-value>)'
        },
        content: {
          DEFAULT: 'rgb(var(--content) / <alpha-value>)',
          muted:   'rgb(var(--content-muted) / <alpha-value>)',
          subtle:  'rgb(var(--content-subtle) / <alpha-value>)'
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          strong:  'rgb(var(--border-strong) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
        screens: { '2xl': '1280px' }
      }
    }
  },
  plugins: []
};
