'use client'

import { useState, useEffect, useRef } from 'react'
import {
    MicrophoneIcon,
    StopIcon,
    PauseIcon,
    PlayIcon,
    SpeakerWaveIcon
} from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

interface AudioRecorderProps {
    sessionId: string
    isRecording: boolean
    onStart: () => void
    onStop: () => void
    onPause: () => void
    onResume: () => void
    onTranscriptionUpdate: (text: string, isFinal: boolean) => void
}

interface TranscriptionChunk {
    text: string
    confidence: number
    timestamp: string
    isFinal: boolean
}

export default function AudioRecorder({
    sessionId,
    isRecording,
    onStart,
    onStop,
    onPause,
    onResume,
    onTranscriptionUpdate
}: AudioRecorderProps) {
    const [isPaused, setIsPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioLevel, setAudioLevel] = useState(0)
    const [transcriptionChunks, setTranscriptionChunks] = useState<TranscriptionChunk[]>([])
    const [currentInterimText, setCurrentInterimText] = useState('')
    const [isConnected, setIsConnected] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isRecording && !isPaused) {
            startRecording()
        } else if (!isRecording) {
            stopRecording()
        }

        return () => {
            cleanup()
        }
    }, [isRecording, sessionId])

    useEffect(() => {
        if (isRecording) {
            // Start duration timer
            durationIntervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)
        } else {
            // Stop duration timer
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
                durationIntervalRef.current = null
            }
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
            }
        }
    }, [isRecording, isPaused])

    const startRecording = async () => {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1
                }
            })

            streamRef.current = stream

            // Set up audio level monitoring
            setupAudioLevelMonitoring(stream)

            // Set up WebSocket for real-time transcription
            await setupWebSocket()

            // Set up MediaRecorder for audio streaming
            setupMediaRecorder(stream)

            setDuration(0)
            toast.success('Recording started')

        } catch (error) {
            console.error('Error starting recording:', error)
            toast.error('Failed to start recording. Please check microphone permissions.')
        }
    }

    const stopRecording = () => {
        try {
            // Stop MediaRecorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
            }

            // Close WebSocket
            if (websocketRef.current) {
                websocketRef.current.send(JSON.stringify({ type: 'stop_recording' }))
                websocketRef.current.close()
            }

            // Stop audio stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }

            cleanup()
            setDuration(0)
            setIsPaused(false)

            toast.success('Recording stopped')

        } catch (error) {
            console.error('Error stopping recording:', error)
            toast.error('Failed to stop recording')
        }
    }

    const pauseRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.pause()
                setIsPaused(true)

                if (websocketRef.current) {
                    websocketRef.current.send(JSON.stringify({ type: 'pause_recording' }))
                }

                onPause()
                toast('Recording paused', {
                    icon: '⏸️',
                    style: {
                        background: '#f59e0b',
                        color: '#ffffff',
                    }
                })
            }
        } catch (error) {
            console.error('Error pausing recording:', error)
            toast.error('Failed to pause recording')
        }
    }

    const resumeRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
                mediaRecorderRef.current.resume()
                setIsPaused(false)

                if (websocketRef.current) {
                    websocketRef.current.send(JSON.stringify({ type: 'resume_recording' }))
                }

                onResume()
                toast('Recording resumed', {
                    icon: '▶️',
                    style: {
                        background: '#10b981',
                        color: '#ffffff',
                    }
                })
            }
        } catch (error) {
            console.error('Error resuming recording:', error)
            toast.error('Failed to resume recording')
        }
    }

    const setupWebSocket = async (): Promise<void> => {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(`ws://localhost:8000/ws/consultation/${sessionId}`)

                ws.onopen = () => {
                    console.log('WebSocket connected for transcription')
                    setIsConnected(true)
                    resolve()
                }

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        handleWebSocketMessage(data)
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error)
                    }
                }

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    setIsConnected(false)
                    reject(error)
                }

                ws.onclose = () => {
                    console.log('WebSocket connection closed')
                    setIsConnected(false)
                }

                websocketRef.current = ws

            } catch (error) {
                console.error('Error setting up WebSocket:', error)
                reject(error)
            }
        })
    }

    const setupMediaRecorder = (stream: MediaStream) => {
        try {
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 48000
            })

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
                    // Send audio data to WebSocket for real-time transcription
                    websocketRef.current.send(event.data)
                }
            }

            mediaRecorder.onstart = () => {
                console.log('MediaRecorder started')
            }

            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped')
            }

            // Start recording with small chunks for real-time processing
            mediaRecorder.start(250) // 250ms chunks
            mediaRecorderRef.current = mediaRecorder

        } catch (error) {
            console.error('Error setting up MediaRecorder:', error)
            toast.error('Failed to set up audio recording')
        }
    }

    const setupAudioLevelMonitoring = (stream: MediaStream) => {
        try {
            const audioContext = new AudioContext()
            const analyser = audioContext.createAnalyser()
            const source = audioContext.createMediaStreamSource(stream)

            analyser.fftSize = 256
            source.connect(analyser)

            audioContextRef.current = audioContext
            analyserRef.current = analyser

            // Start monitoring audio level
            audioLevelIntervalRef.current = setInterval(() => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                    analyserRef.current.getByteFrequencyData(dataArray)

                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                    setAudioLevel(Math.min(100, (average / 256) * 100))
                }
            }, 100)

        } catch (error) {
            console.error('Error setting up audio level monitoring:', error)
        }
    }

    const handleWebSocketMessage = (data: any) => {
        switch (data.type) {
            case 'transcription':
                if (data.data) {
                    const transcriptionData = data.data

                    if (transcriptionData.type === 'interim') {
                        setCurrentInterimText(transcriptionData.transcript)
                        onTranscriptionUpdate(transcriptionData.transcript, false)
                    } else if (transcriptionData.type === 'final') {
                        const newChunk: TranscriptionChunk = {
                            text: transcriptionData.transcript,
                            confidence: transcriptionData.confidence,
                            timestamp: transcriptionData.timestamp,
                            isFinal: true
                        }

                        setTranscriptionChunks(prev => [...prev, newChunk])
                        setCurrentInterimText('')
                        onTranscriptionUpdate(transcriptionData.transcript, true)
                    }
                }
                break

            case 'connected':
                console.log('Connected to consultation session')
                break

            case 'error':
                console.error('WebSocket error:', data.message)
                toast.error(`Transcription error: ${data.message}`)
                break

            default:
                console.log('Unknown WebSocket message type:', data.type)
        }
    }

    const cleanup = () => {
        // Clear intervals
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current)
            durationIntervalRef.current = null
        }

        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current)
            audioLevelIntervalRef.current = null
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        // Reset state
        setAudioLevel(0)
        setIsConnected(false)
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${isRecording ? 'bg-red-100' : 'bg-neutral-100'}`}>
                        <MicrophoneIcon className={`h-6 w-6 ${isRecording ? 'text-red-600' : 'text-neutral-600'}`} />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                            {isRecording ? (isPaused ? 'Recording Paused' : 'Recording Active') : 'Ready to Record'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <span>{formatDuration(duration)}</span>
                            {isConnected && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                        STT Connected
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Audio Level Indicator */}
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <SpeakerWaveIcon className="h-5 w-5 text-neutral-600" />
                        <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-100"
                                style={{ width: `${audioLevel}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
                {!isRecording ? (
                    <button
                        onClick={onStart}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <MicrophoneIcon className="h-4 w-4" />
                        Start Recording
                    </button>
                ) : (
                    <>
                        {!isPaused ? (
                            <button
                                onClick={pauseRecording}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                <PauseIcon className="h-4 w-4" />
                                Pause
                            </button>
                        ) : (
                            <button
                                onClick={resumeRecording}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <PlayIcon className="h-4 w-4" />
                                Resume
                            </button>
                        )}

                        <button
                            onClick={onStop}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <StopIcon className="h-4 w-4" />
                            Stop Recording
                        </button>
                    </>
                )}
            </div>

            {/* Live Transcription Display */}
            {(transcriptionChunks.length > 0 || currentInterimText) && (
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">Live Transcription</h4>
                    <div className="text-sm text-neutral-700 space-y-1 max-h-32 overflow-y-auto">
                        {transcriptionChunks.map((chunk, index) => (
                            <span key={index} className="block">
                                {chunk.text}
                            </span>
                        ))}
                        {currentInterimText && (
                            <span className="text-neutral-500 italic">
                                {currentInterimText}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
