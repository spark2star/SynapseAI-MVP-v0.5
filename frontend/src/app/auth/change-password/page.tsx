'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, changePassword } = useAuthStore();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Password strength validation
    const validatePasswordStrength = (password: string) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
        };

        return checks;
    };

    const passwordChecks = validatePasswordStrength(newPassword);
    const allChecksPassed = Object.values(passwordChecks).every(check => check);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setError('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (!allChecksPassed) {
            setError('Password does not meet strength requirements');
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await changePassword(currentPassword, newPassword);

            if (result.success) {
                toast.success('Password changed successfully! Redirecting to dashboard...');

                // Update the user state to clear password_reset_required
                const currentUser = user;
                if (currentUser) {
                    currentUser.password_reset_required = false;
                }

                setTimeout(() => {
                    const role = user?.role || 'doctor';
                    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';

                    // Force a complete reload to ensure auth state is fresh
                    window.location.replace(redirectPath);
                }, 1500);
            }else {
                setError(result.error || 'Failed to change password');
                toast.error(result.error || 'Failed to change password');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            toast.error('Failed to change password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-synapseSkyBlue to-synapseDarkBlue px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <LockClosedIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                        Change Your Password
                    </h1>
                    <p className="text-gray-600">
                        You must change your temporary password before continuing
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your current password"
                                disabled={isSubmitting}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3.5 text-gray-600 hover:text-gray-800 transition-colors"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                tabIndex={-1}
                            >
                                {showCurrentPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter a strong password"
                                disabled={isSubmitting}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3.5 text-gray-600 hover:text-gray-800 transition-colors"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                            >
                                {showNewPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Password Strength Indicators */}
                    {newPassword && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2 text-sm"
                        >
                            <p className="font-medium text-gray-700">Password must contain:</p>
                            <div className="space-y-1">
                                <PasswordCheck checked={passwordChecks.length} label="At least 8 characters" />
                                <PasswordCheck checked={passwordChecks.uppercase} label="One uppercase letter (A-Z)" />
                                <PasswordCheck checked={passwordChecks.lowercase} label="One lowercase letter (a-z)" />
                                <PasswordCheck checked={passwordChecks.number} label="One number (0-9)" />
                                <PasswordCheck checked={passwordChecks.special} label="One special character (!@#$%^&*)" />
                            </div>
                        </motion.div>
                    )}

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Re-enter your new password"
                                disabled={isSubmitting}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3.5 text-gray-600 hover:text-gray-800 transition-colors"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-1 text-sm text-red-600"
                            >
                                Passwords do not match
                            </motion.p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={isSubmitting}
                        disabled={isSubmitting || !allChecksPassed || newPassword !== confirmPassword || !currentPassword}
                    >
                        {isSubmitting ? 'Changing Password...' : 'Change Password'}
                    </Button>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Security Tip:</strong> Choose a strong, unique password that you don't use for other accounts.
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// Password check component
function PasswordCheck({ checked, label }: { checked: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            {checked ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
                <XCircleIcon className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={checked ? 'text-green-700' : 'text-gray-500'}>{label}</span>
        </div>
    );
}
