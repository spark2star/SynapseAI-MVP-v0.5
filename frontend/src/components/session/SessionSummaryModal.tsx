'use client'

import React, { useState } from 'react'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { MedicationItem } from '@/types/report'
import apiService from '@/services/api'
import PatientProgressSelector, { ProgressData } from '@/components/session/PatientProgressSelector'
import { toast } from 'react-hot-toast'

interface SessionSummaryModalProps {
    isOpen: boolean
    onClose: () => void
    sessionId: string
    transcription: string
    onReportGenerated: (reportId: number) => void
    initialMedications?: MedicationItem[]
    initialNotes?: string
    sessionType?: 'follow_up' | 'first_visit'
}

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
    isOpen,
    onClose,
    sessionId,
    transcription,
    onReportGenerated,
    initialMedications,
    initialNotes,
    sessionType = 'follow_up'
}) => {
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const [medicationPlan, setMedicationPlan] = useState<MedicationItem[]>(
        initialMedications && initialMedications.length > 0
            ? initialMedications
            : [{ drug_name: '', dosage: '', frequency: '', route: 'Oral', instructions: '' }]
    )
    const [additionalNotes, setAdditionalNotes] = useState(initialNotes || '')
    const [isGenerating, setIsGenerating] = useState(false)
    const [progressMessage, setProgressMessage] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleAddMedication = () => {
        setMedicationPlan([...medicationPlan, { drug_name: '', dosage: '', frequency: '', route: 'Oral', instructions: '' }])
    }

    const handleRemoveMedication = (index: number) => {
        if (medicationPlan.length > 1) {
            setMedicationPlan(medicationPlan.filter((_, i) => i !== index))
        }
    }

    const handleMedicationChange = (index: number, field: keyof MedicationItem, value: string) => {
        const updated = [...medicationPlan]
        updated[index] = { ...updated[index], [field]: value }
        setMedicationPlan(updated)
    }

    const pollReportStatus = async (reportId: number, timeoutMs = 120000, intervalMs = 1500): Promise<'completed' | 'failed' | 'timeout'> => {
        const start = Date.now()
        while (Date.now() - start < timeoutMs) {
            try {
                const statusResp = await apiService.get<any>(`/reports/${reportId}/status`)
                const s = statusResp?.data?.status || statusResp?.status
                if (s === 'completed' || s === 'failed') return s
            } catch (_) { }
            await new Promise(r => setTimeout(r, intervalMs))
        }
        return 'timeout'
    }

    const handleGenerateReport = async () => {
        setError(null)
        setIsGenerating(true)
        setProgressMessage('Submitting to AI for generation...')

        try {
            // Validate
            const validMeds = medicationPlan.filter(m => m.drug_name.trim() && m.dosage.trim() && m.frequency.trim())

            if (validMeds.length === 0) {
                setError('Please add at least one complete medication (drug name, dosage, and frequency required)')
                setIsGenerating(false)
                return
            }

            if (!progress) {
                setError('Please select patient progress status')
                setIsGenerating(false)
                return
            }

            console.log('📋 Generating report with progress + medications:', { progress, meds: validMeds })

            const resp = await apiService.post<any>(
                '/reports/generate-session',
                {
                    session_id: sessionId,
                    transcription: transcription,
                    patient_progress: progress.status,
                    medication_plan: validMeds,
                    additional_notes: additionalNotes,
                    session_type: sessionType
                },
                { timeout: 30000 }
            )

            if (!resp || (resp.status !== 'success' && resp.status !== 'accepted')) {
                throw new Error((resp && (resp.detail || resp.message)) || 'Failed to generate report')
            }

            const reportId = resp.report_id
            console.log('✅ Report job accepted, id:', reportId)
            setProgressMessage('Generating report (this can take up to ~60s)...')

            const finalStatus = await pollReportStatus(reportId)
            if (finalStatus === 'completed') {
                toast.success('Report ready!')
                onReportGenerated(reportId)
                onClose()
            } else if (finalStatus === 'failed') {
                throw new Error('AI report generation failed')
            } else {
                throw new Error('Report generation timed out. Please try again.')
            }

        } catch (err) {
            console.error('Report generation error:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate report')
        } finally {
            setIsGenerating(false)
            setProgressMessage('')
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b dark:border-neutral-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Session Summary
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Add medications and generate clinical report
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Patient Progress */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Patient Progress</h3>
                        <PatientProgressSelector selectedValue={progress?.status} onSelect={setProgress} required={true} />
                    </div>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-full">
                                    <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                        <div className="h-2 bg-blue-500 rounded-full animate-[progress_3s_ease-in-out_infinite]" style={{ width: '35%' }}></div>
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">{progressMessage || 'Generating report (~30s)...'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Medications Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Medication Plan
                        </h3>
                        <div className="space-y-4">
                            {medicationPlan.map((med, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Medication #{index + 1}
                                        </span>
                                        {medicationPlan.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveMedication(index)}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Drug Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={med.drug_name}
                                                onChange={(e) => handleMedicationChange(index, 'drug_name', e.target.value)}
                                                placeholder="e.g., Sertraline"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Dosage <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={med.dosage}
                                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                                placeholder="e.g., 100mg"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Frequency <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={med.frequency}
                                                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                                placeholder="e.g., Once daily"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Route
                                            </label>
                                            <input
                                                type="text"
                                                value={med.route}
                                                onChange={(e) => handleMedicationChange(index, 'route', e.target.value)}
                                                placeholder="e.g., Oral"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Instructions
                                            </label>
                                            <input
                                                type="text"
                                                value={med.instructions}
                                                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                                                placeholder="e.g., Take with food"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleAddMedication}
                                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                + Add Another Medication
                            </button>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Additional Clinical Notes (Optional)
                        </label>
                        <textarea
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            rows={3}
                            placeholder="Any additional observations or instructions..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t dark:border-neutral-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating || !progress}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Generating Report...
                            </>
                        ) : (
                            'Generate Report'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SessionSummaryModal

