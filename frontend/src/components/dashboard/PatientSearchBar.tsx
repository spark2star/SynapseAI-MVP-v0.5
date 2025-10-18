'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Props for the PatientSearchBar component
 */
interface PatientSearchBarProps {
    /** Optional callback when search is submitted. If not provided, navigates to patients page with search query */
    onSearch?: (query: string) => void
}

/**
 * Patient Search Bar Component
 * 
 * Provides a search input for quickly finding patients by name, phone, or ID.
 * Supports keyboard shortcuts (Enter to submit) and includes a clear button.
 * The search query is preserved in the URL for bookmarking and sharing.
 * 
 * @component
 * @example
 * ```tsx
 * <PatientSearchBar
 *   onSearch={(query) => router.push(`/patients?search=${query}`)}
 * />
 * ```
 */
export default function PatientSearchBar({
    onSearch
}: PatientSearchBarProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedQuery = searchQuery.trim()

        if (trimmedQuery) {
            if (onSearch) {
                onSearch(trimmedQuery)
            } else {
                router.push(`/dashboard/patients?search=${encodeURIComponent(trimmedQuery)}`)
            }
        }
    }

    const handleClear = () => {
        setSearchQuery('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch(e as any)
        }
    }

    return (
        <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
                <Input
                    type="text"
                    placeholder="Search patients by name, phone, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    rightIcon={
                        searchQuery && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1 transition-colors"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )
                    }
                    className="pr-10"
                />
            </div>
        </form>
    )
}
