'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from '@headlessui/react'
import { clsx } from 'clsx'
import {
    Bars3Icon,
    BellIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    CogIcon,
} from '@heroicons/react/24/outline'

import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

export default function DashboardHeader() {
    const router = useRouter()
    const { user, profile, logout } = useAuthStore()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        router.push('/auth/login')
    }

    const displayName = profile
        ? `Dr. ${profile.first_name} ${profile.last_name}`
        : user?.email

    return (
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-neutral-200">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Mobile menu button */}
                <div className="flex items-center lg:hidden">
                    <button
                        type="button"
                        className="text-neutral-500 hover:text-neutral-600"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>

                {/* Page title - will be dynamic based on route */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold text-neutral-900 sm:truncate">
                        {/* This will be replaced by page-specific titles */}
                        Dashboard
                    </h1>
                </div>

                {/* Right side buttons and menu */}
                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    <button
                        type="button"
                        className="p-1 rounded-full text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" />
                    </button>

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative">
                        <div>
                            <Menu.Button className="flex max-w-xs items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                <span className="sr-only">Open user menu</span>
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-700">
                                        {user?.email?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </Menu.Button>
                        </div>

                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="px-4 py-2 border-b border-neutral-200">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                    {displayName}
                                </p>
                                <p className="text-xs text-neutral-500 capitalize">
                                    {user?.role}
                                </p>
                            </div>

                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => router.push('/dashboard/profile')}
                                        className={clsx(
                                            'w-full text-left px-4 py-2 text-sm text-neutral-700 flex items-center',
                                            active ? 'bg-neutral-100' : ''
                                        )}
                                    >
                                        <UserCircleIcon className="mr-3 h-4 w-4" />
                                        Profile
                                    </button>
                                )}
                            </Menu.Item>

                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => router.push('/dashboard/settings')}
                                        className={clsx(
                                            'w-full text-left px-4 py-2 text-sm text-neutral-700 flex items-center',
                                            active ? 'bg-neutral-100' : ''
                                        )}
                                    >
                                        <CogIcon className="mr-3 h-4 w-4" />
                                        Settings
                                    </button>
                                )}
                            </Menu.Item>

                            <div className="border-t border-neutral-200">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={handleLogout}
                                            className={clsx(
                                                'w-full text-left px-4 py-2 text-sm text-neutral-700 flex items-center',
                                                active ? 'bg-neutral-100' : ''
                                            )}
                                        >
                                            <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                                            Sign Out
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Menu>
                </div>
            </div>
        </div>
    )
}
