'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline'

/**
 * Represents a patient pending clinical profile completion
 */
interface PendingIntakePatient {
    /** Unique patient identifier */
    id: string
    /** Patient's full name */
    full_name: string
    /** ISO timestamp of patient registration */
    registered_at: string
}

/**
 * Props for the ClinicalIntakeQueue component
 */
interface ClinicalIntakeQueueProps {
    /** Array of patients awaiting clinical profile completion */
    patients: PendingIntakePatient[]
    /** Optional callback when "Complete Profile" is clicked. If not provided, navigates to clinical info form */
    onCompleteProfile?: (patientId: string) => void
}

/**
 * Clinical Intake Queue Component
 * 
 * Displays a prioritized list of patients who have completed demographic registration
 * but require clinical information completion. Shows up to 5 most recent patients.
 * 
 * @component
 * @example
 * ```tsx
 * <ClinicalIntakeQueue
 *   patients={pendingPatients}
 *   onCompleteProfile={(id) => router.push(`/patients/${id}/clinical-info`)}
 * />
 * ```
 */
export default function ClinicalIntakeQueue({
    patients,
    onCompleteProfile
}: ClinicalIntakeQueueProps) {
    const router = useRouter()

    const handleCompleteProfile = (patientId: string) => {
        if (onCompleteProfile) {
            onCompleteProfile(patientId)
        } else {
            router.push(`/dashboard/patients/${patientId}/clinical-info`)
        }
    }

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

            if (diffInHours < 1) {
                return 'Just now'
            } else if (diffInHours < 24) {
                return `${diffInHours}h ago`
            } else if (diffInHours < 48) {
                return 'Yesterday'
            } else {
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                })
            }
        } catch (error) {
            return dateString
        }
    }

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                        <UserPlusIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            Clinical Intake Queue
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Patients awaiting profile completion
                        </p>
                    </div>
                </div>
                {patients.length > 0 && (
                    <div className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 rounded-full">
                        <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                            {patients.length}
                        </span>
                    </div>
                )}
            </div>

            {patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                        <UserPlusIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                        No pending intake patients
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        All patients have completed their profiles
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {patients.map((patient) => (
                        <div
                            key={patient.id}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {patient.full_name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Registered {formatDate(patient.registered_at)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleCompleteProfile(patient.id)}
                                className="ml-4 whitespace-nowrap"
                            >
                                Complete Profile
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
