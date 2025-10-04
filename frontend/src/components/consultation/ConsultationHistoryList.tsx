'use client'

import { formatDistanceToNow } from 'date-fns'
import { ClockIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon as PendingIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import type { ConsultationHistoryItem } from '@/types/consultation'

interface ConsultationHistoryListProps {
    consultations: ConsultationHistoryItem[]
    patientId: string
}

export default function ConsultationHistoryList({ consultations, patientId }: ConsultationHistoryListProps) {
    const getStatusBadge = (status: string) => {
        const badges = {
            completed: {
                bg: 'bg-green-100 dark:bg-green-900/20',
                text: 'text-green-800 dark:text-green-300',
                icon: CheckCircleIcon,
                label: 'Completed'
            },
            in_progress: {
                bg: 'bg-yellow-100 dark:bg-yellow-900/20',
                text: 'text-yellow-800 dark:text-yellow-300',
                icon: PendingIcon,
                label: 'In Progress'
            },
            paused: {
                bg: 'bg-blue-100 dark:bg-blue-900/20',
                text: 'text-blue-800 dark:text-blue-300',
                icon: ClockIcon,
                label: 'Paused'
            },
            cancelled: {
                bg: 'bg-gray-100 dark:bg-gray-900/20',
                text: 'text-gray-800 dark:text-gray-300',
                icon: ClockIcon,
                label: 'Cancelled'
            }
        }

        const badge = badges[status as keyof typeof badges] || badges.in_progress
        const Icon = badge.icon

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="h-3.5 w-3.5" />
                {badge.label}
            </span>
        )
    }

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return 'N/A'
        if (minutes < 1) return '< 1 min'
        if (minutes < 60) return `${Math.round(minutes)} min`
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return `${hours}h ${mins}m`
    }

    return (
        <div className="space-y-4">
            {consultations.map((consultation) => (
                <div
                    key={consultation.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:border-sky-300 dark:hover:border-sky-600 transition-colors"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    {consultation.session_id}
                                </h3>
                                {getStatusBadge(consultation.status)}
                                {consultation.has_transcription && (
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                        <DocumentTextIcon className="h-3.5 w-3.5" />
                                        Transcribed
                                    </span>
                                )}
                            </div>

                            {/* Chief Complaint */}
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                                <span className="font-medium">Chief Complaint:</span>{' '}
                                {consultation.chief_complaint || 'Not specified'}
                            </p>

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4" />
                                    {formatDistanceToNow(new Date(consultation.created_at), { addSuffix: true })}
                                </span>
                                {consultation.duration_minutes && (
                                    <span className="flex items-center gap-1">
                                        Duration: {formatDuration(consultation.duration_minutes)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <Link
                            href={`/dashboard/patients/${patientId}/consultations/${consultation.id}`}
                            className="ml-4 inline-flex items-center px-4 py-2 border border-sky-300 dark:border-sky-700 text-sm font-medium rounded-md text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                        >
                            View Details
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}

