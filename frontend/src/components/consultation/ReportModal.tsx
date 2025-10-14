'use client'

import { useState } from 'react'
import { XMarkIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline'
import apiClient from '@/services/api'

interface ReportModalProps {
    isOpen: boolean
    report: string
    sttConfidence: number
    llmConfidence: number
    keywords: string[]
    reportId: string | null
    onClose: () => void
}

export default function ReportModal({
    isOpen,
    report,
    sttConfidence,
    llmConfidence,
    keywords,
    reportId,
    onClose
}: ReportModalProps) {
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const submitFeedback = async (feedback: 'thumbs_up' | 'thumbs_down') => {
        if (!reportId) {
            console.warn('No report ID available for feedback')
            return
        }

        try {
            setIsSubmitting(true)

            await apiClient.post('/reports/feedback', {
                report_id: reportId,
                feedback: feedback
            })

            setFeedbackSubmitted(true)

            // Auto-close after 1 second
            setTimeout(() => {
                onClose()
            }, 1000)
        } catch (error) {
            console.error('Failed to submit feedback:', error)
            alert('Failed to submit feedback. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-green-50 to-white dark:from-slate-800 dark:to-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                            Consultation Report Generated
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                            Powered by Gemini 2.5 Flash
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        disabled={isSubmitting}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Quality Metrics Section */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* STT Confidence */}
                        <div className={`p-4 rounded-lg border-2 ${sttConfidence > 0.8
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                        Transcript Quality
                                    </span>
                                    <div className={`text-3xl font-bold mt-1 ${sttConfidence > 0.8
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                        {(sttConfidence * 100).toFixed(0)}%
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-slate-400">
                                        Speech Recognition Accuracy
                                    </span>
                                </div>
                                <div className={`text-4xl ${sttConfidence > 0.8 ? 'opacity-100' : 'opacity-50'
                                    }`}>
                                    {sttConfidence > 0.8 ? '✅' : '⚠️'}
                                </div>
                            </div>
                        </div>

                        {/* LLM Confidence */}
                        <div className={`p-4 rounded-lg border-2 ${llmConfidence > 0.8
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                        Report Confidence
                                    </span>
                                    <div className={`text-3xl font-bold mt-1 ${llmConfidence > 0.8
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                        {(llmConfidence * 100).toFixed(0)}%
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-slate-400">
                                        Gemini Assessment Score
                                    </span>
                                </div>
                                <div className={`text-4xl ${llmConfidence > 0.8 ? 'opacity-100' : 'opacity-50'
                                    }`}>
                                    {llmConfidence > 0.8 ? '✅' : '⚠️'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Keywords Section */}
                    {keywords && keywords.length > 0 && (
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                Key Summary:
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {keywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-gray-900 dark:text-slate-100">
                                {report}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    {!feedbackSubmitted ? (
                        <div className="flex items-center justify-between">
                            <p className="text-gray-700 dark:text-slate-300 font-medium">
                                Was this report helpful?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => submitFeedback('thumbs_up')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                                >
                                    <HandThumbUpIcon className="w-5 h-5" />
                                    Yes, helpful
                                </button>
                                <button
                                    onClick={() => submitFeedback('thumbs_down')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                                >
                                    <HandThumbDownIcon className="w-5 h-5" />
                                    Needs improvement
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium">
                                <span className="text-2xl">✓</span>
                                Thank you for your feedback!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

