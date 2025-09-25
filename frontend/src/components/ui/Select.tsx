import { forwardRef, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'onChange'> {
    label?: string
    error?: string
    helpText?: string
    fullWidth?: boolean
    options: SelectOption[]
    placeholder?: string
    onValueChange?: (value: string) => void
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({
        className,
        label,
        error,
        helpText,
        fullWidth = true,
        options,
        placeholder,
        id,
        onValueChange,
        ...props
    }, ref) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

        return (
            <div className={clsx(fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                    >
                        {label}
                        {props.required && (
                            <span className="text-red-500 ml-1">*</span>
                        )}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={clsx(
                            // Base styles
                            'block w-full px-4 py-3 text-sm appearance-none pr-10',
                            // Border and background
                            'border-2 rounded-lg',
                            'bg-white dark:bg-neutral-800',
                            // Normal state
                            'border-neutral-300 dark:border-neutral-600',
                            'text-neutral-900 dark:text-neutral-100',
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
                        onChange={(e) => onValueChange?.(e.target.value)}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}

                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-700">
                        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                </div>

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

Select.displayName = 'Select'

export { Select }
export default Select
