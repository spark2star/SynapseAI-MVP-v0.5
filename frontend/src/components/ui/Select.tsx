import { forwardRef, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string
    error?: string
    helpText?: string
    fullWidth?: boolean
    options: SelectOption[]
    placeholder?: string
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
        ...props
    }, ref) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

        return (
            <div className={clsx(fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="input-label"
                    >
                        {label}
                        {props.required && (
                            <span className="text-medical-error ml-1">*</span>
                        )}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={clsx(
                            'input-field appearance-none pr-10',
                            error && 'border-medical-error focus:border-medical-error focus:ring-medical-error',
                            className
                        )}
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
                    <p className="error-message">
                        {error}
                    </p>
                )}

                {helpText && !error && (
                    <p className="text-sm text-neutral-500 mt-1">
                        {helpText}
                    </p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export default Select
