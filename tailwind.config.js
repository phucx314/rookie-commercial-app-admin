/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class', // or 'media' if you want to respect system preferences
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
} 