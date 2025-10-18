'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { apiService } from '@/services/api'
import {
    UserGroupIcon,
    HeartIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PatientSelectionModal from '@/components/consultation/PatientSelectionModal'
import ClinicalIntakeQueue from '@/components/dashboard/ClinicalIntakeQueue'
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard'
import PatientSearchBar from '@/components/dashboard/PatientSearchBar'
import StatCard from '@/components/dashboard/StatCard'
import WeeklySessionsChart from '@/components/dashboard/WeeklySessionsChart'
import { toast } from 'react-hot-toast'

// Dashboard data interface matching backend response schema
interface PendingIntakePatient {
    id: string
    full_name: string
    registered_at: string
}

interface WeeklySession {
    day: string
    count: number
}

interface DashboardData {
    pending_intake_patients: PendingIntakePatient[]
    needs_attention_patients_count: number
    pending_reports_count: number
    active_patients_count: number
    sessions_this_week: WeeklySession[]
}

interface Patient {
    id: string
    patient_id: string
    full_name: string
    age: number
    gender: string
    phone_primary: string
    last_visit: string | null
    created_at: string
}

// Loading skeleton component
function LoadingState() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Immediate Priorities skeleton */}
            <section>
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
            </section>

            {/* Core Actions skeleton */}
            <section>
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
            </section>

            {/* Practice Insights skeleton */}
            <section>
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
            </section>
        </div>
    )
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                <svg
                    className="h-16 w-16 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Failed to Load Dashboard
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                {error}
            </p>
            <Button variant="primary" onClick={onRetry}>
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Retry
            </Button>
        </div>
    )
}

export default function DashboardPage() {
    const router = useRouter()
    const { user, profile } = useAuthStore()
    const doctorName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : 'Doctor'

    // State management
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showPatientSelection, setShowPatientSelection] = useState(false)

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await apiService.getDashboardStats()

            if (response.status === 'success') {
                setDashboardData(response.data)
                console.log('✅ Dashboard data loaded successfully')
            } else {
                throw new Error('Failed to load dashboard data')
            }
        } catch (err: any) {
            console.error('Failed to load dashboard data:', err)
            setError(err.message || 'Failed to load dashboard data. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    // Event handlers
    const handleCompleteProfile = (patientId: string) => {
        router.push(`/dashboard/patients/${patientId}/clinical-info`)
    }

    const handleNeedsAttentionClick = () => {
        router.push('/dashboard/patients?filter=needs_attention')
    }

    const handlePatientSearch = (query: string) => {
        router.push(`/dashboard/patients?search=${encodeURIComponent(query)}`)
    }

    const handleStartUnscheduledSession = () => {
        setShowPatientSelection(true)
    }

    const handleReviewPendingReports = () => {
        router.push('/dashboard/reports?filter=pending_review')
    }

    const handlePatientSelect = (patient: Patient) => {
        router.push(`/dashboard/patients/${patient.id}?followup=true`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
            <div className="p-6 lg:p-8">
                {/* Professional Header */}
                <div className="mb-8">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-sky-100/50 dark:border-slate-700/50 p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <HeartIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                                        Welcome back, Dr. {doctorName}
                                    </h1>
                                    <p className="text-sky-600 dark:text-sky-300 text-sm lg:text-base">
                                        Your Clinical Command Center
                                    </p>
                                </div>
                            </div>
                            <div className="text-left lg:text-right">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{currentDate}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm">System Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && <LoadingState />}

                {/* Error State */}
                {!isLoading && error && (
                    <ErrorState error={error} onRetry={fetchDashboardData} />
                )}

                {/* Dashboard Content */}
                {!isLoading && !error && dashboardData && (
                    <div className="space-y-8">
                        {/* Immediate Priorities Section */}
                        <section>
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-3">
                                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-600 rounded-full"></div>
                                Immediate Priorities
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ClinicalIntakeQueue
                                    patients={dashboardData.pending_intake_patients}
                                    onCompleteProfile={handleCompleteProfile}
                                />
                                <NeedsAttentionCard
                                    count={dashboardData.needs_attention_patients_count}
                                    onClick={handleNeedsAttentionClick}
                                />
                            </div>
                        </section>

                        {/* Core Actions Section */}
                        <section>
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-3">
                                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                                Core Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Patient Search */}
                                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-100/50 dark:border-slate-700/50 p-6">
                                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                                        Find Patient
                                    </h3>
                                    <PatientSearchBar onSearch={handlePatientSearch} />
                                </div>

                                {/* Start Unscheduled Session */}
                                <div
                                    onClick={handleStartUnscheduledSession}
                                    className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-100/50 dark:border-slate-700/50 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex flex-col items-center text-center h-full justify-center">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors duration-300">
                                            <ArrowPathIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-100">
                                            Start Unscheduled Session
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                                            Begin consultation
                                        </p>
                                    </div>
                                </div>

                                {/* Review Pending Reports */}
                                <div
                                    onClick={handleReviewPendingReports}
                                    className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-100/50 dark:border-slate-700/50 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex flex-col items-center text-center h-full justify-center relative">
                                        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl mb-3 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/40 transition-colors duration-300">
                                            <DocumentTextIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-100">
                                            Review Pending Reports
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                                            Sign and finalize
                                        </p>
                                        {dashboardData.pending_reports_count > 0 && (
                                            <div className="absolute -top-2 -right-2">
                                                <Badge variant="warning">
                                                    {dashboardData.pending_reports_count}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Practice Insights Section */}
                        <section>
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-3">
                                <div className="w-1 h-6 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                                Practice Insights
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <StatCard
                                    title="Active Patients"
                                    value={dashboardData.active_patients_count}
                                    icon={<UserGroupIcon />}
                                    variant="info"
                                />
                                <div className="lg:col-span-2">
                                    <WeeklySessionsChart sessions={dashboardData.sessions_this_week} />
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Patient Selection Modal for Unscheduled Session */}
            <PatientSelectionModal
                isOpen={showPatientSelection}
                onClose={() => setShowPatientSelection(false)}
                onPatientSelect={handlePatientSelect}
            />
        </div>
    )
}
