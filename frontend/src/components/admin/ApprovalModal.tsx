'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Info, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// ============================================================================
// TYPES
// ============================================================================
interface ApprovalModalProps {
    isOpen: boolean;
    application: {
        id: string;
        full_name: string;
        email: string;
        medical_registration_number: string;
    } | null;
    onClose: () => void;
    onConfirm: (applicationId: string) => Promise<void>;
    isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function ApprovalModal({
    isOpen,
    application,
    onClose,
    onConfirm,
    isLoading = false
}: ApprovalModalProps) {
    // ========================================================================
    // ESCAPE KEY & BODY SCROLL LOCK
    // ========================================================================
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Disable scroll
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isLoading, onClose]);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleConfirm = async () => {
        if (!application) return;
        await onConfirm(application.id);
    };

    const handleOverlayClick = () => {
        if (!isLoading) {
            onClose();
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
                        aria-labelledby="approval-modal-title"
                        aria-describedby="approval-modal-description"
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
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
                        >
                            {/* ================================================
                                CLOSE BUTTON
                                ================================================ */}
                            <button
                                onClick={onClose}
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
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2
                                    id="approval-modal-title"
                                    className="text-2xl font-heading font-bold text-gray-900 mb-2"
                                >
                                    Approve Doctor Application
                                </h2>
                                <p
                                    id="approval-modal-description"
                                    className="text-body text-gray-600"
                                >
                                    Are you sure you want to approve this application?
                                </p>
                            </div>

                            {/* ================================================
                                APPLICATION DETAILS
                                ================================================ */}
                            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
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
                                INFO BOX
                                ================================================ */}
                            <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <div className="text-sm text-amber-900">
                                        <p className="font-semibold mb-2">After approval:</p>
                                        <ul className="space-y-1">
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>A temporary password will be generated</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Doctor will receive an email with login credentials</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Doctor must change password on first login</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* ================================================
                                ACTIONS
                                ================================================ */}
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1"
                                    aria-label="Cancel approval"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="flex-1"
                                    style={{
                                        backgroundColor: isLoading ? '#16A34A' : '#16A34A',
                                        opacity: isLoading ? 0.7 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isLoading) {
                                            e.currentTarget.style.backgroundColor = '#15803D';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#16A34A';
                                    }}
                                    aria-label="Confirm approval"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Approve Application
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
