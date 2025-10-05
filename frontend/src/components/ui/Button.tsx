import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'tertiary';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    style = {},
    ...props
}: ButtonProps) {
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    // FORCE CORRECT COLORS WITH INLINE STYLES
    const variantStyles = {
        primary: {
            backgroundColor: '#50B9E8',
            color: '#FFFFFF',
        },
        secondary: {
            backgroundColor: 'transparent',
            color: '#0A4D8B',
            border: '2px solid #50B9E8',
        },
        tertiary: {
            backgroundColor: 'transparent',
            color: '#0A4D8B',
        },
    };

    return (
        <button
            className={`inline-flex items-center justify-center gap-2 font-body font-semibold rounded-button transition-all duration-200 ${sizeClasses[size]} ${className}`}
            style={{
                ...variantStyles[variant],
                ...style,
            }}
            disabled={disabled || isLoading}
            onMouseEnter={(e) => {
                if (variant === 'primary') {
                    e.currentTarget.style.backgroundColor = '#0A4D8B';
                    e.currentTarget.style.transform = 'scale(1.05)';
                } else if (variant === 'secondary') {
                    e.currentTarget.style.backgroundColor = 'rgba(80, 185, 232, 0.1)';
                } else if (variant === 'tertiary') {
                    e.currentTarget.style.color = '#50B9E8';
                }
            }}
            onMouseLeave={(e) => {
                if (variant === 'primary') {
                    e.currentTarget.style.backgroundColor = '#50B9E8';
                    e.currentTarget.style.transform = 'scale(1)';
                } else if (variant === 'secondary') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                } else if (variant === 'tertiary') {
                    e.currentTarget.style.color = '#0A4D8B';
                }
            }}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : leftIcon}
            {children}
            {rightIcon}
        </button>
    );
}