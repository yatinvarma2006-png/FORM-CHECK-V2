/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'Inter', 'Impact', 'sans-serif'],
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      colors: {
        nike: {
          ink: '#111111',
          canvas: '#ffffff',
          cloud: '#f5f5f5',
          charcoal: '#39393b',
          ash: '#4b4b4d',
          mute: '#707072',
          stone: '#9e9ea0',
          hairline: '#e5e5e5',
          red: '#d30005',
          green: '#007d48',
          blue: '#1151ff',
          teal: '#0a7281',
          purple: '#7c3aed',
        },
        brand: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          500: '#111111',
          600: '#111111',
          900: '#0f172a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'tap-collapse': 'tapCollapse 0.15s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        tapCollapse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
