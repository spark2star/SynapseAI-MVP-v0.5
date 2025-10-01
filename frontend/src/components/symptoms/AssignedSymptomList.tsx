'use client'

import React from 'react'
import type { AssignedSymptom } from '@/types/symptom'

interface Props {
    symptoms: AssignedSymptom[]
    onDelete: (id: number) => void
    isLoading?: boolean
}

const AssignedSymptomList: React.FC<Props> = ({ symptoms, onDelete, isLoading }) => {
    if (isLoading) return <div className="text-gray-500">Loading symptoms...</div>
    if (symptoms.length === 0) return <div className="text-gray-500">No symptoms assigned yet</div>

    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-3">Assigned Symptoms</h3>
            {symptoms.map((s) => (
                <div key={s.id} className="bg-white dark:bg-neutral-800 border rounded-lg p-3 flex justify-between items-start">
                    <div className="flex-1">
                        <div className="font-medium">{s.symptom_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <span className="inline-block mr-3"><span className="font-medium">Intensity:</span> {s.intensity}</span>
                            <span className="inline-block"><span className="font-medium">Duration:</span> {s.duration}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(s.recorded_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => onDelete(s.id)} className="text-red-500 hover:text-red-700 ml-2" aria-label="Delete symptom">✕</button>
                </div>
            ))}
        </div>
    )
}

export default AssignedSymptomList


