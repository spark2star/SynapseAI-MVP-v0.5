'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

export interface Medication {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
}

interface MedicationModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (medications: Medication[], patientStatus?: string) => void
    isLoading?: boolean
}

export default function MedicationModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}: MedicationModalProps) {
    const [medications, setMedications] = useState<Medication[]>([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ])
    const [patientStatus, setPatientStatus] = useState<'improving' | 'stable' | 'worse' | null>(null)

    const addMedication = () => {
        setMedications([
            ...medications,
            { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
        ])
    }

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications]
        updated[index][field] = value
        setMedications(updated)
    }

    const removeMedication = (index: number) => {
        if (medications.length === 1) {
            // Keep at least one empty form
            setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
        } else {
            setMedications(medications.filter((_, i) => i !== index))
        }
    }

    const handleSubmit = () => {

        // Check patient status
        if (!patientStatus) {
            alert('Please select patient status (Improving, Stable, or Worse)')
            return
        }

        // Filter out empty medications
        const validMeds = medications.filter(m =>
            m.name.trim().length > 0 && m.dosage.trim().length > 0
        )

        if (validMeds.length === 0) {
            alert('Please add at least one medication with name and dosage, or click "Skip" to continue without medications.')
            return
        }

        onSubmit(validMeds, patientStatus || undefined)  // PASS STATUS
    }

    const handleSkip = () => {
        onSubmit([], patientStatus || undefined)  // PASS STATUS EVEN WHEN SKIPPING
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Add Medication Plan</h2>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Prescribe medications for the patient (optional)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        disabled={isLoading}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* ADD THIS ENTIRE SECTION - Patient Status - BEFORE the Scrollable Content div */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/30">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Patient Status <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setPatientStatus('improving')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${patientStatus === 'improving'
                                    ? 'bg-green-500 text-white shadow-lg'
                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-gray-300 dark:border-slate-600 hover:border-green-500'
                                }`}
                        >
                            ✅ Improving
                        </button>
                        <button
                            type="button"
                            onClick={() => setPatientStatus('stable')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${patientStatus === 'stable'
                                    ? 'bg-blue-500 text-white shadow-lg'
                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-gray-300 dark:border-slate-600 hover:border-blue-500'
                                }`}
                        >
                            ➖ Stable
                        </button>
                        <button
                            type="button"
                            onClick={() => setPatientStatus('worse')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${patientStatus === 'worse'
                                    ? 'bg-red-500 text-white shadow-lg'
                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-gray-300 dark:border-slate-600 hover:border-red-500'
                                }`}
                        >
                            ⚠️ Worse
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                        {medications.map((med, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 dark:border-slate-700 rounded-lg p-5 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-lg">
                                        Medication {index + 1}
                                    </h3>
                                    {medications.length > 1 && (
                                        <button
                                            onClick={() => removeMedication(index)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            disabled={isLoading}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Medication Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Medication Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Sertraline, Alprazolam"
                                            value={med.name}
                                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>

                                    {/* Dosage */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Dosage <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 50mg, 10ml"
                                            value={med.dosage}
                                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>

                                    {/* Frequency */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Frequency
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Twice daily, Before bed"
                                            value={med.frequency}
                                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Duration
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 30 days, 3 months"
                                            value={med.duration}
                                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Instructions */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Special Instructions
                                        </label>
                                        <textarea
                                            placeholder="e.g., Take with food, Avoid alcohol"
                                            value={med.instructions}
                                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                                            rows={2}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Another Button */}
                    <div className="mt-6">
                        <button
                            onClick={addMedication}
                            className="w-full border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-medium"
                            disabled={isLoading}
                        >
                            + Add Another Medication
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3 justify-end">
                    <Button
                        onClick={handleSkip}
                        variant="secondary"
                        disabled={isLoading}
                    >
                        Skip (No Medications)
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Generating Report...' : 'Generate Report'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
