import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export default function Select({
    label,
    error,
    options,
    className = '',
    ...props
}: SelectProps) {
    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <label className="input-label">
                    {label}
                    {props.required && <span className="text-warningRed ml-1">*</span>}
                </label>
            )}

            {/* Select Field */}
            <select
                className={`input-field ${error ? 'input-error' : ''} ${className}`}
                {...props}
            >
                <option value="" disabled>Select an option</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {/* Error Message */}
            {error && <p className="input-error-message">{error}</p>}
        </div>
    );
}