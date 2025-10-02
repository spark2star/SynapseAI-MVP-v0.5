'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewPatientRedirect() {
    const router = useRouter()
    useEffect(() => {
        // For MVP: create a new patient and redirect to session page as first visit
        // This is a placeholder redirect; the actual creation can be wired later
        const newId = `patient-${Date.now()}`
        router.replace(`/dashboard/patients/${newId}?first_visit=true`)
    }, [router])
    return null
}


