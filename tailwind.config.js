import { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f6f7f9',
          100: '#e0e4ed',
          200: '#b8c0d6',
          300: '#8f9cbe',
          400: '#6778a7',
          500: '#4d5f8d',
          600: '#3b4970',
          700: '#2a3553',
          800: '#1a2136',
          900: '#0a0d19'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
