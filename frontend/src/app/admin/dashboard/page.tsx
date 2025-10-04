'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface DoctorApplication {
    user_id: string;
    full_name: string;
    email: string;
    medical_registration_number: string;
    state_medical_council: string;
    application_date: string;
    status: 'pending' | 'verified' | 'rejected';
    verification_date: string | null;
    verified_by: string | null;
}

interface ApplicationDetails extends DoctorApplication {
    created_at: string;
    profile: {
        full_name: string;
        medical_registration_number: string;
        state_medical_council: string;
        application_date: string;
        verification_date: string | null;
        rejection_reason: string | null;
        profile_completed: boolean;
    };
    audit_history: Array<{
        event_type: string;
        timestamp: string;
        admin_id: string | null;
        details: any;
    }>;
}

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected';

export default function AdminDashboardPage() {
    const [applications, setApplications] = useState<DoctorApplication[]>([]);
    const [filter, setFilter] = useState<StatusFilter>('pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationDetails | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, [filter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('Not authenticated. Please login.');
                return;
            }

            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await axios.get(
                `${API_URL}/admin/applications${statusParam}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 'success') {
                setApplications(response.data.data.applications);
            }
        } catch (err: any) {
            console.error('Error fetching applications:', err);
            setError(err.response?.data?.error?.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicationDetails = async (userId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(
                `${API_URL}/admin/applications/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 'success') {
                setSelectedApplication(response.data.data);
                setShowDetailModal(true);
            }
        } catch (err: any) {
            console.error('Error fetching details:', err);
            setError('Failed to load application details');
        }
    };

    const handleApprove = async (userId: string) => {
        if (!confirm('Are you sure you want to approve this application? A temporary password will be sent to the doctor.')) {
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('access_token');

            const response = await axios.post(
                `${API_URL}/admin/applications/${userId}/approve`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 'success') {
                setSuccessMessage('Doctor approved successfully! Temporary password sent.');
                setShowDetailModal(false);
                fetchApplications();

                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (err: any) {
            console.error('Error approving doctor:', err);
            setError(err.response?.data?.error?.message || 'Failed to approve doctor');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (userId: string) => {
        if (!rejectReason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('access_token');

            const response = await axios.post(
                `${API_URL}/admin/applications/${userId}/reject`,
                { rejection_reason: rejectReason },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 'success') {
                setSuccessMessage('Doctor application rejected. Notification email sent.');
                setShowRejectModal(false);
                setShowDetailModal(false);
                setRejectReason('');
                fetchApplications();

                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (err: any) {
            console.error('Error rejecting doctor:', err);
            setError(err.response?.data?.error?.message || 'Failed to reject doctor');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            verified: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };

        const icons = {
            pending: '⏳',
            verified: '✓',
            rejected: '✕'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
                {icons[status as keyof typeof icons]} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Doctor Applications</h1>
                            <p className="text-gray-600">Review and manage doctor registration applications</p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-fadeIn">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-4 text-red-900 hover:text-red-700 font-medium">
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex gap-2">
                    {[
                        { key: 'all', label: 'All Applications', icon: '📋' },
                        { key: 'pending', label: 'Pending', icon: '⏳' },
                        { key: 'verified', label: 'Verified', icon: '✓' },
                        { key: 'rejected', label: 'Rejected', icon: '✕' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as StatusFilter)}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${filter === key
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span className="mr-2">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <p className="text-gray-600">Loading applications...</p>
                            </div>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-20">
                            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Applications Found</h3>
                            <p className="text-gray-600">
                                {filter === 'all'
                                    ? 'No doctor applications yet.'
                                    : `No ${filter} applications at this time.`}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Doctor Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Registration Info
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Application Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {applications.map((app) => (
                                        <tr key={app.user_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold text-gray-900">{app.full_name}</div>
                                                    <div className="text-sm text-gray-600">{app.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-mono text-gray-900">{app.medical_registration_number}</div>
                                                    <div className="text-xs text-gray-600">{app.state_medical_council}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{formatDate(app.application_date)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => fetchApplicationDetails(app.user_id)}
                                                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        View Details
                                                    </button>
                                                    {app.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(app.user_id)}
                                                                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedApplication(app as any);
                                                                    setShowRejectModal(true);
                                                                }}
                                                                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {showDetailModal && selectedApplication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Current Status</label>
                                    {getStatusBadge(selectedApplication.status)}
                                </div>

                                {/* Doctor Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                                        <p className="text-gray-900 font-semibold">{selectedApplication.profile.full_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                        <p className="text-gray-900">{selectedApplication.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Medical Registration Number</label>
                                        <p className="text-gray-900 font-mono">{selectedApplication.profile.medical_registration_number}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">State Medical Council</label>
                                        <p className="text-gray-900">{selectedApplication.profile.state_medical_council}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Application Date</label>
                                        <p className="text-gray-900">{formatDate(selectedApplication.profile.application_date)}</p>
                                    </div>
                                    {selectedApplication.profile.verification_date && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Verification Date</label>
                                            <p className="text-gray-900">{formatDate(selectedApplication.profile.verification_date)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Rejection Reason */}
                                {selectedApplication.profile.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-red-800 mb-2">Rejection Reason</label>
                                        <p className="text-red-700">{selectedApplication.profile.rejection_reason}</p>
                                    </div>
                                )}

                                {/* Audit History */}
                                {selectedApplication.audit_history && selectedApplication.audit_history.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-3">Audit History</label>
                                        <div className="space-y-2">
                                            {selectedApplication.audit_history.map((event, index) => (
                                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {event.event_type.replace(/_/g, ' ').toUpperCase()}
                                                        </span>
                                                        <span className="text-xs text-gray-600">{formatDate(event.timestamp)}</span>
                                                    </div>
                                                    {event.details && (
                                                        <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                                                            {JSON.stringify(event.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                {selectedApplication.status === 'pending' && (
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleApprove(selectedApplication.user_id)}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {actionLoading ? 'Processing...' : 'Approve Application'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                setShowRejectModal(true);
                                            }}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Reject Application
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedApplication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                            <div className="bg-red-600 text-white px-6 py-4 rounded-t-2xl">
                                <h2 className="text-xl font-bold">Reject Application</h2>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-600 mb-4">
                                    Please provide a detailed reason for rejecting this application. This will be sent to the applicant.
                                </p>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                        placeholder="e.g., Invalid medical registration number, incomplete documentation, etc."
                                        minLength={10}
                                        maxLength={1000}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {rejectReason.length}/1000 characters (minimum 10)
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectReason('');
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedApplication.user_id)}
                                        disabled={actionLoading || rejectReason.length < 10}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
