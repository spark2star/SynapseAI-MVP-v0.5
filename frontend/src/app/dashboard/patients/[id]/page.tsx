'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

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
import apiClient from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SimpleRecorder from '@/components/consultation/recording/SimpleRecorder'
import AudioDeviceSelector from '@/components/consultation/AudioDeviceSelector'
import AIInsights from '@/components/consultation/AIInsights'
import EditableTranscript from '@/components/consultation/EditableTranscript'
import MedicalReportDisplay from '@/components/consultation/MedicalReportDisplay'
import MedicationModal, { Medication } from '@/components/consultation/MedicationModal'
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
    has_report?: boolean
    report_id?: string
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

    const user = useAuthStore((state) => state.user)

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

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails()
            fetchConsultationSessions()
        }
    }, [patientId])

    useEffect(() => {
        if (isFollowUpMode && patient && !isRecording && !showNewConsultation) {
            setShowNewConsultation(true)
            setIsFollowUpSession(true)
            setChiefComplaint("Follow-up consultation")
        }
    }, [isFollowUpMode, patient, isRecording, showNewConsultation])

    useEffect(() => {
        if (isNewPatient && patient && !isRecording && !showNewConsultation) {
            console.log('🆕 New patient detected, opening session modal with type:', preSelectedSessionType)
            setShowNewConsultation(true)
            setSessionType(preSelectedSessionType || 'first_session')
            setChiefComplaint('First session - Initial assessment')
            toast.success('✅ Patient registered! You can now start the first session.')
        }
    }, [isNewPatient, patient, isRecording, showNewConsultation, preSelectedSessionType])

    useEffect(() => {
        const handleOpenMedicationModal = (e: any) => {
            console.log('📥 Received generate report event with transcript:', e.detail.transcript?.length || 0, 'chars')
            if (e.detail.transcript) {
                setFinalTranscription(e.detail.transcript)
            }
            setShowMedicationModal(true)
        }

        window.addEventListener('open-session-summary-modal', handleOpenMedicationModal)
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

            const patientResponse = await apiClient.get(`/intake/patients/${patientId}`)

            if (patientResponse.status === 'success' && patientResponse.data) {
                const patientData = patientResponse.data

                if (!patientData || !patientData.id) {
                    console.error('❌ Invalid patient data:', patientData)
                    throw new Error('Patient data is missing')
                }

                console.log('✅ Patient data loaded:', patientData)

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
                console.log('🏁 Patient state set successfully')

                try {
                    const historyResponse = await apiClient.get(`/consultation/history/${patientId}`)
                    if (historyResponse.status === 'success' && historyResponse.data) {
                        console.log('✅ Consultation history loaded:', historyResponse.data.consultations?.length || 0)
                    }
                } catch (historyError) {
                    console.warn('⚠️ Could not load consultation history:', historyError)
                }
            } else {
                throw new Error('Invalid response format')
            }
        } catch (error) {
            console.error('❌ Error fetching patient:', error)
            toast.error('Failed to load patient details')
        } finally {
            setLoading(false)
            console.log('🏁 Loading complete')
        }
    }

    const fetchConsultationSessions = async () => {
        try {
            console.log('📋 Fetching consultation history for patient:', patientId)

            const consultationService = (await import('@/services/consultationService')).default
            const response = await consultationService.getHistory(patientId)

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
                has_report: c.hasReport || c.has_report,
                report_id: c.reportId || c.report_id,
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
        try {
            console.log('🎬 Starting new consultation for patient:', patientId)

            if (!user?.id) {
                toast.error('Error: User not authenticated')
                return
            }

            const requestBody = {
                patient_id: patientId,
                doctor_id: user.id,
                session_type: sessionType || 'first_session',
                chief_complaint: chiefComplaint || 'Not specified'
            }

            console.log('📤 Request body:', requestBody)

            let response = await apiClient.post('/consultation/start', requestBody)

            console.log('📥 Response:', response)

            const sessionId = response?.data?.session_id || response?.session_id

            if (sessionId) {
                console.log('✅ Session ID:', sessionId)
                setCurrentSession(sessionId)
                setIsRecording(true)
                setShowNewConsultation(false)
                toast.success('Recording started successfully!')
            } else {
                console.error('❌ Response structure:', JSON.stringify(response, null, 2))
                throw new Error('No session_id in response')
            }

        } catch (error: any) {
            console.error('❌ Consultation start error:', error)
            console.error('❌ Error response:', error.response?.data)

            const errorMessage = error.response?.data?.error?.message || error.message

            if (errorMessage?.toLowerCase().includes('already has an active')) {
                console.log('⚠️ Active session detected, attempting to end it first...')

                if (!user?.id) {
                    toast.error('User session expired. Please refresh and try again.')
                    return
                }

                try {
                    await apiClient.post(`/consultation/end-by-patient/${patientId}`)

                    toast.success('Ended previous session, retrying...')

                    await new Promise(resolve => setTimeout(resolve, 500))

                    const retryResponse = await apiClient.post('/consultation/start', {
                        patient_id: patientId,
                        doctor_id: user.id,
                        session_type: sessionType || 'first_session',
                        chief_complaint: chiefComplaint || 'Not specified'
                    })

                    console.log('📥 Retry response:', retryResponse)

                    const retrySessionId = retryResponse?.data?.session_id || retryResponse?.session_id

                    if (retrySessionId) {
                        console.log('✅ Retry successful! Session ID:', retrySessionId)
                        setCurrentSession(retrySessionId)
                        setIsRecording(true)
                        setShowNewConsultation(false)
                        toast.success('Recording started successfully!')
                        return
                    }
                } catch (retryError) {
                    console.error('❌ Retry failed:', retryError)
                    toast.error('Failed to end previous session. Please refresh the page.')
                    return
                }
            }

            if (error.response?.data?.error?.fields) {
                console.error('❌ Validation errors:', error.response.data.error.fields)
            }

            toast.error(`Failed to start consultation: ${errorMessage}`)
        }
    }

    const stopConsultation = async () => {
        try {
            if (currentSession) {
                console.log('🏁 Stopping consultation...')

                setIsRecording(false)

                await new Promise(resolve => setTimeout(resolve, 200))

                const response = await apiClient.post(`/consultation/${currentSession}/stop`)

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
                    setChiefComplaint('')
                    setRecordingDuration(0)

                    toast.success('Consultation session completed')
                    console.log('✅ Session saved')
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

    const handleTranscriptionUpdate = useCallback((transcript: string, isFinal: boolean) => {
        console.log(`📝 [page.tsx] Transcription update: "${transcript.substring(0, 50)}..." (final: ${isFinal}, length: ${transcript.length})`);

        if (isFinal) {
            setFinalTranscription(prev => {
                const trimmedTranscript = transcript.trim()
                const trimmedPrev = prev.trim()

                if (!trimmedTranscript) {
                    console.log('⚠️ [page.tsx] Skipping empty transcript')
                    return prev
                }

                if (
                    trimmedPrev.endsWith(trimmedTranscript) ||
                    trimmedPrev.split(/\s+/).slice(-trimmedTranscript.split(/\s+/).length).join(' ') === trimmedTranscript
                ) {
                    console.log('🔄 [page.tsx] Skipping exact duplicate transcript')
                    return prev
                }

                const updated = trimmedPrev.length > 0
                    ? trimmedPrev + ' ' + trimmedTranscript
                    : trimmedTranscript

                console.log(`✅ [page.tsx] Final transcript updated. Total length: ${updated.length}`);
                return updated
            })
        } else {
            setLiveTranscription(transcript);
            console.log(`🔵 [page.tsx] Live transcript updated: ${transcript.length} chars`);
        }
    }, [])

    const handleTranscriptionEdit = (newText: string) => {
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

            const updatePayload = {
                name: editedPatient.name,
                age: parseInt(editedPatient.age),
                sex: editedPatient.gender,
                phone: editedPatient.phone_primary,
                email: editedPatient.email,
                address: editedPatient.address
            }

            const response = await apiClient.updatePatient(patientId, updatePayload)

            if (response.status === 'success') {
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

    const handleGenerateReport = async (medications: Medication[] = [], patientStatus?: string) => {
        try {
            setIsGeneratingReport(true)
            setShowMedicationModal(false)
            console.log('🤖 Starting report generation with medications:', medications.length)

            if (!finalTranscription || finalTranscription.trim().length === 0) {
                toast.error('No transcript available to generate report')
                return
            }

            if (!currentSession) {
                toast.error('No active session found')
                return
            }

            console.log('📝 Calling AI to generate report...')
            const generatePayload = {
                transcription: finalTranscription,
                session_id: currentSession,
                patient_id: patientId,
                session_type: sessionType || 'follow_up',
                medication_plan: medications,
                patient_status: patientStatus
            }

            const reportResponse = await apiClient.post('/reports/generate', generatePayload)

            if (reportResponse.status !== 'success' || !reportResponse.data?.report) {
                throw new Error('Report generation failed')
            }

            const generatedContent = reportResponse.data.report
            console.log('✅ Report generated by AI')

            console.log('💾 Saving report to database...')
            const savePayload = {
                session_id: currentSession,
                patient_id: patientId,
                generated_content: generatedContent,
                report_type: sessionType || 'follow_up',
                status: 'completed',
                medication_plan: medications,
                patient_status: patientStatus
            }

            const saveResponse = await apiClient.post('/reports/save', savePayload)

            if (saveResponse.status !== 'success') {
                throw new Error('Failed to save report')
            }

            console.log('✅ Report saved successfully:', saveResponse.data.report.id)
            setGeneratedReport(reportResponse.data)
            setReportId(saveResponse.data.report.id)

            toast.success('Report generated and saved successfully!')

            setTimeout(() => {
                const reportElement = document.getElementById('generated-report')
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)

        } catch (error: any) {
            console.error('❌ Report generation error:', error)

            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                'Failed to generate report'

            toast.error(errorMessage)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    console.log('🎨 RENDER CHECK:', {
        loading,
        hasPatient: !!patient,
        patientName: patient?.full_name,
        patientId: patient?.id
    })

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
                                setChiefComplaint("Follow-up consultation")
                            }}
                            className="flex items-center gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Follow Up
                        </Button>
                    )}
                </div>

                {/* Recording Interface */}
                {isRecording && currentSession && (
                    <div className="space-y-4">
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

                        {/* Audio Recorder */}
                        <SimpleRecorder
                            sessionId={currentSession || ''}
                            onTranscriptUpdate={handleTranscriptionUpdate}
                            onError={(error) => {
                                console.error('[Patient Page] Recording error:', error)
                                toast.error(error)
                            }}
                            onStart={() => {
                                console.log('[Patient Page] Recording started')
                                setIsRecording(true)
                            }}
                            onStop={() => {
                                console.log('[Patient Page] Recording stopped')

                                if (liveTranscription.trim()) {
                                    setFinalTranscription(prev => {
                                        const combined = prev ? `${prev} ${liveTranscription}` : liveTranscription;
                                        console.log(`📝 Moved ${liveTranscription.length} chars to final`);
                                        return combined;
                                    });
                                    setLiveTranscription('');
                                }

                                setIsRecording(false)
                            }}
                        />
                    </div>
                )}

                {/* Patient Information Card */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Patient Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Full Name</p>
                            <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.full_name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Age</p>
                            <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.age} years</p>
                        </div>

                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Gender</p>
                            <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.gender}</p>
                        </div>

                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p>
                            <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.phone_primary}</p>
                        </div>

                        {patient.email && (
                            <div className="col-span-2">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                                <p className="text-neutral-900 dark:text-neutral-100 font-medium">{patient.email}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Consultation History */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        Consultation History ({sessions.length})
                    </h3>

                    {sessions.length === 0 ? (
                        <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
                            No previous consultations found
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                    onClick={() => {
                                        if (session.report_id) {
                                            setSelectedReportId(session.report_id)
                                            setShowReportModal(true)
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {session.session_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                                {session.chief_complaint}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                                {formatDate(session.started_at)} • {session.duration_minutes} min
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${session.status === 'completed'
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                }`}>
                                                {session.status}
                                            </span>
                                            {session.has_report && (
                                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                                    Has Report
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Editable Live Transcription */}
                {currentSession && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg p-4">
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

                {/* Mental Health Follow-Up Interface */}
                {showNewConsultation && !generatedReport && (
                    <div className="space-y-6">
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
                                                placeholder="Primary focus for today's session..."
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

                                    <div className="p-4 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg">
                                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                            <MicrophoneIcon className="h-4 w-4" />
                                            Audio Input Settings
                                        </h4>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                            Select your microphone before starting the session
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
                                            disabled={!chiefComplaint.trim() || loading}
                                            className="flex items-center gap-2"
                                        >
                                            <MicrophoneIcon className="h-4 w-4" />
                                            {loading ? 'Starting...' : 'Start Session'}
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
                    </div>
                )}
            </div>

            {/* Report Modal */}
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
