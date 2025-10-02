'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Button } from '@/components/ui/Button'

interface EditableTranscriptProps {
    finalTranscription: string
    liveTranscription: string
    isRecording: boolean
    onTranscriptionEdit: (newText: string) => void
    onGenerateReport: (transcriptText: string) => void
    sessionId?: string
}

export default function EditableTranscript({
    finalTranscription,
    liveTranscription,
    isRecording,
    onTranscriptionEdit,
    onGenerateReport,
    sessionId
}: EditableTranscriptProps) {
    console.log('🧩 EditableTranscript MOUNTED/UPDATED with props:', {
        isRecording,
        finalTranscriptionLength: finalTranscription.length,
        liveTranscriptionLength: liveTranscription.length,
        sessionId,
        timestamp: new Date().toISOString()
    })
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

    // Always use the latest finalTranscription as base, let editableFinalText be for active editing only
    const displayFinalText = isInlineEditing ? editableFinalText : finalTranscription

    // Combine final text, manual text, and live transcription
    const combinedText = [displayFinalText, manualText, liveTranscription].filter(Boolean).join('\n')

    useEffect(() => {
        setEditedText(displayFinalText)
    }, [displayFinalText])

    // Sync editable text with STT final transcription when not actively editing
    useEffect(() => {
        if (!isInlineEditing) {
            setEditableFinalText(finalTranscription)
            console.log('🔄 Syncing editable text with STT final:', finalTranscription)
        }
    }, [finalTranscription, isInlineEditing])

    // Debug logging to track state changes
    useEffect(() => {
        if (isInlineEditing) {
            const newSttSinceEdit = finalTranscription.slice(baseTextWhenEditingStarted.length)
            console.log('📊 During Edit State:', {
                baseWhenStarted: baseTextWhenEditingStarted.slice(-30) + '...',
                currentFinalTranscription: finalTranscription.slice(-50) + '...',
                newSttDuringEdit: newSttSinceEdit || 'none',
                editableFinalText: editableFinalText.slice(-30) + '...'
            })
        }
    }, [finalTranscription, editableFinalText, isInlineEditing, baseTextWhenEditingStarted])

    // Manual text is stored locally and only combined when needed
    // No automatic real-time updates to prevent infinite loops

    // Show post-recording options after processing is complete
    useEffect(() => {
        const hasContent = finalTranscription.trim() || manualText.trim()

        console.log('📋 Post-recording options check:', {
            isRecording,
            isProcessingAfterRecording,
            hasContent,
            finalTranscription: finalTranscription.slice(-30),
            manualText: manualText.slice(-20),
            showPostRecordingOptions
        })

        if (!isRecording && !isProcessingAfterRecording && hasContent) {
            setShowPostRecordingOptions(true)
            console.log('✅ POST-RECORDING OPTIONS SHOULD BE VISIBLE NOW!')
        } else if (isRecording || isProcessingAfterRecording) {
            setShowPostRecordingOptions(false)
            console.log('📋 Hiding post-recording options - Recording:', isRecording, 'Processing:', isProcessingAfterRecording)
        } else if (!hasContent) {
            console.log('⚠️ No content available for post-recording options')
        }
    }, [isRecording, isProcessingAfterRecording, finalTranscription, manualText])

    // Fallback to ensure options show (safety net)
    useEffect(() => {
        if (!isRecording && !isProcessingAfterRecording) {
            const timer = setTimeout(() => {
                const hasContent = finalTranscription.trim() || manualText.trim()
                if (hasContent && !showPostRecordingOptions) {
                    setShowPostRecordingOptions(true)
                    console.log('⏰ Fallback: Showing post-recording options')
                }
            }, 500) // Quick fallback check

            return () => clearTimeout(timer)
        }
    }, [isRecording, isProcessingAfterRecording, finalTranscription, manualText, showPostRecordingOptions])

    // Handle recording state changes with loading indicator
    useEffect(() => {
        console.log('🎛️ Recording state changed:', {
            isRecording,
            isProcessingAfterRecording,
            finalTranscription: finalTranscription.slice(-30),
            manualText: manualText.slice(-20)
        })

        if (!isRecording) {
            setIsManualTypingMode(false)
            setShowPostRecordingOptions(false) // Hide options first
            setIsProcessingAfterRecording(true) // Show loading state
            console.log('🔄 RECORDING STOPPED - SHOWING LOADING UI NOW!')
            console.log('📊 Current state for loading:', {
                hasTranscription: !!finalTranscription.trim(),
                hasManualText: !!manualText.trim(),
                combinedLength: (finalTranscription + manualText).length
            })

            // Processing timeout (simulates backend processing time)
            const processingTimer = setTimeout(() => {
                setIsProcessingAfterRecording(false)
                console.log('✅ LOADING COMPLETE - BUTTONS SHOULD APPEAR NOW!')
                console.log('📊 Final state for buttons:', {
                    isRecording: false,
                    isProcessingAfterRecording: false,
                    hasContent: !!(finalTranscription.trim() || manualText.trim())
                })
            }, 2000) // 2 second processing simulation

            return () => clearTimeout(processingTimer)
        } else {
            setIsProcessingAfterRecording(false)
            setShowPostRecordingOptions(false)
            console.log('🎙️ Recording started, hiding all post-recording UI')
        }
    }, [isRecording])

    // Save manual text when user explicitly stops recording (separate effect)
    const handleRecordingStop = () => {
        console.log('💾 handleRecordingStop called, manual text:', manualText.slice(-50))
        if (manualText.trim()) {
            const combinedTranscription = finalTranscription + '\n' + manualText
            onTranscriptionEdit(combinedTranscription)
            setManualText('') // Clear manual text after saving
            console.log('✅ Manual text saved and cleared')
        }
    }

    // Auto-save manual text when recording stops  
    useEffect(() => {
        if (!isRecording && manualText.trim()) {
            console.log('🔄 Auto-saving manual text on recording stop:', manualText.slice(-50))
            const combinedTranscription = finalTranscription + '\n' + manualText
            onTranscriptionEdit(combinedTranscription)
            setManualText('') // Clear manual text after saving
            console.log('✅ Manual text auto-saved and state updated')
        }
    }, [isRecording])

    const handleStartEdit = () => {
        setIsEditing(true)
        setEditedText(combinedText)
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
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
            // Persist edits back to parent (final transcription)
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

            console.log('🚀 Starting report generation with transcript:', textToProcess.slice(0, 100) + '...')

            // Hide post-recording options and show report generation in progress
            setShowPostRecordingOptions(false)

            // Call the parent's report generation handler
            await onGenerateReport(textToProcess)

        } catch (error) {
            console.error('Error generating report:', error)
            // Re-show options if there was an error
            setShowPostRecordingOptions(true)
        }
    }

    // Handle real-time inline editing during recording
    const handleInlineEdit = () => {
        // Remember what the text was when editing started
        setBaseTextWhenEditingStarted(finalTranscription)
        setEditableFinalText(finalTranscription)
        setIsInlineEditing(true)
        console.log('✏️ Starting inline edit with base text:', finalTranscription)
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

        // Check if new STT content came in during editing
        const newSttContentDuringEditing = finalTranscription.slice(baseTextWhenEditingStarted.length)

        // Combine user's edited text + any new STT that came during editing + manual text
        let finalCombinedText = editableFinalText
        if (newSttContentDuringEditing.trim()) {
            finalCombinedText += ' ' + newSttContentDuringEditing.trim()
            console.log('🎙️ Found new STT during editing:', newSttContentDuringEditing)
        }
        if (manualText) {
            finalCombinedText += '\n' + manualText
        }

        onTranscriptionEdit(finalCombinedText)
        console.log('💾 User edit saved with preserved STT:', finalCombinedText)
        console.log('🔄 Base was:', baseTextWhenEditingStarted)
        console.log('🎙️ New STT during edit:', newSttContentDuringEditing)
    }

    const handleInlineCancel = () => {
        // Cancel editing and revert to original transcription
        setEditableFinalText(finalTranscription)
        setIsInlineEditing(false)
        console.log('❌ Edit cancelled, reverted to:', finalTranscription)
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
                            className="w-full min-h-[300px] p-4 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            /* Live Recording Mode with Real-time Editing */
                            <div className="space-y-4">
                                {/* Real-time Editable Final Transcription */}
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
                                                className="w-full min-h-[100px] p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Edit final transcription..."
                                            />
                                        ) : (
                                            <div
                                                onClick={handleInlineEdit}
                                                className="text-base text-black dark:text-white whitespace-pre-wrap leading-relaxed font-medium cursor-text hover:bg-green-50 dark:hover:bg-green-900/10 p-2 rounded border-2 border-dashed border-green-200 dark:border-green-800 transition-colors"
                                                title="Click to edit this transcription"
                                            >
                                                {displayFinalText}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Live STT Stream */}
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

                                {/* Manual Typing Area */}
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
                                            className="w-full min-h-[120px] p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                    className="text-base text-black dark:text-white whitespace-pre-wrap leading-relaxed font-medium cursor-text"
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
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    This should be visible for 2 seconds
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
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    These buttons should be visible now!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => {
                                    console.log('📝 Review button clicked, combinedText:', combinedText)
                                    handleStartEdit()
                                }}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <EyeIcon className="h-4 w-4" />
                                Review Transcripts
                            </Button>
                            <Button
                                onClick={() => {
                                    console.log('🚀 Generate report button clicked, combinedText:', combinedText)
                                    // When clinician clicks generate, open the medication/progress modal
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
}
