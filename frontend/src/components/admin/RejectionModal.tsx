'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, X, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// ============================================================================
// TYPES
// ============================================================================
interface RejectionModalProps {
    isOpen: boolean;
    application: {
        id: string;
        full_name: string;
        email: string;
        medical_registration_number: string;
    } | null;
    onClose: () => void;
    onConfirm: (applicationId: string, reason: string) => Promise<void>;
    isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function RejectionModal({
    isOpen,
    application,
    onClose,
    onConfirm,
    isLoading = false
}: RejectionModalProps) {
    // ========================================================================
    // STATE
    // ========================================================================
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    // ========================================================================
    // VALIDATION
    // ========================================================================
    const isValidReason = reason.trim().length >= 10;
    const characterCount = reason.length;

    // ========================================================================
    // RESET STATE ON OPEN/CLOSE
    // ========================================================================
    useEffect(() => {
        if (isOpen) {
            setReason('');
            setError('');
        }
    }, [isOpen]);

    // ========================================================================
    // ESCAPE KEY & BODY SCROLL LOCK
    // ========================================================================
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isLoading]);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReason(e.target.value);
        if (error) setError('');
    };

    const handleConfirm = async () => {
        const trimmedReason = reason.trim();

        if (trimmedReason.length < 10) {
            setError('Rejection reason must be at least 10 characters');
            return;
        }

        if (!application) return;
        await onConfirm(application.id, trimmedReason);
    };

    const handleOverlayClick = () => {
        if (!isLoading) {
            handleClose();
        }
    };

    // ========================================================================
    // EARLY RETURN
    // ========================================================================
    if (!application) return null;

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ========================================================
                        OVERLAY
                        ======================================================== */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleOverlayClick}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="rejection-modal-title"
                        aria-describedby="rejection-modal-description"
                    >
                        {/* ====================================================
                            MODAL CONTAINER
                            ==================================================== */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto"
                        >
                            {/* ================================================
                                CLOSE BUTTON
                                ================================================ */}
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* ================================================
                                HEADER
                                ================================================ */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h2
                                    id="rejection-modal-title"
                                    className="text-2xl font-heading font-bold text-gray-900 mb-2"
                                >
                                    Reject Doctor Application
                                </h2>
                                <p
                                    id="rejection-modal-description"
                                    className="text-body text-gray-600"
                                >
                                    Please provide a reason for rejection
                                </p>
                            </div>

                            {/* ================================================
                                APPLICATION DETAILS
                                ================================================ */}
                            <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Applicant Details:
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-700">
                                        <span className="font-medium">Name:</span>{' '}
                                        <span className="font-semibold text-gray-900">
                                            {application.full_name}
                                        </span>
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">Email:</span>{' '}
                                        {application.email}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">Reg No:</span>{' '}
                                        <span className="font-mono">
                                            {application.medical_registration_number}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* ================================================
                                REASON INPUT
                                ================================================ */}
                            <div className="mb-4">
                                <label
                                    htmlFor="rejection-reason"
                                    className="block text-sm font-medium text-gray-900 mb-2"
                                >
                                    Rejection Reason{' '}
                                    <span className="text-red-600" aria-label="required">*</span>
                                </label>
                                <textarea
                                    id="rejection-reason"
                                    value={reason}
                                    onChange={handleReasonChange}
                                    disabled={isLoading}
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Please explain why this application is being rejected. The applicant will receive this reason via email."
                                    className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body text-sm ${error
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 focus:outline-none'
                                        }`}
                                    aria-invalid={!!error}
                                    aria-describedby={error ? 'reason-error' : undefined}
                                />
                                <div className="flex justify-between items-start mt-2">
                                    <div className="flex-1">
                                        {error && (
                                            <p
                                                id="reason-error"
                                                className="text-sm text-red-600 font-medium"
                                                role="alert"
                                            >
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm font-medium ml-4 flex-shrink-0 ${characterCount > 500
                                                ? 'text-red-600'
                                                : characterCount >= 10
                                                    ? 'text-green-600'
                                                    : 'text-gray-500'
                                            }`}
                                        aria-live="polite"
                                        aria-label={`${characterCount} of 500 characters`}
                                    >
                                        {characterCount} / 500
                                    </span>
                                </div>
                            </div>

                            {/* ================================================
                                WARNING BOX
                                ================================================ */}
                            <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
                                <div className="flex gap-3">
                                    <AlertTriangle
                                        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm text-red-900">
                                        <span className="font-semibold">⚠️ Warning:</span> This action cannot be undone.
                                        The applicant will be notified of the rejection via email.
                                    </p>
                                </div>
                            </div>

                            {/* ================================================
                                ACTIONS
                                ================================================ */}
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-1"
                                    aria-label="Cancel rejection"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleConfirm}
                                    disabled={!isValidReason || isLoading}
                                    className="flex-1"
                                    style={{
                                        backgroundColor: (!isValidReason || isLoading) ? '#D1D5DB' : '#DC2626',
                                        opacity: 1,
                                        cursor: (!isValidReason || isLoading) ? 'not-allowed' : 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isValidReason && !isLoading) {
                                            e.currentTarget.style.backgroundColor = '#B91C1C';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isValidReason && !isLoading) {
                                            e.currentTarget.style.backgroundColor = '#DC2626';
                                        }
                                    }}
                                    aria-label="Confirm rejection"
                                    aria-disabled={!isValidReason || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Rejecting...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Reject Application
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
