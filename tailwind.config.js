/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        bg:      '#000008',
        surface: 'rgba(4,4,20,0.88)',
        gold:    '#e8c547',
        cyan:    '#5eead4',
      },
    },
  },
  plugins: [],
}
