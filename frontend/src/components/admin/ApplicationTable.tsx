'use client';

import { useMemo, useState } from 'react';
import { Eye, CheckCircle, XCircle, ChevronUp, ChevronDown, FileText, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface ApplicationTableProps {
    applications: Array<{
        id: string;
        full_name: string;
        email: string;
        phone_number: string;
        medical_registration_number: string;
        state_medical_council: string;
        doctor_status: 'pending' | 'verified' | 'rejected';
        application_date: string;
        rejection_reason?: string;
    }>;
    onViewDetails: (id: string) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isLoading?: Record<string, boolean>;
}

type SortKey = 'full_name' | 'application_date' | 'doctor_status';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPONENT
// ============================================================================
export default function ApplicationTable({
    applications,
    onViewDetails,
    onApprove,
    onReject,
    isLoading = {}
}: ApplicationTableProps) {
    // ========================================================================
    // STATE
    // ========================================================================
    const [sortConfig, setSortConfig] = useState<{
        key: SortKey | null;
        direction: SortDirection;
    }>({
        key: 'application_date',
        direction: 'desc'
    });

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    const statusConfig = {
        pending: {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            border: 'border-amber-200',
            label: 'Pending',
            icon: '⏳'
        },
        verified: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-200',
            label: 'Verified',
            icon: '✅'
        },
        rejected: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-200',
            label: 'Rejected',
            icon: '❌'
        }
    };

    // ========================================================================
    // UTILITIES
    // ========================================================================
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // ========================================================================
    // SORTING
    // ========================================================================
    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedApplications = useMemo(() => {
        if (!sortConfig.key) return applications;

        return [...applications].sort((a, b) => {
            const key = sortConfig.key!;
            const aValue = a[key];
            const bValue = b[key];

            if (key === 'application_date') {
                const aTime = new Date(aValue).getTime();
                const bTime = new Date(bValue).getTime();
                return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
            }

            // String comparison for name and status
            const comparison = String(aValue).localeCompare(String(bValue));
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [applications, sortConfig]);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================
    const SortableHeader = ({
        label,
        sortKey,
        className = ''
    }: {
        label: string;
        sortKey: SortKey;
        className?: string;
    }) => {
        const isActive = sortConfig.key === sortKey;
        const direction = sortConfig.direction;

        return (
            <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
                onClick={() => handleSort(sortKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(sortKey);
                    }
                }}
                aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
                <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {isActive && (
                        direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )
                    )}
                    {!isActive && (
                        <div className="w-4 h-4 opacity-0 group-hover:opacity-30">
                            <ChevronUp className="w-4 h-4" />
                        </div>
                    )}
                </div>
            </th>
        );
    };

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Mobile scroll hint */}
            <div className="lg:hidden px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800 flex items-center gap-2">
                <span>← Scroll horizontally to see all columns →</span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* ========================================================
                        TABLE HEADER
                        ======================================================== */}
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <SortableHeader
                                label="Name"
                                sortKey="full_name"
                                className="sticky left-0 bg-gray-50 lg:static"
                            />
                            <th
                                scope="col"
                                className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                Email
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                Phone
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                Reg No
                            </th>
                            <th
                                scope="col"
                                className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                State
                            </th>
                            <SortableHeader
                                label="Application Date"
                                sortKey="application_date"
                            />
                            <SortableHeader
                                label="Status"
                                sortKey="doctor_status"
                            />
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>

                    {/* ========================================================
                        TABLE BODY
                        ======================================================== */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedApplications.length === 0 ? (
                            // Empty State
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-600 font-medium">No applications found</p>
                                        <p className="text-sm text-gray-500">Applications will appear here once doctors register</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sortedApplications.map((application) => {
                                const status = statusConfig[application.doctor_status];
                                const isRowLoading = isLoading[application.id] || false;

                                return (
                                    <tr
                                        key={application.id}
                                        className={`hover:bg-blue-50 transition-colors ${isRowLoading ? 'opacity-70' : ''}`}
                                    >
                                        {/* Name */}
                                        <td className="sticky left-0 bg-white hover:bg-blue-50 transition-colors lg:static px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-synapseDarkBlue">
                                                {application.full_name}
                                            </div>
                                        </td>

                                        {/* Email - Hidden on mobile */}
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700 truncate max-w-xs" title={application.email}>
                                                {application.email}
                                            </div>
                                        </td>

                                        {/* Phone */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {application.phone_number}
                                            </div>
                                        </td>

                                        {/* Registration Number */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono text-gray-700 truncate max-w-xs" title={application.medical_registration_number}>
                                                {application.medical_registration_number}
                                            </div>
                                        </td>

                                        {/* State - Hidden on mobile */}
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700 truncate max-w-xs" title={application.state_medical_council}>
                                                {application.state_medical_council}
                                            </div>
                                        </td>

                                        {/* Application Date */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {formatDate(application.application_date)}
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        {/* <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
                                            >
                                                <span>{status.icon}</span>
                                                <span>{status.label}</span>
                                            </span>
                                        </td> */}

                                        {/* Action Buttons */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {/* View Details - Always visible */}
                                                <button
                                                    onClick={() => onViewDetails(application.id)}
                                                    disabled={isRowLoading}
                                                    className="p-2 text-synapseSkyBlue hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={`View details for ${application.full_name}`}
                                                    aria-label={`View details for ${application.full_name}`}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* Approve - Only for pending */}
                                                {application.doctor_status === 'pending' && (
                                                    <button
                                                        onClick={() => onApprove(application.id)}
                                                        disabled={isRowLoading}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={`Approve ${application.full_name}`}
                                                        aria-label={`Approve ${application.full_name}`}
                                                    >
                                                        {isRowLoading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}

                                                {/* Reject - Only for pending */}
                                                {application.doctor_status === 'pending' && (
                                                    <button
                                                        onClick={() => onReject(application.id)}
                                                        disabled={isRowLoading}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={`Reject ${application.full_name}`}
                                                        aria-label={`Reject ${application.full_name}`}
                                                    >
                                                        {isRowLoading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
