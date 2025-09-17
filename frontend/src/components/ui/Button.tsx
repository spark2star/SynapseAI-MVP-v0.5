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
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed'

        const variantClasses = {
            primary: 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:bg-blue-600 text-white focus:ring-blue-500 dark:focus:ring-blue-400',
            secondary: 'bg-white hover:bg-neutral-50 focus:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 focus:ring-blue-500 dark:focus:ring-blue-400',
            danger: 'bg-red-600 hover:bg-red-700 focus:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:bg-red-600 text-white focus:ring-red-500 dark:focus:ring-red-400',
            success: 'bg-green-600 hover:bg-green-700 focus:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:bg-green-600 text-white focus:ring-green-500 dark:focus:ring-green-400'
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
