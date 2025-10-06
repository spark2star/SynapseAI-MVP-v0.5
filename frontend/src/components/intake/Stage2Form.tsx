'use client'

import { apiService } from '@/services/api';
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
    PuzzlePieceIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XMarkIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { symptomAPI } from '@/services/symptoms'

interface Symptom {
    id: string
    name: string
    description?: string
    categories: string[]
    source: 'master' | 'user'
    aliases?: string[]
}

export interface PatientSymptom {
    symptom_id: string
    symptom_source: 'master' | 'user' | 'medical_db' | 'icd10' | 'icd11'
    symptom_name: string
    severity: 'Mild' | 'Moderate' | 'Severe'
    frequency: 'Hourly' | 'Daily' | 'Weekly' | 'Constant'
    duration: {
        value: number
        unit: 'Days' | 'Weeks' | 'Months' | 'Years'
    }
    notes?: string
    triggers?: string[]
}

interface Stage2FormProps {
    patientId: string
    patientName: string
    onComplete: (symptoms: PatientSymptom[]) => void
    onBack: () => void
    isLoading?: boolean
}

export default function Stage2Form({
    patientId,
    patientName,
    onComplete,
    onBack,
    isLoading = false
}: Stage2FormProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Symptom[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedSymptoms, setSelectedSymptoms] = useState<PatientSymptom[]>([])
    const [showNewSymptomModal, setShowNewSymptomModal] = useState(false)
    const [newSymptomName, setNewSymptomName] = useState('')
    const [collapsedSymptoms, setCollapsedSymptoms] = useState<Set<string>>(new Set())

    // Search symptoms using unified API (global + custom)
    const searchSymptoms = async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const data = await symptomAPI.search(query)
            const mapped: Symptom[] = (data || []).map((r: any, idx: number) => ({
                id: String(r.source_id ?? `g-${idx}-${r.name}`),
                name: r.name,
                description: undefined,
                categories: r.category ? [r.category] : [],
                source: r.type === 'custom' ? 'user' : 'master'
            }))
            setSearchResults(mapped)
        } catch (error) {
            console.error('Symptom search error:', error)
            toast.error('Symptom search failed')
        } finally {
            setIsSearching(false)
        }
    }


    useEffect(() => {
        const timer = setTimeout(() => {
            searchSymptoms(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const addSymptom = (symptom: Symptom) => {
        // Check if already added
        if (selectedSymptoms.find(s => s.symptom_id === symptom.id)) {
            toast.error('This symptom has already been added')
            return
        }

        const newPatientSymptom: PatientSymptom = {
            symptom_id: symptom.id,
            symptom_source: symptom.source,
            symptom_name: symptom.name,
            severity: 'Moderate',
            frequency: 'Daily',
            duration: {
                value: 1,
                unit: 'Weeks'
            },
            notes: '',
            triggers: []
        }

        setSelectedSymptoms(prev => [...prev, newPatientSymptom])
        setSearchQuery('')
        setSearchResults([])
        toast.success(`Added "${symptom.name}" to patient symptoms`)
    }

    const removeSymptom = (symptomId: string) => {
        setSelectedSymptoms(prev => prev.filter(s => s.symptom_id !== symptomId))
        toast.success('Symptom removed')
    }

    const updateSymptom = (symptomId: string, updates: Partial<PatientSymptom>) => {
        setSelectedSymptoms(prev => prev.map(symptom =>
            symptom.symptom_id === symptomId
                ? { ...symptom, ...updates }
                : symptom
        ))
    }

    const handleCreateCustomSymptom = async () => {
        if (!newSymptomName.trim()) {
            toast.error('Please enter a symptom name')
            return
        }

        try {
            // Call backend API to create custom symptom using apiService
            const response = await apiService.post('/intake/user_symptoms', {
                name: newSymptomName.trim(),
                description: 'Custom symptom created by doctor',
                categories: ['ICD11-Custom']
            })

            if (response.status === 'success' && response.data) {
                const customSymptom: Symptom = {
                    id: response.data.symptom_id,
                    name: response.data.name,
                    description: 'Custom symptom created by doctor',
                    categories: response.data.categories,
                    source: 'user'
                }

                addSymptom(customSymptom)
                setShowNewSymptomModal(false)
                setNewSymptomName('')
                toast.success(`Custom symptom "${newSymptomName}" created and added`)
            } else {
                throw new Error(response.error?.message || 'Failed to create custom symptom')
            }
        } catch (error) {
            console.error('Custom symptom creation error:', error)
            toast.error('Failed to create custom symptom')
        }
    }

    const handleComplete = () => {
        if (selectedSymptoms.length === 0) {
            toast.error('Please add at least one symptom before continuing')
            return
        }

        // Validate all symptoms have required fields
        const incompleteSymptoms = selectedSymptoms.filter(symptom =>
            !symptom.severity || !symptom.frequency || !symptom.duration.value
        )

        if (incompleteSymptoms.length > 0) {
            toast.error('Please complete all symptom details before saving')
            return
        }

        onComplete(selectedSymptoms)
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50">
                {/* Header */}
                <div className="px-8 py-6 border-b border-sky-100/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <PuzzlePieceIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                Symptom Assessment: {patientName}
                            </h2>
                            <p className="text-emerald-600 dark:text-emerald-300 text-sm mt-1">
                                Stage 2: Add and detail specific symptoms
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Search & Add Symptoms */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                                Search Symptoms
                            </h3>

                            {/* Search Bar */}
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Type to search for symptoms..."
                                    className="pl-10 w-full"
                                />
                                {isSearching && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                                    {searchResults.map(symptom => (
                                        <div
                                            key={symptom.id}
                                            onClick={() => addSymptom(symptom)}
                                            className="p-3 hover:bg-sky-50 dark:hover:bg-slate-600 cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                                        >
                                            <div className="font-medium text-slate-800 dark:text-slate-200">
                                                {symptom.name}
                                            </div>
                                            {symptom.description && (
                                                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                    {symptom.description}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800">
                                                    {(symptom.categories && symptom.categories[0]) || 'Symptom'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* No Results / Create Custom */}
                            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                                No symptoms found for "{searchQuery}"
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setNewSymptomName(searchQuery)
                                                    setShowNewSymptomModal(true)
                                                }}
                                                variant="secondary"
                                                className="text-sm px-3 py-2"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                Create Custom Symptom
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Symptoms */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                                    Selected Symptoms ({selectedSymptoms.length})
                                </h3>
                            </div>

                            {selectedSymptoms.length === 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
                                    <PuzzlePieceIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400 mb-2">No symptoms added yet</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500">
                                        Use the search box to find and add symptoms for this patient
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {selectedSymptoms.map((symptom, index) => (
                                        <SymptomCard
                                            key={symptom.symptom_id}
                                            symptom={symptom}
                                            onUpdate={updateSymptom}
                                            onRemove={removeSymptom}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-sky-100/50 dark:border-slate-700/50">
                        <Button
                            type="button"
                            onClick={onBack}
                            variant="secondary"
                            className="px-6 py-3"
                        >
                            ← Back to Demographics
                        </Button>

                        <Button
                            type="button"
                            onClick={handleComplete}
                            disabled={isLoading || selectedSymptoms.length === 0}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                        >
                            {isLoading ? 'Saving Patient...' : `Complete Registration (${selectedSymptoms.length} symptoms)`}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Custom Symptom Modal */}
            {showNewSymptomModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                            Create Custom Symptom
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Symptom Name
                            </label>
                            <Input
                                type="text"
                                value={newSymptomName}
                                onChange={(e) => setNewSymptomName(e.target.value)}
                                placeholder="Enter symptom name"
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                onClick={() => {
                                    setShowNewSymptomModal(false)
                                    setNewSymptomName('')
                                }}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateCustomSymptom}
                                className="bg-sky-600 hover:bg-sky-700"
                            >
                                Create & Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Symptom Card Component
interface SymptomCardProps {
    symptom: PatientSymptom
    onUpdate: (symptomId: string, updates: Partial<PatientSymptom>) => void
    onRemove: (symptomId: string) => void
}

function SymptomCard({ symptom, onUpdate, onRemove }: SymptomCardProps) {
    return (
        <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                        {symptom.symptom_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${symptom.symptom_source === 'medical_db' ? 'bg-green-100 text-green-800' :
                            symptom.symptom_source === 'icd10' || symptom.symptom_source === 'icd11' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                            }`}>
                            {symptom.symptom_source === 'medical_db' ? 'Medical Database' :
                                symptom.symptom_source === 'icd10' ? 'ICD-10' :
                                    symptom.symptom_source === 'icd11' ? 'ICD-11' :
                                        'Custom'}
                        </span>
                        {/* Collapse/Expand Button */}
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Collapse/Expand"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Enhanced red circular remove button */}
                <button
                    type="button"
                    onClick={() => onRemove(symptom.symptom_id)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 transition-all duration-200 border border-red-200"
                    title="Remove this symptom"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Severity
                    </label>
                    <Select
                        value={symptom.severity}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            onUpdate(symptom.symptom_id, { severity: e.target.value as 'Mild' | 'Moderate' | 'Severe' })
                        }
                        options={[
                            { value: 'Mild', label: 'Mild' },
                            { value: 'Moderate', label: 'Moderate' },
                            { value: 'Severe', label: 'Severe' }
                        ]}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Frequency
                    </label>
                    <Select
                        value={symptom.frequency}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            onUpdate(symptom.symptom_id, { frequency: e.target.value as 'Hourly' | 'Daily' | 'Weekly' | 'Constant' })
                        }
                        options={[
                            { value: 'Hourly', label: 'Hourly' },
                            { value: 'Daily', label: 'Daily' },
                            { value: 'Weekly', label: 'Weekly' },
                            { value: 'Constant', label: 'Constant' }
                        ]}
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        type="number"
                        min="1"
                        value={symptom.duration.value}
                        onChange={(e) => onUpdate(symptom.symptom_id, {
                            duration: { ...symptom.duration, value: parseInt(e.target.value) || 1 }
                        })}
                        className="text-sm"
                    />
                    <Select
                        value={symptom.duration.unit}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            onUpdate(symptom.symptom_id, {
                                duration: { ...symptom.duration, unit: e.target.value as 'Days' | 'Weeks' | 'Months' | 'Years' }
                            })
                        }
                        options={[
                            { value: 'Days', label: 'Days' },
                            { value: 'Weeks', label: 'Weeks' },
                            { value: 'Months', label: 'Months' },
                            { value: 'Years', label: 'Years' }
                        ]}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Additional Notes
                </label>
                <textarea
                    value={symptom.notes || ''}
                    onChange={(e) => onUpdate(symptom.symptom_id, { notes: e.target.value })}
                    placeholder="Any additional details about this symptom..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                />
            </div>
        </div>
    )
}
