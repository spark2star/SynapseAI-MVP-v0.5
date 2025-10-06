'use client'

import { useEffect, useRef, useState } from 'react'
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
    const { isAuthenticated, isLoading, user } = useAuthStore()
    const [mounted, setMounted] = useState(false)
    const renderCount = useRef(0)

    // Increment render count for debugging
    renderCount.current += 1

    // DEBUG: Log detailed state on every render
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🔍 DASHBOARD LAYOUT RENDER #${renderCount.current}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Auth State:', {
        mounted,
        isLoading,
        isAuthenticated,
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
    })
    console.log('💾 Storage State:', {
        localStorage_token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : 'N/A',
        localStorage_user: typeof window !== 'undefined' ? localStorage.getItem('user') : 'N/A',
        sessionStorage_token: typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : 'N/A',
    })
    console.log('🎯 Zustand Persist:', {
        auth_storage: typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : 'N/A',
    })
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Wait for client-side hydration
    useEffect(() => {
        console.log('✅ Dashboard mounted - setting mounted = true')
        setMounted(true)
    }, [])

    // Redirect to login if not authenticated (only after mounted)
    useEffect(() => {
        console.log('🔄 Redirect Effect Triggered:', { mounted, isLoading, isAuthenticated })
        
        if (mounted && !isLoading && !isAuthenticated) {
            console.log('🔒 NOT AUTHENTICATED - Redirecting to login...')
            router.push('/auth/login')
        } else if (mounted && !isLoading && isAuthenticated) {
            console.log('✅ AUTHENTICATED - User can access dashboard')
        }
    }, [mounted, isAuthenticated, isLoading, router])

    // Don't render anything until mounted (prevents hydration mismatch)
    if (!mounted) {
        console.log('⏳ Not mounted yet - returning null')
        return null
    }

    // Show loading state
    if (isLoading) {
        console.log('⏳ Loading state - showing spinner')
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    // Don't render dashboard if not authenticated
    if (!isAuthenticated) {
        console.log('❌ Not authenticated - returning null (redirect should happen)')
        return null
    }

    console.log('✅ Rendering full dashboard layout')

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
