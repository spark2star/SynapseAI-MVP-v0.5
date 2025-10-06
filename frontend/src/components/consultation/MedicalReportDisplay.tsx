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
import  Button  from '@/components/ui/Button'
import { jsPDF } from 'jspdf'

interface ReportData {
    report: string
    session_id: string
    session_type: string
    model_used?: string
    transcription_length: number
    generated_at: string
    patient_name?: string
    doctor_name?: string
    highlight_tags?: string[]
    complaint_capture_score?: { score: number, rationale: string } | null
    concise_summary?: string
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
    const [tags, setTags] = useState<string[]>([])

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

    /**
     * Convert markdown to HTML (basic support for bold, lists, line breaks)
     */
    const renderMarkdownToHTML = (markdown: string): string => {
        let html = markdown

        // Convert **bold** to <strong>bold</strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

        // Convert bullet points (* item) to proper list items
        html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>')

        // Wrap consecutive <li> tags in <ul>
        html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-5 space-y-1">${match}</ul>`)

        // Convert newlines to <br> (but not within <ul> or already processed)
        html = html.replace(/\n(?!<\/?(ul|li))/g, '<br>')

        return html
    }

    const formatReportSections = (reportText: any) => {
        const textToFormat = typeof reportText === 'string' ? reportText : (reportText ? JSON.stringify(reportText, null, 2) : '')
        if (!textToFormat) return []

        // Split BEFORE lines that start with "## ", preserving the header in each chunk
        const chunks = textToFormat.split(/\n(?=##\s+)/).filter(Boolean)

        return chunks.map((chunk, index) => {
            const lines = chunk.trim().split('\n')
            const headerLine = lines[0] || ''
            const title = headerLine.replace(/^##\s+/, '').trim() || 'Section'
            const content = lines.slice(1).join('\n').trim()
            return {
                title,
                content,
                contentHTML: renderMarkdownToHTML(content),
                index
            }
        })
    }

    const handleDownloadPDF = async () => {
        if (!reportData) return

        // PDF setup: A4, generous margins, black text only
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = 210
        const pageHeight = 297
        const margin = 18
        const contentWidth = pageWidth - margin * 2
        let cursorY = margin

        const addPageIfNeeded = (nextBlockHeight: number) => {
            if (cursorY + nextBlockHeight > pageHeight - margin) {
                pdf.addPage()
                cursorY = margin
            }
        }

        const writeHeading = (text: string) => {
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(16)
            const lines = pdf.splitTextToSize(text, contentWidth)
            addPageIfNeeded(lines.length * 8 + 2)
            pdf.text(lines, margin, cursorY)
            cursorY += lines.length * 8 + 4
        }

        const writeSubHeading = (label: string, value?: string) => {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(10)
            const text = value ? `${label}: ${value}` : label
            const lines = pdf.splitTextToSize(text, contentWidth)
            addPageIfNeeded(lines.length * 6)
            pdf.text(lines, margin, cursorY)
            cursorY += lines.length * 6
        }

        const writeSectionTitle = (text: string) => {
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(13)
            addPageIfNeeded(10)
            pdf.text(text.toUpperCase(), margin, cursorY)
            cursorY += 6
            pdf.setDrawColor(0)
            pdf.setLineWidth(0.3)
            pdf.line(margin, cursorY, pageWidth - margin, cursorY)
            cursorY += 4
        }

        const writeParagraph = (text: string, indent = 0) => {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(11)
            const lines = pdf.splitTextToSize(text, contentWidth - indent)
            lines.forEach((line: string) => {
                addPageIfNeeded(7)
                pdf.text(line, margin + indent, cursorY)
                cursorY += 6
            })
            cursorY += 2
        }

        const writeBullet = (text: string) => {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(11)
            const bullet = '• '
            const wrapped = pdf.splitTextToSize(text, contentWidth - 6 - 4)
            addPageIfNeeded((wrapped.length + 1) * 6)
            pdf.text(bullet, margin, cursorY)
            const first = wrapped.shift() || ''
            pdf.text(first, margin + 6, cursorY)
            cursorY += 6
            wrapped.forEach((line: string) => {
                pdf.text(line, margin + 6, cursorY)
                cursorY += 6
            })
        }

        // Header
        writeHeading('Clinical Summary Report')
        writeSubHeading('Patient', reportData.patient_name || 'Patient')
        writeSubHeading('Clinician', reportData.doctor_name || 'Doctor')
        writeSubHeading('Session ID', reportData.session_id)
        writeSubHeading('Generated', new Date(reportData.generated_at).toLocaleString())
        cursorY += 2

        // Key Terms (top of PDF)
        if (Array.isArray(reportData.highlight_tags) && reportData.highlight_tags.length > 0) {
            writeSectionTitle('Key Terms')
            const line = reportData.highlight_tags.join(', ')
            writeParagraph(line)
        }

        // 30-second concise summary (from AI if available)
        const abstract = (reportData.concise_summary || '').trim()
        if (abstract) {
            writeSectionTitle('Concise Summary')
            writeParagraph(abstract)
        }

        // Body from markdown sections
        // Convert markdown **bold** markers to plain emphasis for PDF
        const normalizedReport = (reportData.report || '').replace(/\*\*(.+?)\*\*/g, '$1')
        const sections = formatReportSections(normalizedReport)
        sections.forEach((section) => {
            writeSectionTitle(section.title)
            const raw = section.content || ''
            const lines = raw.split('\n').filter(l => l.trim().length > 0)
            lines.forEach((l) => {
                const trimmed = l.trim()
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    writeBullet(trimmed.replace(/^[-*]\s+/, ''))
                } else {
                    writeParagraph(trimmed)
                }
            })
            cursorY += 2
        })

        // Footer disclaimer
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(9)
        const disclaimer = 'This report was generated with AI assistance and should be reviewed by the clinician.'
        const dLines = pdf.splitTextToSize(disclaimer, contentWidth)
        addPageIfNeeded(dLines.length * 5)
        pdf.text(dLines, margin, pageHeight - margin)

        const safeName = (reportData.patient_name || 'Patient').replace(/[^a-z0-9_-]+/gi, '_')
        const sessionNo = reportData.session_id || 'session'
        pdf.save(`${safeName}_${sessionNo}.pdf`)
    }

    return (
        <div id="medical-report-card" className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-green-50 dark:bg-green-900/20">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <SparklesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                {isGenerating ? 'Generating Medical Report...' : 'AI-Generated Medical Report'}
                            </h3>
                            {reportData && (
                                <div className="text-sm text-green-700 dark:text-green-300 flex flex-wrap items-center gap-8 mt-1">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">Session ID:</span>
                                        <span className="font-mono">{reportData.session_id || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">Session Type:</span>
                                        <span className="capitalize">{reportData.session_type?.replace('_', ' ') || 'Follow-up'}</span>
                                    </div>
                                    {reportData.complaint_capture_score && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">Capture Score:</span>
                                            <span>{reportData.complaint_capture_score.score}/100</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
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
                        {!isGenerating && reportData && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleDownloadPDF}
                            >
                                Download PDF
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
                                Generating Your Medical Report
                            </h4>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Please wait while we analyze the consultation...
                            </p>
                            <div className="mt-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {!isGenerating && reportData && isExpanded && (
                    <div className="space-y-6">
                        {reportData.concise_summary && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-5 border border-amber-200 dark:border-amber-800">
                                <div className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">Concise Summary</div>
                                <div className="text-[16px] leading-relaxed text-amber-900/95 dark:text-amber-100/95">{reportData.concise_summary}</div>
                            </div>
                        )}

                        {Array.isArray(reportData.highlight_tags) && reportData.highlight_tags.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                <div className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Key Terms</div>
                                <div className="flex flex-wrap gap-2">
                                    {reportData.highlight_tags.map((t, i) => (
                                        <span key={`tag-${i}`} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Capture score body card removed; score shown in header only */}
                        {/* Session Info removed - moved into header */}

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
                                                <div
                                                    className="text-neutral-700 dark:text-neutral-300 leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: section.contentHTML }}
                                                />
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
                        <div className="flex items-center justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
                            <span>Analysis of {reportData.transcription_length || 0} characters</span>
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
