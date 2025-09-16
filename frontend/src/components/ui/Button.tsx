import { forwardRef, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        loading = false,
        fullWidth = false,
        disabled,
        children,
        ...props
    }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed'

        const variantClasses = {
            primary: 'bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white focus:ring-primary-500',
            secondary: 'bg-white hover:bg-neutral-50 focus:bg-neutral-50 text-neutral-700 border border-neutral-300 focus:ring-primary-500',
            danger: 'bg-medical-error hover:bg-red-600 focus:bg-red-600 text-white focus:ring-red-500',
            success: 'bg-medical-success hover:bg-green-600 focus:bg-green-600 text-white focus:ring-green-500'
        }

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base'
        }

        const isDisabled = disabled || loading

        return (
            <button
                ref={ref}
                className={clsx(
                    baseClasses,
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth && 'w-full',
                    className
                )}
                disabled={isDisabled}
                {...props}
            >
                {loading && (
                    <LoadingSpinner
                        size="sm"
                        className="mr-2"
                    />
                )}
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'

export default Button
