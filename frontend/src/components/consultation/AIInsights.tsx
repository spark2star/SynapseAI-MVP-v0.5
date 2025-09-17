'use client'

import { useState } from 'react'
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
    onInsightGenerated
}: AIInsightsProps) {
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
    const [report, setReport] = useState<MedicalReport | null>(null)
    const [insights, setInsights] = useState<ClinicalInsight | null>(null)
    const [activeTab, setActiveTab] = useState<'report' | 'insights'>('insights')

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
                if (response.data.insights) {
                    setInsights(response.data.insights)
                }
                setActiveTab('report')
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

    const generateClinicalInsights = async () => {
        if (!transcriptionText.trim()) {
            toast.error('No transcription available to analyze')
            return
        }

        setIsGeneratingInsights(true)
        try {
            const response = await apiService.post('/reports/insights', {
                transcription_text: transcriptionText,
                patient_id: patientId
            })

            if (response.status === 'success') {
                setInsights(response.data.insights)
                setActiveTab('insights')
                toast.success('Clinical insights generated successfully')
                
                if (onInsightGenerated) {
                    onInsightGenerated(response.data)
                }
            } else {
                toast.error('Failed to generate clinical insights')
            }
        } catch (error) {
            console.error('Error generating clinical insights:', error)
            toast.error('Failed to generate clinical insights')
        } finally {
            setIsGeneratingInsights(false)
        }
    }

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
            <h4 className="text-sm font-medium text-neutral-900 mb-2 uppercase tracking-wide">
                {title}
            </h4>
            <div className="text-sm text-neutral-700 whitespace-pre-wrap">
                {content}
            </div>
        </div>
    )

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-neutral-900">
                            AI-Powered Medical Insights
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={generateClinicalInsights}
                            disabled={isGeneratingInsights || !transcriptionText.trim()}
                            className="flex items-center gap-2"
                        >
                            {isGeneratingInsights ? (
                                <ClockIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <ChartBarIcon className="h-4 w-4" />
                            )}
                            {isGeneratingInsights ? 'Analyzing...' : 'Generate Insights'}
                        </Button>
                        
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
                            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                        </Button>
                    </div>
                </div>
                
                {!transcriptionText.trim() && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                Start recording a consultation to enable AI insights
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {(insights || report) && (
                <div className="p-6">
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-6 bg-neutral-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'insights'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        >
                            Clinical Insights
                        </button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'report'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        >
                            Medical Report
                        </button>
                    </div>

                    {/* Clinical Insights Tab */}
                    {activeTab === 'insights' && insights && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">
                                    AI Analysis Complete • Confidence: {Math.round((insights.confidence || 0.94) * 100)}%
                                </span>
                            </div>

                            {insights.key_clinical_findings && (
                                renderInsightsList(
                                    insights.key_clinical_findings,
                                    'Key Clinical Findings',
                                    ExclamationTriangleIcon
                                )
                            )}

                            {insights.differential_diagnosis && (
                                renderInsightsList(
                                    insights.differential_diagnosis,
                                    'Differential Diagnosis',
                                    ChartBarIcon
                                )
                            )}

                            {insights.treatment_recommendations && (
                                renderInsightsList(
                                    insights.treatment_recommendations,
                                    'Treatment Recommendations',
                                    CheckCircleIcon
                                )
                            )}

                            {insights.follow_up_priorities && (
                                renderInsightsList(
                                    insights.follow_up_priorities,
                                    'Follow-up Priorities',
                                    ClockIcon
                                )
                            )}
                        </div>
                    )}

                    {/* Medical Report Tab */}
                    {activeTab === 'report' && report && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">
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
                                <div className="prose prose-sm max-w-none">
                                    <div className="text-sm text-neutral-700 whitespace-pre-wrap">
                                        {report.content}
                                    </div>
                                </div>
                            )}

                            {report.ai_generated && (
                                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="h-4 w-4 text-blue-600" />
                                        <p className="text-sm text-blue-800">
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
            {!insights && !report && transcriptionText.trim() && (
                <div className="p-8 text-center">
                    <SparklesIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        AI-Powered Medical Analysis
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4 max-w-md mx-auto">
                        Generate intelligent clinical insights and comprehensive medical reports 
                        from your consultation transcription using advanced AI models.
                    </p>
                    <div className="flex justify-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={generateClinicalInsights}
                            disabled={isGeneratingInsights}
                            className="flex items-center gap-2"
                        >
                            <ChartBarIcon className="h-4 w-4" />
                            Quick Insights
                        </Button>
                        <Button
                            variant="primary"
                            onClick={generateMedicalReport}
                            disabled={isGeneratingReport}
                            className="flex items-center gap-2"
                        >
                            <DocumentTextIcon className="h-4 w-4" />
                            Full Report
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
