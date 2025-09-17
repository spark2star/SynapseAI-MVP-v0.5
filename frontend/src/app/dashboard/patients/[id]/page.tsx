'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
import { useAuthStore } from '@/store/authStore'
import apiService from '@/services/api'

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
    const patientId = params?.id as string
    const { user } = useAuthStore()
    
    const [patient, setPatient] = useState<Patient | null>(null)
    const [sessions, setSessions] = useState<ConsultationSession[]>([])
    const [loading, setLoading] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [currentSession, setCurrentSession] = useState<string | null>(null)
    const [chiefComplaint, setChiefComplaint] = useState('')
    const [showNewConsultation, setShowNewConsultation] = useState(false)
    const [liveTranscription, setLiveTranscription] = useState('')
    const [finalTranscription, setFinalTranscription] = useState('')

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails()
            fetchConsultationSessions()
        }
    }, [patientId])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isRecording])

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
                last_visit: patientId === 'patient-1' ? null : '2024-01-15T10:00:00Z'
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
        try {
            if (currentSession) {
                const response = await apiService.post(`/consultation/${currentSession}/stop`)
                
                if (response.status === 'success') {
                    setIsRecording(false)
                    
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
                    setCurrentSession(null)
                    setChiefComplaint('')
                    setRecordingDuration(0)
                    
                    toast.success('Consultation session completed')
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
        if (isFinal) {
            setFinalTranscription(prev => prev + ' ' + text)
            setLiveTranscription('')
        } else {
            setLiveTranscription(text)
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard/patients"
                    className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-neutral-900">{patient.full_name}</h1>
                    <p className="text-neutral-600">Patient ID: {patient.patient_id}</p>
                </div>
                
                {!isRecording && (
                    <Button
                        variant="primary"
                        onClick={() => setShowNewConsultation(true)}
                        className="flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Consultation
                    </Button>
                )}
            </div>

            {/* Audio Recording Interface */}
            {isRecording && currentSession && (
                <div className="space-y-4">
                    <AudioRecorder
                        sessionId={currentSession}
                        isRecording={isRecording}
                        onStart={startConsultation}
                        onStop={stopConsultation}
                        onPause={() => {}}
                        onResume={() => {}}
                        onTranscriptionUpdate={handleTranscriptionUpdate}
                    />
                    
                    {/* Live Transcription Display */}
                    {(finalTranscription || liveTranscription) && (
                        <div className="medical-card">
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Session Transcription</h3>
                                <div className="text-sm text-neutral-700 space-y-2 max-h-48 overflow-y-auto">
                                    {finalTranscription && (
                                        <div className="whitespace-pre-wrap">{finalTranscription}</div>
                                    )}
                                    {liveTranscription && (
                                        <div className="text-neutral-500 italic">
                                            {liveTranscription}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* New Consultation Modal */}
            {showNewConsultation && (
                <div className="medical-card bg-blue-50 border-blue-200">
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Start New Consultation</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-2">
                                    Chief Complaint
                                </label>
                                <Input
                                    placeholder="What is the main reason for today's visit?"
                                    value={chiefComplaint}
                                    onChange={(e) => setChiefComplaint(e.target.value)}
                                    className="w-full"
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
                                    Start Recording
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowNewConsultation(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="lg:col-span-2 medical-card">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Patient Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Age</label>
                                <p className="text-neutral-900">{patient.age} years</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Gender</label>
                                <p className="text-neutral-900 capitalize">{patient.gender}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Phone</label>
                                <p className="text-neutral-900 flex items-center gap-2">
                                    <PhoneIcon className="h-4 w-4 text-neutral-400" />
                                    {patient.phone_primary}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Email</label>
                                <p className="text-neutral-900 flex items-center gap-2">
                                    <EnvelopeIcon className="h-4 w-4 text-neutral-400" />
                                    {patient.email}
                                </p>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700">Address</label>
                                <p className="text-neutral-900">{patient.address}</p>
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
                                <p className="text-sm text-neutral-600">Last Visit</p>
                                <p className="font-medium text-neutral-900">
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
                                <p className="text-sm text-neutral-600">Blood Group</p>
                                <p className="font-medium text-neutral-900">{patient.blood_group}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="medical-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <DocumentTextIcon className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Sessions</p>
                                <p className="font-medium text-neutral-900">{sessions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="medical-card">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Medical History</h3>
                        <p className="text-neutral-700">{patient.medical_history || 'No medical history recorded'}</p>
                    </div>
                </div>
                
                <div className="medical-card">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Allergies</h3>
                        <p className="text-neutral-700">{patient.allergies || 'No known allergies'}</p>
                    </div>
                </div>
            </div>

            {/* Consultation Sessions */}
            <div className="medical-card">
                <div className="px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900">Consultation History</h2>
                </div>
                
                {sessions.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <ClockIcon className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900">No consultation sessions</h3>
                        <p className="mt-1 text-sm text-neutral-500">Start a new consultation to begin recording.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200">
                        {sessions.map((session) => (
                            <div key={session.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-medium text-neutral-900">
                                                {session.session_id}
                                            </h3>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                session.status === 'completed' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm text-neutral-600 mb-2">
                                            {session.chief_complaint}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-neutral-500">
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
    )
}
