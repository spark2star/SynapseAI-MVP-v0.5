'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    PlusIcon,
    UserIcon,
    ClockIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ChartBarIcon,
    HeartIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface DashboardStats {
    totalPatients: number
    todayAppointments: number
    patientsGettingBetter: number
    patientsGettingWorse: number
}

interface MonthlyData {
    month: string
    livesTouched: number
    positiveProgress: number
    needsAttention: number
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats>({
        totalPatients: 0,
        todayAppointments: 0,
        patientsGettingBetter: 0,
        patientsGettingWorse: 0
    })

    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

    useEffect(() => {
        // Simulate loading stats
        setTimeout(() => {
            setStats({
                totalPatients: 42,
                todayAppointments: 8,
                patientsGettingBetter: 28,
                patientsGettingWorse: 6
            })

            // Simulate monthly progress data
            setMonthlyData([
                { month: 'Jan', livesTouched: 15, positiveProgress: 12, needsAttention: 3 },
                { month: 'Feb', livesTouched: 22, positiveProgress: 18, needsAttention: 4 },
                { month: 'Mar', livesTouched: 28, positiveProgress: 22, needsAttention: 6 },
                { month: 'Apr', livesTouched: 35, positiveProgress: 26, needsAttention: 9 },
                { month: 'May', livesTouched: 38, positiveProgress: 28, needsAttention: 8 },
                { month: 'Jun', livesTouched: 42, positiveProgress: 28, needsAttention: 6 },
            ])
        }, 500)
    }, [])

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

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
                                        Welcome back, Dr. {user?.name || 'Therapist'}
                                    </h1>
                                    <p className="text-sky-600 dark:text-sky-300 text-sm lg:text-base">
                                        Your patient care overview for today
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

                {/* Patient Care Overview */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-3">
                        <div className="w-1 h-6 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                        Patient Care Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Patients */}
                        <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-100/50 dark:border-slate-700/50 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Lives Touched</p>
                                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalPatients}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Under your care</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <UserGroupIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                </div>
                            </div>
                        </div>

                        {/* Today's Sessions */}
                        <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-100/50 dark:border-slate-700/50 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Today's Sessions</p>
                                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.todayAppointments}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Scheduled appointments</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        {/* Positive Progress */}
                        <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100/50 dark:border-slate-700/50 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Positive Progress</p>
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.patientsGettingBetter}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Improving outcomes</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/30 dark:to-green-800/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <ArrowUpIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        {/* Needs Attention */}
                        <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-100/50 dark:border-slate-700/50 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Needs Attention</p>
                                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.patientsGettingWorse}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Requires follow-up</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-800/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <ArrowDownIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-3">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                        Quick Actions
                    </h2>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50 p-6 lg:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            <div className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-sky-200/50 dark:border-slate-600/50 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-sky-300/60 dark:hover:border-slate-500/60 transition-all duration-300 cursor-pointer">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-xl mb-4 group-hover:bg-sky-100 dark:group-hover:bg-sky-800/40 transition-colors duration-300">
                                        <UserIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-100">New Patient</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Register and onboard</p>
                                </div>
                            </div>

                            <div className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-sky-200/50 dark:border-slate-600/50 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-sky-300/60 dark:hover:border-slate-500/60 transition-all duration-300 cursor-pointer">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-xl mb-4 group-hover:bg-sky-100 dark:group-hover:bg-sky-800/40 transition-colors duration-300">
                                        <CalendarIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-100">Schedule Session</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Book appointments</p>
                                </div>
                            </div>

                            <div className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-sky-200/50 dark:border-slate-600/50 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-sky-300/60 dark:hover:border-slate-500/60 transition-all duration-300 cursor-pointer">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-xl mb-4 group-hover:bg-sky-100 dark:group-hover:bg-sky-800/40 transition-colors duration-300">
                                        <DocumentTextIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-100">AI Report</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Generate insights</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Patient Progress Analytics */}
                    <div className="lg:col-span-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50 p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-800/30 rounded-xl">
                                    <ChartBarIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                                </div>
                                Monthly Progress Overview
                            </h3>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                                    {monthlyData.length > 1 ? `+${monthlyData[monthlyData.length - 1].livesTouched - monthlyData[0].livesTouched}` : '+0'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lives Growth</p>
                            </div>
                        </div>

                        {/* Monthly Progress Line Chart */}
                        <div className="space-y-6">
                            <div className="relative h-64 border-b border-slate-200 dark:border-slate-600 pb-4">
                                <svg className="w-full h-full" viewBox="0 0 400 200">
                                    {/* Grid lines */}
                                    <defs>
                                        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgb(203 213 225)" strokeWidth="0.5" opacity="0.3" />
                                        </pattern>

                                        {/* Gradients for area fills below lines */}
                                        <linearGradient id="livesTouchedGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(14 165 233)" stopOpacity="0.4" />
                                            <stop offset="40%" stopColor="rgb(14 165 233)" stopOpacity="0.15" />
                                            <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity="0.02" />
                                        </linearGradient>
                                        <linearGradient id="positiveProgressGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.4" />
                                            <stop offset="40%" stopColor="rgb(34 197 94)" stopOpacity="0.15" />
                                            <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0.02" />
                                        </linearGradient>
                                        <linearGradient id="needsAttentionGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity="0.4" />
                                            <stop offset="40%" stopColor="rgb(245 158 11)" stopOpacity="0.15" />
                                            <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity="0.02" />
                                        </linearGradient>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />

                                    {/* Area fills with gradients */}
                                    {monthlyData.length > 1 && (
                                        <>
                                            {/* Lives Touched Area Fill */}
                                            <path
                                                d={`M 20,180 ${monthlyData.map((data, index) => {
                                                    const x = (index / (monthlyData.length - 1)) * 360 + 20
                                                    const maxValue = Math.max(...monthlyData.map(d => d.livesTouched))
                                                    const y = 180 - ((data.livesTouched / maxValue) * 160)
                                                    return `L ${x},${y}`
                                                }).join(' ')} L 380,180 Z`}
                                                fill="url(#livesTouchedGradient)"
                                            />

                                            {/* Positive Progress Area Fill */}
                                            <path
                                                d={`M 20,180 ${monthlyData.map((data, index) => {
                                                    const x = (index / (monthlyData.length - 1)) * 360 + 20
                                                    const maxValue = Math.max(...monthlyData.map(d => d.positiveProgress))
                                                    const y = 180 - ((data.positiveProgress / maxValue) * 120)
                                                    return `L ${x},${y}`
                                                }).join(' ')} L 380,180 Z`}
                                                fill="url(#positiveProgressGradient)"
                                            />

                                            {/* Needs Attention Area Fill */}
                                            <path
                                                d={`M 20,180 ${monthlyData.map((data, index) => {
                                                    const x = (index / (monthlyData.length - 1)) * 360 + 20
                                                    const maxValue = Math.max(...monthlyData.map(d => d.needsAttention))
                                                    const y = 180 - ((data.needsAttention / maxValue) * 80)
                                                    return `L ${x},${y}`
                                                }).join(' ')} L 380,180 Z`}
                                                fill="url(#needsAttentionGradient)"
                                            />

                                            {/* Lines on top of gradients */}
                                            {/* Lives Touched Line */}
                                            <path
                                                d={`M ${monthlyData.map((data, index) => {
                                                    const x = (index / (monthlyData.length - 1)) * 360 + 20
                                                    const maxValue = Math.max(...monthlyData.map(d => d.livesTouched))
                                                    const y = 180 - ((data.livesTouched / maxValue) * 160)
                                                    return `${x},${y}`
                                                }).join(' L ')}`}
                                                fill="none"
                                                stroke="rgb(14 165 233)"
                                                strokeWidth="3"
                                                className="drop-shadow-sm"
                                            />

                                            {/* Positive Progress Line */}
                                            <path
                                                d={`M ${monthlyData.map((data, index) => {
                                                    const x = (index / (monthlyData.length - 1)) * 360 + 20
                                                    const maxValue = Math.max(...monthlyData.map(d => d.positiveProgress))
                                                    const y = 180 - ((data.positiveProgress / maxValue) * 120)
                                                    return `${x},${y}`
                                                }).join(' L ')}`}
                                                fill="none"
                                                stroke="rgb(34 197 94)"
                                                strokeWidth="3"
                                                className="drop-shadow-sm"
                                            />

                                            {/* Needs Attention Line */}
                                            <path
                                                d={`M ${monthlyData.map((data, index) => {
                                                    const x = (index / (monthlyData.length - 1)) * 360 + 20
                                                    const maxValue = Math.max(...monthlyData.map(d => d.needsAttention))
                                                    const y = 180 - ((data.needsAttention / maxValue) * 80)
                                                    return `${x},${y}`
                                                }).join(' L ')}`}
                                                fill="none"
                                                stroke="rgb(245 158 11)"
                                                strokeWidth="3"
                                                className="drop-shadow-sm"
                                            />
                                        </>
                                    )}

                                    {/* Data Points */}
                                    {monthlyData.map((data, index) => {
                                        const x = (index / (monthlyData.length - 1)) * 360 + 20
                                        const maxValue = Math.max(...monthlyData.map(d => d.livesTouched))
                                        const y = 180 - ((data.livesTouched / maxValue) * 160)

                                        return (
                                            <g key={data.month}>
                                                <circle cx={x} cy={y} r="6" fill="rgb(14 165 233)" className="drop-shadow-sm" />
                                                <circle cx={x} cy={y} r="3" fill="white" />
                                                <text x={x} y="195" textAnchor="middle" className="text-xs fill-slate-600 dark:fill-slate-400 font-medium">
                                                    {data.month}
                                                </text>
                                                <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-slate-800 dark:fill-slate-200 font-bold">
                                                    {data.livesTouched}
                                                </text>
                                            </g>
                                        )
                                    })}
                                </svg>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-sky-500 rounded-full shadow-sm"></div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Lives Touched</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-emerald-500 rounded-full shadow-sm"></div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Positive Progress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-amber-500 rounded-full shadow-sm"></div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Needs Attention</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Care Summary */}
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50 p-6 lg:p-8">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-800/30 rounded-xl">
                                <HeartIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            Care Impact
                        </h3>

                        <div className="space-y-6">
                            {/* Total Patients Highlight */}
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-center">
                                    <p className="text-4xl lg:text-5xl font-bold mb-2">{stats.totalPatients}</p>
                                    <p className="text-sky-100 font-semibold">Lives Touched</p>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="space-y-4">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100/50 dark:border-emerald-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Recovery Rate</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                                            {Math.round((stats.patientsGettingBetter / stats.totalPatients) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-100/50 dark:border-sky-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Today's Sessions</span>
                                        <span className="text-sky-600 dark:text-sky-400 text-lg font-bold">{stats.todayAppointments}</span>
                                    </div>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100/50 dark:border-purple-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Active Cases</span>
                                        <span className="text-purple-600 dark:text-purple-400 text-lg font-bold">{stats.totalPatients - stats.patientsGettingWorse}</span>
                                    </div>
                                </div>

                                {/* Monthly Growth */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100/50 dark:border-indigo-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Monthly Growth</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                                            +{monthlyData.length > 1 ? monthlyData[monthlyData.length - 1].livesTouched - monthlyData[monthlyData.length - 2].livesTouched : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}