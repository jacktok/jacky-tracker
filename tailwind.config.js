/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'bg': '#0a0a0a',
        'bg-secondary': '#111111',
        'panel': '#1a1a1a',
        'panel-2': '#262626',
        'panel-3': '#333333',
        'text': '#fafafa',
        'text-secondary': '#d4d4d8',
        'text-muted': '#a1a1aa',
        'accent': '#3b82f6',
        'accent-hover': '#2563eb',
        'accent-light': '#60a5fa',
        'border': '#404040',
        'border-light': '#525252',
        'ring': 'rgba(59, 130, 246, 0.3)',
        'success': '#10b981',
        'success-light': '#34d399',
        'warning': '#f59e0b',
        'warning-light': '#fbbf24',
        'danger': '#ef4444',
        'danger-light': '#f87171',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'custom': '12px',
        'custom-sm': '8px',
        'custom-lg': '16px',
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'custom-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down': 'slideDown 0.3s ease',
        'toast-in': 'toastIn 0.3s ease',
      },
      keyframes: {
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          'from': { opacity: '0', transform: 'translateX(100%) translateY(8px)' },
          'to': { opacity: '1', transform: 'translateX(0) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

