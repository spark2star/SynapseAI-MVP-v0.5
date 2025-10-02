'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeftIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    MicrophoneIcon,
    DocumentTextIcon,
    HeartIcon,
    PlusIcon
} from '@heroicons/react/24/outline'
import {
    PlayIcon,
    StopIcon,
    PauseIcon
} from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import VertexAIAudioRecorder from '@/components/consultation/VertexAIAudioRecorder'
import AudioDeviceSelector from '@/components/consultation/AudioDeviceSelector'
import AIInsights from '@/components/consultation/AIInsights'
import EditableTranscript from '@/components/consultation/EditableTranscript'
import SessionSummaryModal from '@/components/session/SessionSummaryModal'
import ReportView from '@/components/report/ReportView'
import MedicalReportDisplay from '@/components/consultation/MedicalReportDisplay'
// SymptomAssessment intentionally not imported here; feature lives in new patient registration only
import { useAuthStore } from '@/store/authStore'
import apiService from '@/services/api'
import type { MedicationItem } from '@/types/report'

interface Patient {
    id: string
    patient_id: string
    full_name: string
    age: number
    gender: string
    phone_primary: string
    email?: string
    address?: string
    emergency_contact?: string
    blood_group?: string
    allergies?: string
    medical_history?: string
    created_at: string
    last_visit?: string
}

interface ConsultationSession {
    id: string
    session_id: string
    session_type: string
    status: string
    started_at: string
    ended_at?: string
    duration_minutes: number
    chief_complaint?: string
    has_transcription: boolean
    created_at: string
}

export default function PatientDetailPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const patientId = params?.id as string
    const isFollowUpMode = searchParams?.get('followup') === 'true'
    const isFirstVisitMode = searchParams?.get('first_visit') === 'true'
    const { user } = useAuthStore()

    const [patient, setPatient] = useState<Patient | null>(null)
    const [sessions, setSessions] = useState<ConsultationSession[]>([])
    const [loading, setLoading] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [currentSession, setCurrentSession] = useState<string | null>(null)
    const [chiefComplaint, setChiefComplaint] = useState('')
    const [showNewConsultation, setShowNewConsultation] = useState(false)
    const [isFollowUpSession, setIsFollowUpSession] = useState(false)
    const [liveTranscription, setLiveTranscription] = useState('')
    const [finalTranscription, setFinalTranscription] = useState('')
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [generatedReport, setGeneratedReport] = useState<any>(null)
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
    // Removed selectedLanguage - Vertex AI auto-detects language
    const audioRecorderRef = useRef<{ stopRecording: () => void }>(null)
    const isStoppingRef = useRef(false) // Prevent multiple simultaneous stop calls

    // Phase 1 MVP: Post-session workflow state
    const [showSessionSummaryModal, setShowSessionSummaryModal] = useState(false)
    const [currentReportId, setCurrentReportId] = useState<number | null>(null)
    const [viewingReport, setViewingReport] = useState(false)
    const [lastMedicationPlan, setLastMedicationPlan] = useState<MedicationItem[]>([])
    const [lastAdditionalNotes, setLastAdditionalNotes] = useState<string>('')
    const [pendingTranscriptForReport, setPendingTranscriptForReport] = useState<string>('')

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails()
            fetchConsultationSessions()
        }
    }, [patientId])

    // Listen for request to open SessionSummaryModal from EditableTranscript
    useEffect(() => {
        const handler = (e: any) => {
            const text = e?.detail?.transcript || finalTranscription
            setPendingTranscriptForReport(text)
            setShowSessionSummaryModal(true)
        }
        window.addEventListener('open-session-summary-modal', handler)
        return () => window.removeEventListener('open-session-summary-modal', handler)
    }, [finalTranscription])

    // Auto-trigger session if coming from links
    useEffect(() => {
        if ((isFollowUpMode || isFirstVisitMode) && patient && !isRecording && !showNewConsultation) {
            // Auto-open the consultation modal for follow-up
            setShowNewConsultation(true)
            setIsFollowUpSession(!isFirstVisitMode)
            setChiefComplaint(isFirstVisitMode ? 'First visit consultation' : 'Follow-up consultation')
        }
    }, [isFollowUpMode, isFirstVisitMode, patient, isRecording, showNewConsultation])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isRecording, isPaused])

    const fetchPatientDetails = async () => {
        try {
            setLoading(true)

            // Mock patient data for demo
            const mockPatient: Patient = {
                id: patientId,
                patient_id: `PAT-${patientId.slice(-4).toUpperCase()}`,
                full_name: patientId === 'patient-1' ? 'John Doe' : 'Jane Smith',
                age: patientId === 'patient-1' ? 35 : 28,
                gender: patientId === 'patient-1' ? 'male' : 'female',
                phone_primary: patientId === 'patient-1' ? '+1-555-1234' : '+1-555-5678',
                email: patientId === 'patient-1' ? 'john.doe@email.com' : 'jane.smith@email.com',
                address: patientId === 'patient-1' ? '123 Main St, City, State 12345' : '456 Oak Ave, City, State 67890',
                emergency_contact: patientId === 'patient-1' ? 'Mary Doe (+1-555-9999)' : 'Bob Smith (+1-555-8888)',
                blood_group: patientId === 'patient-1' ? 'O+' : 'A+',
                allergies: patientId === 'patient-1' ? 'Penicillin, Peanuts' : 'None known',
                medical_history: patientId === 'patient-1' ? 'Hypertension, Diabetes Type 2' : 'Asthma',
                created_at: '2024-01-01T00:00:00Z',
                last_visit: patientId === 'patient-1' ? undefined : '2024-01-15T10:00:00Z'
            }

            setPatient(mockPatient)
        } catch (error) {
            console.error('Error fetching patient:', error)
            toast.error('Failed to load patient details')
        } finally {
            setLoading(false)
        }
    }

    const fetchConsultationSessions = async () => {
        try {
            // Mock consultation sessions
            const mockSessions: ConsultationSession[] = [
                {
                    id: 'session-1',
                    session_id: 'CS-2024-001',
                    session_type: 'consultation',
                    status: 'completed',
                    started_at: '2024-01-15T10:00:00Z',
                    ended_at: '2024-01-15T10:30:00Z',
                    duration_minutes: 30,
                    chief_complaint: 'Routine checkup and blood pressure monitoring',
                    has_transcription: true,
                    created_at: '2024-01-15T10:00:00Z'
                },
                {
                    id: 'session-2',
                    session_id: 'CS-2024-002',
                    session_type: 'follow_up',
                    status: 'completed',
                    started_at: '2024-01-08T14:00:00Z',
                    ended_at: '2024-01-08T14:15:00Z',
                    duration_minutes: 15,
                    chief_complaint: 'Follow-up on medication adjustment',
                    has_transcription: true,
                    created_at: '2024-01-08T14:00:00Z'
                }
            ]

            setSessions(mockSessions)
        } catch (error) {
            console.error('Error fetching sessions:', error)
            toast.error('Failed to load consultation sessions')
        }
    }

    const startConsultation = async () => {
        if (!chiefComplaint.trim()) {
            toast.error('Please enter the chief complaint')
            return
        }

        try {
            // Start consultation session
            const response = await apiService.post('/consultation/start', {
                patient_id: patientId,
                doctor_id: user?.id,
                chief_complaint: chiefComplaint
            })

            if (response.status === 'success') {
                setCurrentSession(response.data.session_id)
                setIsRecording(true)
                setRecordingDuration(0)
                setShowNewConsultation(false)
                setLiveTranscription('')
                setFinalTranscription('')

                toast.success('Consultation session started')
            }
        } catch (error) {
            console.error('Error starting consultation:', error)
            toast.error('Failed to start consultation')
            setIsRecording(false)
        }
    }

    const stopConsultation = async () => {
        // Prevent multiple simultaneous calls
        if (isStoppingRef.current) {
            console.log('⚠️ Stop already in progress, ignoring duplicate call')
            return
        }

        try {
            if (!currentSession || !isRecording) {
                console.log('⚠️ Cannot stop: no session or not recording')
                return
            }

            isStoppingRef.current = true  // Lock to prevent re-entry

            console.log('🏁 Starting consultation stop sequence...')
            console.log('🔍 PRE-STOP STATE:', {
                currentSession,
                isRecording,
                finalTranscription: finalTranscription.slice(-50),
                liveTranscription: liveTranscription.slice(-30)
            })

            // Set recording to false FIRST to prevent re-entry
            setIsRecording(false)
            console.log('🛑 Recording state set to false - should trigger loading UI')

            // Then stop AudioRecorder component (this will call onStop() but isRecording is now false)
            if (audioRecorderRef.current) {
                console.log('🛑 Calling AudioRecorder.stopRecording() to fully stop STT & microphone')
                audioRecorderRef.current.stopRecording()
            }

            // Give a moment for state to propagate to EditableTranscript
            await new Promise(resolve => setTimeout(resolve, 200))
            console.log('🔄 State propagation delay complete, calling API...')
            console.log('🔍 MID-STOP STATE:', {
                currentSession,
                isRecording,
                finalTranscription: finalTranscription.slice(-50)
            })

            const response = await apiService.post(`/consultation/${currentSession}/stop`)

            if (response.status === 'success') {
                const newSession: ConsultationSession = {
                    id: `session-${currentSession}-${Date.now()}`,  // Unique ID using session + timestamp
                    session_id: currentSession,
                    session_type: 'consultation',
                    status: 'completed',
                    started_at: new Date().toISOString(),
                    ended_at: new Date().toISOString(),
                    duration_minutes: Math.round(recordingDuration / 60),
                    chief_complaint: chiefComplaint,
                    has_transcription: !!finalTranscription,
                    created_at: new Date().toISOString()
                }

                setSessions(prev => [newSession, ...prev])

                // Don't reset currentSession immediately - let user see processing/options first
                // setCurrentSession(null) // Commented out to keep component mounted
                console.log('💾 Keeping currentSession active for post-recording UI:', currentSession)
                setChiefComplaint('')
                setRecordingDuration(0)

                // Phase 1 MVP: Show post-session modal instead of just toast
                console.log('✅ Session saved, showing post-session workflow')
                console.log('🔍 POST-STOP STATE:', {
                    currentSession,
                    isRecording,
                    finalTranscription: finalTranscription.slice(-50),
                    componentShouldRender: !!currentSession
                })

                // Do not open medication/progress modal automatically.
            }
        } catch (error) {
            console.error('Error stopping consultation:', error)
            toast.error('Failed to stop consultation')
        } finally {
            // Release lock after completion (success or error)
            isStoppingRef.current = false
            console.log('🔓 Stop lock released')
        }
    }

    // Phase 1 MVP: Post-session workflow handlers
    const handleReportGenerated = async (reportId: number) => {
        console.log('📄 Report generated with ID:', reportId)
        try {
            setIsGeneratingReport(true)
            setCurrentReportId(reportId)
            setShowSessionSummaryModal(false)

            // Fetch report details from backend and adapt to MedicalReportDisplay shape
            const resp = await apiService.get(`/reports/${reportId}`)
            const data = (resp as any)?.data || (resp as any)
            if (data) {
                // Build medication summary for display and PDF (italics in preview via markdown)
                const meds = (data.medication_plan || []).map((m: any) => {
                    const base = `${m.drug_name} ${m.dosage} – ${m.frequency}`
                    const route = m.route ? ` (${m.route})` : ''
                    const instr = m.instructions ? ` — ${m.instructions}` : ''
                    return `*${base}${route}${instr}*`
                }).join('\n')

                const adapted = {
                    report: data.report_content,
                    session_id: data.session_id,
                    session_type: data.session_type || 'follow_up',
                    model_used: '',
                    transcription_length: data.transcription_length,
                    generated_at: data.created_at,
                    patient_name: patient?.full_name || undefined,
                    doctor_name: (user as any)?.name || undefined
                }
                // If report doesn't contain a medication/treatment section, append one
                if (meds) {
                    if (/##\s*(medication|treatment)/i.test(adapted.report)) {
                        // Inject meds under existing section by appending at the end
                        adapted.report += `\n${meds}`
                    } else {
                        // Create the section if it's missing
                        adapted.report += `\n\n## MEDICATION & TREATMENT\n${meds}`
                    }
                }
                // Persist last medications (state + localStorage)
                const medsList: MedicationItem[] = (data.medication_plan || [])
                setLastMedicationPlan(medsList)
                try {
                    if (currentSession) {
                        window.localStorage.setItem(`last_meds_${currentSession}`, JSON.stringify(medsList))
                    }
                } catch (_) { }

                setGeneratedReport(adapted)
                setViewingReport(false)
                toast.success('Report generated successfully!')
                // Smooth scroll to report card
                setTimeout(() => {
                    const el = document.getElementById('medical-report-card')
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
            } else {
                toast.error('Failed to load generated report')
            }
        } catch (e) {
            console.error('Failed to fetch generated report:', e)
            toast.error('Failed to fetch generated report')
        } finally {
            setIsGeneratingReport(false)
        }
    }

    const handleBackFromReport = () => {
        setViewingReport(false)
        setCurrentReportId(null)
        // Could optionally show the transcript again or navigate somewhere
    }

    const handleCloseSessionModal = () => {
        setShowSessionSummaryModal(false)
        // Just close modal, session stays active so user can still see transcript
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleTranscriptionUpdate = (text: string, isFinal: boolean) => {
        const wordCount = text.split(' ').length

        if (isFinal) {
            // STT service says this text is final - append it immediately
            setFinalTranscription(prev => {
                const newFinal = prev ? prev + ' ' + text : text
                const totalWords = newFinal.split(' ').length
                console.log(`📝 STT FINAL received (${wordCount} words):`, text)
                console.log(`📝 Total final transcription now (${totalWords} words):`, newFinal)
                return newFinal
            })
            setLiveTranscription('') // Clear interim when final arrives
        } else {
            // Handle interim text - show it in live transcription
            setLiveTranscription(text)
            console.log(`🎤 STT INTERIM received (${wordCount} words):`, text)

            // Debug: Alert if interim text gets very long without becoming final
            if (wordCount >= 50) {
                console.warn(`⚠️ LONG INTERIM TEXT (${wordCount} words) - may be stuck!`)
            }
        }
    }

    const handleTranscriptionEdit = (newText: string) => {
        // Store the edited text separately to avoid conflicts with ongoing STT
        setFinalTranscription(newText)
        console.log('✏️ User edited transcription:', newText)
        toast.success('Transcript updated successfully')
    }

    const handleGenerateReport = async (transcriptText: string) => {
        if (!transcriptText.trim()) {
            toast.error('No transcript available to generate report')
            return
        }

        setIsGeneratingReport(true)
        console.log('🤖 Generating Gemini report for transcript length:', transcriptText.length)

        try {
            // Call the Gemini API to generate structured report
            const reportRequest = {
                transcription: transcriptText,
                session_id: currentSession || 'unknown',
                session_type: 'follow_up', // Since this is follow-up session
                patient_id: patientId
            }

            console.log('📤 Sending request to Gemini API:', {
                session_id: reportRequest.session_id,
                session_type: reportRequest.session_type,
                patient_id: reportRequest.patient_id,
                transcription_length: reportRequest.transcription.length,
                transcription_preview: reportRequest.transcription.slice(0, 100) + '...'
            })

            const response = await apiService.post('/reports/generate', reportRequest)

            if (response.status === 'success') {
                // Store the generated report data
                const reportData = response.data
                console.log('📄 Generated Gemini Report:', {
                    model: reportData.model_used,
                    session_type: reportData.session_type,
                    transcription_length: reportData.transcription_length,
                    report_preview: typeof reportData.report === 'string' ? reportData.report.slice(0, 300) + '...' : reportData.report
                })

                // Store report in a separate state variable (we'll create this)
                setGeneratedReport(reportData)

                toast.success('✅ Medical report generated successfully!')
                console.log('🎯 Medical report generated successfully!')

                // No auto-scroll - let user control their view
            } else {
                throw new Error('Report generation failed')
            }

        } catch (error: any) {
            console.error('❌ Error generating Gemini report:', error)
            console.error('❌ Error details:', {
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message
            })

            if (error?.response?.status === 400) {
                toast.error('Invalid transcript content. Please check your input.')
            } else if (error?.response?.status === 503) {
                toast.error('⚠️ Please set up your Gemini API key first!')
            } else if (error?.response?.status === 500) {
                toast.error('AI service temporarily unavailable. Please try again.')
            } else {
                toast.error('Failed to generate report. Please try again.')
            }
        } finally {
            setIsGeneratingReport(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-neutral-200 rounded mb-4"></div>
                    <div className="h-48 bg-neutral-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">Patient not found</h3>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-all duration-300">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={isFollowUpMode ? "/dashboard" : "/dashboard/patients"}
                        className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {patient.full_name}
                            {isFollowUpMode && (
                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                                    Follow-up Session
                                </span>
                            )}
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400">Patient ID: {patient.patient_id}</p>
                    </div>

                    {!isRecording && !isFollowUpMode && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowNewConsultation(true)
                                setIsFollowUpSession(true)
                                setChiefComplaint("Follow-up consultation") // Auto-fill for follow-up
                            }}
                            className="flex items-center gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Follow Up
                        </Button>
                    )}
                </div>

                {/* Active Recording Interface - Single Screen Layout */}
                {isRecording && currentSession && (
                    <div className="space-y-4">
                        {/* 🎙️ ACTIVE RECORDING UI - isRecording: {isRecording}, currentSession: {currentSession} */}
                        {/* Recording Status Bar */}
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-lg font-semibold text-red-800 dark:text-red-200">RECORDING IN PROGRESS</span>
                                    </div>
                                    <div className="text-sm text-red-600 dark:text-red-300">
                                        {formatDuration(recordingDuration)} • Multi-language STT Active
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">मराठी</span>
                                    <span className="text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">English</span>
                                    <span className="text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">हिंदी</span>
                                </div>
                            </div>
                        </div>


                        {/* Recording Controls - Vertex AI Powered */}
                        <VertexAIAudioRecorder
                            ref={audioRecorderRef}
                            sessionId={currentSession}
                            isRecording={isRecording}
                            duration={recordingDuration}
                            selectedAudioDevice={selectedAudioDevice}
                            onStart={startConsultation}
                            onStop={stopConsultation}
                            onPause={() => setIsPaused(true)}
                            onResume={() => setIsPaused(false)}
                            onTranscriptionUpdate={handleTranscriptionUpdate}
                        />

                    </div>
                )}

                {/* Editable Live Transcription - Available during AND after recording */}
                {currentSession && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg p-4">
                        {/* 🎯 RENDERING EditableTranscript - currentSession: {currentSession}, isRecording: {isRecording} */}
                        <EditableTranscript
                            finalTranscription={finalTranscription}
                            liveTranscription={liveTranscription}
                            isRecording={isRecording}
                            onTranscriptionEdit={handleTranscriptionEdit}
                            onGenerateReport={handleGenerateReport}
                            sessionId={currentSession}
                        />
                    </div>
                )}

                {/* AI-Powered Medical Report Generation */}
                {finalTranscription && !isRecording && (
                    <MedicalReportDisplay
                        reportData={generatedReport}
                        isGenerating={isGeneratingReport}
                        onGenerateNew={() => {
                            // Re-open modal with last-used values for quick edit
                            setShowSessionSummaryModal(true)
                        }}
                    />
                )}

                {/* Mental Health Follow-Up Interface - Hide when report is displayed */}
                {showNewConsultation && !generatedReport && (
                    <div className="space-y-6">
                        {/* Session Setup */}
                        <div className="medical-card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Mental Health Follow-Up Session</h3>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowNewConsultation(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {!isFollowUpSession && (
                                        <div>
                                            <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                Session Focus
                                            </label>
                                            <Input
                                                placeholder="Primary focus for today's session (e.g., anxiety management, mood assessment)..."
                                                value={chiefComplaint}
                                                onChange={(e) => setChiefComplaint(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                            Session Type
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                            defaultValue="follow-up"
                                        >
                                            <option value="follow-up">Follow-up Session</option>
                                            <option value="therapy">Therapy Session</option>
                                            <option value="assessment">Mental Health Assessment</option>
                                            <option value="counseling">Counseling Session</option>
                                            <option value="crisis">Crisis Intervention</option>
                                        </select>
                                    </div>

                                    {/* Vertex AI Auto-Language Detection Info */}
                                    <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700 rounded-lg">
                                        <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Vertex AI Auto-Detection
                                        </h4>
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            ✨ Automatically detects and switches between Hindi (हिंदी), Marathi (मराठी), and English (India). Just speak naturally!
                                        </p>
                                    </div>

                                    {/* Audio Input Device Selection - Show before recording */}
                                    <div className="p-4 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg">
                                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                            <MicrophoneIcon className="h-4 w-4" />
                                            Audio Input Settings
                                        </h4>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                            Select your collar microphone or preferred audio input device before starting the session
                                        </p>
                                        <AudioDeviceSelector
                                            selectedDeviceId={selectedAudioDevice}
                                            onDeviceChange={setSelectedAudioDevice}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            onClick={startConsultation}
                                            disabled={!chiefComplaint.trim()}
                                            className="flex items-center gap-2"
                                        >
                                            <MicrophoneIcon className="h-4 w-4" />
                                            Start Session
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setShowNewConsultation(false)
                                                setIsFollowUpSession(false)
                                                setChiefComplaint('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session Status - Only show if session is active */}
                        {currentSession && (
                            <div className="medical-card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Session Active</h3>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    Multi-language STT recording • मराठी • English • हिंदी
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Session ID</p>
                                            <p className="text-xs text-green-500 dark:text-green-500">{currentSession}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Patient Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="lg:col-span-2 medical-card">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Patient Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Age</label>
                                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.age} years</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Gender</label>
                                    <p className="text-neutral-900 dark:text-neutral-100 font-medium capitalize">{patient.gender}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</label>
                                    <p className="text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2">
                                        <PhoneIcon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                        {patient.phone_primary}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                                    <p className="text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2">
                                        <EnvelopeIcon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                        {patient.email}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</label>
                                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-4">
                        <div className="medical-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Last Visit</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {patient.last_visit ? formatDate(patient.last_visit) : 'No previous visits'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="medical-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <HeartIcon className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Blood Group</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{patient.blood_group}</p>
                                </div>
                            </div>
                        </div>

                        <div className="medical-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <DocumentTextIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Sessions</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{sessions.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="medical-card">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Medical History</h3>
                            <p className="text-neutral-700 dark:text-neutral-300">{patient.medical_history || 'No medical history recorded'}</p>
                        </div>
                    </div>

                    <div className="medical-card">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Allergies</h3>
                            <p className="text-neutral-700 dark:text-neutral-300">{patient.allergies || 'No known allergies'}</p>
                        </div>
                    </div>
                </div>

                {/* Consultation Sessions */}
                <div className="medical-card">
                    <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Consultation History</h2>
                    </div>

                    {sessions.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <ClockIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
                            <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">No consultation sessions</h3>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Start a new consultation to begin recording.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {sessions.map((session) => (
                                <div key={session.id} className="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                    {session.session_id}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${session.status === 'completed'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                    }`}>
                                                    {session.status}
                                                </span>
                                            </div>

                                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                                                {session.chief_complaint}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                                                <span>{formatDate(session.started_at)}</span>
                                                <span>{session.duration_minutes} min</span>
                                                {session.has_transcription && (
                                                    <span className="flex items-center gap-1">
                                                        <DocumentTextIcon className="h-3 w-3" />
                                                        Transcribed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Button variant="secondary" size="sm">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Symptom Assessment removed on patient page per requirement (kept only in new patient registration) */}

            {/* Phase 1 MVP: Post-Session Workflow Components */}

            {/* Session Summary Modal - Phase 1 MVP */}
            {showSessionSummaryModal && (
                <SessionSummaryModal
                    isOpen={showSessionSummaryModal}
                    onClose={handleCloseSessionModal}
                    sessionId={currentSession || ''}
                    transcription={pendingTranscriptForReport || finalTranscription}
                    onReportGenerated={handleReportGenerated}
                    sessionType={isFirstVisitMode ? 'first_visit' : 'follow_up'}
                    initialMedications={
                        (currentSession && (() => {
                            try {
                                const raw = window.localStorage.getItem(`last_meds_${currentSession}`)
                                return raw ? JSON.parse(raw) : lastMedicationPlan
                            } catch { return lastMedicationPlan }
                        })()) || lastMedicationPlan
                    }
                    initialNotes={lastAdditionalNotes}
                />
            )}

            {/* Report View - Phase 1 MVP */}
            {viewingReport && currentReportId && (
                <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50">
                    <ReportView
                        reportId={currentReportId}
                        onBack={handleBackFromReport}
                    />
                </div>
            )}

        </div>
    )
}
