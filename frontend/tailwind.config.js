/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090d16',
          850: '#0d1322',
          800: '#131b2e',
          700: '#1e2942',
          600: '#2d3b5b',
        },
        risk: {
          low: '#10b981',      // Emerald
          moderate: '#f59e0b', // Amber
          high: '#f97316',     // Orange
          critical: '#ef4444', // Red
        },
        hud: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          glow: '#38bdf8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
