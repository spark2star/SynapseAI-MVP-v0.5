'use client'

import React from 'react'
import Card from '@/components/ui/Card'

/**
 * Props for the StatCard component
 */
interface StatCardProps {
    /** Title/label for the statistic */
    title: string
    /** Numeric or string value to display */
    value: number | string
    /** Optional icon element to display */
    icon?: React.ReactNode
    /** Visual variant for color theming */
    variant?: 'default' | 'success' | 'warning' | 'info'
}

/**
 * Stat Card Component
 * 
 * A reusable card component for displaying key statistics and metrics.
 * Supports multiple color variants and optional icons. Designed for
 * responsive layouts and consistent styling across the dashboard.
 * 
 * @component
 * @example
 * ```tsx
 * <StatCard
 *   title="Active Patients"
 *   value={87}
 *   icon={<UserGroupIcon />}
 *   variant="info"
 * />
 * ```
 */
export default function StatCard({
    title,
    value,
    icon,
    variant = 'default'
}: StatCardProps) {
    const variantStyles = {
        default: {
            iconBg: 'bg-sky-100 dark:bg-sky-900/30',
            iconColor: 'text-sky-600 dark:text-sky-400',
            valueBg: 'bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
            valueColor: 'text-sky-600 dark:text-sky-400',
            border: 'border-sky-200 dark:border-sky-800'
        },
        success: {
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            valueBg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
            valueColor: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800'
        },
        warning: {
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            valueBg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
            valueColor: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800'
        },
        info: {
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            valueBg: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
            valueColor: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800'
        }
    }

    const styles = variantStyles[variant]

    return (
        <Card className={`h-full border-2 ${styles.border}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        {title}
                    </p>
                    <div className={`inline-block px-4 py-2 rounded-xl ${styles.valueBg} mb-2`}>
                        <p className={`text-4xl font-bold ${styles.valueColor}`}>
                            {value}
                        </p>
                    </div>
                </div>
                {icon && (
                    <div className={`p-4 ${styles.iconBg} rounded-2xl shadow-sm`}>
                        <div className={`h-8 w-8 ${styles.iconColor}`}>
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
