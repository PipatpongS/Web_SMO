/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        magical: {
          dark: '#1a0b2e',
          purple: '#4c1d95',
          light: '#8b5cf6',
          gold: '#fbbf24',
          goldDark: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      backgroundImage: {
        'magical-gradient': 'linear-gradient(to bottom, #1a0b2e, #3b0764, #1a0b2e)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards',
        scaleIn: 'scaleIn 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}
