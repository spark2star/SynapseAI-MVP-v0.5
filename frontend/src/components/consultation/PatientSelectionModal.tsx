'use client'

import React, { useState, useEffect } from 'react'
import {
    MagnifyingGlassIcon,
    UserIcon,
    PhoneIcon,
    CalendarDaysIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {apiService} from '@/services/api'

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

interface PatientSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onPatientSelect: (patient: Patient) => void
}

const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({
    isOpen,
    onClose,
    onPatientSelect
}) => {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchPatients()
        }
    }, [isOpen])

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const response = await apiService.get('/patients/list/')

            if (response.status === 'success') {
                setPatients(response.data.patients || [])
            } else {
                toast.error('Failed to load patients')
                setPatients([])
            }
        } catch (error) {
            console.error('Error fetching patients:', error)
            toast.error('Failed to load patients')
            setPatients([])
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone_primary && patient.phone_primary.includes(searchTerm))
    )

    const getInitials = (fullName: string) => {
        return fullName.split(' ').map(name => name[0]).join('').toUpperCase()
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No visits yet'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient)
    }

    const handleContinue = () => {
        if (selectedPatient) {
            onPatientSelect(selectedPatient)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            Select Patient for Follow-up
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                            Choose a patient to start a follow-up consultation session
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                            placeholder="Search by name, patient ID, or phone number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                </div>

                {/* Patient List */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <LoadingSpinner size="md" />
                            <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading patients...</span>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                            <UserIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                {searchTerm ? 'No patients found' : 'No patients available'}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {searchTerm
                                    ? 'Try adjusting your search terms'
                                    : 'Add patients first before starting follow-up sessions'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    onClick={() => handlePatientSelect(patient)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedPatient?.id === patient.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {getInitials(patient.full_name)}
                                        </div>

                                        {/* Patient Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {patient.full_name}
                                                    </h4>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        ID: {patient.patient_id} • {patient.age} years • {patient.gender}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                                        <PhoneIcon className="h-4 w-4" />
                                                        {patient.phone_primary || 'No phone'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                                        <CalendarDaysIcon className="h-4 w-4" />
                                                        {formatDate(patient.last_visit)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selection Indicator */}
                                        {selectedPatient?.id === patient.id && (
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {selectedPatient ? (
                                <>Selected: <span className="font-medium">{selectedPatient.full_name}</span></>
                            ) : (
                                'Select a patient to continue'
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleContinue}
                                disabled={!selectedPatient}
                                className="flex items-center gap-2"
                            >
                                Continue with Follow-up
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PatientSelectionModal
