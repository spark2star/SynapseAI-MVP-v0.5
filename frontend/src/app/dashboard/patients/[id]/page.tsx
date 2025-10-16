'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Mic, Wifi, WifiOff } from 'lucide-react';
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
import { SmartVADRecorder } from '@/components/SmartVADRecorder';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import AudioDeviceSelector from '@/components/consultation/AudioDeviceSelector'
import LanguageSelector from '@/components/consultation/LanguageSelector'
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
    const [currentSessionId, setCurrentSessionId] = useState<string>(''); // ✅ FIXED: Added for VAD
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
    const [sessionState, setSessionState] = useState<'idle' | 'recording' | 'paused'>('idle')
    const [showMedicationModal, setShowMedicationModal] = useState(false)
    const [reportId, setReportId] = useState<string | null>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedPatient, setEditedPatient] = useState<any>(null)
    const [isSavingPatient, setIsSavingPatient] = useState(false)
    const [micVolume, setMicVolume] = useState(0);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const { isOnline, connectionType } = useNetworkStatus();
    const [doctorMicId, setDoctorMicId] = useState<string>(); // ✅ FIXED: Added for VAD
    const [selectedLanguage, setSelectedLanguage] = useState<string>('')
    const [sessionId, setSessionId] = useState<string | null>(null);

    // ✅ FIX: Recording duration timer (only updates when recording)
    useEffect(() => {
        if (!isRecording || isPaused) {
            return
        }

        const startTime = Date.now()
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000)
            setRecordingDuration(prev => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [isRecording, isPaused])

    // Get available devices
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            console.log('[Audio Devices]', audioInputs);

            // ✅ Find collar mic (user selects from dropdown)
            // Or auto-detect by label containing "collar", "lavalier", etc.
        });
    }, []);

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails()
            fetchConsultationSessions()
        }
    }, [patientId])

    useEffect(() => {
        if (isFollowUpMode && patient && !isRecording && !showNewConsultation && !finalTranscription) {
            setShowNewConsultation(true)
            setIsFollowUpSession(true)
            setSessionType('follow-up')
            setChiefComplaint("Follow-up consultation")
        }
    }, [isFollowUpMode, patient, isRecording, showNewConsultation, finalTranscription])

    useEffect(() => {
        if (isNewPatient && patient && !isRecording && !showNewConsultation && !finalTranscription) {
            console.log('🆕 New patient detected')
            setShowNewConsultation(true)
            setSessionType(preSelectedSessionType || 'first_session')
            setChiefComplaint('First session - Initial assessment')
            toast.success('✅ Patient registered!')
        }
    }, [isNewPatient, patient, isRecording, showNewConsultation, finalTranscription, preSelectedSessionType])

    useEffect(() => {
        const handleOpenMedicationModal = (e: any) => {
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

    const fetchPatientDetails = async () => {
        try {
            setLoading(true)
            const patientResponse = await apiClient.get(`/intake/patients/${patientId}`)

            if (patientResponse.status === 'success' && patientResponse.data) {
                const patientData = patientResponse.data

                if (!patientData || !patientData.id) {
                    throw new Error('Patient data is missing')
                }

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

                try {
                    const historyResponse = await apiClient.get(`/consultation/history/${patientId}`)
                    if (historyResponse.status === 'success') {
                        console.log('✅ History loaded')
                    }
                } catch (historyError) {
                    console.warn('⚠️ History unavailable')
                }
            } else {
                throw new Error('Invalid response')
            }
        } catch (error) {
            console.error('❌ Error fetching patient:', error)
            toast.error('Failed to load patient')
        } finally {
            setLoading(false)
        }
    }

    const fetchConsultationSessions = async () => {
        try {
            const consultationService = (await import('@/services/consultationService')).default
            const response = await consultationService.getHistory(patientId)
            const consultations = response.consultations

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
            console.error('❌ Error fetching sessions:', error)
            toast.error('Failed to load consultation history')
            setSessions([])
        }
    }

    const startConsultation = async () => {
        try {
            if (!user?.id) {
                toast.error('Error: User not authenticated')
                return
            }

            // ✅ CHECK AUDIO DEVICE SELECTION
            if (!selectedAudioDevice) {
                toast.error('Please select an audio input device first')
                return
            }

            const requestBody = {
                patient_id: patientId,
                doctor_id: user.id,
                session_type: sessionType || 'first_session',
                chief_complaint: chiefComplaint || 'Not specified'
            }

            let response = await apiClient.post('/consultation/start', requestBody)
            const sessionId = response?.data?.session_id || response?.session_id

            if (sessionId) {
                setCurrentSession(sessionId)
                setCurrentSessionId(sessionId); // ✅ FIXED: Set session ID for VAD
                // ✅ SET STATE TO RECORDING
                setSessionState('recording')
                setIsRecording(true)
                setIsPaused(false)
                setShowNewConsultation(false)
                setRecordingDuration(0)
                toast.success('Recording started!')
            } else {
                throw new Error('No session_id in response')
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message

            if (errorMessage?.toLowerCase().includes('already has an active') ||
                errorMessage?.toLowerCase().includes('active consultation')) {
                handleActiveSessionPrompt()
                return
            }

            toast.error(`Failed to start: ${errorMessage}`)
        }
    }

    const handleActiveSessionPrompt = () => {
        const confirmed = window.confirm(
            '⚠️ ACTIVE SESSION DETECTED\n\n' +
            'This patient already has an active session.\n\n' +
            'Do you want to END it and START a new one?'
        )

        if (confirmed) {
            handleForceStartSession()
        } else {
            toast('Action cancelled', { icon: 'ℹ️', duration: 4000 })
        }
    }

    const handleForceStartSession = async () => {
        const loadingToast = toast.loading('Force starting new session...')

        try {
            if (!user?.id) {
                toast.error('User session expired', { id: loadingToast })
                return
            }

            const requestBody = {
                patient_id: patientId,
                doctor_id: user.id,
                session_type: sessionType || 'first_session',
                chief_complaint: chiefComplaint || 'Not specified'
            }

            const response = await apiClient.post(
                '/consultation/start?force=true',
                requestBody
            )

            const sessionId = response?.data?.data?.session_id ||
                response?.data?.session_id ||
                response?.session_id

            if (sessionId) {
                setCurrentSession(sessionId)
                setCurrentSessionId(sessionId); // ✅ FIXED: Set session ID for VAD
                setIsRecording(true)
                setShowNewConsultation(false)
                setRecordingDuration(0)

                toast.success('🎉 New session started!', {
                    id: loadingToast,
                    duration: 4000,
                })

                await fetchPatientDetails()
            } else {
                throw new Error('No session_id after force start')
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message

            toast.error(`Force start failed: ${errorMsg}`, { id: loadingToast })
        }
    }

    const stopConsultation = async () => {
        try {
            if (currentSession) {
                console.log('🛑 Stopping session...');

                // ✅ RESET STATE FIRST
                setSessionState('idle')
                setIsRecording(false)
                setIsPaused(false)

                await new Promise(resolve => setTimeout(resolve, 200))

                const response = await apiClient.post(`/consultation/${currentSession}/stop`)

                if (response.status === 'success') {
                    console.log('✅ Session stopped:', response.data);

                    // Session stopped successfully - transcript will be shown via EditableTranscript component
                    if (!finalTranscription || !finalTranscription.trim()) {
                        toast.error('No transcript was captured during the session');
                    }

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
                    setShowNewConsultation(false) // Hide "New Consultation Session" section
                    // Keep currentSession for report generation - don't clear it
                    // setCurrentSession(null)
                    // setCurrentSessionId(''); // ✅ FIXED: Reset session ID

                    toast.success('Session completed - Review your transcript')
                }
            }
        } catch (error) {
            console.error('Error stopping:', error)
            toast.error('Failed to stop consultation')
        }
    }

    const handlePauseResume = () => {
        if (sessionState === 'recording') {
            console.log('⏸️ Pausing recording...')
            setSessionState('paused')
            setIsPaused(true)
            toast.success('Recording paused')
        } else if (sessionState === 'paused') {
            console.log('▶️ Resuming recording...')
            setSessionState('recording')
            setIsPaused(false)
            toast.success('Recording resumed')
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

    const handleTranscriptionUpdate = useCallback((data: {
        transcript: string
        isFinal: boolean
        currentFinal?: string
        currentLive?: string
    }) => {
        console.log('📝 [page.tsx] Transcription received:', {
            transcript: data.transcript.slice(0, 100) + '...',
            isFinal: data.isFinal,
            rawData: JSON.stringify(data)
        });

        // ✅ Save ALL transcripts immediately
        if (data.transcript && data.transcript.trim()) {
            const trimmedTranscript = data.transcript.trim();

            setFinalTranscription(prev => {
                const trimmedPrev = prev.trim();

                if (!trimmedTranscript) {
                    return prev;
                }

                // Check for exact duplicate at the end
                if (trimmedPrev.endsWith(trimmedTranscript)) {
                    console.log('🔄 Skipping duplicate');
                    return prev;
                }

                // Append new transcript
                const updated = trimmedPrev.length > 0
                    ? `${trimmedPrev} ${trimmedTranscript}`
                    : trimmedTranscript;

                console.log(`✅ Added: "${trimmedTranscript.slice(0, 50)}..."`);
                console.log(`📊 Total length: ${updated.length} chars`);

                return updated;
            });

            // Update live transcription
            setLiveTranscription(trimmedTranscript);
        }
    }, []);

    const handleTranscriptionEdit = (newText: string) => {
        setFinalTranscription(newText)
        toast.success('Transcript updated')
    }

    const handleGenerateReport = async (medications: Medication[] = [], patientStatus?: string) => {
        try {
            setIsGeneratingReport(true)
            setShowMedicationModal(false)

            if (!finalTranscription || finalTranscription.trim().length === 0) {
                toast.error('No transcript available')
                setIsGeneratingReport(false)
                return
            }

            if (!currentSession) {
                toast.error('No active session')
                setIsGeneratingReport(false)
                return
            }

            const generatePayload = {
                transcription: finalTranscription,
                session_id: currentSession,
                patient_id: patientId,
                session_type: sessionType || 'follow_up',
                medication_plan: medications,
                patient_status: patientStatus
            }

            const reportResponse = await apiClient.post('/reports/generate', generatePayload)

            if (reportResponse.status !== 'success' || !reportResponse.data?.generated_report) {
                throw new Error('Report generation failed')
            }

            // Report is already saved by backend, just use the response
            setGeneratedReport(reportResponse.data)
            setReportId(reportResponse.data.report_id)

            toast.success('Report generated successfully!')

            setTimeout(() => {
                const reportElement = document.getElementById('generated-report')
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)

        } catch (error: any) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                'Failed to generate report'

            toast.error(errorMessage)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    // ✅ FIX: Only log on mount (removed from render)
    useEffect(() => {
        console.log('🎨 Component mounted with patient:', patient?.full_name)
    }, [patient])

    if (!patient) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">Patient not found</h3>
                    <button
                        onClick={() => router.push('/dashboard/patients')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Back to Patients
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={isFollowUpMode ? "/dashboard" : "/dashboard/patients"}
                        className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {patient.full_name}
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400">ID: {patient.patient_id}</p>
                    </div>

                    {/* ✅ NEW: Status Indicators */}
                    <div className="flex items-center gap-4 ml-auto">
                        {/* Microphone Volume Indicator */}
                        <div className="flex items-center gap-2">
                            <Mic className={`w-5 h-5 ${micVolume > 10 ? 'text-green-500' : 'text-gray-400'}`} />
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-100 ${micVolume > 50 ? 'bg-green-500' :
                                        micVolume > 20 ? 'bg-yellow-500' :
                                            'bg-gray-400'
                                        }`}
                                    style={{ width: `${micVolume}%` }}
                                />
                            </div>
                        </div>

                        {/* Network Status Indicator */}
                        <div className="flex items-center gap-2">
                            {isOnline ? (
                                <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-sm text-green-600 font-medium">
                                        {connectionType === '2g' || connectionType === 'slow' ? '⚠️ Slow' : 'Online'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    <span className="text-sm text-red-600 font-medium">Offline</span>
                                </>
                            )}
                        </div>

                        {/* Network Error Toast */}
                        {networkError && (
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded text-sm">
                                {networkError}
                            </div>
                        )}
                    </div>

                    {!isRecording && !isFollowUpMode && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowNewConsultation(true)
                                setIsFollowUpSession(true)
                                setChiefComplaint("Follow-up consultation")
                            }}
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Follow Up
                        </Button>
                    )}
                </div>

                {/* Recording Interface */}
                {isRecording && currentSession && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 border-2 border-red-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-3 w-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                                    <span className="text-lg font-semibold text-red-800">
                                        {isPaused ? 'PAUSED' : 'RECORDING'}
                                    </span>
                                    <span className="text-sm text-red-600">
                                        {formatDuration(recordingDuration)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handlePauseResume}
                                        variant={sessionState === 'paused' ? 'primary' : 'secondary'}
                                        size="sm"
                                    >
                                        {sessionState === 'paused' ? (
                                            <>
                                                <PlayIcon className="w-4 h-4 mr-1" /> Resume
                                            </>
                                        ) : (
                                            <>
                                                <PauseIcon className="w-4 h-4 mr-1" /> Pause
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={stopConsultation}
                                        variant="secondary"
                                        size="sm"
                                        className="bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <StopIcon className="w-4 h-4 mr-1" /> Stop
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ FIXED: SmartVADRecorder with correct sessionId */}
                {currentSessionId && (
                    <SmartVADRecorder
                        sessionId={currentSessionId}
                        isActive={isRecording && !isPaused}
                        onTranscriptReceived={(transcript) => {
                            console.log('[VAD Doctor said]:', transcript);
                            // ✅ Add to final transcription
                            handleTranscriptionUpdate({
                                transcript,
                                isFinal: true
                            });
                        }}
                        doctorMicDeviceId={doctorMicId}
                    />
                )}

                {/* Patient Info */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border p-6">
                    <h3 className="text-xl font-semibold mb-4">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-neutral-500">Full Name</p>
                            <p className="font-medium">{patient.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Age</p>
                            <p className="font-medium">{patient.age} years</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Gender</p>
                            <p className="font-medium">{patient.gender}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Phone</p>
                            <p className="font-medium">{patient.phone_primary}</p>
                        </div>
                    </div>
                </div>

                {/* Transcript */}
                {currentSession && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-blue-200 p-4">
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

                {/* New Consultation Modal */}
                {showNewConsultation && !generatedReport && !isRecording && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">New Consultation Session</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Session Type</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={sessionType}
                                    onChange={(e) => setSessionType(e.target.value)}
                                >
                                    <option value="first_session">First Session</option>
                                    <option value="follow-up">Follow-up</option>
                                    <option value="therapy">Therapy</option>
                                    <option value="assessment">Assessment</option>
                                </select>
                            </div>
                            <AudioDeviceSelector
                                selectedDeviceId={selectedAudioDevice}
                                onDeviceChange={(deviceId) => {
                                    setSelectedAudioDevice(deviceId);
                                    setDoctorMicId(deviceId); // ✅ FIXED: Set doctor mic for VAD
                                }}
                            />
                            <LanguageSelector
                                selectedLanguage={selectedLanguage}
                                onLanguageChange={setSelectedLanguage}
                            />
                            <div className="flex gap-3">
                                <Button
                                    variant="primary"
                                    onClick={startConsultation}
                                    disabled={!selectedAudioDevice || !selectedLanguage}
                                >
                                    <MicrophoneIcon className="h-4 w-4 mr-2" />
                                    Start Session
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowNewConsultation(false)
                                        setIsFollowUpSession(false)
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Consultation History */}
                {!isRecording && sessions.length > 0 && !isFollowUpMode && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border p-6">
                        <h3 className="text-xl font-semibold mb-6">Consultation History</h3>
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <h4 className="font-medium">{session.session_type}</h4>
                                            <p className="text-sm text-neutral-600">{session.chief_complaint}</p>
                                            <p className="text-xs text-neutral-500 mt-2">{formatDate(session.started_at)}</p>
                                        </div>
                                        {session.has_report && session.report_id && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedReportId(session.report_id!)
                                                    setShowReportModal(true)
                                                }}
                                            >
                                                View Report
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Report Display */}
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

                {/* SimpleRecorder (fallback/backup) */}
                {currentSession && isRecording && (
                    <div className="hidden">
                        <SimpleRecorder
                            sessionId={currentSession}
                            onTranscriptUpdate={handleTranscriptionUpdate}
                            onError={(error) => toast.error(error)}
                            onStart={() => {
                                console.log('🎙️ Recording started')
                                setIsRecording(true)
                                setSessionState('recording')
                            }}
                            onStop={() => {
                                console.log('🛑 Recording stopped')
                                if (liveTranscription.trim()) {
                                    setFinalTranscription(prev => {
                                        const combined = prev ? `${prev} ${liveTranscription}` : liveTranscription
                                        return combined
                                    })
                                    setLiveTranscription('')
                                }
                                setIsRecording(false)
                                setSessionState('idle')
                            }}
                            isPaused={isPaused}
                            selectedDeviceId={selectedAudioDevice}
                            autoStart={true}
                            onVolumeChange={setMicVolume}
                            onNetworkError={setNetworkError}
                        />
                    </div>
                )}

                {/* Report Modal */}
                {showReportModal && selectedReportId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-6xl h-[90vh] bg-white rounded-lg overflow-auto">
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
        </div>
    )
}
