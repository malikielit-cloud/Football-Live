/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#0a0f1d',
          card: '#131b2e',
          border: '#1e293b',
          accent: '#10b981',
          gold: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif', 'Kantumruy Pro'],
      },
    },
  },
  plugins: [],
};
