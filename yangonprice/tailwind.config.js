/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#121A2B',
        panel: '#1B2740',
        'panel-raised': '#212F4D',
        line: '#2E3B59',
        ink: '#EDEFF5',
        muted: '#8C97B5',
        gold: '#D9A24B',
        good: '#5FBE8C',
        bad: '#E2645A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        myanmar: ['"Noto Sans Myanmar"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
