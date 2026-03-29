/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#07070A',
          surface: '#121218',
          elevated: '#1A1A24',
        },
        accent: {
          primary: '#FF007F',
          secondary: '#00F0FF',
          tertiary: '#FFD700',
        },
        border: {
          DEFAULT: '#2D2D3B',
          glass: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'holographic': 'linear-gradient(135deg, #00F0FF 0%, #FF007F 50%, #FFD700 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 0, 127, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 240, 255, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
