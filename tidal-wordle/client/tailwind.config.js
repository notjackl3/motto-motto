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
        // Surf-instrument palette
        abyss: '#04162b',
        tide: '#0a3658',
        brass: '#d4a857',
        coral: '#ff7a59',
        kelp: '#2b5e4b',
      },
      fontFamily: {
        display: ['"Unbounded"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        instrument: '0.18em',
      },
      keyframes: {
        'meme-cannon-drop': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(-12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow:
              '0 0 0 0 rgba(154,212,214,0.0), inset 0 0 0 1px rgba(154,212,214,0.45)',
          },
          '50%': {
            boxShadow:
              '0 0 24px 0 rgba(154,212,214,0.45), inset 0 0 0 1px rgba(154,212,214,0.85)',
          },
        },
        'tide-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '200px 0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'tide-drift': 'tide-drift 18s linear infinite',
      },
    },
  },
  plugins: [],
};
