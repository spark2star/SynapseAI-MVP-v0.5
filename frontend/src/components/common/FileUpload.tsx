/**
 * FileUpload Component
 * Reusable file upload with validation, preview, and error display
 */

import React, { useRef, useState } from 'react';
import { CloudArrowUpIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { validateFile } from '@/utils/formValidation';

interface FileUploadProps {
    label: string;
    name: string;
    accept?: string;
    maxSizeMB?: number;
    allowedFormats?: string[];
    required?: boolean;
    disabled?: boolean;
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string | null;
    helpText?: string;
    showPreview?: boolean;
    className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    label,
    name,
    accept = 'image/*',
    maxSizeMB = 5,
    allowedFormats = ['jpg', 'jpeg', 'png'],
    required = false,
    disabled = false,
    value,
    onChange,
    error,
    helpText,
    showPreview = true,
    className = '',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const hasError = !!error;

    const handleFileChange = (file: File | null) => {
        if (!file) {
            onChange(null);
            setPreview(null);
            return;
        }

        // Validate file
        const validationError = validateFile(file, { required, maxSizeMB, allowedFormats });
        if (validationError) {
            onChange(null);
            setPreview(null);
            return;
        }

        onChange(file);

        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileChange(files[0]);
        }
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleFileChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`
          relative border-2 border-dashed rounded-lg p-6
          transition-all duration-200 cursor-pointer
          ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
          ${hasError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-indigo-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          dark:border-gray-600
        `}
            >
                <input
                    ref={fileInputRef}
                    id={name}
                    name={name}
                    type="file"
                    accept={accept}
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    disabled={disabled}
                    className="hidden"
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
                />

                {value && preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            aria-label="Remove file"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                        <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                            {value.name} ({(value.size / 1024).toFixed(1)} KB)
                        </p>
                    </div>
                ) : value ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CloudArrowUpIcon className="h-8 w-8 text-indigo-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{value.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(value.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1 text-red-500 hover:text-red-600 transition-colors"
                            aria-label="Remove file"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                Click to upload
                            </span>{' '}
                            or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {allowedFormats.map(f => f.toUpperCase()).join(', ')} up to {maxSizeMB}MB
                        </p>
                    </div>
                )}

                {hasError && (
                    <div className="absolute top-2 right-2">
                        <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
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
        </div>
    );
};
