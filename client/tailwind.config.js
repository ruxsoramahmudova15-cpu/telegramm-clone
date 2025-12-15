/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#0088cc',
          'blue-dark': '#006699',
          'blue-light': '#54a9eb',
          bg: '#17212b',
          'bg-light': '#232e3c',
          'bg-lighter': '#2b3a4a',
          text: '#ffffff',
          'text-secondary': '#8b9ba5',
          accent: '#64b5f6',
          success: '#4caf50',
          error: '#f44336',
          warning: '#ff9800'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}