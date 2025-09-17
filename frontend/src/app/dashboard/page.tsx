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
    ClockIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface DashboardStats {
    totalPatients: number
    todayAppointments: number
    reportsGenerated: number
    pendingInvoices: number
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats>({
        totalPatients: 0,
        todayAppointments: 0,
        reportsGenerated: 0,
        pendingInvoices: 0
    })

    useEffect(() => {
        // Simulate loading stats
        setTimeout(() => {
            setStats({
                totalPatients: 42,
                todayAppointments: 8,
                reportsGenerated: 156,
                pendingInvoices: 3
            })
        }, 500)
    }, [])

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="min-h-full bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
            <div className="p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="medical-card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                                <p className="text-blue-100">Here's what's happening with your EMR system today.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-blue-100 text-sm">{currentDate}</p>
                                <p className="text-white font-semibold">Role: {user?.role || 'Doctor'}</p>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Overview Stats */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="medical-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Patients</p>
                                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalPatients}</p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="medical-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Today's Appointments</p>
                                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.todayAppointments}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="medical-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Reports Generated</p>
                                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.reportsGenerated}</p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="medical-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending Invoices</p>
                                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.pendingInvoices}</p>
                            </div>
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <CurrencyDollarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="medical-card p-6 hover:scale-105 transition-all duration-200 cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Register a new patient</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Add a new patient to the system</p>
                            </div>
                        </div>
                    </div>

                    <div className="medical-card p-6 hover:scale-105 transition-all duration-200 cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Book a new appointment</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Schedule patient appointments</p>
                            </div>
                        </div>
                    </div>

                    <div className="medical-card p-6 hover:scale-105 transition-all duration-200 cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Create a new medical report</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Generate AI-powered reports</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="flex-1">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Recent Activity</h2>
                <div className="medical-card p-8 text-center">
                    <DocumentTextIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">No Recent Activity</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">Start by creating a new patient or scheduling an appointment.</p>
                    <Button variant="primary" className="inline-flex items-center gap-2">
                        <PlusIcon className="h-4 w-4" />
                        New Patient
                    </Button>
                </div>
            </div>
        </div>
    )
}