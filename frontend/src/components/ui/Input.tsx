import { forwardRef, InputHTMLAttributes } from 'react'
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
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

        return (
            <div className={clsx(fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="input-label"
                    >
                        {label}
                        {props.required && (
                            <span className="text-medical-error ml-1">*</span>
                        )}
                    </label>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={clsx(
                        'input-field',
                        error && 'border-medical-error focus:border-medical-error focus:ring-medical-error',
                        className
                    )}
                    {...props}
                />

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

Input.displayName = 'Input'

export default Input
