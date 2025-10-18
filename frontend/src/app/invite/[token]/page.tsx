'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/api';
import { InvitationStatusResponse } from '@/types/staff';
import { CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react';

export default function AcceptInvitationPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invitationStatus, setInvitationStatus] = useState<InvitationStatusResponse | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        checkInvitationStatus();
    }, [token]);

    const checkInvitationStatus = async () => {
        try {
            setLoading(true);
            const status = await apiClient.checkInvitationStatus(token);
            setInvitationStatus(status);
        } catch (error: any) {
            console.error('Error checking invitation:', error);
            toast.error('Failed to validate invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setSubmitting(true);
            const response = await apiClient.acceptInvitation(token, password, confirmPassword);

            // Store tokens
            apiClient.setAuthTokens(response.accessToken, response.refreshToken);

            toast.success('Account created successfully! Redirecting...');

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            const message = error.response?.data?.detail || 'Failed to create account';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Validating invitation...</p>
                </div>
            </div>
        );
    }

    if (!invitationStatus?.valid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {invitationStatus?.expired ? 'Invitation Expired' : 'Invalid Invitation'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {invitationStatus?.message || 'This invitation link is not valid.'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        You're Invited!
                    </h1>
                    <p className="text-gray-600">
                        {invitationStatus.inviterName && (
                            <>
                                <span className="font-semibold">{invitationStatus.inviterName}</span> has invited you to join
                            </>
                        )}
                        {invitationStatus.clinicName && (
                            <> <span className="font-semibold">{invitationStatus.clinicName}</span></>
                        )}
                        {' '}on SynapseAI
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Your Role: Receptionist</p>
                            <p className="text-blue-700">
                                You'll be able to register new patients and manage appointments.
                                Clinical data will remain accessible only to doctors.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={invitationStatus.recipientEmail || ''}
                            disabled
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Create Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password (min. 8 characters)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                        🔒 Your data is encrypted and secure. By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
