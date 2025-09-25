'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to landing page as the main entry point
        router.replace('/landing')
    }, [router])

    return null
}
