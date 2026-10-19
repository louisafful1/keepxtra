import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F2F8EF',
          100: '#E4F3DD',
          200: '#C9E6BC',
          300: '#A1D28A',
          400: '#6FB956',
          500: '#2F8F3F',
          600: '#1D7334',
          700: '#14532D',
          800: '#0F3F23',
          900: '#0A2C19',
          950: '#06190F',
        },
        secondary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        success: '#22C55E',
        tint: {
          green: '#ECFDF5',
          orange: '#FFF7ED',
        },
      },
      fontFamily: {
        display: ['"Geist"', '"Inter"', 'ui-sans-serif', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px -1px rgba(15,23,42,0.04), 0 2px 8px -2px rgba(15,23,42,0.05)',
        premium: '0 4px 12px -4px rgba(15,23,42,0.06), 0 12px 32px -8px rgba(15,23,42,0.08)',
        glow: '0 8px 24px -8px rgba(20,83,45,0.22)',
        panel: '0 24px 60px -28px rgba(10,44,25,0.28), 0 2px 8px -2px rgba(10,44,25,0.06)',
      },
      backgroundImage: {
        'gradient-hero':
          'radial-gradient(120% 120% at 0% 0%, #E8F5E0 0%, #F3F9EE 42%, #FBFDF9 100%)',
        'gradient-soft-green': 'linear-gradient(135deg, #E4F3DD 0%, #FFFFFF 60%)',
        'gradient-soft-orange': 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 60%)',
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-slower': 'float 9s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
