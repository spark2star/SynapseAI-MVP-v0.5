/**
 * FormTextarea Component
 * Reusable textarea with validation and error display
 */

import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FormTextareaProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    error?: string | null;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
    className?: string;
    helpText?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    label,
    name,
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    required = false,
    disabled = false,
    rows = 4,
    maxLength,
    className = '',
    helpText,
}) => {
    const hasError = !!error;

    return (
        <div className={`space-y-1 ${className}`}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
                <textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    maxLength={maxLength}
                    className={`
            block w-full rounded-lg border px-4 py-2.5
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-none
            ${hasError
                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        }
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
          `}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
                />

                {hasError && (
                    <div className="absolute top-3 right-3 pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                )}
            </div>

            {hasError && (
                <p id={`${name}-error`} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    {error}
                </p>
            )}

            {!hasError && helpText && (
                <p id={`${name}-help`} className="text-sm text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}

            {maxLength && (
                <p className="text-xs text-gray-400 text-right">
                    {value.length} / {maxLength}
                </p>
            )}
        </div>
    );
};
