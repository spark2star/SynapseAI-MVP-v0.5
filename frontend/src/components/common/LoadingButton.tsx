/**
 * LoadingButton Component
 * Button with loading state and disabled handling
 */

import React from 'react';

interface LoadingButtonProps {
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    type = 'button',
    onClick,
    loading = false,
    disabled = false,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    children,
    className = '',
}) => {
    const isDisabled = disabled || loading;

    const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const variantClasses = {
        primary: `
      bg-indigo-600 text-white
      hover:bg-indigo-700
      focus:ring-indigo-500
      disabled:hover:bg-indigo-600
    `,
        secondary: `
      bg-gray-200 text-gray-900
      hover:bg-gray-300
      focus:ring-gray-500
      disabled:hover:bg-gray-200
      dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600
    `,
        danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
      disabled:hover:bg-red-600
    `,
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
};
