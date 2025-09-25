import { forwardRef, InputHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helpText?: string
    fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
        className,
        label,
        error,
        helpText,
        fullWidth = true,
        id,
        ...props
    }, ref) => {
        const generatedId = useId()
        const inputId = id || generatedId

        return (
            <div className={clsx(fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                    >
                        {label}
                        {props.required && (
                            <span className="text-red-500 ml-1">*</span>
                        )}
                    </label>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={clsx(
                        // Base styles
                        'block w-full px-4 py-3 text-sm',
                        // Border and background
                        'border-2 rounded-lg',
                        'bg-white dark:bg-neutral-800',
                        // Normal state
                        'border-neutral-300 dark:border-neutral-600',
                        'text-neutral-900 dark:text-neutral-100',
                        'placeholder-neutral-500 dark:placeholder-neutral-400',
                        // Focus state
                        'focus:outline-none focus:border-blue-500 dark:focus:border-blue-400',
                        'focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10',
                        // Transition
                        'transition-all duration-200',
                        // Error state
                        error && 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/10 dark:focus:ring-red-400/10',
                        // Disabled state
                        'disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:text-neutral-500 dark:disabled:text-neutral-600 disabled:cursor-not-allowed',
                        className
                    )}
                    {...props}
                />

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}

                {helpText && !error && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                        {helpText}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export { Input }
export default Input
