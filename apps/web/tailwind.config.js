/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // Senior-friendly larger base sizes
        base: '1.125rem',
        lg: '1.25rem',
        xl: '1.5rem',
      },
      padding: {
        // iOS safe area for bottom nav
        safe: 'env(safe-area-inset-bottom)',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
