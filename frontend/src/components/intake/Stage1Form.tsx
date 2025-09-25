'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UserIcon, CalendarIcon, HomeIcon, ClockIcon } from '@heroicons/react/24/outline'

export interface Stage1Data {
    name: string
    age: number
    sex: 'Male' | 'Female' | 'Other'
    address: string
    informants: {
        selection: string[]
        other_details?: string
    }
    illness_duration: {
        value: number
        unit: 'Days' | 'Weeks' | 'Months' | 'Years'
    }
    referred_by: string
    precipitating_factor: {
        narrative: string
        tags: string[]
    }
}

interface Stage1FormProps {
    onNext: (data: Stage1Data) => void
    initialData?: Partial<Stage1Data>
    isLoading?: boolean
}

const INFORMANT_OPTIONS = [
    'Self',
    'Parent',
    'Spouse',
    'Child',
    'Other'
]

export default function Stage1Form({ onNext, initialData, isLoading = false }: Stage1FormProps) {
    const [formData, setFormData] = useState<Stage1Data>({
        name: '',
        age: 0,
        sex: 'Male',
        address: '',
        informants: {
            selection: ['Self'],
            other_details: ''
        },
        illness_duration: {
            value: 0,
            unit: 'Weeks'
        },
        referred_by: '',
        precipitating_factor: {
            narrative: '',
            tags: []
        },
        ...initialData
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleInformantToggle = (informant: string) => {
        const currentSelection = formData.informants.selection
        const newSelection = currentSelection.includes(informant)
            ? currentSelection.filter(i => i !== informant)
            : [...currentSelection, informant]

        setFormData(prev => ({
            ...prev,
            informants: {
                ...prev.informants,
                selection: newSelection
            }
        }))
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Patient name is required'
        }

        if (!formData.age || formData.age < 1 || formData.age > 150) {
            newErrors.age = 'Please enter a valid age (1-150)'
        }

        if (formData.informants.selection.length === 0) {
            newErrors.informants = 'Please select at least one informant'
        }

        if (formData.informants.selection.includes('Other') && !formData.informants.other_details?.trim()) {
            newErrors.other_details = 'Please specify other informant details'
        }

        if (!formData.illness_duration.value || formData.illness_duration.value < 1) {
            newErrors.illness_duration = 'Please enter a valid duration (minimum 1)'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onNext(formData)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50">
                {/* Header */}
                <div className="px-8 py-6 border-b border-sky-100/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <UserIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                New Patient Registration
                            </h2>
                            <p className="text-sky-600 dark:text-sky-300 text-sm mt-1">
                                Stage 1: Patient Demographics & Basic Information
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                                    Basic Information
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Full Name *
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter patient's full name"
                                            error={errors.name}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Age *
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="150"
                                                value={formData.age || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                                                placeholder="Age"
                                                error={errors.age}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Sex *
                                            </label>
                                            <Select
                                                value={formData.sex}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value as any }))}
                                                options={[
                                                    { value: 'Male', label: 'Male' },
                                                    { value: 'Female', label: 'Female' },
                                                    { value: 'Other', label: 'Other' }
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Enter patient's address"
                                            rows={3}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-800/50 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Informants */}
                            <div>
                                <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-3">
                                    Information Source(s) *
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Who provided this information about the patient?
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    {INFORMANT_OPTIONS.map(informant => (
                                        <label
                                            key={informant}
                                            className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-sky-50/50 dark:hover:bg-sky-900/20 cursor-pointer transition-colors duration-200"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.informants.selection.includes(informant)}
                                                onChange={() => handleInformantToggle(informant)}
                                                className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-sky-500 focus:ring-2"
                                            />
                                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                {informant}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {errors.informants && (
                                    <p className="text-red-500 text-sm mt-2">{errors.informants}</p>
                                )}

                                {formData.informants.selection.includes('Other') && (
                                    <div className="mt-4">
                                        <Input
                                            type="text"
                                            value={formData.informants.other_details}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                informants: {
                                                    ...prev.informants,
                                                    other_details: e.target.value
                                                }
                                            }))}
                                            placeholder="Please specify other informant details"
                                            error={errors.other_details}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Clinical Information */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                                    Clinical Information
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Duration of Current Illness *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.illness_duration.value === 0 ? '' : formData.illness_duration.value.toString()}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    illness_duration: {
                                                        ...prev.illness_duration,
                                                        value: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                                    }
                                                }))}
                                                placeholder="Duration"
                                                error={errors.illness_duration}
                                                className="w-full"
                                            />
                                            <Select
                                                value={formData.illness_duration.unit}
                                                onValueChange={(value) => setFormData(prev => ({
                                                    ...prev,
                                                    illness_duration: {
                                                        ...prev.illness_duration,
                                                        unit: value as 'Days' | 'Weeks' | 'Months' | 'Years'
                                                    }
                                                }))}
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
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Referred By
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.referred_by}
                                            onChange={(e) => setFormData(prev => ({ ...prev, referred_by: e.target.value }))}
                                            placeholder="Name of referring doctor or source"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Precipitating Factors
                                        </label>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                            Describe any events, stressors, or circumstances that may have triggered the current illness
                                        </p>
                                        <textarea
                                            value={formData.precipitating_factor.narrative}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                precipitating_factor: {
                                                    ...prev.precipitating_factor,
                                                    narrative: e.target.value
                                                }
                                            }))}
                                            placeholder="Describe precipitating factors (e.g., job loss, relationship issues, trauma, medical illness, etc.)"
                                            rows={4}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-800/50 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Information Note */}
                            <div className="bg-sky-50/50 dark:bg-sky-900/20 border border-sky-200/50 dark:border-sky-800/50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <ClockIcon className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-sky-800 dark:text-sky-200 mb-1">
                                            Next Step: Symptom Assessment
                                        </h4>
                                        <p className="text-sm text-sky-700 dark:text-sky-300">
                                            After completing this basic information, you'll move to Stage 2 where you can add and detail specific symptoms for this patient.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-sky-100/50 dark:border-slate-700/50">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                        >
                            {isLoading ? 'Creating Patient...' : 'Continue to Symptoms →'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
