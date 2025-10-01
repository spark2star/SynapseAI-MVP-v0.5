'use client'

import React from 'react'
import { CheckCircleIcon, MinusCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export type ProgressStatus = 'IMPROVING' | 'STABLE' | 'DETERIORATING'

export interface ProgressData {
    status: ProgressStatus
    label: string
    value: 1 | 0 | -1
    displayText: string
}

interface PatientProgressSelectorProps {
    selectedValue?: ProgressStatus | null
    onSelect: (progress: ProgressData) => void
    disabled?: boolean
    required?: boolean
}

const OPTIONS: Array<{
    status: ProgressStatus
    label: string
    value: 1 | 0 | -1
    displayText: string
    icon: React.ComponentType<any>
    color: {
        ring: string
        iconBg: string
        iconColor: string
        selectedRing: string
        selectedBg: string
    }
    description: string
}> = [
        {
            status: 'IMPROVING',
            label: 'Improving',
            value: 1,
            displayText: 'Patient is improving on the current treatment plan',
            icon: CheckCircleIcon,
            color: { ring: 'ring-emerald-200', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700', selectedRing: 'ring-emerald-500', selectedBg: 'bg-emerald-50' },
            description: 'Symptoms are reducing; functioning improving'
        },
        {
            status: 'STABLE',
            label: 'Stable',
            value: 0,
            displayText: 'Patient is stable on the current treatment plan',
            icon: MinusCircleIcon,
            color: { ring: 'ring-amber-200', iconBg: 'bg-amber-50', iconColor: 'text-amber-700', selectedRing: 'ring-amber-500', selectedBg: 'bg-amber-50' },
            description: 'No significant change in symptoms'
        },
        {
            status: 'DETERIORATING',
            label: 'Deteriorating',
            value: -1,
            displayText: "Patient's condition is deteriorating",
            icon: XCircleIcon,
            color: { ring: 'ring-rose-200', iconBg: 'bg-rose-50', iconColor: 'text-rose-700', selectedRing: 'ring-rose-500', selectedBg: 'bg-rose-50' },
            description: 'Symptoms worsening; functioning declining'
        }
    ]

const PatientProgressSelector: React.FC<PatientProgressSelectorProps> = ({
    selectedValue,
    onSelect,
    disabled = false,
    required = true,
}) => {
    const handleSelect = (opt: typeof OPTIONS[number]) => {
        onSelect({ status: opt.status, label: opt.label, value: opt.value, displayText: opt.displayText })
    }

    return (
        <div className="py-4">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    Patient's Overall Progress {required && <span className="text-rose-600">*</span>}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">How has the patient progressed since the last session?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const selected = selectedValue === opt.status
                    return (
                        <button
                            key={opt.status}
                            type="button"
                            onClick={() => handleSelect(opt)}
                            disabled={disabled}
                            className={[
                                'relative w-full text-left rounded-xl border bg-white dark:bg-neutral-800 px-4 py-4 transition-all',
                                'ring-2', opt.color.ring,
                                selected ? opt.color.selectedRing : '',
                                selected ? 'shadow-md' : 'hover:shadow-sm',
                                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
                            ].join(' ')}
                        >
                            <div className="flex items-center gap-3">
                                <div className={[opt.color.iconBg, 'rounded-full p-2'].join(' ')}>
                                    <Icon className={[opt.color.iconColor, 'h-6 w-6'].join(' ')} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{opt.label}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">{opt.description}</div>
                                </div>
                            </div>
                            {selected && (
                                <div className="absolute top-2 right-3 text-emerald-600">
                                    <CheckCircleIcon className="h-5 w-5" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {required && !selectedValue && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 border-l-4 border-amber-500 px-3 py-2 rounded">Please select the patient's progress status to continue</p>
            )}
        </div>
    )
}

export default PatientProgressSelector


