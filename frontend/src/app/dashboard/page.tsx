'use client'

import Link from 'next/link'
import {
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    PlusIcon,
} from '@heroicons/react/24/outline'
import {
    UserGroupIcon as UserGroupSolidIcon,
    CalendarIcon as CalendarSolidIcon,
    DocumentTextIcon as DocumentSolidIcon,
    CurrencyDollarIcon as CurrencySolidIcon,
} from '@heroicons/react/24/solid'

import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

export default function DashboardPage() {
    const { user, profile, hasAnyRole } = useAuthStore()

    const displayName = profile
        ? `Dr. ${profile.first_name} ${profile.last_name}`
        : user?.email

    const stats = [
        {
            name: 'Total Patients',
            value: '0',
            icon: UserGroupSolidIcon,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
            href: '/dashboard/patients',
        },
        {
            name: 'Today\'s Appointments',
            value: '0',
            icon: CalendarSolidIcon,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
            href: '/dashboard/appointments',
        },
        {
            name: 'Reports Generated',
            value: '0',
            icon: DocumentSolidIcon,
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-100',
            href: '/dashboard/reports',
        },
        {
            name: 'Pending Invoices',
            value: '0',
            icon: CurrencySolidIcon,
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-100',
            href: '/dashboard/billing',
        },
    ]

    const quickActions = [
        {
            name: 'New Patient',
            description: 'Register a new patient',
            href: '/dashboard/patients/new',
            icon: UserGroupIcon,
            color: 'bg-primary-600 hover:bg-primary-700',
        },
        {
            name: 'Schedule Appointment',
            description: 'Book a new appointment',
            href: '/dashboard/appointments/new',
            icon: CalendarIcon,
            color: 'bg-green-600 hover:bg-green-700',
        },
        {
            name: 'Generate Report',
            description: 'Create a new medical report',
            href: '/dashboard/reports/new',
            icon: DocumentTextIcon,
            color: 'bg-purple-600 hover:bg-purple-700',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome header */}
            <div className="medical-card">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">
                            Welcome back, {displayName}
                        </h1>
                        <p className="mt-1 text-neutral-600">
                            Here's what's happening with your EMR system today.
                        </p>
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-right">
                            <p className="text-sm text-neutral-500">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-xs text-neutral-400 capitalize">
                                Role: {user?.role}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats overview */}
            <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-4">
                    Overview
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Link
                            key={stat.name}
                            href={stat.href}
                            className="medical-card hover:shadow-medical transition-shadow duration-200 group"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className={`${stat.bgColor} rounded-lg p-3`}>
                                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-neutral-600">
                                        {stat.name}
                                    </p>
                                    <p className="text-2xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors duration-200">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.name}
                            href={action.href}
                            className="medical-card hover:shadow-medical transition-all duration-200 group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`${action.color} rounded-lg p-3 transition-colors duration-200`}>
                                    <action.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-medium text-neutral-900 group-hover:text-primary-600 transition-colors duration-200">
                                        {action.name}
                                    </h3>
                                    <p className="text-sm text-neutral-600">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent activity placeholder */}
            <div className="medical-card">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">
                    Recent Activity
                </h2>
                <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400" />
                    <h3 className="mt-2 text-sm font-medium text-neutral-900">
                        No recent activity
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                        Start by creating a new patient or scheduling an appointment.
                    </p>
                    <div className="mt-6">
                        <Link href="/dashboard/patients/new">
                            <Button variant="primary">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                New Patient
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
