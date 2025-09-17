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
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

import { useAuthStore } from '@/store/authStore'
import type { NavItem } from '@/types'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'

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

    const { logout } = useAuthStore()

    const handleLogout = () => {
        logout()
    }

    return (
        <div className="flex h-full flex-col bg-white dark:bg-neutral-900 transition-all duration-300 ease-in-out">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-neutral-100 dark:border-neutral-800/50">
                <Logo size="md" showText={true} />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={clsx(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                            item.current
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        )}
                        style={item.current ? { boxShadow: 'inset 3px 0 0 rgb(59 130 246)' } : {}}
                    >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                        {item.badge && (
                            <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Footer with theme toggle and user info */}
            <div className="border-t border-neutral-100 dark:border-neutral-800/50 p-4 space-y-4">
                {/* Theme Toggle */}
                <div className="flex justify-center">
                    <ThemeToggle />
                </div>

                {/* User info */}
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            {user?.email?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {user?.email}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                            Mental Health Practitioner
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center gap-2"
                >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
