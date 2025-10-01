'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'
import apiService from '@/services/api'
import type { ReportData } from '@/types/report'

interface ReportViewProps {
    reportId: number
    onBack: () => void
}

const ReportView: React.FC<ReportViewProps> = ({ reportId, onBack }) => {
    const [report, setReport] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchReport()
    }, [reportId])

    const fetchReport = async () => {
        setIsLoading(true)
        setError(null)

        try {
            console.log('📄 Fetching report:', reportId)
            // Poll status if still generating
            try {
                for (let i = 0; i < 30; i++) {
                    const st = await apiService.get(`/reports/${reportId}/status`)
                    const status = (st as any)?.data?.status
                    if (status && status !== 'generating') break
                    await new Promise(r => setTimeout(r, 1000))
                }
            } catch { }

            const data = await apiService.get(`/reports/${reportId}`)
            console.log('✅ Report fetched:', data)

            setReport((data as any).data)
        } catch (err) {
            console.error('Error fetching report:', err)
            setError(err instanceof Error ? err.message : 'Failed to load report')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <p className="text-red-600 dark:text-red-400">{error || 'Report not found'}</p>
                    </div>
                    <button
                        onClick={onBack}
                        className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Session
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            {/* Action Bar - Hidden when printing */}
            <div className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 p-4 print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Session
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PrinterIcon className="h-4 w-4" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="max-w-4xl mx-auto p-8">
                <div id="report-content" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-8 print:shadow-none">
                    {/* Header */}
                    <div className="border-b pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Clinical Summary Report
                        </h1>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>Session ID: {report.session_id}</p>
                            <p>Generated: {new Date(report.created_at).toLocaleString()}</p>
                            <p>Model: {report.model_used}</p>
                        </div>
                    </div>

                    {/* Report Content - Markdown Rendered */}
                    <div className="prose dark:prose-invert max-w-none">
                        <div
                            className="whitespace-pre-wrap text-gray-800 dark:text-gray-200"
                            dangerouslySetInnerHTML={{
                                __html: report.report_content
                                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\n/g, '<br>')
                            }}
                        />
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t text-center text-xs text-gray-500 dark:text-gray-400">
                        <p>This report was generated with AI assistance and should be reviewed by the clinician.</p>
                        <p className="mt-1">Report ID: {report.id}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReportView


