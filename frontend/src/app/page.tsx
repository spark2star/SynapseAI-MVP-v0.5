'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

    useEffect(() => {
        // Check authentication status on page load
        checkAuth()
    }, []) // Remove checkAuth from dependency array to prevent infinite loop

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                // Redirect to dashboard if authenticated
                router.push('/dashboard')
            } else {
                // Redirect to login if not authenticated
                router.push('/auth/login')
            }
        }
    }, [isAuthenticated, isLoading, router])

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="medical-card p-8">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-neutral-600">Loading EMR System...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Return null while redirecting
    return null
}
