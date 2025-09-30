/**
 * Vertex AI-Powered Audio Recorder for Consultations
 * Uses WebSocket streaming to Vertex AI Speech-to-Text API
 * Replaces browser-based Speech Recognition with production-grade cloud STT
 */

'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import {
    MicrophoneIcon,
    StopIcon,
    PauseIcon,
    PlayIcon,
    SignalIcon
} from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

interface AudioRecorderProps {
    sessionId: string | null
    isRecording: boolean
    duration?: number
    selectedAudioDevice?: string
    selectedLanguage?: string  // Ignored - Vertex AI auto-detects
    onStart: () => void
    onStop: () => void
    onPause: () => void
    onResume: () => void
    onTranscriptionUpdate: (text: string, isFinal: boolean) => void
}

interface TranscriptionResult {
    transcript: string
    is_final: boolean
    confidence: number
    language_code: string
    speaker_tag: number | null
    words: Array<{
        word: string
        start_time: number
        end_time: number
        confidence: number
    }>
    timestamp: string
}

const VertexAIAudioRecorder = forwardRef<{ stopRecording: () => void }, AudioRecorderProps>(({
    sessionId,
    isRecording,
    duration = 0,
    selectedAudioDevice,
    selectedLanguage,  // Ignored - auto-detection
    onStart,
    onStop,
    onPause,
    onResume,
    onTranscriptionUpdate
}, ref) => {
    const [isPaused, setIsPaused] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [isConnected, setIsConnected] = useState(false)
    const [currentLanguage, setCurrentLanguage] = useState('hi-IN')
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
    const [averageConfidence, setAverageConfidence] = useState(0)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)
    const audioStreamRef = useRef<MediaStream | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const confidenceScoresRef = useRef<number[]>([])

    // Constants
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const MAX_RECONNECT_ATTEMPTS = 5
    const RECONNECT_DELAY = 2000
    const AUDIO_CHUNK_INTERVAL = 250

    // Expose stopRecording to parent via ref
    useImperativeHandle(ref, () => ({
        stopRecording: () => {
            console.log('[VertexAI] Parent called stopRecording via ref')
            stopRecording()
        }
    }))

    // Main effect - start/stop recording based on isRecording prop
    useEffect(() => {
        if (isRecording && !isPaused && sessionId) {
            console.log('[VertexAI] Starting recording - sessionId:', sessionId)
            startRecording()
        } else if (!isRecording && websocketRef.current) {
            console.log('[VertexAI] Stopping recording')
            stopRecording()
        }

        return () => {
            // Cleanup on unmount
            if (websocketRef.current || audioStreamRef.current) {
                cleanup()
            }
        }
    }, [isRecording, sessionId, isPaused])

    /**
     * Connect to Vertex AI WebSocket
     */
    const connectWebSocket = async () => {
        if (!sessionId) {
            console.error('[VertexAI] Cannot connect - no session ID')
            return
        }

        const token = localStorage.getItem('accessToken')
        if (!token) {
            toast.error('Authentication required')
            console.error('[VertexAI] No access token found')
            return
        }

        setConnectionStatus('connecting')

        const wsUrl = `${WS_URL}/ws/transcribe?token=${token}&session_id=${sessionId}`
        console.log('[VertexAI] Connecting to WebSocket:', wsUrl.replace(token, 'TOKEN'))

        const ws = new WebSocket(wsUrl)
        ws.binaryType = 'arraybuffer'

        ws.onopen = () => {
            console.log('[VertexAI] WebSocket connected')
            setConnectionStatus('connected')
            setIsConnected(true)
            reconnectAttemptsRef.current = 0
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                // Handle status messages
                if (data.status === 'connected') {
                    console.log('[VertexAI] Service ready')
                    return
                }

                if (data.status === 'completed') {
                    console.log('[VertexAI] Transcription completed')
                    return
                }

                // Handle transcription results
                if (data.transcript) {
                    const result: TranscriptionResult = data

                    // Update language indicator
                    if (result.language_code) {
                        setCurrentLanguage(result.language_code)
                    }

                    // Update confidence tracking
                    if (result.is_final && result.confidence) {
                        confidenceScoresRef.current.push(result.confidence)
                        const avg = confidenceScoresRef.current.reduce((a, b) => a + b, 0) /
                                   confidenceScoresRef.current.length
                        setAverageConfidence(avg)
                    }

                    // Send to parent component
                    onTranscriptionUpdate(result.transcript, result.is_final)

                    console.log('[VertexAI] Transcription:', {
                        text: result.transcript.substring(0, 50),
                        isFinal: result.is_final,
                        confidence: result.confidence,
                        language: result.language_code
                    })
                }

                // Handle errors
                if (data.error) {
                    console.error('[VertexAI] Server error:', data)
                    toast.error(`Transcription error: ${data.error}`)
                    setConnectionStatus('error')
                }
            } catch (err) {
                console.error('[VertexAI] Error parsing message:', err)
            }
        }

        ws.onerror = (event) => {
            console.error('[VertexAI] WebSocket error:', event)
            setConnectionStatus('error')
            toast.error('Connection error occurred')
        }

        ws.onclose = (event) => {
            console.log('[VertexAI] WebSocket closed:', event.code, event.reason)
            setConnectionStatus('disconnected')
            setIsConnected(false)

            // Attempt reconnection if recording is still active
            if (isRecording && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttemptsRef.current++
                console.log(`[VertexAI] Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`)

                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket()
                }, RECONNECT_DELAY)
            } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                toast.error('Failed to reconnect after multiple attempts')
                onStop()
            }
        }

        websocketRef.current = ws

        // Wait for connection to establish
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'))
            }, 10000)

            ws.addEventListener('open', () => {
                clearTimeout(timeout)
                resolve()
            }, { once: true })

            ws.addEventListener('error', () => {
                clearTimeout(timeout)
                reject(new Error('WebSocket connection failed'))
            }, { once: true })
        })
    }

    /**
     * Start recording audio and streaming to Vertex AI
     */
    const startRecording = async () => {
        try {
            console.log('[VertexAI] Starting recording...')
            confidenceScoresRef.current = []

            // Prepare audio constraints
            const audioConstraints: MediaTrackConstraints = {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
                channelCount: 1
            }

            // Apply selected device if available
            if (selectedAudioDevice) {
                audioConstraints.deviceId = { exact: selectedAudioDevice }
                console.log('[VertexAI] Using selected device:', selectedAudioDevice)
            }

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
            })

            audioStreamRef.current = stream

            // Log active device
            const track = stream.getAudioTracks()[0]
            if (track) {
                console.log('[VertexAI] Active device:', track.label)
            }

            // Setup audio level monitoring
            setupAudioLevelMonitoring(stream)

            // Check browser support
            const mimeType = 'audio/webm;codecs=opus'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                throw new Error('Browser does not support audio/webm;codecs=opus')
            }

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000
            })

            mediaRecorderRef.current = mediaRecorder

            // Connect WebSocket first
            await connectWebSocket()

            // Handle audio data
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
                    event.data.arrayBuffer().then((buffer) => {
                        websocketRef.current?.send(buffer)
                    }).catch((err) => {
                        console.error('[VertexAI] Error sending audio:', err)
                    })
                }
            }

            mediaRecorder.onerror = (event) => {
                console.error('[VertexAI] MediaRecorder error:', event)
                toast.error('Microphone recording error')
                stopRecording()
            }

            // Start recording with chunked output
            mediaRecorder.start(AUDIO_CHUNK_INTERVAL)
            console.log('[VertexAI] MediaRecorder started')

        } catch (err: any) {
            console.error('[VertexAI] Error starting recording:', err)
            toast.error(err.message || 'Failed to start recording')
            onStop()
        }
    }

    /**
     * Stop recording and cleanup
     */
    const stopRecording = () => {
        console.log('[VertexAI] Stopping recording and cleaning up...')

        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current = null
        }

        // Stop audio stream
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => track.stop())
            audioStreamRef.current = null
        }

        // Stop audio level monitoring
        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current)
            audioLevelIntervalRef.current = null
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
            analyserRef.current = null
        }

        // Close WebSocket
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.close()
            websocketRef.current = null
        }

        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        setConnectionStatus('disconnected')
        setIsConnected(false)
        setAudioLevel(0)

        console.log('[VertexAI] Cleanup complete')
    }

    /**
     * Cleanup on unmount
     */
    const cleanup = () => {
        stopRecording()
    }

    /**
     * Setup audio level visualization
     */
    const setupAudioLevelMonitoring = (stream: MediaStream) => {
        try {
            const audioContext = new AudioContext()
            const analyser = audioContext.createAnalyser()
            const source = audioContext.createMediaStreamSource(stream)

            analyser.fftSize = 256
            source.connect(analyser)

            audioContextRef.current = audioContext
            analyserRef.current = analyser

            // Update audio level periodically
            audioLevelIntervalRef.current = setInterval(() => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                    analyserRef.current.getByteFrequencyData(dataArray)

                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                    setAudioLevel(Math.min(100, average * 1.5))
                }
            }, 100)
        } catch (err) {
            console.error('[VertexAI] Error setting up audio monitoring:', err)
        }
    }

    /**
     * Get language display name
     */
    const getLanguageName = (code: string): string => {
        const languages: { [key: string]: string } = {
            'hi-IN': '🇮🇳 Hindi',
            'mr-IN': '🇮🇳 Marathi',
            'en-IN': '🇮🇳 English'
        }
        return languages[code] || code
    }

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isRecording ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <MicrophoneIcon className={`w-6 h-6 ${isRecording ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Vertex AI Transcription
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Real-time, multi-language
                        </p>
                    </div>
                </div>

                {/* Connection Status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    connectionStatus === 'connected' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                    connectionStatus === 'connecting' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                    connectionStatus === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                    <SignalIcon className="w-4 h-4" />
                    {connectionStatus === 'connected' && 'Connected'}
                    {connectionStatus === 'connecting' && 'Connecting...'}
                    {connectionStatus === 'disconnected' && 'Disconnected'}
                    {connectionStatus === 'error' && 'Error'}
                </div>
            </div>

            {/* Audio Level & Stats */}
            {isRecording && (
                <div className="space-y-3 mb-4">
                    {/* Audio Level Bar */}
                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Audio Level</span>
                            <span className="text-gray-900 dark:text-white font-medium">{Math.round(audioLevel)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-100"
                                style={{ width: `${audioLevel}%` }}
                            />
                        </div>
                    </div>

                    {/* Language & Confidence */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Language:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {getLanguageName(currentLanguage)}
                            </span>
                        </div>
                        {averageConfidence > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {(averageConfidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Message */}
            {!isRecording && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    ✨ Using Vertex AI Speech-to-Text with automatic multi-language detection (Hindi, Marathi, English)
                </div>
            )}
        </div>
    )
})

VertexAIAudioRecorder.displayName = 'VertexAIAudioRecorder'

export default VertexAIAudioRecorder
