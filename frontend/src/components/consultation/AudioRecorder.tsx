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
    duration?: number  // Optional prop to sync with parent timer
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
    language?: string
    hasCodeMixing?: boolean
}

export default function AudioRecorder({
    sessionId,
    isRecording,
    duration = 0,
    onStart,
    onStop,
    onPause,
    onResume,
    onTranscriptionUpdate
}: AudioRecorderProps) {
    const [isPaused, setIsPaused] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [transcriptionChunks, setTranscriptionChunks] = useState<TranscriptionChunk[]>([])
    const [currentInterimText, setCurrentInterimText] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [currentLanguage, setCurrentLanguage] = useState('en-IN') // Default to English India
    const [codeMixingMode, setCodeMixingMode] = useState(true) // Enable code-mixing processing

    // Helper function to generate language context for LLM processing
    const getLanguageContext = (): string => {
        const codeMixedChunks = transcriptionChunks.filter(chunk => chunk.hasCodeMixing)
        const totalChunks = transcriptionChunks.length

        if (codeMixedChunks.length === 0) {
            return "This transcript is in English."
        }

        const mixingPercentage = Math.round((codeMixedChunks.length / totalChunks) * 100)

        return `This transcript contains code-mixing between English and Indian languages (Hindi/Marathi) in approximately ${mixingPercentage}% of the conversation. Hindi and Marathi words are written in Roman script. Please consider this multilingual context when analyzing the content for mental health insights.`
    }

    // Language options for Indian mental health context
    const languageOptions = [
        { code: 'en-IN', name: 'English (India)', primary: true },
        { code: 'hi-IN', name: 'Hindi (India)', primary: false },
        { code: 'mr-IN', name: 'Marathi (India)', primary: false },
        { code: 'en-US', name: 'English (US)', primary: false }
    ]

    // Simple processing for mental health context (keeping everything in Roman script)
    const processMentalHealthTranscript = (text: string, language: string): string => {
        // Just clean up the text without transliteration
        let processed = text
            .replace(/\s+/g, ' ') // Multiple spaces
            .replace(/([.!?])\s*([.!?])/g, '$1') // Duplicate punctuation
            .trim()

        // Capitalize first letter
        return processed.charAt(0).toUpperCase() + processed.slice(1)
    }

    // Simple language detection for logging purposes
    const tryAlternativeLanguage = (transcript: string) => {
        const words = transcript.toLowerCase().split(' ')

        // Common Hindi/Marathi words (for detection only)
        const hindiWords = ['main', 'mujhe', 'hun', 'hai', 'raha', 'rahi', 'nahi', 'bahut', 'kya', 'kaise', 'hoon', 'kar', 'aur']
        const marathiWords = ['mala', 'aahe', 'ahe', 'kay', 'kase', 'khup', 'mi', 'tu', 'to']

        const hindiCount = words.filter(word => hindiWords.includes(word)).length
        const marathiCount = words.filter(word => marathiWords.includes(word)).length
        const totalWords = words.length

        // Just log the language mix for analytics (no switching)
        if (hindiCount > 0 || marathiCount > 0) {
            console.log(`🌍 Code-mixing detected - Hindi: ${hindiCount}, Marathi: ${marathiCount}, English/Other: ${totalWords - hindiCount - marathiCount}`)

            // Optional: Show subtle indicator
            if (hindiCount / totalWords > 0.2) {
                console.log('📝 Predominantly Hindi-English mix')
            } else if (marathiCount / totalWords > 0.2) {
                console.log('📝 Predominantly Marathi-English mix')
            }
        }
    }

    // Restart recognition with new language
    const restartWithNewLanguage = (newLang: string) => {
        if (speechRecognitionRef.current && isRecording) {
            speechRecognitionRef.current.stop()
            setTimeout(() => {
                setCurrentLanguage(newLang)
                // Will restart automatically with new language
            }, 500)
        }
    }

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const speechRecognitionRef = useRef<any>(null)
    const recognitionActiveRef = useRef<boolean>(false)
    const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isPausedRef = useRef<boolean>(false)

    // Keep isPausedRef in sync with isPaused state
    useEffect(() => {
        isPausedRef.current = isPaused
    }, [isPaused])

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

    // Timer is now managed by parent component

    const startRecording = async () => {
        try {
            // Request microphone access for audio level monitoring
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: true,
                    sampleRate: { ideal: 48000 },
                    channelCount: 1
                },
                video: false
            })

            streamRef.current = stream

            // Set up audio level monitoring (visual feedback)
            setupAudioLevelMonitoring(stream)

            // Setup and start Web Speech API
            const recognition = setupWebSpeechAPI()
            if (!recognition) {
                throw new Error('Speech recognition not supported')
            }

            speechRecognitionRef.current = recognition
            recognition.start()

            toast.success('Recording started with Web Speech API')
            console.log('🎤 Web Speech API recording started')

        } catch (error) {
            console.error('Error starting recording:', error)
            toast.error('Failed to start recording. Please check microphone permissions.')
        }
    }

    const stopRecording = () => {
        try {
            // Clear restart timeout
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current)
                restartTimeoutRef.current = null
            }

            // Stop Web Speech API
            if (speechRecognitionRef.current) {
                recognitionActiveRef.current = false
                speechRecognitionRef.current.stop()
                speechRecognitionRef.current = null
                console.log('🛑 Web Speech API stopped')
            }

            // Stop audio stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }

            cleanup()
            setIsPaused(false)
            setIsConnected(false)
            setCurrentInterimText('')

            toast.success('Recording stopped')

        } catch (error) {
            console.error('Error stopping recording:', error)
            toast.error('Failed to stop recording')
        }
    }

    const pauseRecording = () => {
        try {
            if (isRecording && !isPaused) {
                setIsPaused(true)

                // Clear restart timeout
                if (restartTimeoutRef.current) {
                    clearTimeout(restartTimeoutRef.current)
                    restartTimeoutRef.current = null
                }

                // Pause Web Speech API
                if (speechRecognitionRef.current) {
                    recognitionActiveRef.current = false
                    speechRecognitionRef.current.stop()
                    console.log('⏸️ Web Speech API paused')
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

    // Setup Web Speech API for transcription
    const setupWebSpeechAPI = () => {
        // Check for Web Speech API support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {
            console.error('Web Speech API not supported')
            toast.error('Speech recognition not supported in this browser')
            return null
        }

        const recognition = new SpeechRecognition()

        // Configure speech recognition for Indian languages and mental health
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = currentLanguage // Dynamic language setting
        recognition.maxAlternatives = 3 // More alternatives for better accuracy

        // Additional configuration for better accuracy
        if (typeof recognition.serviceURI !== 'undefined') {
            recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize'
        }

        console.log('🌍 Speech recognition configured for:', recognition.lang)

        // Handle speech recognition events
        recognition.onstart = () => {
            console.log('🎤 Speech recognition started')
            recognitionActiveRef.current = true
            setIsConnected(true)
        }

        recognition.onresult = (event: any) => {
            let interimTranscript = ''
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                const confidence = event.results[i][0].confidence || 0.95

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' '

                    // Process for mental health context (simple cleanup)
                    const processedTranscript = processMentalHealthTranscript(transcript.trim(), currentLanguage)

                    // Detect code-mixing for metadata
                    const words = processedTranscript.toLowerCase().split(' ')
                    const hindiWords = ['main', 'mujhe', 'hun', 'hai', 'raha', 'rahi', 'nahi', 'bahut', 'kya', 'kaise']
                    const marathiWords = ['mala', 'aahe', 'kay', 'kase', 'khup']
                    const hasHindi = words.some(word => hindiWords.includes(word))
                    const hasMarathi = words.some(word => marathiWords.includes(word))
                    const hasCodeMixing = hasHindi || hasMarathi

                    // Add to transcription chunks with metadata
                    const chunk: TranscriptionChunk = {
                        text: processedTranscript,
                        confidence: confidence,
                        timestamp: new Date().toISOString(),
                        isFinal: true,
                        language: currentLanguage,
                        hasCodeMixing: hasCodeMixing
                    }

                    setTranscriptionChunks(prev => [...prev, chunk])
                    onTranscriptionUpdate(processedTranscript, true)

                    console.log('✅ FINAL (' + currentLanguage + '):', processedTranscript, hasCodeMixing ? '[Code-mixed]' : '[English]')

                    // Simple language detection for logging
                    if (hasCodeMixing) {
                        tryAlternativeLanguage(processedTranscript)
                    }
                } else {
                    interimTranscript += transcript
                    setCurrentInterimText(interimTranscript)
                    onTranscriptionUpdate(interimTranscript, false)

                    console.log('📝 interim:', interimTranscript)
                }
            }
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)

            if (event.error === 'not-allowed') {
                toast.error('Microphone access denied')
                recognitionActiveRef.current = false
            } else if (event.error === 'aborted') {
                console.log('Speech recognition aborted (likely due to restart)')
                // Don't restart on abort - it's usually intentional
                recognitionActiveRef.current = false
            } else if (event.error === 'no-speech') {
                console.log('No speech detected, continuing listening...')
                // Don't stop on no-speech, keep listening
                // recognitionActiveRef.current = false // Commented out to keep listening
            } else {
                console.log(`Speech recognition error: ${event.error}`)
                recognitionActiveRef.current = false
            }
        }

        recognition.onend = () => {
            console.log('🛑 Speech recognition ended')
            recognitionActiveRef.current = false

            // Clear any existing restart timeout
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current)
                restartTimeoutRef.current = null
            }

            // Only restart if we're still actively recording
            if (isRecording && !isPaused) {
                console.log('🔄 Scheduling speech recognition restart...')
                restartTimeoutRef.current = setTimeout(() => {
                    // Double-check we still need to restart and no recognition is active
                    if (isRecording && !isPaused && !recognitionActiveRef.current && speechRecognitionRef.current) {
                        try {
                            speechRecognitionRef.current.start()
                            console.log('✅ Speech recognition restarted successfully')
                        } catch (e) {
                            console.log('Recognition restart failed:', e)
                        }
                    }
                    restartTimeoutRef.current = null
                }, 2000)  // 2 second delay for more stable restarts
            } else {
                setIsConnected(false)
                console.log('🛑 Speech recognition stopped (no restart needed)')
            }
        }

        return recognition
    }

    // Define floatTo16BitPCM function at component level (keep for audio level monitoring)
    const floatTo16BitPCM = (float32: Float32Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(float32.length * 2)
        const view = new DataView(buffer)
        let offset = 0
        for (let i = 0; i < float32.length; i++) {
            // Apply 3x gain amplification for better transcription
            let s = Math.max(-1, Math.min(1, float32[i] * 3.0))
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
            offset += 2
        }
        return buffer
    }

    const resumeRecording = () => {
        try {
            if (isRecording && isPaused) {
                setIsPaused(false)

                // Resume Web Speech API
                if (speechRecognitionRef.current) {
                    recognitionActiveRef.current = true
                    speechRecognitionRef.current.start()
                    console.log('▶️ Web Speech API resumed')
                } else {
                    // Create new recognition if needed
                    const recognition = setupWebSpeechAPI()
                    if (recognition) {
                        speechRecognitionRef.current = recognition
                        recognition.start()
                    }
                }
                processorRef.current.onaudioprocess = (event) => {
                    try {
                        if (isPausedRef.current || !websocketRef.current) return  // Use ref for immediate check

                        const inputBuffer = event.inputBuffer
                        const inputData = inputBuffer.getChannelData(0)
                        console.log('🎵 Processing resume audio, length:', inputData.length)

                        const pcmData = floatTo16BitPCM(inputData)
                        console.log('✅ Resume PCM conversion successful, size:', pcmData.byteLength)

                        // Send audio to backend
                        websocketRef.current.send(pcmData)
                        console.log('📤 Resume audio sent to backend')

                        // Calculate audio levels for visual feedback
                        const average = Math.sqrt(inputData.reduce((sum, sample) => sum + sample * sample, 0) / inputData.length)
                        const max = Math.max(...inputData.map(Math.abs))
                        console.log(`Audio chunk: ${pcmData.byteLength} bytes, avg: ${average.toFixed(6)}, max: ${max.toFixed(6)}`)
                    } catch (error) {
                        console.error('❌ Resume audio processing error:', error)
                    }
                }
            }

            // Reconnect the processor to resume sending audio data
            if (processorRef.current && sourceNodeRef.current) {
                const audioContext = audioContextRef.current
                if (audioContext) {
                    const silentGain = audioContext.createGain()
                    silentGain.gain.value = 0

                    sourceNodeRef.current.connect(processorRef.current)
                    processorRef.current.connect(silentGain)
                    silentGain.connect(audioContext.destination)
                }
            }

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

    // PCM streaming (LINEAR16 @ 16kHz) for Google STT best practices
    const setupPcmStreaming = (stream: MediaStream) => {
        try {
            const createOrGetAudioContext = (): AudioContext => {
                if (audioContextRef.current) return audioContextRef.current
                const ctx = new AudioContext()
                audioContextRef.current = ctx
                return ctx
            }

            const audioContext = createOrGetAudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            sourceNodeRef.current = source

            const bufferSize = 4096
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1)
            processorRef.current = processor

            const silentGain = audioContext.createGain()
            silentGain.gain.value = 0

            source.connect(processor)
            processor.connect(silentGain)
            silentGain.connect(audioContext.destination)

            const downsampleBuffer = (buffer: Float32Array, inSampleRate: number, outSampleRate: number): Float32Array => {
                if (outSampleRate === inSampleRate) return buffer
                const ratio = inSampleRate / outSampleRate
                const newLength = Math.round(buffer.length / ratio)
                const result = new Float32Array(newLength)
                let offsetResult = 0
                let offsetBuffer = 0
                while (offsetResult < result.length) {
                    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio)
                    let accum = 0
                    let count = 0
                    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                        accum += buffer[i]
                        count++
                    }
                    result[offsetResult] = accum / (count || 1)
                    offsetResult++
                    offsetBuffer = nextOffsetBuffer
                }
                return result
            }

            // floatTo16BitPCM function now defined at component level

            processor.onaudioprocess = (e: AudioProcessingEvent) => {
                try {
                    if (isPausedRef.current || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return
                    const input = e.inputBuffer.getChannelData(0)
                    if (!input || input.length === 0) return

                    // Much more sensitive voice activity detection
                    let sum = 0
                    let maxLevel = 0
                    for (let i = 0; i < input.length; i++) {
                        const absValue = Math.abs(input[i])
                        sum += absValue
                        maxLevel = Math.max(maxLevel, absValue)
                    }
                    const averageLevel = sum / input.length

                    // Very low threshold - capture almost all audio including quiet speech
                    // Only filter out complete silence
                    if (averageLevel < 0.00001 && maxLevel < 0.001) return

                    console.log('🎵 Main processor: processing audio, input length:', input.length)
                    const downsampled = downsampleBuffer(input, audioContext.sampleRate, 16000)
                    if (downsampled.length === 0) return
                    console.log('🔄 Downsampled length:', downsampled.length)

                    const pcm16 = floatTo16BitPCM(downsampled)
                    console.log('✅ Main PCM conversion successful, size:', pcm16.byteLength)

                    // Debug logging for audio levels
                    console.log(`Audio chunk: ${pcm16.byteLength} bytes, avg: ${averageLevel.toFixed(6)}, max: ${maxLevel.toFixed(6)}`)

                    websocketRef.current.send(pcm16)
                    console.log('📤 Main audio sent to backend')
                } catch (err) {
                    console.error('❌ Main PCM processing error:', err)
                    console.error('Error stack:', err.stack)
                }
            }

            console.log('PCM streaming initialized (LINEAR16 @16kHz)')
        } catch (error) {
            console.error('Error setting up PCM streaming:', error)
            toast.error('Failed to set up PCM streaming')
        }
    }

    const setupAudioLevelMonitoring = (stream: MediaStream) => {
        try {
            const audioContext = new AudioContext()
            const analyser = audioContext.createAnalyser()
            const source = audioContext.createMediaStreamSource(stream)

            // Optimized analyser settings for accurate volume detection
            analyser.fftSize = 2048  // Higher resolution for better accuracy
            analyser.smoothingTimeConstant = 0.1  // More responsive to changes
            analyser.minDecibels = -100  // Much lower threshold
            analyser.maxDecibels = -20   // Better range for speech

            source.connect(analyser)

            audioContextRef.current = audioContext
            analyserRef.current = analyser

            // Start monitoring audio level with much better sensitivity
            audioLevelIntervalRef.current = setInterval(() => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                    analyserRef.current.getByteFrequencyData(dataArray)

                    // Much more sensitive level calculation
                    let sum = 0
                    let max = 0
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i]
                        max = Math.max(max, dataArray[i])
                    }
                    const average = sum / dataArray.length

                    // Use both average and peak for better detection
                    const normalizedLevel = Math.min(100, Math.max(0, (average / 50) * 100))  // Much more sensitive
                    const peakLevel = Math.min(100, (max / 128) * 100)

                    // Use the higher of average or peak for display
                    const finalLevel = Math.max(normalizedLevel, peakLevel * 0.7)
                    setAudioLevel(finalLevel)
                }
            }, 30)  // Even more frequent updates

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
                setIsConnected(true)
                break

            case 'stt_ready':
                console.log('Google Cloud Speech-to-Text ready:', data.message)
                setIsConnected(true)
                toast.success('Speech recognition ready')
                break

            case 'stt_status':
                console.log('STT status update:', data.message)
                toast(data.message)  // Show reconnection status using default toast
                break

            case 'stt_error':
                console.warn('STT processing error:', data.message)
                if (data.message.includes('unavailable')) {
                    toast.error('Speech recognition temporarily unavailable')
                }
                break

            case 'error':
                console.error('WebSocket error:', data.message)
                toast.error(`Transcription error: ${data.message}`)
                break

            case 'heartbeat':
                // Handle heartbeat messages - just acknowledge
                console.log('WebSocket heartbeat received')
                break

            default:
                console.log('Unknown WebSocket message type:', data.type)
        }
    }

    const cleanup = () => {
        // Clear intervals
        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current)
            audioLevelIntervalRef.current = null
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        // Disconnect processing nodes
        try {
            if (processorRef.current) {
                processorRef.current.disconnect()
                processorRef.current.onaudioprocess = null as any
                processorRef.current = null
            }
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect()
                sourceNodeRef.current = null
            }
        } catch (e) {
            // ignore
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
        <div className="bg-white dark:bg-neutral-800 rounded-lg border shadow-sm p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isRecording ? 'bg-red-100 dark:bg-red-900/30' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                        <MicrophoneIcon className={`h-5 w-5 ${isRecording ? 'text-red-600 dark:text-red-400' : 'text-neutral-600 dark:text-neutral-400'}`} />
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            Recording Controls
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
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
                            {isRecording && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-2">
                                        <SpeakerWaveIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                        <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all duration-100"
                                                style={{ width: `${audioLevel}%` }}
                                            />
                                        </div>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-2">
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
                                    className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    <PauseIcon className="h-4 w-4" />
                                    Pause
                                </button>
                            ) : (
                                <button
                                    onClick={resumeRecording}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <PlayIcon className="h-4 w-4" />
                                    Resume
                                </button>
                            )}

                            <button
                                onClick={onStop}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <StopIcon className="h-4 w-4" />
                                Stop
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
