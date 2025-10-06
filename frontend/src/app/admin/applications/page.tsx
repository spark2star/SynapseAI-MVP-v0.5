'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Settings,
    LogOut,
    Clock,
    CheckCircle,
    XCircle,
    Grid3x3,
    List,
    RefreshCw,
    FileX,
    ArrowLeft,
    Filter
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { toast } from 'react-hot-toast';
import ApplicationCard from '@/components/admin/ApplicationCard';
import ApplicationTable from '@/components/admin/ApplicationTable';
import ApprovalModal from '@/components/admin/ApprovalModal';
import RejectionModal from '@/components/admin/RejectionModal';

// ============================================================================
// TYPES
// ============================================================================
interface Application {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    medical_registration_number: string;
    state_medical_council: string;
    doctor_status: 'pending' | 'verified' | 'rejected';
    application_date: string;
    verification_date?: string;
    rejection_reason?: string;
}

type ViewMode = 'cards' | 'table';
type FilterStatus = 'all' | 'pending' | 'verified' | 'rejected';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminApplicationsPage() {
    const router = useRouter();
    const { logout } = useAuthStore();

    // State Management
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal states
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);

    // ========================================================================
    // AUTH CHECK
    // ========================================================================
    useEffect(() => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserEmail(payload.email || 'Admin User');

            if (payload.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
        } catch (error) {
            console.error('Token decode error:', error);
            router.push('/auth/login');
        }
    }, [router]);

    // ========================================================================
    // VIEW PERSISTENCE
    // ========================================================================
    useEffect(() => {
        const savedView = localStorage.getItem('adminAppsView');
        if (savedView && (savedView === 'cards' || savedView === 'table')) {
            setViewMode(savedView as ViewMode);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('adminAppsView', viewMode);
    }, [viewMode]);

    // ========================================================================
    // FETCH APPLICATIONS
    // ========================================================================
    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError("");

            const endpoint = filterStatus === 'all'
                ? '/admin/applications'
                : `/admin/applications?status=${filterStatus}`;

            const response = await apiService.get(endpoint);

            console.log('✅ Fetched applications:', response.data);

            // ✅ Backend returns: { applications: [...], pagination: {...}, filters_applied: {...} }
            const applicationsArray = response.data?.applications || [];

            // ✅ Map user_id to id
            const mappedApplications = applicationsArray.map((app: any) => ({
                ...app,
                id: app.user_id || app.id,
                doctor_status: app.status || app.doctor_status  // ✅ ADD THIS LINE
            }));

            console.log('✅ Mapped applications:', mappedApplications);

            setApplications(mappedApplications);

        } catch (error: any) {
            console.error('Failed to fetch applications:', error);
            setError(error.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchApplications();
    }, [filterStatus]);

    // ========================================================================
    // STATS CALCULATION
    // ========================================================================
    // AFTER (safe version):
    const stats = {
        total: Array.isArray(applications) ? applications.length : 0,
        pending: Array.isArray(applications)
            ? applications.filter(app => app.doctor_status === 'pending').length
            : 0,
        verified: Array.isArray(applications)
            ? applications.filter(app => app.doctor_status === 'verified').length
            : 0,
        rejected: Array.isArray(applications)
            ? applications.filter(app => app.doctor_status === 'rejected').length
            : 0,
    };

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    // Open approval modal
    const handleApprove = (applicationId: string) => {
        console.log('👁️ Opening approval modal for:', applicationId);
        const app = applications.find(a => a.id === applicationId);
        setSelectedApplication(app || null);
        setShowApprovalModal(true);
    };

    // Open rejection modal
    const handleReject = (applicationId: string) => {
        console.log('❌ Opening rejection modal for:', applicationId);
        const app = applications.find(a => a.id === applicationId);
        setSelectedApplication(app || null);
        setShowRejectionModal(true);
    };

    // Confirm approval - calls backend API
    const handleConfirmApproval = async (applicationId: string) => {
        try {
            console.log('✅ Confirming approval for:', applicationId);
            setActionLoading(applicationId);

            // ✅ Backend API call with doctorUserId
            const response = await apiService.post(`/admin/applications/${applicationId}/approve`, {
                doctorUserId: applicationId  // ✅ ADDED: Backend requires this
            });

            console.log('✅ Approval response:', response);

            // Show success message
            toast.success('✅ Doctor approved successfully! Login credentials have been emailed.', {
                duration: 5000
            });

            // Close modal
            setShowApprovalModal(false);
            setSelectedApplication(null);

            // Refresh applications list
            await fetchApplications();

        } catch (error: any) {
            console.error('❌ Approval failed:', error);

            // Show error message
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error?.message
                || 'Failed to approve application. Please try again.';

            toast.error(errorMessage, {
                duration: 5000
            });

            // Keep modal open so user can retry
        } finally {
            setActionLoading(null);
        }
    };

    // Confirm rejection - calls backend API with reason
    const handleConfirmRejection = async (applicationId: string, reason: string) => {
        try {
            console.log('❌ Confirming rejection for:', applicationId, 'Reason:', reason);
            setActionLoading(applicationId);

            // ✅ Backend API call with doctorUserId AND rejection reason
            const response = await apiService.post(`/admin/applications/${applicationId}/reject`, {
                doctorUserId: applicationId,  // ✅ ADDED: Backend requires this
                rejection_reason: reason
            });

            console.log('❌ Rejection response:', response);

            // Show success message
            toast.success('❌ Application rejected. The applicant will be notified.', {
                duration: 5000
            });

            // Close modal
            setShowRejectionModal(false);
            setSelectedApplication(null);

            // Refresh applications list
            await fetchApplications();

        } catch (error: any) {
            console.error('❌ Rejection failed:', error);

            // Show error message
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error?.message
                || 'Failed to reject application. Please try again.';

            toast.error(errorMessage, {
                duration: 5000
            });

            // Keep modal open so user can retry
        } finally {
            setActionLoading(null);
        }
    };

    // View details handler
    const handleViewDetails = (applicationId: string) => {
        console.log('👁️ View Details clicked for:', applicationId);

        if (!applicationId) {
            console.error('❌ No application ID provided');
            return;
        }

        const app = applications.find(a => a.id === applicationId);

        if (!app) {
            console.error('❌ Application not found:', applicationId);
            toast.error('Application not found');
            return;
        }

        console.log('✅ Found application:', app);
        setSelectedApplication(app);

        // For now, show toast (TODO: implement details modal)
        toast('📋 Application details modal coming soon!', {
            icon: '🚧',
            duration: 3000
        });
    };

    // Create loading states object for table component
    const loadingStates = applications.reduce((acc, app) => {
        acc[app.id] = actionLoading === app.id;
        return acc;
    }, {} as Record<string, boolean>);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (loading && applications.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutralGray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-synapseSkyBlue mx-auto mb-4"></div>
                    <p className="text-neutralGray-700">Loading applications...</p>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <div className="min-h-screen bg-neutralGray-100">
            {/* ====================================================================
                HEADER
                ==================================================================== */}
            <header className="bg-white border-b border-neutralGray-300 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                        <ArrowLeft className="w-5 h-5 text-synapseDarkBlue group-hover:translate-x-[-4px] transition-transform" />
                        <img
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI"
                            className="w-20 h-20 ..."
                        />
                        <div>
                            <span className="text-xl font-heading font-bold text-synapseDarkBlue">
                                SynapseAI Admin
                            </span>
                            <p className="text-xs text-neutralGray-700 -mt-1">
                                Doctor Applications
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right mr-4">
                            <p className="text-sm font-medium text-synapseDarkBlue">
                                {userEmail}
                            </p>
                            <p className="text-xs text-neutralGray-700">System Administrator</p>
                        </div>
                        <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => router.push('/admin/settings')}
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* ====================================================================
                MAIN CONTENT
                ==================================================================== */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue mb-2">
                        Doctor Applications
                    </h1>
                    <p className="text-body text-neutralGray-700">
                        Review and manage doctor registration applications
                    </p>
                </motion.div>

                {/* Stats Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                >
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-heading font-bold text-synapseDarkBlue">
                                {stats.total}
                            </p>
                            <p className="text-sm text-neutralGray-700">Total</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-heading font-bold text-amber-600">
                                {stats.pending}
                            </p>
                            <p className="text-sm text-neutralGray-700">Pending</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-heading font-bold text-successGreen">
                                {stats.verified}
                            </p>
                            <p className="text-sm text-neutralGray-700">Verified</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-heading font-bold text-warningRed">
                                {stats.rejected}
                            </p>
                            <p className="text-sm text-neutralGray-700">Rejected</p>
                        </div>
                    </Card>
                </motion.div>

                {/* Filters and View Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-xl shadow-md p-4 mb-6"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'pending', 'verified', 'rejected'] as FilterStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg font-body font-medium text-sm transition-all duration-200 ${filterStatus === status
                                        ? 'bg-synapseSkyBlue text-white shadow-md'
                                        : 'bg-neutralGray-100 text-neutralGray-700 hover:bg-neutralGray-300'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                    {status !== 'all' && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                                            {stats[status as keyof typeof stats]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle and Refresh */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'cards'
                                    ? 'bg-synapseSkyBlue text-white'
                                    : 'bg-neutralGray-100 text-neutralGray-700 hover:bg-neutralGray-300'
                                    }`}
                                title="Card View"
                            >
                                <Grid3x3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'table'
                                    ? 'bg-synapseSkyBlue text-white'
                                    : 'bg-neutralGray-100 text-neutralGray-700 hover:bg-neutralGray-300'
                                    }`}
                                title="Table View"
                            >
                                <List className="w-5 h-5" />
                            </button>
                            <button
                                onClick={fetchApplications}
                                className="p-2 rounded-lg bg-neutralGray-100 text-neutralGray-700 hover:bg-neutralGray-300 transition-all duration-200"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900 mb-1">Error Loading Applications</h3>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <Button
                                variant="tertiary"
                                size="sm"
                                onClick={fetchApplications}
                            >
                                Retry
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Content: Cards or Table */}
                <AnimatePresence mode="wait">
                    {applications.length === 0 && !loading ? (
                        // Empty State
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="text-center py-16"
                        >
                            <Card>
                                <FileX className="w-16 h-16 text-neutralGray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-2">
                                    No Applications Found
                                </h3>
                                <p className="text-body text-neutralGray-700 mb-4">
                                    There are no {filterStatus !== 'all' ? filterStatus : ''} applications at the moment.
                                </p>
                                <Button
                                    variant="secondary"
                                    onClick={() => setFilterStatus('all')}
                                >
                                    View All Applications
                                </Button>
                            </Card>
                        </motion.div>
                    ) : viewMode === 'cards' ? (
                        // Cards View
                        <motion.div
                            key="cards"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {Array.isArray(applications) && applications.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    application={app}
                                    onViewDetails={handleViewDetails}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    isLoading={actionLoading === app.id}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        // Table View
                        <motion.div
                            key="table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ApplicationTable
                                applications={applications}
                                onViewDetails={handleViewDetails}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                isLoading={loadingStates}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ================================================================
                MODALS
                ================================================================ */}

            {/* Approval Modal */}
            <ApprovalModal
                isOpen={showApprovalModal}
                application={selectedApplication}
                onClose={() => {
                    if (actionLoading === null) {
                        setShowApprovalModal(false);
                        setSelectedApplication(null);
                    }
                }}
                onConfirm={handleConfirmApproval}
                isLoading={actionLoading === selectedApplication?.id}
            />

            {/* Rejection Modal */}
            <RejectionModal
                isOpen={showRejectionModal}
                application={selectedApplication}
                onClose={() => {
                    if (actionLoading === null) {
                        setShowRejectionModal(false);
                        setSelectedApplication(null);
                    }
                }}
                onConfirm={handleConfirmRejection}
                isLoading={actionLoading === selectedApplication?.id}
            />
        </div>
    );
}
