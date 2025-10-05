'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, FileText, MapPin, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';

// ============================================================================
// TYPES
// ============================================================================
interface ApplicationCardProps {
    application: {
        id: string;
        full_name: string;
        email: string;
        phone_number: string;
        medical_registration_number: string;
        state_medical_council: string;
        doctor_status: 'pending' | 'verified' | 'rejected';
        application_date: string;
        rejection_reason?: string;
    };
    onViewDetails: (id: string) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function ApplicationCard({
    application,
    onViewDetails,
    onApprove,
    onReject,
    isLoading = false
}: ApplicationCardProps) {
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
    // STYLES
    // ========================================================================
    const statusStyles = {
        pending: 'bg-amber-100 text-amber-800 border border-amber-200',
        verified: 'bg-green-100 text-green-800 border border-green-200',
        rejected: 'bg-red-100 text-red-800 border border-red-200'
    };

    const statusEmoji = {
        pending: '⏳',
        verified: '✅',
        rejected: '❌'
    };

    const statusLabel = {
        pending: 'Pending',
        verified: 'Verified',
        rejected: 'Rejected'
    };

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
            {/* ================================================================
                HEADER: Name and Status Badge
                ================================================================ */}
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-heading font-bold text-synapseDarkBlue pr-2">
                    {application.full_name}
                </h3>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusStyles[application.doctor_status]}`}
                    aria-label={`Status: ${statusLabel[application.doctor_status]}`}
                >
                    {statusEmoji[application.doctor_status]} {statusLabel[application.doctor_status]}
                </span>
            </div>

            {/* ================================================================
                INFO GRID: Contact and Registration Details
                ================================================================ */}
            <div className="grid grid-cols-1 gap-3 mb-4">
                {/* Email */}
                <div className="flex items-center gap-2 text-sm text-neutralGray-700">
                    <Mail className="w-4 h-4 text-synapseSkyBlue flex-shrink-0" aria-hidden="true" />
                    <span className="truncate" title={application.email}>
                        {application.email}
                    </span>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 text-sm text-neutralGray-700">
                    <Phone className="w-4 h-4 text-synapseSkyBlue flex-shrink-0" aria-hidden="true" />
                    <span>{application.phone_number}</span>
                </div>

                {/* Registration Number */}
                <div className="flex items-center gap-2 text-sm text-neutralGray-700">
                    <FileText className="w-4 h-4 text-synapseSkyBlue flex-shrink-0" aria-hidden="true" />
                    <span className="truncate" title={application.medical_registration_number}>
                        Reg: {application.medical_registration_number}
                    </span>
                </div>

                {/* State Medical Council */}
                <div className="flex items-center gap-2 text-sm text-neutralGray-700">
                    <MapPin className="w-4 h-4 text-synapseSkyBlue flex-shrink-0" aria-hidden="true" />
                    <span>{application.state_medical_council}</span>
                </div>

                {/* Application Date */}
                <div className="flex items-center gap-2 text-sm text-neutralGray-700">
                    <Calendar className="w-4 h-4 text-synapseSkyBlue flex-shrink-0" aria-hidden="true" />
                    <span>Applied: {formatDate(application.application_date)}</span>
                </div>
            </div>

            {/* ================================================================
                REJECTION REASON (Only if rejected)
                ================================================================ */}
            {application.doctor_status === 'rejected' && application.rejection_reason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-800 mb-1">
                        Rejection Reason:
                    </p>
                    <p className="text-sm text-red-700">
                        {application.rejection_reason}
                    </p>
                </div>
            )}

            {/* ================================================================
                ACTION BUTTONS
                ================================================================ */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                {/* View Details - Always visible */}
                <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                        const appId = application.id;
                        if (!appId) {
                            console.error('❌ Application ID missing:', application);
                            toast.error('Error: Application ID not found');
                            return;
                        }
                        onViewDetails(appId);
                    }}
                    className="flex-1"
                    aria-label={`View details for ${application.full_name}`}
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </Button>

                {/* Approve and Reject - Only for pending applications */}
                {/* {application.doctor_status === 'pending' && ( */}
                {true && (
                    <>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onApprove(application.id)}
                            isLoading={isLoading}
                            className="flex-1"
                            style={{ backgroundColor: '#10B981' }}
                            aria-label={`Approve application for ${application.full_name}`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onReject(application.id)}
                            isLoading={isLoading}
                            className="flex-1"
                            style={{
                                borderColor: '#EF4444',
                                color: '#EF4444'
                            }}
                            aria-label={`Reject application for ${application.full_name}`}
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
