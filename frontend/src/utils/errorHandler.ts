/**
 * Error handling utilities
 * Provides consistent error handling and user-friendly error messages
 */

import { AxiosError } from 'axios';
import { showError } from './toast';

interface ApiError {
    error?: string;
    message: string;
    field?: string;
    retry?: boolean;
    [key: string]: any;
}

/**
 * Extract error message from API response
 */
export const getErrorMessage = (error: unknown): string => {
    if (!error) {
        return 'An unexpected error occurred';
    }

    // Handle Axios errors
    if (error instanceof AxiosError) {
        const data = error.response?.data;

        // Handle structured error responses
        if (data && typeof data === 'object') {
            // Check for detail field (FastAPI format)
            if (data.detail) {
                if (typeof data.detail === 'string') {
                    return data.detail;
                }
                if (typeof data.detail === 'object' && data.detail.message) {
                    return data.detail.message;
                }
            }

            // Check for message field
            if (data.message) {
                return data.message;
            }

            // Check for error field
            if (data.error) {
                if (typeof data.error === 'string') {
                    return data.error;
                }
                if (typeof data.error === 'object' && data.error.message) {
                    return data.error.message;
                }
            }
        }

        // Handle network errors
        if (error.code === 'ERR_NETWORK') {
            return 'Network error. Please check your internet connection.';
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            return 'Request timeout. Please try again.';
        }

        // Handle status codes
        if (error.response?.status === 401) {
            return 'Unauthorized. Please log in again.';
        }
        if (error.response?.status === 403) {
            return 'Access denied. You do not have permission to perform this action.';
        }
        if (error.response?.status === 404) {
            return 'Resource not found.';
        }
        if (error.response?.status === 413) {
            return 'File too large. Please upload a smaller file.';
        }
        if (error.response?.status === 429) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        if (error.response?.status === 500) {
            return 'Server error. Please try again later.';
        }

        return error.message || 'An error occurred';
    }

    // Handle Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
};

/**
 * Get field-specific error from API response
 */
export const getFieldError = (error: unknown, fieldName: string): string | null => {
    if (!error || !(error instanceof AxiosError)) {
        return null;
    }

    const data = error.response?.data;
    if (!data || typeof data !== 'object') {
        return null;
    }

    // Check for detail.field format
    if (data.detail && typeof data.detail === 'object' && data.detail.field === fieldName) {
        return data.detail.message || null;
    }

    // Check for validation errors array
    if (Array.isArray(data.detail)) {
        const fieldError = data.detail.find((err: any) => err.loc?.includes(fieldName));
        if (fieldError) {
            return fieldError.msg || null;
        }
    }

    return null;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
    if (!(error instanceof AxiosError)) {
        return false;
    }

    const data = error.response?.data;
    if (data && typeof data === 'object' && 'retry' in data) {
        return data.retry === true;
    }

    // Network errors and timeouts are retryable
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        return true;
    }

    // 5xx errors are retryable
    const status = error.response?.status;
    return status ? status >= 500 && status < 600 : false;
};

/**
 * Handle API error with toast notification
 */
export const handleApiError = (error: unknown, customMessage?: string) => {
    const message = customMessage || getErrorMessage(error);
    showError(message);
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry if error is not retryable
            if (!isRetryableError(error)) {
                throw error;
            }

            // Don't wait after last attempt
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

/**
 * Validation error type
 */
export interface ValidationError {
    field: string;
    message: string;
}

/**
 * Extract validation errors from API response
 */
export const getValidationErrors = (error: unknown): ValidationError[] => {
    if (!(error instanceof AxiosError)) {
        return [];
    }

    const data = error.response?.data;
    if (!data || typeof data !== 'object') {
        return [];
    }

    const errors: ValidationError[] = [];

    // Handle FastAPI validation errors
    if (Array.isArray(data.detail)) {
        data.detail.forEach((err: any) => {
            if (err.loc && Array.isArray(err.loc) && err.msg) {
                const field = err.loc[err.loc.length - 1];
                errors.push({
                    field: String(field),
                    message: err.msg,
                });
            }
        });
    }

    // Handle single field error
    if (data.detail && typeof data.detail === 'object' && data.detail.field) {
        errors.push({
            field: data.detail.field,
            message: data.detail.message || 'Validation error',
        });
    }

    return errors;
};
