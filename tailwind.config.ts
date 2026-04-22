import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAFB',
        surface: '#FFFFFF',
        surface2: '#EFF6FC',
        'text-base': '#293745',
        'text-muted': '#7F859D',
        'text-dim': '#A8B2C0',
        accent: '#3CACD7',
        'accent-dark': '#2B9DC8',
        'border-base': '#BBD0E5',
        'border-light': '#E7EFF3',
        'dark-header': '#1E2A35',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(41,55,69,.07), 0 4px 16px rgba(41,55,69,.05)',
        'card-md': '0 4px 20px rgba(41,55,69,.12), 0 16px 48px rgba(41,55,69,.08)',
        accent: '0 2px 8px rgba(60,172,215,.4)',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
