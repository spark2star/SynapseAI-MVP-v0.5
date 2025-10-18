'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

/**
 * Props for the NeedsAttentionCard component
 */
interface NeedsAttentionCardProps {
    /** Number of patients whose latest report indicates "worse" status */
    count: number
    /** Optional callback when card is clicked. If not provided, navigates to filtered patients page */
    onClick?: () => void
}

/**
 * Needs Attention Card Component
 * 
 * Displays a prominent alert card showing the count of patients whose most recent
 * report indicates a "worse" patient status, requiring immediate follow-up care.
 * The card is clickable and navigates to a filtered view of these patients.
 * 
 * @component
 * @example
 * ```tsx
 * <NeedsAttentionCard
 *   count={3}
 *   onClick={() => router.push('/patients?filter=needs_attention')}
 * />
 * ```
 */
export default function NeedsAttentionCard({
    count,
    onClick
}: NeedsAttentionCardProps) {
    const router = useRouter()

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else {
            router.push('/dashboard/patients?filter=needs_attention')
        }
    }

    return (
        <Card
            hoverable
            onClick={handleClick}
            className="h-full cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800"
        >
            <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="p-4 bg-amber-100 dark:bg-amber-900/40 rounded-full mb-4 shadow-lg">
                    <ExclamationTriangleIcon className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>

                <div className="mb-2">
                    <p className="text-6xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                        {count}
                    </p>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Needs Attention
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Patients need follow-up
                </p>

                {count > 0 && (
                    <div className="mt-4 px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-md">
                        View Patients →
                    </div>
                )}
            </div>
        </Card>
    )
}
