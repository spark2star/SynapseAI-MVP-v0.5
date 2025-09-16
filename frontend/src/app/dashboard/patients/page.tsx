'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    PhoneIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import apiService from '@/services/api'
import type { Patient, PaginatedResponse } from '@/types'

const searchTypeOptions = [
    { value: 'name', label: 'Name' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
]

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('name')
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [isSearching, setIsSearching] = useState(false)

    const itemsPerPage = 20

    useEffect(() => {
        loadPatients()
    }, [currentPage])

    const loadPatients = async () => {
        try {
            setLoading(true)
            const offset = (currentPage - 1) * itemsPerPage

            const response = await apiService.get('/patients/list/', {
                limit: itemsPerPage,
                offset: offset
            })

            if (response.status === 'success' && response.data) {
                setPatients(response.data.patients || [])
                setTotalCount(response.data.total_count || 0)
            }
        } catch (error) {
            console.error('Failed to load patients:', error)
            toast.error('Failed to load patients')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadPatients()
            return
        }

        try {
            setIsSearching(true)

            const response = await apiService.get('/patients/search/', {
                query: searchQuery,
                search_type: searchType,
                limit: itemsPerPage,
                offset: 0
            })

            if (response.status === 'success' && response.data) {
                setPatients(response.data.patients || [])
                setTotalCount(response.data.total_count || 0)
                setCurrentPage(1)
            }
        } catch (error) {
            console.error('Search failed:', error)
            toast.error('Search failed')
        } finally {
            setIsSearching(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const clearSearch = () => {
        setSearchQuery('')
        loadPatients()
    }

    const formatAge = (age: number | undefined) => {
        if (!age) return 'Unknown'
        return `${age} years`
    }

    const formatPhone = (phone: string | undefined) => {
        if (!phone) return 'Not provided'
        // Simple phone formatting - in production, use a proper library
        return phone
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Patients</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Manage patient records securely and efficiently
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link href="/dashboard/patients/new">
                        <Button variant="primary">
                            <PlusIcon className="mr-2 h-4 w-4" />
                            New Patient
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="medical-card">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder={`Search by ${searchType}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select
                            options={searchTypeOptions}
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-32"
                        />
                        <Button
                            variant="primary"
                            onClick={handleSearch}
                            loading={isSearching}
                            disabled={isSearching}
                        >
                            <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                        {searchQuery && (
                            <Button
                                variant="secondary"
                                onClick={clearSearch}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results summary */}
            {!loading && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                        {searchQuery
                            ? `Found ${totalCount} patient${totalCount !== 1 ? 's' : ''} matching "${searchQuery}"`
                            : `Showing ${patients.length} of ${totalCount} patient${totalCount !== 1 ? 's' : ''}`
                        }
                    </p>
                    {totalCount > itemsPerPage && (
                        <div className="text-sm text-neutral-600">
                            Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                        </div>
                    )}
                </div>
            )}

            {/* Patient list */}
            <div className="space-y-4">
                {loading ? (
                    <div className="medical-card">
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 text-neutral-600">Loading patients...</p>
                            </div>
                        </div>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="medical-card">
                        <div className="text-center py-12">
                            <UserGroupIcon className="mx-auto h-12 w-12 text-neutral-400" />
                            <h3 className="mt-2 text-sm font-medium text-neutral-900">
                                {searchQuery ? 'No patients found' : 'No patients yet'}
                            </h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                {searchQuery
                                    ? 'Try adjusting your search criteria'
                                    : 'Get started by registering your first patient'
                                }
                            </p>
                            {!searchQuery && (
                                <div className="mt-6">
                                    <Link href="/dashboard/patients/new">
                                        <Button variant="primary">
                                            <PlusIcon className="mr-2 h-4 w-4" />
                                            Register First Patient
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    patients.map((patient) => (
                        <Link
                            key={patient.id}
                            href={`/dashboard/patients/${patient.id}`}
                            className="block"
                        >
                            <div className="patient-card">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <span className="text-lg font-semibold text-primary-700">
                                                {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-900">
                                                {patient.full_name}
                                            </h3>
                                            <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                                                <span>ID: {patient.patient_id}</span>
                                                <span>Age: {formatAge(patient.age)}</span>
                                                <span className="capitalize">{patient.gender}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end space-y-1 text-sm text-neutral-600">
                                        {patient.phone_primary && (
                                            <div className="flex items-center space-x-1">
                                                <PhoneIcon className="h-4 w-4" />
                                                <span>{formatPhone(patient.phone_primary)}</span>
                                            </div>
                                        )}
                                        {patient.email && (
                                            <div className="flex items-center space-x-1">
                                                <EnvelopeIcon className="h-4 w-4" />
                                                <span>{patient.email}</span>
                                            </div>
                                        )}
                                        <div className="text-xs text-neutral-500">
                                            Registered: {new Date(patient.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalCount > itemsPerPage && !loading && (
                <div className="flex justify-center space-x-2">
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>

                    <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                            .filter(page =>
                                page === 1 ||
                                page === Math.ceil(totalCount / itemsPerPage) ||
                                Math.abs(page - currentPage) <= 1
                            )
                            .map((page, index, array) => (
                                <div key={page} className="flex items-center">
                                    {index > 0 && array[index - 1] !== page - 1 && (
                                        <span className="text-neutral-400 px-2">...</span>
                                    )}
                                    <Button
                                        variant={currentPage === page ? "primary" : "secondary"}
                                        onClick={() => setCurrentPage(page)}
                                        className="min-w-[40px]"
                                    >
                                        {page}
                                    </Button>
                                </div>
                            ))
                        }
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
