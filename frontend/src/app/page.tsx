'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ClientProvider from '@/components/providers/ClientProvider'

function HomePageContent() {
    const router = useRouter()
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

    useEffect(() => {
        // Check authentication status on page load - only run once
        const initAuth = async () => {
            try {
                await checkAuth()
            } catch (error) {
                console.error('Auth check failed:', error)
            }
        }
        initAuth()
    }, []) // Remove checkAuth from dependencies to prevent infinite loop

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                // Redirect to dashboard if authenticated
                router.replace('/dashboard')
            } else {
                // Redirect to login if not authenticated
                router.replace('/auth/login')
            }
        }
    }, [isAuthenticated, isLoading, router])

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center transition-all duration-300">
                <div className="text-center">
                    <div className="medical-card p-8">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading EMR System...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Return null while redirecting
    return null
}

export default function HomePage() {
    return (
        <ClientProvider>
            <HomePageContent />
        </ClientProvider>
    )
}
