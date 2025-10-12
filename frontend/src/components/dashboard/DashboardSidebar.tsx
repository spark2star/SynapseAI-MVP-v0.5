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
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

import { useAuthStore } from '@/store/authStore'
import type { NavItem } from '@/types'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

export default function DashboardSidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()

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
        {
            name: 'Settings',
            href: '/dashboard/settings',
            icon: CogIcon,
            current: pathname.startsWith('/dashboard/settings'),
        },
    ]

    const handleLogout = () => {
        logout()
    }

    const handleComingSoon = (featureName: string) => {
        toast(`${featureName} feature is coming soon! 🚀`, {
            icon: '⏳',
            duration: 3000,
            style: {
                borderRadius: '12px',
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)'
            }
        })
    }

    const comingSoonPages = ['/dashboard/appointments', '/dashboard/reports', '/dashboard/billing']

    return (
        <div className="flex h-full flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-500 ease-in-out border-r border-gray-200 dark:border-slate-800">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-slate-800 transition-colors duration-500">
                <div className="flex items-center gap-0.1">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 mt-1.5">
                        <Logo size="md" showText={false} />
                    </div>
                    <span className="text-xl font-semibold leading-none text-gray-900 dark:text-white">
                        Synapse<span className="text-cyan-500 dark:text-cyan-400">AI</span>
                    </span>
                </div>
            </div>




            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isComingSoon = comingSoonPages.includes(item.href)

                    if (isComingSoon) {
                        return (
                            <button
                                key={item.name}
                                onClick={() => handleComingSoon(item.name)}
                                className={clsx(
                                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-left',
                                    'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                                <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30 transition-colors duration-500">
                                    Soon
                                </span>
                            </button>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300',
                                item.current
                                    ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-500'
                                    : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.name}
                            {item.badge && (
                                <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 transition-colors duration-500">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer with theme toggle and user info */}
            <div className="border-t border-gray-200 dark:border-slate-800 p-4 space-y-4 transition-colors duration-500">
                {/* Theme Toggle - Centered */}
                <div className="flex justify-center">
                    <ThemeToggle />
                </div>

                {/* User info */}
                <div className="flex items-center space-x-3 transition-colors duration-500">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                            {user?.email?.charAt(0).toUpperCase() || 'D'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate transition-colors duration-500">
                            {user?.email || 'Doctor'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 capitalize transition-colors duration-500">
                            Mental Health Practitioner
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center gap-2 transition-colors duration-300"
                >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
