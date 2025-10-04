import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <label className="input-label" style={{ fontFamily: 'var(--font-lato), Lato, sans-serif' }}>
                    {label}
                    {props.required && <span className="text-warningRed ml-1">*</span>}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutralGray-700">
                        {leftIcon}
                    </div>
                )}

                {/* Input Field */}
                <input
                    className={`input-field ${error ? 'input-error' : ''} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
                    {...props}
                />

                {/* Right Icon */}
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutralGray-700">
                        {rightIcon}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && <p className="input-error-message">{error}</p>}

            {/* Success Message */}
            {success && <p className="input-success-message">{success}</p>}

            {/* Helper Text */}
            {helperText && !error && !success && (
                <p className="text-label text-neutralGray-700 mt-1">{helperText}</p>
            )}
        </div>
    );
}