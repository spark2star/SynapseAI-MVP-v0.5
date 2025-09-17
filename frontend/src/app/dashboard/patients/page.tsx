'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import apiService from '@/services/api'

interface Patient {
    id: string
    patient_id: string
    full_name: string
    age: number
    gender: string
    phone_primary: string
    last_visit: string | null
    created_at: string
}

export default function PatientsPage() {
    const { user } = useAuthStore()
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const response = await apiService.get('/patients/list/')
            
            if (response.status === 'success') {
                setPatients(response.data.patients)
            } else {
                toast.error('Failed to load patients')
            }
        } catch (error) {
            console.error('Error fetching patients:', error)
            toast.error('Failed to load patients')
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone_primary.includes(searchTerm)
    )

    const getInitials = (fullName: string) => {
        return fullName.split(' ').map(name => name[0]).join('').toUpperCase()
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-neutral-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Patients</h1>
                    <p className="text-neutral-600">Manage patient records and information</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => toast.info('Patient registration coming soon!')}
                        className="flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Patient
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <Input
                        placeholder="Search patients by name, ID, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="medical-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">Total Patients</p>
                            <p className="text-2xl font-bold text-neutral-900">{patients.length}</p>
                        </div>
                    </div>
                </div>
                
                <div className="medical-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">Recent Visits</p>
                            <p className="text-2xl font-bold text-neutral-900">
                                {patients.filter(p => p.last_visit).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="medical-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">New This Month</p>
                            <p className="text-2xl font-bold text-neutral-900">
                                {patients.filter(p => 
                                    new Date(p.created_at).getMonth() === new Date().getMonth()
                                ).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient List */}
            <div className="medical-card">
                <div className="px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900">
                        Patient Records ({filteredPatients.length})
                    </h2>
                </div>
                
                {filteredPatients.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900">No patients found</h3>
                        <p className="mt-1 text-sm text-neutral-500">
                            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by registering a new patient.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200">
                        {filteredPatients.map((patient) => (
                            <div key={patient.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-primary-700 font-semibold">
                                                {getInitials(patient.full_name)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-neutral-900">
                                                    {patient.full_name}
                                                </h3>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-700">
                                                    {patient.patient_id}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                                                <span>{patient.age} years • {patient.gender}</span>
                                                {patient.phone_primary && (
                                                    <div className="flex items-center gap-1">
                                                        <PhoneIcon className="h-4 w-4" />
                                                        {patient.phone_primary}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="text-sm text-neutral-600">Last Visit</p>
                                        <p className="text-sm font-medium text-neutral-900">
                                            {formatDate(patient.last_visit)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}