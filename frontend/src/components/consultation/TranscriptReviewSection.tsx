'use client'

import { useState, useRef } from 'react'
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

interface TranscriptReviewSectionProps {
    initialTranscript: string
    onConfirm: (editedTranscript: string) => void
}

export default function TranscriptReviewSection({
    initialTranscript,
    onConfirm
}: TranscriptReviewSectionProps) {
    const [transcript, setTranscript] = useState(initialTranscript)
    const [isEditing, setIsEditing] = useState(false)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const handleEditToggle = () => {
        setIsEditing(!isEditing)
        if (!isEditing && textAreaRef.current) {
            // Focus the textarea when entering edit mode
            setTimeout(() => {
                textAreaRef.current?.focus()
            }, 100)
        }
    }

    const handleConfirm = () => {
        if (!transcript.trim()) {
            alert('Transcript cannot be empty')
            return
        }
        onConfirm(transcript)
    }

    return (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                        Review Consultation Transcript
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        Review and edit the transcript before generating the report
                    </p>
                </div>
                <button
                    onClick={handleEditToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isEditing
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                    {isEditing ? (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            Done Editing
                        </>
                    ) : (
                        <>
                            <PencilIcon className="w-5 h-5" />
                            Edit Transcript
                        </>
                    )}
                </button>
            </div>

            {/* Transcript Content */}
            <div className="p-6">
                {isEditing ? (
                    <textarea
                        ref={textAreaRef}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full h-96 px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-mono text-sm"
                        placeholder="Type or edit the consultation transcript here..."
                    />
                ) : (
                    <div className="w-full h-96 overflow-y-auto px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg">
                        <pre className="whitespace-pre-wrap text-gray-900 dark:text-slate-100 font-mono text-sm leading-relaxed">
                            {transcript || 'No transcript available'}
                        </pre>
                    </div>
                )}

                {/* Character Count */}
                <div className="mt-3 text-sm text-gray-500 dark:text-slate-400 flex justify-between items-center">
                    <span>
                        {transcript.length} characters · {transcript.split(/\s+/).filter(w => w.length > 0).length} words
                    </span>
                    {isEditing && (
                        <span className="text-blue-600 dark:text-blue-400">
                            ✏️ Editing mode active
                        </span>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3 justify-end">
                <Button
                    onClick={handleConfirm}
                    variant="primary"
                    disabled={!transcript.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                    Confirm & Continue to Medication
                </Button>
            </div>
        </div>
    )
}

