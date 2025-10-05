'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            checkAuth().catch(error => {
                console.error('Dashboard auth check failed:', error)
            })
        }
    }, [isAuthenticated, isLoading])

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
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
