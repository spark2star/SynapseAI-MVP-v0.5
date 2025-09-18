'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

    useEffect(() => {
        checkAuth()
    }, []) // Remove checkAuth from dependency array to prevent infinite loop

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center transition-all duration-300">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-all duration-300">
            <div className="flex">
                {/* Sidebar */}
                <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-40 lg:w-64">
                    <DashboardSidebar />
                </div>

                {/* Main content */}
                <div className="flex-1 lg:ml-64">
                    {/* Header */}
                    <DashboardHeader />

                    {/* Page content */}
                    <main className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
