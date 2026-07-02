/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hisd: {
          navy:       '#1B3A6B',
          'navy-dark':'#122850',
          teal:       '#4DB8C8',
          blue:       '#0066B3',
          'blue-light':'#E8F4FD',
          green:      '#28A745',
          red:        '#DC3545',
          amber:      '#FFC107',
          gray:       '#F4F6F9',
          'gray-border': '#DEE2E6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
