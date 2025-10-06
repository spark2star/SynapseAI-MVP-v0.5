'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
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
import AudioRecorder from '@/components/consultation/AudioRecorder'
import AudioDeviceSelector from '@/components/consultation/AudioDeviceSelector'
import AIInsights from '@/components/consultation/AIInsights'
import EditableTranscript from '@/components/consultation/EditableTranscript'
import MedicalReportDisplay from '@/components/consultation/MedicalReportDisplay'
import MedicationModal, { Medication } from '@/components/consultation/MedicationModal'
import { useAuthStore } from '@/store/authStore'
import { apiService } from '@/services/api'
import ReportView from '@/components/report/ReportView'


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
    has_report?: boolean;      // ADD THIS
    report_id?: string;
    created_at: string
}

export default function PatientDetailPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const patientId = params?.id as string
    const isFollowUpMode = searchParams?.get('followup') === 'true'
    const isNewPatient = searchParams?.get('newPatient') === 'true'
    const preSelectedSessionType = searchParams?.get('sessionType')
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
    const [sessionType, setSessionType] = useState<string>('')
    const [liveTranscription, setLiveTranscription] = useState('')
    const [finalTranscription, setFinalTranscription] = useState('')
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [generatedReport, setGeneratedReport] = useState<any>(null)
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
    const [showMedicationModal, setShowMedicationModal] = useState(false)
    const [reportId, setReportId] = useState<string | null>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedPatient, setEditedPatient] = useState<any>(null)
    const [isSavingPatient, setIsSavingPatient] = useState(false)
    const audioRecorderRef = useRef<{ stopRecording: () => void }>(null)

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails()
            fetchConsultationSessions()
        }
    }, [patientId])

    // Auto-trigger follow-up session if coming from dashboard
    useEffect(() => {
        if (isFollowUpMode && patient && !isRecording && !showNewConsultation) {
            // Auto-open the consultation modal for follow-up
            setShowNewConsultation(true)
            setIsFollowUpSession(true)
            setChiefComplaint("Follow-up consultation") // Auto-fill for follow-up
        }
    }, [isFollowUpMode, patient, isRecording, showNewConsultation])

    // Auto-trigger first session for new patients
    useEffect(() => {
        if (isNewPatient && patient && !isRecording && !showNewConsultation) {
            console.log('🆕 New patient detected, opening session modal with type:', preSelectedSessionType)
            // Auto-open the consultation modal with pre-selected session type
            setShowNewConsultation(true)
            setSessionType(preSelectedSessionType || 'first_session')
            setChiefComplaint('First session - Initial assessment')
            toast.success('✅ Patient registered! You can now start the first session.')
        }
    }, [isNewPatient, patient, isRecording, showNewConsultation, preSelectedSessionType])


    // Listen for generate report event from EditableTranscript
    useEffect(() => {
        const handleOpenMedicationModal = (e: any) => {
            console.log('📥 Received generate report event with transcript:', e.detail.transcript?.length || 0, 'chars')

            // Set the final transcription
            if (e.detail.transcript) {
                setFinalTranscription(e.detail.transcript)
            }

            // Open medication modal
            setShowMedicationModal(true)
        }

        // Listen for the custom event
        window.addEventListener('open-session-summary-modal', handleOpenMedicationModal)

        // Cleanup
        return () => {
            window.removeEventListener('open-session-summary-modal', handleOpenMedicationModal)
        }
    }, [])




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
            console.log(`📋 Fetching patient details for: ${patientId}`)

            // Fetch patient data from backend
            const patientResponse = await apiService.get(`/intake/patients/${patientId}`)

            if (patientResponse.status === 'success' && patientResponse.data) {
                const patientData = patientResponse.data
                // Add this validation:
                if (!patientData || !patientData.id) {
                    console.error('❌ Invalid patient data:', patientData)
                    throw new Error('Patient data is missing')
                }
                console.log('✅ Patient data loaded:', patientData)

                // Map backend data to frontend Patient interface
                const mappedPatient: Patient = {
                    id: patientData.id,
                    patient_id: patientData.id,
                    full_name: patientData.name,
                    age: patientData.age,
                    gender: patientData.sex,
                    phone_primary: patientData.phone || 'N/A',
                    email: patientData.email || '',
                    address: patientData.address || '',
                    emergency_contact: '',
                    blood_group: '',
                    allergies: '',
                    medical_history: '',
                    created_at: patientData.created_at || new Date().toISOString(),
                    last_visit: undefined
                }

                setPatient(mappedPatient)

                // Also fetch consultation history
                try {
                    const historyResponse = await apiService.get(`/consultation/history/${patientId}`)
                    if (historyResponse.status === 'success' && historyResponse.data) {
                        console.log('✅ Consultation history loaded:', historyResponse.data.consultations?.length || 0)
                    }
                } catch (historyError) {
                    console.warn('⚠️ Could not load consultation history:', historyError)
                    // Don't block page load if history fails
                }
            } else {
                throw new Error('Invalid response format')
            }
        } catch (error) {
            console.error('❌ Error fetching patient:', error)
            toast.error('Failed to load patient details')
            // Optionally redirect to patients list
            // router.push('/dashboard/patients')
        } finally {
            setLoading(false)
        }
    }

    const fetchConsultationSessions = async () => {
        try {
            console.log('📋 Fetching consultation history for patient:', patientId)

            const consultationService = (await import('@/services/consultationService')).default
            const response = await consultationService.getHistory(patientId)

            // ✅ FIX: Parse the correct nested structure
            const consultations = response.consultations

            console.log(`✅ Loaded ${consultations.length} consultations`)

            const mappedSessions: ConsultationSession[] = consultations.map((c: any) => ({
                id: c.id,
                session_id: c.sessionId || c.session_id,
                session_type: c.sessionType || c.session_type,
                status: c.status,
                started_at: c.startedAt || c.started_at,
                ended_at: c.endedAt || c.ended_at || undefined,
                duration_minutes: c.durationMinutes || c.duration_minutes || 0,
                chief_complaint: c.chiefComplaint || c.chief_complaint || 'Not specified',
                has_transcription: c.hasTranscription || c.has_transcription,
                has_report: c.hasReport || c.has_report,  // ADD THIS
                report_id: c.reportId || c.report_id,      // ADD THIS
                created_at: c.createdAt || c.created_at
            }))

            setSessions(mappedSessions)
        } catch (error) {
            console.error('❌ Error fetching consultation sessions:', error)
            toast.error('Failed to load consultation history')
            setSessions([])
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
        try {
            if (currentSession) {
                console.log('🏁 Starting consultation stop sequence...')
                console.log('🔍 PRE-STOP STATE:', {
                    currentSession,
                    isRecording,
                    finalTranscription: finalTranscription.slice(-50),
                    liveTranscription: liveTranscription.slice(-30)
                })

                // CRITICAL: Stop AudioRecorder component first
                if (audioRecorderRef.current) {
                    console.log('🛑 Calling AudioRecorder.stopRecording() to fully stop STT & microphone')
                    audioRecorderRef.current.stopRecording()
                }

                // Then update state immediately to trigger UI changes
                setIsRecording(false)
                console.log('🛑 Recording state set to false - should trigger loading UI')

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
                        id: 'session-new',
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

                    toast.success('Consultation session completed')
                    console.log('✅ Session saved, keeping transcript component mounted for user actions')
                    console.log('🔍 POST-STOP STATE:', {
                        currentSession,
                        isRecording,
                        finalTranscription: finalTranscription.slice(-50),
                        componentShouldRender: !!currentSession
                    })
                }
            }
        } catch (error) {
            console.error('Error stopping consultation:', error)
            toast.error('Failed to stop consultation')
        }
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

    const handleStartEdit = () => {
        if (patient) {
            setEditedPatient({
                name: patient.full_name,
                age: patient.age,
                gender: patient.gender,
                phone_primary: patient.phone_primary,
                email: patient.email,
                address: patient.address
            })
            setIsEditMode(true)
        }
    }

    const handleCancelEdit = () => {
        setIsEditMode(false)
        setEditedPatient(null)
    }

    const handleSavePatient = async () => {
        if (!editedPatient) return

        try {
            setIsSavingPatient(true)
            console.log('💾 Saving patient changes...')

            // Map frontend fields to backend fields
            const updatePayload = {
                name: editedPatient.name,
                age: parseInt(editedPatient.age),
                sex: editedPatient.gender,
                phone: editedPatient.phone_primary,
                email: editedPatient.email,
                address: editedPatient.address
            }

            const response = await apiService.updatePatient(patientId, updatePayload)

            if (response.status === 'success') {
                // Update patient state with new data
                const updatedPatientData = response.data.patient
                const mappedPatient: Patient = {
                    id: updatedPatientData.id,
                    patient_id: updatedPatientData.id,
                    full_name: updatedPatientData.name,
                    age: updatedPatientData.age,
                    gender: updatedPatientData.sex,
                    phone_primary: updatedPatientData.phone || 'N/A',
                    email: updatedPatientData.email || '',
                    address: updatedPatientData.address || '',
                    emergency_contact: '',
                    blood_group: '',
                    allergies: '',
                    medical_history: '',
                    created_at: updatedPatientData.created_at || new Date().toISOString(),
                    last_visit: undefined
                }

                setPatient(mappedPatient)
                setIsEditMode(false)
                setEditedPatient(null)
                toast.success('Patient updated successfully')
                console.log('✅ Patient updated:', response.data.updated_fields, 'fields changed')
            }
        } catch (error: any) {
            console.error('❌ Update patient error:', error)
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to update patient'
            toast.error(errorMessage)
        } finally {
            setIsSavingPatient(false)
        }
    }

    const handleGenerateReport = async (medications: Medication[] = []) => {
        try {
            setIsGeneratingReport(true)
            setShowMedicationModal(false) // Close modal
            console.log('🤖 Starting report generation with medications:', medications.length)

            // Validate required data
            if (!finalTranscription || finalTranscription.trim().length === 0) {
                toast.error('No transcript available to generate report')
                return
            }

            if (!currentSession) {
                toast.error('No active session found')
                return
            }

            // STEP 1: Generate report content using AI
            console.log('📝 Calling AI to generate report...')
            const generatePayload = {
                transcription: finalTranscription,
                session_id: currentSession,
                patient_id: patientId,
                session_type: sessionType || 'follow_up',
                medication_plan: medications // Pass medications to AI
            }

            const reportResponse = await apiService.post('/reports/generate', generatePayload)

            if (reportResponse.status !== 'success' || !reportResponse.data?.report) {
                throw new Error('Report generation failed')
            }

            const generatedContent = reportResponse.data.report
            console.log('✅ Report generated by AI')

            // STEP 2: Save report to database
            console.log('💾 Saving report to database...')
            const savePayload = {
                session_id: currentSession,
                patient_id: patientId,
                generated_content: generatedContent,
                report_type: sessionType || 'follow_up',
                status: 'completed',
                medication_plan: medications
            }

            const saveResponse = await apiService.post('/reports/save', savePayload)

            if (saveResponse.status !== 'success') {
                throw new Error('Failed to save report')
            }

            // STEP 3: Update UI with saved report
            console.log('✅ Report saved successfully:', saveResponse.data.report.id)
            setGeneratedReport(reportResponse.data)
            setReportId(saveResponse.data.report.id)

            toast.success('Report generated and saved successfully!')

            // Scroll to report display
            setTimeout(() => {
                const reportElement = document.getElementById('generated-report')
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)

        } catch (error: any) {
            console.error('❌ Report generation error:', error)

            // User-friendly error messages
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                'Failed to generate report'

            toast.error(errorMessage)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading patient details...</p>
                </div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">Patient not found</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">The patient you're looking for doesn't exist or you don't have access.</p>
                    <button
                        onClick={() => router.push('/dashboard/patients')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Back to Patients
                    </button>
                </div>
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

                        {/* Development Phase Notice */}
                        {isRecording && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <div className="text-sm">
                                            <strong className="font-semibold text-yellow-800 dark:text-yellow-200">Development Phase Notice:</strong>
                                            <span className="text-yellow-700 dark:text-yellow-300 ml-1">
                                                This recording feature is currently under active development. Some features may not work as expected.
                                                We appreciate your patience as we continue to improve the system.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recording Controls - Compact Display */}
                        <AudioRecorder
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
                            onGenerateReport={() => setShowMedicationModal(true)}
                            sessionId={currentSession}
                        />
                    </div>
                )}

                {/* AI-Powered Medical Report Generation */}
                {finalTranscription && !isRecording && (
                    <MedicalReportDisplay
                        reportData={generatedReport}
                        isGenerating={isGeneratingReport}
                        onGenerateNew={() => setShowMedicationModal(true)}
                    />
                )}

                {/* Medication Modal */}
                <MedicationModal
                    isOpen={showMedicationModal}
                    onClose={() => setShowMedicationModal(false)}
                    onSubmit={handleGenerateReport}
                    isLoading={isGeneratingReport}
                />

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
                                            value={sessionType}
                                            onChange={(e) => setSessionType(e.target.value)}
                                        >
                                            <option value="first_session">First Session</option>
                                            <option value="follow-up">Follow-up Session</option>
                                            <option value="therapy">Therapy Session</option>
                                            <option value="assessment">Mental Health Assessment</option>
                                            <option value="counseling">Counseling Session</option>
                                            <option value="crisis">Crisis Intervention</option>
                                        </select>
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
                            {/* Header with Edit/Save/Cancel buttons */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Patient Information</h2>
                                {!isEditMode ? (
                                    <Button
                                        onClick={handleStartEdit}
                                        variant="secondary"
                                        size="sm"
                                        disabled={isRecording}
                                    >
                                        Edit Patient
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleCancelEdit}
                                            variant="secondary"
                                            size="sm"
                                            disabled={isSavingPatient}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSavePatient}
                                            variant="primary"
                                            size="sm"
                                            disabled={isSavingPatient}
                                        >
                                            {isSavingPatient ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Full Name</label>
                                    {isEditMode && editedPatient ? (
                                        <input
                                            type="text"
                                            value={editedPatient.name || ''}
                                            onChange={(e) => setEditedPatient({ ...editedPatient, name: e.target.value })}
                                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">{patient.full_name}</p>
                                    )}
                                </div>

                                {/* Age */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Age</label>
                                    {isEditMode && editedPatient ? (
                                        <input
                                            type="number"
                                            value={editedPatient.age || ''}
                                            onChange={(e) => setEditedPatient({ ...editedPatient, age: e.target.value })}
                                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">{patient.age} years</p>
                                    )}
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Gender</label>
                                    {isEditMode && editedPatient ? (
                                        <select
                                            value={editedPatient.gender || ''}
                                            onChange={(e) => setEditedPatient({ ...editedPatient, gender: e.target.value })}
                                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    ) : (
                                        <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1 capitalize">{patient.gender}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</label>
                                    {isEditMode && editedPatient ? (
                                        <input
                                            type="tel"
                                            value={editedPatient.phone_primary || ''}
                                            onChange={(e) => setEditedPatient({ ...editedPatient, phone_primary: e.target.value })}
                                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2 mt-1">
                                            <PhoneIcon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                            {patient.phone_primary}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                                    {isEditMode && editedPatient ? (
                                        <input
                                            type="email"
                                            value={editedPatient.email || ''}
                                            onChange={(e) => setEditedPatient({ ...editedPatient, email: e.target.value })}
                                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2 mt-1">
                                            <EnvelopeIcon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                            {patient.email || 'N/A'}
                                        </p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</label>
                                    {isEditMode && editedPatient ? (
                                        <textarea
                                            value={editedPatient.address || ''}
                                            onChange={(e) => setEditedPatient({ ...editedPatient, address: e.target.value })}
                                            rows={2}
                                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">{patient.address || 'N/A'}</p>
                                    )}
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

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedReportId(session.report_id!)
                                                setShowReportModal(true)
                                            }}
                                        >
                                            📄 View Report
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showReportModal && selectedReportId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="overflow-y-auto w-full max-w-6xl h-[90vh] bg-white dark:bg-neutral-900 rounded-lg overflow-hidden">
                        <ReportView
                            reportId={selectedReportId}
                            onBack={() => {
                                setShowReportModal(false)
                                setSelectedReportId(null)
                            }}
                        />
                    </div>
                </div>
            )}

        </div>
    )
}
