import React from 'react';

interface BadgeProps {
    variant?: 'success' | 'error' | 'primary' | 'neutral';
    children: React.ReactNode;
    className?: string;
}

export default function Badge({
    variant = 'neutral',
    children,
    className = '',
}: BadgeProps) {
    const variantClasses = {
        success: 'badge-success',
        error: 'badge-error',
        primary: 'badge-primary',
        neutral: 'badge-neutral',
    };

    return (
        <span className={`badge ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
}

