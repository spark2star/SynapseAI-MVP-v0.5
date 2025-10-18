/**
 * Toast notification utilities
 * Provides consistent toast notifications across the application
 */

import toast from 'react-hot-toast';

interface ToastOptions {
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Show success toast notification
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
        style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
        iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
        },
    });
};

/**
 * Show error toast notification
 */
export const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
        duration: options?.duration || 5000,
        position: options?.position || 'top-right',
        style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
        iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
        },
    });
};

/**
 * Show info toast notification
 */
export const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
        icon: 'ℹ️',
        style: {
            background: '#3B82F6',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
    });
};

/**
 * Show warning toast notification
 */
export const showWarning = (message: string, options?: ToastOptions) => {
    toast(message, {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
        icon: '⚠️',
        style: {
            background: '#F59E0B',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
    });
};

/**
 * Show loading toast notification
 * Returns a function to dismiss the toast
 */
export const showLoading = (message: string, options?: ToastOptions) => {
    const toastId = toast.loading(message, {
        position: options?.position || 'top-right',
        style: {
            background: '#6366F1',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
    });

    return () => toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
    toast.dismiss();
};
