/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hestia: {
          navy: '#0B1A2A',
          'navy-light': '#132337',
          gold: '#C9A227',
          'gold-light': '#E3C65D',
          cream: '#F7F5F0',
          linen: '#EAE6DD',
          charcoal: '#2C2C2C',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        luxe: '0 25px 50px -12px rgba(11, 26, 42, 0.25)',
        soft: '0 10px 30px -10px rgba(11, 26, 42, 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
