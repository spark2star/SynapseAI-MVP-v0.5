import { clsx } from 'clsx'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
}

export default function LoadingSpinner({
    size = 'md',
    className
}: LoadingSpinnerProps) {
    return (
        <div className={clsx(
            'animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600',
            sizeClasses[size],
            className
        )} />
    )
}
