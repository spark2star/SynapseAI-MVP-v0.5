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
import Button from '@/components/ui/Button'
import { jsPDF } from 'jspdf'

interface ReportData {
    report?: string  // Legacy
    generated_report?: string  // New format
    session_id?: string
    session_type?: string
    model_used?: string
    transcription_length?: number
    generated_at?: string
    patient_name?: string
    doctor_name?: string
    highlight_tags?: string[]
    complaint_capture_score?: { score: number, rationale: string } | null
    concise_summary?: string
    report_id?: string
    stt_confidence_score?: number
    llm_confidence_score?: number
    keywords?: string[]
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

    // Support both 'report' (legacy) and 'generated_report' (new format)
    let reportContent = reportData?.generated_report || reportData?.report || ''

    // If reportContent is an object, try to extract the report string
    if (typeof reportContent === 'object' && reportContent !== null) {
        console.log('📊 Report is object:', reportContent)
        reportContent = (reportContent as any).report || JSON.stringify(reportContent)
    }

    // If reportContent looks like a JSON string, try to parse it
    if (typeof reportContent === 'string' && (reportContent.trim().startsWith('{') || reportContent.trim().startsWith('['))) {
        try {
            const parsed = JSON.parse(reportContent)
            // Try multiple possible keys
            reportContent = parsed.report || parsed.generated_report || parsed.content || reportContent
            console.log('✅ Extracted report from JSON string')
        } catch (e) {
            // Not valid JSON, use as is
            console.log('⚠️ String looks like JSON but failed to parse, using as-is')
        }
    }

    // Ensure it's a string
    if (typeof reportContent !== 'string') {
        console.error('❌ Report content is not a string:', typeof reportContent)
        reportContent = String(reportContent)
    }

    console.log('📄 Final report content type:', typeof reportContent)
    console.log('📄 Final report preview:', reportContent.substring(0, 200))

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
     * Convert markdown to HTML (enhanced support for bold, lists, line breaks)
     */
    const renderMarkdownToHTML = (markdown: string): string => {
        let html = markdown

        // Convert **bold** to <strong class="font-semibold">bold</strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-neutral-900 dark:text-neutral-100">$1</strong>')

        // Convert bullet points (- item or * item) to proper list items with better styling
        html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="mb-2">$1</li>')

        // Wrap consecutive <li> tags in <ul> with better styling
        html = html.replace(/(<li class="mb-2">.*<\/li>\n?)+/g, (match) =>
            `<ul class="list-disc pl-6 space-y-2 my-3 marker:text-blue-500 dark:marker:text-blue-400">${match}</ul>`)

        // Convert numbered lists (1. item, 2. item) to <ol>
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="mb-2">$1</li>')
        html = html.replace(/(<li class="mb-2">.*<\/li>\n?)+/g, (match) => {
            if (match.includes('<ul')) return match; // Already wrapped
            return `<ol class="list-decimal pl-6 space-y-2 my-3 marker:text-blue-500 dark:marker:text-blue-400">${match}</ol>`
        })

        // Convert newlines to <br> (but not within lists or already processed)
        html = html.replace(/\n(?!<\/?(ul|li|ol))/g, '<br>')

        return html
    }

    const formatReportSections = (reportText: any) => {
        const textToFormat = typeof reportText === 'string' ? reportText : (reportText ? JSON.stringify(reportText, null, 2) : '')
        if (!textToFormat) return []

        // Handle escaped newlines from JSON strings
        let cleanedText = textToFormat.replace(/\\n/g, '\n').replace(/\\"/g, '"')

        // Remove leading/trailing quotes if present
        if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
            cleanedText = cleanedText.slice(1, -1)
        }

        // Split BEFORE lines that start with "## ", preserving the header in each chunk
        const chunks = cleanedText.split(/\n(?=##\s+)/).filter(Boolean)

        console.log('🔍 Found', chunks.length, 'section chunks')

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
        writeSubHeading('Session ID', reportData.session_id || 'N/A')
        writeSubHeading('Generated', reportData.generated_at ? new Date(reportData.generated_at).toLocaleString() : 'N/A')
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
        const normalizedReport = reportContent.replace(/\*\*(.+?)\*\*/g, '$1')
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
        <div id="medical-report-card" className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-green-300 dark:border-green-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
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
            <div className="p-8 bg-gradient-to-b from-white to-neutral-50 dark:from-slate-800 dark:to-slate-900">
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
                    <div className="space-y-8">
                        {/* REPORT ID - If available */}
                        {reportData.report_id && (
                            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg px-4 py-3 border border-gray-300 dark:border-slate-600">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Report ID</span>
                                    <code className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-900 px-3 py-1 rounded border border-gray-200 dark:border-slate-700">
                                        {reportData.report_id}
                                    </code>
                                </div>
                            </div>
                        )}

                        {/* KEY TERMS - TOP OF REPORT FOR QUICK UNDERSTANDING */}
                        {(Array.isArray(reportData.keywords) && reportData.keywords.length > 0 ||
                            Array.isArray(reportData.highlight_tags) && reportData.highlight_tags.length > 0) && (
                                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-blue-900/40 rounded-2xl p-6 border-2 border-blue-400 dark:border-blue-600 shadow-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-md">
                                            <SparklesIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Key Terms & Coverage</h3>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">Main topics covered in this consultation</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {(reportData.keywords || reportData.highlight_tags || []).map((term, i) => (
                                            <span
                                                key={`term-${i}`}
                                                className="px-5 py-2.5 text-sm font-bold rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:from-blue-500 dark:to-indigo-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-default"
                                            >
                                                {term}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        {/* CONFIDENCE SCORES */}
                        {(reportData.stt_confidence_score !== undefined || reportData.llm_confidence_score !== undefined) && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <span className="font-semibold text-green-900 dark:text-green-100">Quality Metrics</span>
                                    </div>
                                    <div className="flex gap-4">
                                        {reportData.stt_confidence_score !== undefined && (
                                            <div className="text-center">
                                                <div className="text-xs text-green-700 dark:text-green-300 mb-1">STT Accuracy</div>
                                                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                                    {(reportData.stt_confidence_score * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        )}
                                        {reportData.llm_confidence_score !== undefined && (
                                            <div className="text-center">
                                                <div className="text-xs text-green-700 dark:text-green-300 mb-1">AI Confidence</div>
                                                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                                    {(reportData.llm_confidence_score * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {reportData.concise_summary && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-5 border border-amber-200 dark:border-amber-800">
                                <div className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">Concise Summary</div>
                                <div className="text-[16px] leading-relaxed text-amber-900/95 dark:text-amber-100/95">{reportData.concise_summary}</div>
                            </div>
                        )}

                        {/* Report Content */}
                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                            {(() => {
                                const sections = formatReportSections(reportContent);
                                console.log('📋 Parsed sections:', sections.length);
                                return sections.length > 0 ? (
                                    <div className="space-y-6">
                                        {sections.map((section) => {
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
                                                <div key={section.index} className={`border-l-4 ${colors.border} ${colors.bg} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                                                    <div className={`px-5 py-3 border-b ${colors.border.replace('border-', 'border-b-')} bg-gradient-to-r ${colors.bg}`}>
                                                        <h4 className={`text-xl font-bold ${colors.text} flex items-center gap-2`}>
                                                            <div className={`w-3 h-3 ${colors.border.replace('border-', 'bg-')} rounded-full animate-pulse`}></div>
                                                            {section.title}
                                                        </h4>
                                                    </div>
                                                    <div className="px-5 py-4 bg-white dark:bg-slate-800">
                                                        <div
                                                            className="text-base text-neutral-800 dark:text-neutral-200 leading-relaxed prose prose-neutral dark:prose-invert max-w-none"
                                                            style={{ fontSize: '15px', lineHeight: '1.8' }}
                                                            dangerouslySetInnerHTML={{ __html: section.contentHTML }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                        <p className="text-red-600 dark:text-red-400 mb-2">No sections found. Raw report:</p>
                                        <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono">
                                            {typeof reportContent === 'string'
                                                ? reportContent
                                                : JSON.stringify(reportContent, null, 2)
                                            }
                                        </pre>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-6 mt-6 border-t-2 border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <DocumentTextIcon className="h-4 w-4" />
                                <span>Analyzed {reportData.transcription_length || (reportContent.length)} characters</span>
                            </div>
                            {reportData.generated_at && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{formatDateTime(reportData.generated_at)}</span>
                                </div>
                            )}
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
