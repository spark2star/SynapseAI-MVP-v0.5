'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenSquare, X, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiService } from '@/services/api';

// ============================================================================
// TYPES
// ============================================================================
interface SignReportModalProps {
    isOpen: boolean;
    reportId: string;
    onClose: () => void;
    onSuccess: () => void;
    isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function SignReportModal({
    isOpen,
    reportId,
    onClose,
    onSuccess,
    isLoading = false
}: SignReportModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ========================================================================
    // ESCAPE KEY & BODY SCROLL LOCK
    // ========================================================================
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
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
    }, [isOpen, loading]);

    // ========================================================================
    // RESET STATE ON OPEN
    // ========================================================================
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleClose = () => {
        if (!loading) {
            setPassword('');
            setError('');
            onClose();
        }
    };

    const handleOverlayClick = () => {
        if (!loading) {
            handleClose();
        }
    };

    const handleSign = async () => {
        // Validation
        if (!password) {
            setError('Password is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call API to sign the report
            await apiService.signReport(reportId, password);

            // Success - notify parent and close modal
            onSuccess();
            handleClose();
        } catch (err: any) {
            // Show error inline without closing modal
            setError(err.message || 'Failed to sign report');
        } finally {
            setLoading(false);
        }
    };

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
                        aria-labelledby="sign-report-modal-title"
                        aria-describedby="sign-report-modal-description"
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
                                onClick={handleClose}
                                disabled={loading}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* ================================================
                                HEADER
                                ================================================ */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <PenSquare className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2
                                    id="sign-report-modal-title"
                                    className="text-2xl font-heading font-bold text-gray-900 mb-2"
                                >
                                    Sign and Finalize Report
                                </h2>
                                <p
                                    id="sign-report-modal-description"
                                    className="text-body text-gray-600"
                                >
                                    Confirm your identity to digitally sign this report
                                </p>
                            </div>

                            {/* ================================================
                                WARNING BOX
                                ================================================ */}
                            <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                                <div className="flex gap-3">
                                    <AlertTriangle
                                        className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                                        aria-hidden="true"
                                    />
                                    <div className="text-sm text-amber-900">
                                        <p className="font-semibold mb-2">Important:</p>
                                        <ul className="space-y-1">
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>This action is final and cannot be undone</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>By signing, you certify the information is accurate and complete</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Your digital signature will be legally binding</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* ================================================
                                PASSWORD INPUT
                                ================================================ */}
                            <div className="mb-6">
                                <Input
                                    type="password"
                                    label="Confirm Your Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    error={error}
                                    disabled={loading}
                                    required
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && password) {
                                            handleSign();
                                        }
                                    }}
                                />
                            </div>

                            {/* ================================================
                                ACTIONS
                                ================================================ */}
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1"
                                    aria-label="Cancel signing"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSign}
                                    disabled={loading || !password}
                                    className="flex-1"
                                    aria-label="Confirm and sign report"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Signing...
                                        </>
                                    ) : (
                                        <>
                                            <PenSquare className="w-4 h-4" />
                                            Confirm & Sign
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
