/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kuaa: {
          roxo:       '#531A61',
          vinho:      '#840033',
          amarelo:    '#FFDC5C',
          dark:       '#2a0d33',
          darker:     '#1a0826',
          neon:       '#b347d9',
          bg:         '#fbf6e8',
          'bg-soft':  '#f4ead1',
          surface:    '#ffffff',
          'line-soft':'#ece1c5',
          'roxo-light':'#f3eaf7',
          'vinho-light':'#fce8ef',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'Arial', 'sans-serif'],
        display: ['Unbounded', 'cursive'],
        title:   ['Questrial', 'sans-serif'],
      },
      boxShadow: {
        'k-sm':   '0 1px 2px rgba(83,26,97,.05), 0 4px 8px -2px rgba(83,26,97,.06)',
        'k-md':   '0 4px 6px -1px rgba(83,26,97,.06), 0 14px 28px -8px rgba(83,26,97,.12)',
        'k-lg':   '0 10px 15px -3px rgba(83,26,97,.06), 0 30px 50px -12px rgba(83,26,97,.18)',
        'k-neon': '0 0 0 1px rgba(179,71,217,.4), 0 0 32px -8px rgba(179,71,217,.6)',
      },
      borderRadius: {
        'k-card': '24px',
        'k-btn':  '999px',
        'k-input':'14px',
      },
    },
  },
  plugins: [],
}
