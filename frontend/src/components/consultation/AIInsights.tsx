'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    SparklesIcon,
    DocumentTextIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

import Button from '@/components/ui/Button'
import apiService from '@/services/api'

interface AIInsightsProps {
    sessionId: string
    transcriptionText: string
    patientId?: string
    isLiveSession?: boolean
    onInsightGenerated?: (insights: any) => void
}

interface ClinicalInsight {
    key_clinical_findings: string[]
    differential_diagnosis: string[]
    treatment_recommendations: string[]
    follow_up_priorities: string[]
    confidence: number
}

interface MedicalReport {
    content: string
    sections: Record<string, string>
    confidence: number
    ai_generated: boolean
    model: string
}

export default function AIInsights({
    sessionId,
    transcriptionText,
    patientId,
    isLiveSession = false,
    onInsightGenerated
}: AIInsightsProps) {
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [report, setReport] = useState<MedicalReport | null>(null)

    const generateMedicalReport = async () => {
        if (!transcriptionText.trim()) {
            toast.error('No transcription available to generate report')
            return
        }

        setIsGeneratingReport(true)
        try {
            const response = await apiService.post('/reports/generate', {
                session_id: sessionId,
                report_type: 'consultation',
                include_insights: true
            })

            if (response.status === 'success') {
                setReport(response.data.report)
                toast.success('Medical report generated successfully')

                if (onInsightGenerated) {
                    onInsightGenerated(response.data)
                }
            } else {
                toast.error('Failed to generate medical report')
            }
        } catch (error) {
            console.error('Error generating medical report:', error)
            toast.error('Failed to generate medical report')
        } finally {
            setIsGeneratingReport(false)
        }
    }

    // Removed insights generation - only keeping report generation

    const renderInsightsList = (items: string[], title: string, icon: React.ComponentType<any>) => {
        const IconComponent = icon

        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <h4 className="text-sm font-medium text-neutral-900">{title}</h4>
                </div>
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )
    }

    const renderReportSection = (title: string, content: string) => (
        <div className="mb-6">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 uppercase tracking-wide">
                {title}
            </h4>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {content}
            </div>
        </div>
    )

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                AI-Powered Medical Reports
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={generateMedicalReport}
                            disabled={isGeneratingReport || !transcriptionText.trim()}
                            className="flex items-center gap-2"
                        >
                            {isGeneratingReport ? (
                                <ClockIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <DocumentTextIcon className="h-4 w-4" />
                            )}
                            {isGeneratingReport ? 'Generating...' : 'Generate Medical Report'}
                        </Button>
                    </div>
                </div>

                {!transcriptionText.trim() && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                Start recording a consultation to enable AI insights
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {report && (
                <div className="p-6">
                    {/* Medical Report Display */}
                    {report && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                                    Generated by {report.model} • Confidence: {Math.round((report.confidence || 0.95) * 100)}%
                                </span>
                            </div>

                            {report.sections ? (
                                // Structured report with sections
                                <div className="space-y-6">
                                    {Object.entries(report.sections).map(([title, content]) => (
                                        <div key={title}>
                                            {renderReportSection(title, content)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Full report content
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                                        {report.content}
                                    </div>
                                </div>
                            )}

                            {report.ai_generated && (
                                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            This report was generated using AI and should be reviewed by a qualified healthcare professional.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!report && transcriptionText.trim() && (
                <div className="p-8 text-center">
                    <SparklesIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        AI-Powered Medical Analysis
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-md mx-auto">
                        Generate comprehensive medical reports from your consultation transcription using advanced AI models optimized for mental health.
                    </p>
                    <div className="flex justify-center">
                        <Button
                            variant="primary"
                            onClick={generateMedicalReport}
                            disabled={isGeneratingReport}
                            className="flex items-center gap-2"
                        >
                            <DocumentTextIcon className="h-4 w-4" />
                            {isGeneratingReport ? 'Generating...' : 'Generate Medical Report'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
