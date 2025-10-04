import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ============================================================================
            // SYNAPSEAI COLOR PALETTE
            // ============================================================================
            colors: {
                // Primary Colors
                synapseSkyBlue: '#50B9E8',      // Primary actions, CTAs, active states
                synapseDarkBlue: '#0A4D8B',     // Headlines, strong accents, footer

                // Neutral Palette (8-point scale for consistency)
                neutralBlack: '#1A202C',         // Body text, high contrast
                neutralGray: {
                    700: '#4A5568',                // Sub-text, captions, disabled text
                    300: '#CBD5E0',                // Borders, dividers
                    100: '#F7FAFC',                // Section backgrounds, card backgrounds
                },
                white: '#FFFFFF',                // Main background, text on dark

                // Semantic Colors
                successGreen: '#38A169',         // Success messages, validation
                warningRed: '#E53E3E',           // Error messages, destructive actions

                // Alias for common usage (backward compatibility)
                primary: {
                    DEFAULT: '#50B9E8',            // synapseSkyBlue
                    dark: '#0A4D8B',               // synapseDarkBlue
                    light: '#E0F5FF',              // Hover state for secondary buttons
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                neutral: {
                    black: '#1A202C',
                    700: '#4A5568',
                    300: '#CBD5E0',
                    100: '#F7FAFC',
                    50: '#fafafa',
                    200: '#e5e5e5',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    800: '#262626',
                    900: '#171717',
                },
                semantic: {
                    success: '#38A169',
                    error: '#E53E3E',
                },
                // Medical/Healthcare Colors (keep for compatibility)
                medical: {
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                },
            },

            // ============================================================================
            // TYPOGRAPHY SYSTEM
            // ============================================================================
            fontFamily: {
                heading: ['var(--font-poppins)', 'Poppins', 'sans-serif'],  // Headlines (H1, H2, H3)
                body: ['var(--font-lato)', 'Lato', 'sans-serif'],           // Paragraphs, labels, UI text
                sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },

            fontSize: {
                // Typographic Scale
                'page-title': ['48px', { lineHeight: '1.2', fontWeight: '700' }],      // H1
                'section-title': ['36px', { lineHeight: '1.3', fontWeight: '700' }],   // H2
                'card-title': ['24px', { lineHeight: '1.4', fontWeight: '600' }],      // H3
                'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],            // Paragraph
                'label': ['14px', { lineHeight: '1.5', fontWeight: '400' }],           // Caption/Label
            },

            // ============================================================================
            // SPACING (8-POINT GRID SYSTEM)
            // ============================================================================
            spacing: {
                // Custom spacing aligned to 8px grid
                '18': '72px',   // 9 * 8px
                '22': '88px',   // 11 * 8px
                '26': '104px',  // 13 * 8px
                '88': '22rem',
            },

            // ============================================================================
            // BORDER RADIUS (Soft curves echoing logo)
            // ============================================================================
            borderRadius: {
                'card': '12px',          // Standard card radius
                'button': '8px',         // Button radius
                'input': '8px',          // Input field radius
            },

            // ============================================================================
            // BOX SHADOWS (Subtle elevation)
            // ============================================================================
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
                'input-focus': '0 0 0 3px rgba(80, 185, 232, 0.1)',  // Blue glow for inputs
                'button': '0 2px 4px rgba(0, 0, 0, 0.1)',
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'medical': '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
            },

            // ============================================================================
            // ANIMATIONS
            // ============================================================================
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                // Parallax background animations
                'gradientMove': 'gradientMove 20s ease-in-out infinite',
                'float': 'float 8s ease-in-out infinite',
                'float-delay': 'float 8s ease-in-out 4s infinite',
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
                // Gradient shifts left and right
                gradientMove: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                // Vertical floating motion
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
            },
            // Background size for animated gradient
            backgroundSize: {
                '300%': '300% 300%',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),       // Better form styling
        require('@tailwindcss/typography'),  // Better typography
    ],
};

export default config;
