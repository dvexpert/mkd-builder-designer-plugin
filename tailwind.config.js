/** @type {import('tailwindcss').Config} */

require('dotenv').config()

export default {
  prefix: 'tw-',
  corePlugins: {
    preflight: process.env?.VITE_BUILDING_FOR_DEMO === 'true'
  },
  content: [
    "./index.html",
    "./main.js",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}