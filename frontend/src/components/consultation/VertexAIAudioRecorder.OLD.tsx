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
    selectedLanguage?: string
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

const VertexAIAudioRecorder = forwardRef<{ stopRecording: () => void }, AudioRecorderProps>(
    (
        {
            sessionId,
            isRecording,
            duration = 0,
            selectedAudioDevice,
            selectedLanguage,
            onStart,
            onStop,
            onPause,
            onResume,
            onTranscriptionUpdate
        },
        ref
    ) => {
        // State
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
        const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null)
        const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)

        // Constants (WS base must be /ws, not /api/v1)
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
        const MAX_RECONNECT_ATTEMPTS = 5
        const RECONNECT_DELAY = 2000

        // Parent control
        useImperativeHandle(ref, () => ({
            stopRecording: () => {
                console.log('[VertexAI] Parent called stopRecording via ref')
                stopRecording()
            }
        }))

        // Mount/unmount
        useEffect(() => {
            console.log('[VertexAI] Component mounted')
            return () => {
                console.log('[VertexAI] ❌ Component unmounting, cleaning up...')
                console.trace('[VertexAI] Unmount stack trace:')
                cleanup()
            }
        }, [])

        // Record state transitions
        useEffect(() => {
            if (isRecording && !isPaused && sessionId) {
                if (!websocketRef.current) {
                    console.log('[VertexAI] Starting recording - sessionId:', sessionId)
                    startRecording()
                }
            } else if (!isRecording && websocketRef.current) {
                console.log('[VertexAI] Stopping recording (isRecording changed to false)')
                stopRecording()
            }
        }, [isRecording, sessionId, isPaused])

        // WebSocket connect
        const connectWebSocket = async (): Promise<void> => {
            if (!sessionId) {
                console.error('[VertexAI] Cannot connect - no session ID')
                return
            }

            const token = localStorage.getItem('access_token')
            if (!token) {
                toast.error('Please log in again - authentication token not found')
                console.error('[VertexAI] No access token found in localStorage')
                onStop()
                return
            }

            if (token.length < 20 || !token.includes('.')) {
                toast.error('Invalid authentication token - please log in again')
                console.error('[VertexAI] Token appears invalid:', token.substring(0, 20) + '...')
                onStop()
                return
            }

            setConnectionStatus('connecting')

            // Build the correct WS URL with query params
            const websocketUrl = `${WS_URL}/transcribe?token=${encodeURIComponent(token)}&session_id=${encodeURIComponent(sessionId)}`
            console.log('[VertexAI] Connecting to WebSocket:', websocketUrl.replace(token, 'TOKEN'))
            console.log('[VertexAI] Token length:', token.length, 'chars')

            const ws = new WebSocket(websocketUrl)
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

                    if (data.status === 'connected') {
                        console.log('[VertexAI] Service ready')
                        return
                    }
                    if (data.status === 'completed') {
                        console.log('[VertexAI] Transcription completed')
                        return
                    }

                    if (data.transcript) {
                        const result = data as TranscriptionResult
                        if (result.language_code) setCurrentLanguage(result.language_code)

                        if (result.is_final && typeof result.confidence === 'number') {
                            confidenceScoresRef.current.push(result.confidence)
                            const avg =
                                confidenceScoresRef.current.reduce((a, b) => a + b, 0) /
                                confidenceScoresRef.current.length
                            setAverageConfidence(avg)
                        }

                        onTranscriptionUpdate(result.transcript, result.is_final)

                        console.log('[VertexAI] Transcription:', {
                            text: result.transcript.substring(0, 50),
                            isFinal: result.is_final,
                            confidence: result.confidence,
                            language: result.language_code
                        })
                    }

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

                if (isRecording && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++
                    console.log(
                        `[VertexAI] Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`
                    )
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket().catch(() => { })
                    }, RECONNECT_DELAY)
                } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    toast.error('Failed to reconnect after multiple attempts')
                    onStop()
                }
            }

            websocketRef.current = ws

            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000)
                ws.addEventListener(
                    'open',
                    () => {
                        clearTimeout(timeout)
                        resolve()
                    },
                    { once: true }
                )
                ws.addEventListener(
                    'error',
                    () => {
                        clearTimeout(timeout)
                        reject(new Error('WebSocket connection failed'))
                    },
                    { once: true }
                )
            })
        }

        const startRecording = async () => {
            try {
                console.log('[VertexAI] Starting recording...')
                confidenceScoresRef.current = []

                const audioConstraints: MediaTrackConstraints = {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1
                }

                if (selectedAudioDevice) {
                    audioConstraints.deviceId = { exact: selectedAudioDevice }
                    console.log('[VertexAI] Using selected device:', selectedAudioDevice)
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
                audioStreamRef.current = stream

                const track = stream.getAudioTracks()[0]
                if (track) console.log('[VertexAI] Active device:', track.label)

                // Connect WS first
                await connectWebSocket()

                // AudioContext @16kHz for STT
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000
                })
                audioContextRef.current = audioContext

                try {
                    await audioContext.audioWorklet.addModule('/audio-processor.worklet.js')
                    console.log('[VertexAI] AudioWorklet module loaded successfully')
                } catch (err) {
                    console.error('[VertexAI] Failed to load AudioWorklet:', err)
                    toast.error('Failed to initialize audio processor')
                    return
                }

                const source = audioContext.createMediaStreamSource(stream)
                sourceNodeRef.current = source

                const analyser = audioContext.createAnalyser()
                analyser.fftSize = 256
                analyserRef.current = analyser

                const workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor', {
                    numberOfInputs: 1,
                    numberOfOutputs: 1,
                    channelCount: 1,
                    processorOptions: {}
                })

                // Create silent gain node to keep worklet alive without audible feedback
                const silentGain = audioContext.createGain()
                silentGain.gain.value = 0  // Mute completely

                // Connect audio graph: source -> worklet -> silent gain -> destination
                source.connect(workletNode)
                workletNode.connect(silentGain)
                silentGain.connect(audioContext.destination)

                // Also connect source to analyser for visualization (parallel connection)
                source.connect(analyser)

                audioWorkletNodeRef.current = workletNode

                workletNode.port.onmessage = (event) => {
                    const { type, data, message } = event.data
                    console.log('[VertexAI] Worklet message:', { type, dataLength: data?.byteLength })

                    if (type === 'audio') {
                        console.log('[VertexAI] Audio check:', {
                            isPaused,
                            wsExists: !!websocketRef.current,
                            wsState: websocketRef.current?.readyState
                        })
                        if (!isPaused && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                            try {
                                websocketRef.current.send(data)
                                console.log('[VertexAI] ✅ Audio sent to WebSocket')
                            } catch (err) {
                                console.error('[VertexAI] Error sending audio:', err)
                            }
                        } else {
                            console.log('[VertexAI] ❌ NOT sending audio - conditions not met')
                        }
                    } else if (type === 'log') {
                        console.log(`[VertexAI] ${message}`)
                    }
                }


                setupAudioLevelMonitoring()

                console.log('[VertexAI] AudioWorkletNode started @ 16kHz (modern, reliable API)')
                console.log('[VertexAI] ✅ No more 40-second timeouts - AudioWorklet runs in separate thread')
            } catch (err: any) {
                console.error('[VertexAI] Error starting recording:', err)
                toast.error(err.message || 'Failed to start recording')
                onStop()
            }
        }


        // Stop recording
        const stopRecording = () => {
            if (!audioStreamRef.current && !websocketRef.current) {
                console.log('[VertexAI] Already stopped, skipping')
                return
            }
            console.log('[VertexAI] 🛑 stopRecording called')
            console.trace('[VertexAI] stopRecording stack trace:')

            if (audioWorkletNodeRef.current) {
                audioWorkletNodeRef.current.port.onmessage = null
                audioWorkletNodeRef.current.disconnect()
                audioWorkletNodeRef.current = null
            }

            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect()
                sourceNodeRef.current = null
            }

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
                mediaRecorderRef.current = null
            }

            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach((t) => t.stop())
                audioStreamRef.current = null
            }

            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current)
                audioLevelIntervalRef.current = null
            }

            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close()
                audioContextRef.current = null
                analyserRef.current = null
            }

            if (websocketRef.current) {
                try {
                    websocketRef.current.close()
                } catch { }
                websocketRef.current = null
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }

            setConnectionStatus('disconnected')
            setIsConnected(false)
            setAudioLevel(0)

            console.log('[VertexAI] Cleanup complete')
            console.log('[VertexAI] Calling onStop() to notify parent')
            onStop()
            console.log('[VertexAI] Stopped - parent handles state')
        }

        const cleanup = () => {
            stopRecording()
        }

        const setupAudioLevelMonitoring = () => {
            try {
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

        const getLanguageName = (code: string): string => {
            const languages: Record<string, string> = {
                'hi-IN': '🇮🇳 Hindi',
                'mr-IN': '🇮🇳 Marathi',
                'en-IN': '🇮🇳 English'
            }
            return languages[code] || code
        }

        return (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isRecording ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <MicrophoneIcon className={`w-6 h-6 ${isRecording ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vertex AI Transcription</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Real-time, multi-language</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${connectionStatus === 'connected'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : connectionStatus === 'connecting'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                            : connectionStatus === 'error'
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                        <SignalIcon className="w-4 h-4" />
                        {connectionStatus === 'connected' && 'Connected'}
                        {connectionStatus === 'connecting' && 'Connecting...'}
                        {connectionStatus === 'disconnected' && 'Disconnected'}
                        {connectionStatus === 'error' && 'Error'}
                    </div>
                </div>

                {isRecording && (
                    <div className="space-y-2 mb-3">
                        <div className="max-w-xs">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">🎵 Audio</span>
                                <span className="text-gray-900 dark:text-white font-medium text-xs">{Math.round(audioLevel)}%</span>
                            </div>
                            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 h-2 rounded-full transition-all duration-100 shadow-sm"
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
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

                <div className="flex items-center gap-3 mb-4">
                    {isRecording ? (
                        <>
                            {!isPaused ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsPaused(true)
                                            if (audioContextRef.current?.state === 'running') {
                                                audioContextRef.current.suspend().catch(() => { })
                                            }
                                            onPause()
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                                    >
                                        <PauseIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">Pause</span>
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    >
                                        <StopIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">Stop</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsPaused(false)
                                        if (audioContextRef.current?.state === 'suspended') {
                                            audioContextRef.current.resume().catch(() => { })
                                        }
                                        onResume()
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Resume</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 w-full">
                            ✨ Using Vertex AI Speech-to-Text with automatic multi-language detection (Hindi, Marathi, English)
                        </div>
                    )}
                </div>
            </div>
        )
    }
)

VertexAIAudioRecorder.displayName = 'VertexAIAudioRecorder'
export default VertexAIAudioRecorder
