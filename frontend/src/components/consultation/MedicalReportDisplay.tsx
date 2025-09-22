'use client'

import { useState } from 'react'
import {
    DocumentTextIcon,
    SparklesIcon,
    CheckCircleIcon,
    ClockIcon,
    EyeIcon,
    EyeSlashIcon,
    CalendarIcon,
    UserIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface ReportData {
    report: string
    session_id: string
    session_type: string
    model_used: string
    transcription_length: number
    generated_at: string
}

interface MedicalReportDisplayProps {
    reportData: ReportData | null
    isGenerating: boolean
    onGenerateNew?: () => void
}

export default function MedicalReportDisplay({
    reportData,
    isGenerating,
    onGenerateNew
}: MedicalReportDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    if (!reportData && !isGenerating) {
        return null
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return 'Unknown'
        try {
            return new Date(isoString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            return 'Invalid Date'
        }
    }

    const formatReportSections = (reportText: any) => {
        // Ensure we have a string to work with
        const textToFormat = typeof reportText === 'string' ? reportText : JSON.stringify(reportText, null, 2)

        if (!textToFormat || typeof textToFormat !== 'string') {
            return []
        }

        // Split report into sections based on ## headers
        const sections = textToFormat.split(/\n## /).filter(section => section.trim())

        return sections.map((section, index) => {
            const lines = section.trim().split('\n')
            const title = lines[0].replace(/^## /, '').trim()
            const content = lines.slice(1).join('\n').trim()

            return { title, content, index }
        })
    }

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <SparklesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {isGenerating ? 'Generating Medical Report...' : 'AI-Generated Medical Report'}
                            </h3>
                            {reportData && (
                                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <SparklesIcon className="h-4 w-4" />
                                        {reportData.model_used}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-4 w-4" />
                                        {formatDateTime(reportData.generated_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <DocumentTextIcon className="h-4 w-4" />
                                        {reportData.transcription_length} chars analyzed
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isGenerating && reportData && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-2"
                            >
                                {isExpanded ? (
                                    <>
                                        <EyeSlashIcon className="h-4 w-4" />
                                        Collapse
                                    </>
                                ) : (
                                    <>
                                        <EyeIcon className="h-4 w-4" />
                                        Expand
                                    </>
                                )}
                            </Button>
                        )}

                        {!isGenerating && onGenerateNew && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onGenerateNew}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                Regenerate Report
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {isGenerating && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <ClockIcon className="h-12 w-12 text-green-500 animate-spin mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                Analyzing Transcription with Gemini 2.5 Flash
                            </h4>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Generating comprehensive medical report...
                            </p>
                            <div className="mt-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {!isGenerating && reportData && isExpanded && (
                    <div className="space-y-6">
                        {/* Session Info */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Session ID:</span>
                                    <p className="font-mono text-neutral-900 dark:text-neutral-100">{reportData.session_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Session Type:</span>
                                    <p className="capitalize font-medium text-neutral-900 dark:text-neutral-100">
                                        {reportData.session_type?.replace('_', ' ') || 'Follow-up'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">AI Model:</span>
                                    <p className="font-medium text-green-600 dark:text-green-400">{reportData.model_used || 'Gemini 2.5 Flash'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                            {formatReportSections(reportData.report).length > 0 ? (
                                <div className="space-y-6">
                                    {formatReportSections(reportData.report).map((section) => {
                                        // Color scheme for different sections
                                        const getSectionColors = (title: string) => {
                                            const lowerTitle = title.toLowerCase()
                                            if (lowerTitle.includes('current situation') || lowerTitle.includes('chief complaint')) {
                                                return { border: 'border-blue-500', text: 'text-blue-900 dark:text-blue-100', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                                            } else if (lowerTitle.includes('mental status') || lowerTitle.includes('examination')) {
                                                return { border: 'border-purple-500', text: 'text-purple-900 dark:text-purple-100', bg: 'bg-purple-50 dark:bg-purple-900/20' }
                                            } else if (lowerTitle.includes('sleep') || lowerTitle.includes('physical') || lowerTitle.includes('vitals')) {
                                                return { border: 'border-green-500', text: 'text-green-900 dark:text-green-100', bg: 'bg-green-50 dark:bg-green-900/20' }
                                            } else if (lowerTitle.includes('medication') || lowerTitle.includes('treatment')) {
                                                return { border: 'border-orange-500', text: 'text-orange-900 dark:text-orange-100', bg: 'bg-orange-50 dark:bg-orange-900/20' }
                                            } else if (lowerTitle.includes('recommendations') || lowerTitle.includes('plan')) {
                                                return { border: 'border-emerald-500', text: 'text-emerald-900 dark:text-emerald-100', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
                                            }
                                            return { border: 'border-gray-500', text: 'text-gray-900 dark:text-gray-100', bg: 'bg-gray-50 dark:bg-gray-900/20' }
                                        }

                                        const colors = getSectionColors(section.title)

                                        return (
                                            <div key={section.index} className={`border-l-4 ${colors.border} pl-4 py-3 ${colors.bg} rounded-r-lg`}>
                                                <h4 className={`text-lg font-semibold ${colors.text} mb-2 flex items-center gap-2`}>
                                                    <div className={`w-2 h-2 ${colors.border.replace('border-', 'bg-')} rounded-full`}></div>
                                                    {section.title}
                                                </h4>
                                                <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                                                    {section.content}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                    <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono">
                                        {typeof reportData.report === 'string'
                                            ? reportData.report
                                            : JSON.stringify(reportData.report, null, 2)
                                        }
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-1">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                <span>Generated by {reportData.model_used || 'Gemini 2.5 Flash'}</span>
                            </div>
                            <div>
                                <span>Analysis of {reportData.transcription_length || 0} characters</span>
                            </div>
                        </div>
                    </div>
                )}

                {!isGenerating && reportData && !isExpanded && (
                    <div className="text-center py-8">
                        <DocumentTextIcon className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Medical report generated. Click "Expand" to view full report.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
