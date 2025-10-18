'use client'

import React from 'react'
import Card from '@/components/ui/Card'
import { ChartBarIcon } from '@heroicons/react/24/outline'

/**
 * Represents session data for a single day
 */
interface WeeklySession {
    /** Abbreviated day name (Mon, Tue, Wed, etc.) */
    day: string
    /** Number of consultation sessions on this day */
    count: number
}

/**
 * Props for the WeeklySessionsChart component
 */
interface WeeklySessionsChartProps {
    /** Array of session data for each day of the week */
    sessions: WeeklySession[]
}

/**
 * Weekly Sessions Chart Component
 * 
 * Visualizes consultation session activity over the past 7 days using a simple
 * CSS-based bar chart. Shows session counts for each day of the week with
 * hover tooltips and calculates average sessions per day.
 * 
 * @component
 * @example
 * ```tsx
 * <WeeklySessionsChart
 *   sessions={[
 *     { day: 'Mon', count: 5 },
 *     { day: 'Tue', count: 8 },
 *     // ... rest of week
 *   ]}
 * />
 * ```
 */
export default function WeeklySessionsChart({
    sessions
}: WeeklySessionsChartProps) {
    // Ensure we have all 7 days
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const sessionData = daysOfWeek.map(day => {
        const found = sessions.find(s => s.day === day)
        return {
            day,
            count: found ? found.count : 0
        }
    })

    const maxCount = Math.max(...sessionData.map(s => s.count), 1)

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                        <ChartBarIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            Weekly Sessions
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Last 7 days activity
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 rounded-full">
                    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                        {sessionData.reduce((sum, s) => sum + s.count, 0)} total
                    </span>
                </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-48 px-2">
                {sessionData.map((session, index) => {
                    const heightPercentage = maxCount > 0 ? (session.count / maxCount) * 100 : 0
                    const minHeight = session.count > 0 ? 8 : 0

                    return (
                        <div
                            key={session.day}
                            className="flex-1 flex flex-col items-center gap-2"
                        >
                            {/* Count label */}
                            <div className="h-6 flex items-center justify-center">
                                {session.count > 0 && (
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {session.count}
                                    </span>
                                )}
                            </div>

                            {/* Bar */}
                            <div
                                className="w-full rounded-t-lg bg-gradient-to-t from-sky-500 to-sky-400 dark:from-sky-600 dark:to-sky-500 shadow-lg transition-all duration-300 hover:from-sky-600 hover:to-sky-500 dark:hover:from-sky-500 dark:hover:to-sky-400 cursor-pointer relative group"
                                style={{
                                    height: `${Math.max(heightPercentage, minHeight)}%`
                                }}
                            >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {session.count} session{session.count !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Day label */}
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                                {session.day}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                        Average per day
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                        {(sessionData.reduce((sum, s) => sum + s.count, 0) / 7).toFixed(1)}
                    </span>
                </div>
            </div>
        </Card>
    )
}
