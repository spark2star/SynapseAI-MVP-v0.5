'use client'

import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

interface EmptyConsultationStateProps {
    patientName?: string
    onStartConsultation?: () => void
}

export default function EmptyConsultationState({
    patientName,
    onStartConsultation
}: EmptyConsultationStateProps) {
    return (
        <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/20 mb-4">
                <ClipboardDocumentListIcon className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                No Previous Consultations
            </h3>

            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                {patientName ? (
                    <>Start a consultation with <span className="font-medium">{patientName}</span> to begin their medical history</>
                ) : (
                    'Start a consultation to begin this patient\'s medical history'
                )}
            </p>

            {onStartConsultation && (
                <button
                    onClick={onStartConsultation}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                    Start First Consultation
                </button>
            )}
        </div>
    )
}

