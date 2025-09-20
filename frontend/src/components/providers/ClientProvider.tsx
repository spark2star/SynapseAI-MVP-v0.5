'use client'

import { useEffect, useState } from 'react'

interface ClientProviderProps {
    children: React.ReactNode
}

export default function ClientProvider({ children }: ClientProviderProps) {
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)
    }, [])

    // Prevent hydration mismatch by not rendering until client-side
    if (!hasMounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center transition-all duration-300">
                <div className="text-center">
                    <div className="medical-card p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading EMR System...</p>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
