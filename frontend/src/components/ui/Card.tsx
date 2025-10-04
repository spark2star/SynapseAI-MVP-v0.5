import React from 'react';

interface CardProps {
    variant?: 'default' | 'secondary';
    hoverable?: boolean;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

export default function Card({
    variant = 'default',
    hoverable = false,
    className = '',
    children,
    onClick,
}: CardProps) {
    const baseClasses = 'rounded-card p-6 transition-all duration-300 ease-in-out';

    const variantClasses = {
        default: 'card',
        secondary: 'card-secondary',
    };

    // Enhanced hover effects: lift card and increase shadow
    const hoverClasses = hoverable
        ? 'cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-synapseSkyBlue/10'
        : '';

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

