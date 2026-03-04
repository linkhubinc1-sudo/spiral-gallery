/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0f0f0f',
        surface:  '#1a1919',
        surface2: '#242323',
        border:   'rgba(255,255,255,0.085)',
        accent:   '#e8c547',
        cool:     '#7eb8f7',
      },
    },
  },
  plugins: [],
}

