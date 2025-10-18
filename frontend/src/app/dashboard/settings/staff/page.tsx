'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/api';
import { StaffMember, PendingInvitation } from '@/types/staff';
import { UserPlus, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function StaffManagementPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        loadStaffData();
    }, []);

    const loadStaffData = async () => {
        try {
            setLoadingData(true);
            const [staff, invitations] = await Promise.all([
                apiClient.listStaffMembers().catch(err => {
                    console.error('Error loading staff members:', err);
                    return [];
                }),
                apiClient.listPendingInvitations().catch(err => {
                    console.error('Error loading invitations:', err);
                    return { data: [] };
                })
            ]);

            setStaffMembers(Array.isArray(staff) ? staff : []);
            setPendingInvitations(invitations.data || []);
        } catch (error: any) {
            console.error('Error loading staff data:', error);
            // Don't show error toast on initial load, just log it
        } finally {
            setLoadingData(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.inviteStaff(email);

            toast.success(`Invitation sent to ${email}`);
            setEmail('');

            // Reload data
            await loadStaffData();
        } catch (error: any) {
            console.error('Error sending invitation:', error);
            const message = error.response?.data?.detail || 'Failed to send invitation';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Clinic Staff</h1>
                <p className="mt-2 text-gray-600">
                    Manage your clinic's receptionist team and send invitations
                </p>
            </div>

            {/* Invite Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Invite Receptionist</h2>
                </div>

                <form onSubmit={handleInvite} className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter receptionist's email address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                Send Invite
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expires
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingInvitations.map((invitation) => (
                                    <tr key={invitation.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {invitation.recipientEmail}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(invitation.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(invitation.expiresAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                <Clock className="w-3 h-3" />
                                                Pending
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Active Staff Members */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Active Staff</h2>
                </div>

                {staffMembers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No staff members yet. Send an invitation to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {staffMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {member.firstName && member.lastName
                                                ? `${member.firstName} ${member.lastName}`
                                                : 'Not set'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="capitalize">{member.role}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(member.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {member.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircle className="w-3 h-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
