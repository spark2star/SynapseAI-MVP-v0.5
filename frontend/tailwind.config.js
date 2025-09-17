/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
        extend: {
            colors: {
                // Sky Blue Color Palette for Trust and Innovation
                primary: {
                    50: '#f0f9ff',   // Very light sky blue
                    100: '#e0f2fe',  // Light sky blue
                    200: '#bae6fd',  // Lighter sky blue
                    300: '#7dd3fc',  // Light sky blue
                    400: '#38bdf8',  // Sky blue
                    500: '#0ea5e9',  // Main sky blue
                    600: '#0284c7',  // Darker sky blue
                    700: '#0369a1',  // Dark sky blue
                    800: '#075985',  // Very dark sky blue
                    900: '#0c4a6e',  // Darkest sky blue
                },
                // Medical/Healthcare Colors
                medical: {
                    success: '#10b981',   // Green for success
                    warning: '#f59e0b',   // Amber for warnings
                    error: '#ef4444',     // Red for errors
                    info: '#3b82f6',      // Blue for info
                },
                // Neutral Colors for Professional Look
                neutral: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'medical': '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
