'use client'

import React, { useState } from 'react'
import type { IntensityLevel } from '@/types/symptom'

interface Props {
    selectedSymptom: string | null
    isCustom: boolean
    onSubmit: (intensity: IntensityLevel, duration: string) => void
    onCancel: () => void
}

const SymptomAssignmentForm: React.FC<Props> = ({ selectedSymptom, isCustom, onSubmit, onCancel }) => {
    const [intensity, setIntensity] = useState<IntensityLevel>('Moderate')
    const [duration, setDuration] = useState('')

    if (!selectedSymptom) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!duration.trim()) return
        onSubmit(intensity, duration.trim())
        setIntensity('Moderate')
        setDuration('')
    }

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Selected Symptom</label>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{selectedSymptom}</span>
                        {isCustom && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Custom</span>}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Intensity</label>
                    <select value={intensity} onChange={e => setIntensity(e.target.value as IntensityLevel)} className="w-full px-3 py-2 border rounded" required>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 2 weeks, 3 months" className="w-full px-3 py-2 border rounded" required />
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Symptom</button>
                    <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
            </form>
        </div>
    )
}

export default SymptomAssignmentForm


