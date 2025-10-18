/**
 * Form validation utilities
 * Provides real-time validation for form fields
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): string | null => {
    if (!email) {
        return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }

    return null;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): string | null => {
    if (!phone) {
        return 'Phone number is required';
    }

    // Remove spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check if it's a valid phone number (10-15 digits, optionally starting with +)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(cleanPhone)) {
        return 'Please enter a valid phone number';
    }

    return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string): string | null => {
    if (!value || !value.trim()) {
        return `${fieldName} is required`;
    }
    return null;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (
    value: string,
    minLength: number,
    fieldName: string
): string | null => {
    if (!value) {
        return null; // Use validateRequired for required check
    }

    if (value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }

    return null;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (
    value: string,
    maxLength: number,
    fieldName: string
): string | null => {
    if (!value) {
        return null;
    }

    if (value.length > maxLength) {
        return `${fieldName} must not exceed ${maxLength} characters`;
    }

    return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): string | null => {
    if (!password) {
        return 'Password is required';
    }

    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }

    return null;
};

/**
 * Validate file upload
 */
export const validateFile = (
    file: File | null,
    options: {
        required?: boolean;
        maxSizeMB?: number;
        allowedFormats?: string[];
    } = {}
): string | null => {
    const { required = false, maxSizeMB = 5, allowedFormats = ['jpg', 'jpeg', 'png'] } = options;

    if (!file) {
        return required ? 'File is required' : null;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
        return `File size must not exceed ${maxSizeMB}MB`;
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension && !allowedFormats.includes(fileExtension)) {
        return `File format must be one of: ${allowedFormats.join(', ')}`;
    }

    return null;
};

/**
 * Validate qualifications format
 */
export const validateQualifications = (qualifications: string): string | null => {
    if (!qualifications || !qualifications.trim()) {
        return 'Qualifications are required';
    }

    if (qualifications.length > 255) {
        return 'Qualifications must not exceed 255 characters';
    }

    return null;
};

/**
 * Validate clinic name
 */
export const validateClinicName = (clinicName: string): string | null => {
    if (!clinicName || !clinicName.trim()) {
        return 'Clinic name is required';
    }

    if (clinicName.length < 2) {
        return 'Clinic name must be at least 2 characters';
    }

    if (clinicName.length > 255) {
        return 'Clinic name must not exceed 255 characters';
    }

    return null;
};

/**
 * Validate address
 */
export const validateAddress = (address: string): string | null => {
    if (!address || !address.trim()) {
        return 'Address is required';
    }

    if (address.length < 10) {
        return 'Please enter a complete address';
    }

    if (address.length > 1000) {
        return 'Address must not exceed 1000 characters';
    }

    return null;
};

/**
 * Combine multiple validation functions
 */
export const combineValidators = (
    ...validators: Array<(value: any) => string | null>
) => {
    return (value: any): string | null => {
        for (const validator of validators) {
            const error = validator(value);
            if (error) {
                return error;
            }
        }
        return null;
    };
};
