'use client'

import { useState, useEffect, useRef, memo } from 'react'
import {
    PencilIcon,
    DocumentTextIcon,
    CheckIcon,
    XMarkIcon,
    SparklesIcon,
    ClockIcon,
    EyeIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

interface EditableTranscriptProps {
    finalTranscription: string
    liveTranscription: string
    isRecording: boolean
    onTranscriptionEdit: (newText: string) => void
    onGenerateReport: (transcriptText: string) => void
    sessionId?: string
}

const EditableTranscript = memo(({
    finalTranscription,
    liveTranscription,
    isRecording,
    onTranscriptionEdit,
    onGenerateReport,
    sessionId
}: EditableTranscriptProps) => {
    // ✅ REMOVED: Excessive console.log that caused re-renders to be visible
    // Only log on significant state changes
    
    const [isEditing, setIsEditing] = useState(false)
    const [editedText, setEditedText] = useState('')
    const [manualText, setManualText] = useState('')
    const [showPostRecordingOptions, setShowPostRecordingOptions] = useState(false)
    const [isManualTypingMode, setIsManualTypingMode] = useState(false)
    const [editableFinalText, setEditableFinalText] = useState('')
    const [isInlineEditing, setIsInlineEditing] = useState(false)
    const [baseTextWhenEditingStarted, setBaseTextWhenEditingStarted] = useState('')
    const [isProcessingAfterRecording, setIsProcessingAfterRecording] = useState(false)
    
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const liveTextareaRef = useRef<HTMLTextAreaElement>(null)
    const inlineTextareaRef = useRef<HTMLTextAreaElement>(null)

    const displayFinalText = isInlineEditing ? editableFinalText : finalTranscription
    const combinedText = [displayFinalText, manualText].filter(Boolean).join(' ')

    // ✅ Sync editable text
    useEffect(() => {
        setEditedText(displayFinalText)
    }, [displayFinalText])

    // ✅ Sync with STT final transcription (only when NOT editing)
    useEffect(() => {
        if (!isInlineEditing && finalTranscription && finalTranscription.trim().length > 0) {
            setEditableFinalText(finalTranscription)
        }
    }, [finalTranscription, isInlineEditing])

    // ✅ Show post-recording options (optimized logic)
    useEffect(() => {
        const hasContent = finalTranscription.trim() || manualText.trim()

        if (!isRecording && !isProcessingAfterRecording && hasContent) {
            setShowPostRecordingOptions(true)
        } else if (isRecording || isProcessingAfterRecording) {
            setShowPostRecordingOptions(false)
        }
    }, [isRecording, isProcessingAfterRecording, finalTranscription, manualText])

    // ✅ Handle recording state changes
    useEffect(() => {
        if (!isRecording) {
            setIsManualTypingMode(false)
            setShowPostRecordingOptions(false)
            setIsProcessingAfterRecording(true)

            const processingTimer = setTimeout(() => {
                setIsProcessingAfterRecording(false)
            }, 2000)

            return () => clearTimeout(processingTimer)
        } else {
            setIsProcessingAfterRecording(false)
            setShowPostRecordingOptions(false)
        }
    }, [isRecording])

    // ✅ Auto-save manual text when recording stops
    useEffect(() => {
        if (!isRecording && manualText.trim()) {
            const combinedTranscription = finalTranscription + '\n' + manualText
            onTranscriptionEdit(combinedTranscription)
            setManualText('')
        }
    }, [isRecording])

    const handleStartEdit = () => {
        setIsEditing(true)
        setEditedText(combinedText)
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(
                    textareaRef.current.value.length,
                    textareaRef.current.value.length
                )
            }
        }, 100)
    }

    const handleToggleManualTyping = () => {
        setIsManualTypingMode(!isManualTypingMode)
        if (!isManualTypingMode) {
            setTimeout(() => {
                if (liveTextareaRef.current) {
                    liveTextareaRef.current.focus()
                }
            }, 100)
        }
    }

    const handleSaveEdit = () => {
        try {
            const textToSave = editedText?.trim() ? editedText : combinedText
            onTranscriptionEdit(textToSave)
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving transcript:', error)
        }
    }

    const handleCancelEdit = () => {
        setEditedText(combinedText)
        setIsEditing(false)
    }

    const handleGenerateReport = async () => {
        try {
            const textToProcess = isEditing ? editedText : combinedText
            if (!textToProcess.trim()) {
                console.warn('No transcript content to generate report')
                return
            }

            setShowPostRecordingOptions(false)
            await onGenerateReport(textToProcess)
        } catch (error) {
            console.error('Error generating report:', error)
            setShowPostRecordingOptions(true)
        }
    }

    const handleInlineEdit = () => {
        setBaseTextWhenEditingStarted(finalTranscription)
        setEditableFinalText(finalTranscription)
        setIsInlineEditing(true)
        setTimeout(() => {
            if (inlineTextareaRef.current) {
                inlineTextareaRef.current.focus()
                inlineTextareaRef.current.setSelectionRange(
                    inlineTextareaRef.current.value.length,
                    inlineTextareaRef.current.value.length
                )
            }
        }, 100)
    }

    const handleInlineSave = () => {
        setIsInlineEditing(false)
        const newSttContentDuringEditing = finalTranscription.slice(baseTextWhenEditingStarted.length)
        let finalCombinedText = editableFinalText
        
        if (newSttContentDuringEditing.trim()) {
            finalCombinedText += ' ' + newSttContentDuringEditing.trim()
        }
        if (manualText) {
            finalCombinedText += '\n' + manualText
        }

        onTranscriptionEdit(finalCombinedText)
    }

    const handleInlineCancel = () => {
        setEditableFinalText(finalTranscription)
        setIsInlineEditing(false)
    }

    const handleRecordingStop = () => {
        if (manualText.trim()) {
            const combinedTranscription = finalTranscription + '\n' + manualText
            onTranscriptionEdit(combinedTranscription)
            setManualText('')
        }
    }

    const wordCount = combinedText.split(' ').filter(word => word.trim()).length

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {isEditing ? 'Editing Transcript' : isRecording ? 'Live Transcription + Manual Input' : 'Transcription Complete'}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Mental health optimized • STT + Manual typing
                            {isRecording && ' • Real-time collaboration'}
                            {isEditing && ' • Full edit mode'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Word Count</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {wordCount}
                        </div>
                    </div>
                    {isRecording && (
                        <Button
                            onClick={handleToggleManualTyping}
                            variant={isManualTypingMode ? "primary" : "secondary"}
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <CommandLineIcon className="h-4 w-4" />
                            {isManualTypingMode ? 'Voice Only' : 'Manual Type'}
                        </Button>
                    )}
                    {combinedText && !isRecording && (
                        <Button
                            onClick={handleStartEdit}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={isEditing}
                        >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Transcript Content */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-600 transition-all duration-300">
                {isEditing ? (
                    /* Edit Mode */
                    <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full min-h-[300px] p-4 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
                            placeholder="Edit your transcription here..."
                        />
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                <ClockIcon className="h-4 w-4 inline mr-1" />
                                Last edited: {new Date().toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleCancelEdit}
                                    variant="secondary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <CheckIcon className="h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* View/Live Mode */
                    <div className="p-4 min-h-[200px] max-h-[600px] overflow-y-auto">
                        {isRecording ? (
                            /* Live Recording Mode */
                            <div className="space-y-4">
                                {displayFinalText && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                ✅ Final Transcription (Click to edit)
                                            </span>
                                            {isInlineEditing && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleInlineCancel}
                                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleInlineSave}
                                                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {isInlineEditing ? (
                                            <textarea
                                                ref={inlineTextareaRef}
                                                value={editableFinalText}
                                                onChange={(e) => setEditableFinalText(e.target.value)}
                                                className="w-full min-h-[100px] p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-foreground"
                                                placeholder="Edit final transcription..."
                                            />
                                        ) : (
                                            <div
                                                onClick={handleInlineEdit}
                                                className="text-base text-foreground whitespace-pre-wrap leading-relaxed font-medium cursor-text hover:bg-green-50 dark:hover:bg-green-900/10 p-2 rounded border-2 border-dashed border-green-200 dark:border-green-800 transition-colors"
                                                title="Click to edit this transcription"
                                            >
                                                {displayFinalText}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {liveTranscription && (
                                    <div className="relative">
                                        <div className="text-base text-blue-600 dark:text-blue-400 italic whitespace-pre-wrap leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                                            <span className="flex items-center gap-2">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <span className="opacity-90">🎙️ Live: {liveTranscription}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {isManualTypingMode && (
                                    <div className="border-t border-neutral-200 dark:border-neutral-600 pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CommandLineIcon className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-700 dark:text-green-400">Manual Input</span>
                                        </div>
                                        <textarea
                                            ref={liveTextareaRef}
                                            value={manualText}
                                            onChange={(e) => setManualText(e.target.value)}
                                            className="w-full min-h-[120px] p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-foreground"
                                            placeholder="Type additional notes manually while recording..."
                                        />
                                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            This text will be combined with the STT transcription
                                        </div>
                                    </div>
                                )}

                                {!isManualTypingMode && (
                                    <div className="text-center py-4 border-t border-neutral-200 dark:border-neutral-600">
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                                            🎙️ Recording in progress... Click "Manual Type" to add notes
                                        </p>
                                        {manualText && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={handleRecordingStop}
                                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors"
                                                >
                                                    Save Manual Notes
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : combinedText ? (
                            /* Static View Mode */
                            <div className="space-y-3">
                                <div
                                    className="text-base text-foreground whitespace-pre-wrap leading-relaxed font-medium cursor-text"
                                    onClick={handleStartEdit}
                                    title="Click to edit transcript"
                                >
                                    {combinedText}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 italic pt-2 border-t border-neutral-200 dark:border-neutral-600">
                                    💡 Click anywhere on the transcript above to edit it
                                </div>
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="text-center text-neutral-500 dark:text-neutral-400 py-12">
                                <div className="h-12 w-12 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <DocumentTextIcon className="h-6 w-6" />
                                </div>
                                <p className="text-lg font-medium mb-2">Ready to start recording...</p>
                                <p className="text-sm">
                                    Supports STT + manual typing with Marathi, English, and Hindi
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Processing State */}
            {isProcessingAfterRecording && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <SparklesIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-spin" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                                    🔄 Processing Transcription
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Optimizing your consultation transcript for analysis...
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-32 bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Post-Recording Options */}
            {showPostRecordingOptions && !isEditing && !isProcessingAfterRecording && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                    ✅ Transcription Ready
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Your consultation has been processed. What would you like to do next?
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleStartEdit}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <EyeIcon className="h-4 w-4" />
                                Review Transcripts
                            </Button>
                            <Button
                                onClick={() => {
                                    const event = new CustomEvent('open-session-summary-modal', {
                                        detail: { transcript: combinedText }
                                    })
                                    window.dispatchEvent(event)
                                }}
                                variant="primary"
                                size="sm"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                Generate Report
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}, (prevProps, nextProps) => {
    // ✅ Only re-render if these props actually changed
    return (
        prevProps.finalTranscription === nextProps.finalTranscription &&
        prevProps.liveTranscription === nextProps.liveTranscription &&
        prevProps.isRecording === nextProps.isRecording &&
        prevProps.sessionId === nextProps.sessionId
    )
})

EditableTranscript.displayName = 'EditableTranscript'

export default EditableTranscript
