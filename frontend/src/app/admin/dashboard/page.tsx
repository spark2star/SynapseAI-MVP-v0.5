'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    Settings,
    LogOut,
    Clock,
    CheckCircle,
    XCircle,
    Activity
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

interface DashboardStats {
    totalDoctors: number;
    pendingApplications: number;
    verifiedDoctors: number;
    rejectedApplications: number;
    totalReports: number;
    reportsToday: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { logout } = useAuthStore(); // ✅ Removed user and isLoading

    const [userEmail, setUserEmail] = useState<string>(''); // ✅ Added for email from token
    const [stats, setStats] = useState<DashboardStats>({
        totalDoctors: 0,
        pendingApplications: 0,
        verifiedDoctors: 0,
        rejectedApplications: 0,
        totalReports: 0,
        reportsToday: 0,
    });
    const [loading, setLoading] = useState(true);

    // ✅ Get email from token
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserEmail(payload.email || 'Admin User');
            } catch (error) {
                setUserEmail('Admin User');
            }
        }
    }, []);

    // ✅ Check admin access using token
    useEffect(() => {
        const token = localStorage.getItem('access_token');

        console.log('🔍 Admin Dashboard Check:', {
            hasToken: !!token
        });

        if (!token) {
            console.log('❌ No token, redirecting to login');
            router.push('/auth/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('✅ Token payload:', payload);

            if (payload.role !== 'admin') {
                console.log('❌ Not admin, redirecting to dashboard');
                router.push('/dashboard');
                return;
            }

            console.log('✅ Admin verified, fetching stats');
            fetchDashboardStats();

        } catch (error) {
            console.error('❌ Token decode error:', error);
            router.push('/auth/login');
        }
    }, [router]);

    const fetchDashboardStats = async () => {
        try {
            // TODO: Implement actual API calls
            // For now, using mock data
            setStats({
                totalDoctors: 15,
                pendingApplications: 3,
                verifiedDoctors: 12,
                rejectedApplications: 0,
                totalReports: 1247,
                reportsToday: 23,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutralGray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-synapseSkyBlue mx-auto mb-4"></div>
                    <p className="text-neutralGray-700">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutralGray-100">
            {/* ============================================================================
                HEADER
                ============================================================================ */}
            <header className="bg-white border-b border-neutralGray-300 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/landing" className="flex items-center gap-3 group">
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
                                Administration Panel
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right mr-4">
                            {/* ✅ Changed to use userEmail from token */}
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

            {/* ============================================================================
                MAIN CONTENT
                ============================================================================ */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-body text-neutralGray-700">
                        Manage doctor applications, system settings, and monitor platform activity
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Doctors */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card hoverable>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-synapseSkyBlue/10 rounded-card flex items-center justify-center flex-shrink-0">
                                    <Users className="w-6 h-6 text-synapseSkyBlue" />
                                </div>
                                <div>
                                    <p className="text-2xl font-heading font-bold text-synapseDarkBlue">
                                        {stats.totalDoctors}
                                    </p>
                                    <p className="text-body text-neutralGray-700">Total Doctors</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Pending Applications */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card hoverable>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-card flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-heading font-bold text-synapseDarkBlue">
                                        {stats.pendingApplications}
                                    </p>
                                    <p className="text-body text-neutralGray-700">Pending</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Verified Doctors */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card hoverable>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-successGreen/10 rounded-card flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 text-successGreen" />
                                </div>
                                <div>
                                    <p className="text-2xl font-heading font-bold text-synapseDarkBlue">
                                        {stats.verifiedDoctors}
                                    </p>
                                    <p className="text-body text-neutralGray-700">Verified</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Total Reports */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card hoverable>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-synapseDarkBlue/10 rounded-card flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-synapseDarkBlue" />
                                </div>
                                <div>
                                    <p className="text-2xl font-heading font-bold text-synapseDarkBlue">
                                        {stats.totalReports}
                                    </p>
                                    <p className="text-body text-neutralGray-700">Total Reports</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Card>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-card flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-2">
                                        Doctor Applications
                                    </h3>
                                    <p className="text-body text-neutralGray-700 mb-4">
                                        Review and approve pending doctor registrations
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                onClick={() => router.push('/admin/applications')}
                            >
                                Review Applications ({stats.pendingApplications})
                            </Button>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <Card>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-synapseSkyBlue/10 rounded-card flex items-center justify-center flex-shrink-0">
                                    <Activity className="w-6 h-6 text-synapseSkyBlue" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-2">
                                        Platform Activity
                                    </h3>
                                    <p className="text-body text-neutralGray-700 mb-4">
                                        Monitor system usage and performance metrics
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/admin/activity')}
                            >
                                View Activity Logs
                            </Button>
                        </Card>
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    <Card>
                        <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-neutralGray-100 rounded-lg">
                                <div className="w-10 h-10 bg-successGreen/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-successGreen" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-body font-medium text-synapseDarkBlue">
                                        Admin user logged in
                                    </p>
                                    <p className="text-sm text-neutralGray-700">
                                        Just now
                                    </p>
                                </div>
                            </div>

                            <div className="text-center py-8 text-neutralGray-700">
                                <p className="text-body">No recent activity to display</p>
                                <p className="text-sm mt-2">Activity logs will appear here as actions are performed</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
