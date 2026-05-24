/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f4e1c1',
        seafoam: '#9ad4d6',
        ocean: '#2a6f97',
        deep: '#013a63',
      },
      keyframes: {
        'meme-cannon-drop': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(-12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
