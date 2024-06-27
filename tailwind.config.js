/** @type {import('tailwindcss').Config} */

require('dotenv').config()

export default {
  prefix: 'tw-',
  corePlugins: {
    preflight: process.env?.VITE_BUILDING_FOR_DEMO === 'true'
  },
  content: [
    ...(process.env?.VITE_BUILDING_FOR_DEMO === 'true' ? ["./demo/index.html"] : []),
    "./src/main.js",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}