'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
    HomeIcon,
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    CogIcon,
    HeartIcon,
} from '@heroicons/react/24/outline'

import { useAuthStore } from '@/store/authStore'
import type { NavItem } from '@/types'

export default function DashboardSidebar() {
    const pathname = usePathname()
    const { user, hasAnyRole } = useAuthStore()

    const navigation: NavItem[] = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: HomeIcon,
            current: pathname === '/dashboard',
        },
        {
            name: 'Patients',
            href: '/dashboard/patients',
            icon: UserGroupIcon,
            current: pathname.startsWith('/dashboard/patients'),
        },
        {
            name: 'Appointments',
            href: '/dashboard/appointments',
            icon: CalendarIcon,
            current: pathname.startsWith('/dashboard/appointments'),
        },
        {
            name: 'Reports',
            href: '/dashboard/reports',
            icon: DocumentTextIcon,
            current: pathname.startsWith('/dashboard/reports'),
        },
        {
            name: 'Billing',
            href: '/dashboard/billing',
            icon: CurrencyDollarIcon,
            current: pathname.startsWith('/dashboard/billing'),
        },
    ]

    // Add settings for all users (MFA setup)
    navigation.push({
        name: 'Settings',
        href: '/dashboard/settings',
        icon: CogIcon,
        current: pathname.startsWith('/dashboard/settings'),
    })

    return (
        <div className="flex h-full flex-col bg-white shadow-soft">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-neutral-200">
                <div className="flex items-center space-x-2">
                    <HeartIcon className="h-8 w-8 text-primary-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gradient-primary">
                            EMR System
                        </h1>
                        <p className="text-xs text-neutral-500">
                            Privacy by Design
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={clsx(
                            'nav-item',
                            item.current
                                ? 'nav-item-active'
                                : 'text-neutral-700 hover:text-primary-700 hover:bg-primary-50'
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                        {item.badge && (
                            <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* User info */}
            <div className="border-t border-neutral-200 p-4">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                            {user?.email?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                            {user?.email}
                        </p>
                        <p className="text-xs text-neutral-500 capitalize">
                            {user?.role}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
