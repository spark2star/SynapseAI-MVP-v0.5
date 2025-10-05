import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <label className="input-label text-gray-900 font-medium text-sm mb-2 block" style={{ fontFamily: 'var(--font-lato), Lato, sans-serif' }}>
                    {label}
                    {props.required && <span className="text-red-600 ml-1">*</span>}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                        {leftIcon}
                    </div>
                )}

                {/* Input Field */}
                <input
                    ref={ref}
                    className={`input-field text-gray-900 ${error ? 'input-error border-red-500' : 'border-gray-300'} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
                    {...props}
                />

                {/* Right Icon */}
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                        {rightIcon}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && <p className="input-error-message text-red-600 text-sm mt-1">{error}</p>}

            {/* Success Message */}
            {success && <p className="input-success-message text-green-600 text-sm mt-1">{success}</p>}

            {/* Helper Text */}
            {helperText && !error && !success && (
                <p className="text-sm text-gray-600 mt-1">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;