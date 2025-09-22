'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import {
    MicrophoneIcon,
    StopIcon,
    PauseIcon,
    PlayIcon,
    SpeakerWaveIcon
} from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'
import { MedicalAudioProcessor } from '../../services/rnnoise'
import AudioDeviceSelector from './AudioDeviceSelector'

interface AudioRecorderProps {
    sessionId: string
    isRecording: boolean
    duration?: number  // Optional prop to sync with parent timer
    selectedAudioDevice?: string  // Audio device selected from parent
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

const AudioRecorder = forwardRef<{ stopRecording: () => void }, AudioRecorderProps>(({
    sessionId,
    isRecording,
    duration = 0,
    selectedAudioDevice: propSelectedAudioDevice,
    onStart,
    onStop,
    onPause,
    onResume,
    onTranscriptionUpdate
}, ref) => {
    const [isPaused, setIsPaused] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [transcriptionChunks, setTranscriptionChunks] = useState<TranscriptionChunk[]>([])
    const [currentInterimText, setCurrentInterimText] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [currentLanguage, setCurrentLanguage] = useState('en-IN') // Default to English India
    const [codeMixingMode, setCodeMixingMode] = useState(true) // Enable code-mixing processing
    const [isNoiseReductionEnabled, setIsNoiseReductionEnabled] = useState(true) // Enable RNNoise by default
    const [noiseReductionStatus, setNoiseReductionStatus] = useState<'loading' | 'ready' | 'error' | 'disabled'>('loading')
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>(propSelectedAudioDevice || '')
    const [showDeviceSelector, setShowDeviceSelector] = useState(false)

    // Audio processing health monitoring
    const [audioProcessingHealth, setAudioProcessingHealth] = useState<'healthy' | 'degrading' | 'unhealthy'>('healthy')
    const audioHealthIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastAudioProcessTimeRef = useRef<number>(Date.now())
    const audioResetCountRef = useRef<number>(0)

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
    const audioProcessorRef = useRef<MedicalAudioProcessor | null>(null)

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

    // Sync external device selection with internal state
    useEffect(() => {
        if (propSelectedAudioDevice && propSelectedAudioDevice !== selectedAudioDevice) {
            setSelectedAudioDevice(propSelectedAudioDevice)
            console.log('🎤 Updated audio device from parent:', propSelectedAudioDevice)
        }
    }, [propSelectedAudioDevice, selectedAudioDevice])

    // Timer is now managed by parent component

    const startRecording = async () => {
        try {
            // Prepare audio constraints with selected device
            const audioConstraints: MediaTrackConstraints = {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true,
                sampleRate: { ideal: 48000 },
                channelCount: 1
            }

            // Apply selected audio device if available
            if (selectedAudioDevice) {
                audioConstraints.deviceId = { exact: selectedAudioDevice }
                console.log('🎤 Using selected audio device:', selectedAudioDevice)
            } else {
                console.log('🎤 Using default audio device (no specific device selected)')
            }

            // Request microphone access for audio level monitoring
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints,
                video: false
            })

            streamRef.current = stream

            // Verify which device is being used
            const track = stream.getAudioTracks()[0]
            if (track) {
                const settings = track.getSettings()
                console.log('🎤 Active audio device:', {
                    deviceId: settings.deviceId,
                    label: track.label,
                    sampleRate: settings.sampleRate,
                    channelCount: settings.channelCount
                })

                // Show user which device is active
                const deviceName = track.label || 'Unknown Device'
                toast.success(`Recording started with: ${deviceName}`)
            }

            // Set up audio level monitoring (visual feedback)
            setupAudioLevelMonitoring(stream)

            // Setup and start Web Speech API
            const recognition = setupWebSpeechAPI()
            if (!recognition) {
                throw new Error('Speech recognition not supported')
            }

            speechRecognitionRef.current = recognition
            recognition.start()

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

            // Stop Web Speech API and clear all references
            if (speechRecognitionRef.current) {
                recognitionActiveRef.current = false
                speechRecognitionRef.current.stop()
                speechRecognitionRef.current = null
                console.log('🛑 Web Speech API stopped and reference cleared')
            }

            // Double-check: Clear any pending restart timeouts again
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current)
                restartTimeoutRef.current = null
                console.log('🚫 Final cleanup: Cleared any remaining restart timeouts')
            }

            // CRITICAL: Stop audio stream completely to release microphone
            if (streamRef.current) {
                console.log('🎤 Stopping audio stream with', streamRef.current.getTracks().length, 'tracks')
                streamRef.current.getTracks().forEach((track, index) => {
                    console.log(`🔇 Stopping track ${index}:`, track.kind, track.readyState, track.label)
                    track.stop()
                    console.log(`✅ Track ${index} stopped, new state:`, track.readyState)
                })
                streamRef.current = null
                console.log('✅ Audio stream reference cleared')

                // Force garbage collection hint and verify microphone release
                setTimeout(async () => {
                    console.log('🧹 Stream cleanup complete - checking microphone release...')

                    // Try to explicitly request permission again to reset browser state
                    try {
                        // This should trigger browser to re-evaluate microphone usage
                        const testStream = await navigator.mediaDevices.getUserMedia({ audio: false })
                        testStream.getTracks().forEach(track => track.stop())
                        console.log('🔄 Browser microphone state reset')
                    } catch (e) {
                        console.log('📱 Microphone state reset completed')
                    }

                    // Additional cleanup - try to revoke permissions if possible
                    if (navigator.permissions) {
                        try {
                            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
                            console.log('🎤 Microphone permission state:', result.state)
                        } catch (e) {
                            console.log('🔍 Permission check completed')
                        }
                    }
                }, 200)
            }

            // Stop health monitoring
            if (audioHealthIntervalRef.current) {
                clearInterval(audioHealthIntervalRef.current)
                audioHealthIntervalRef.current = null
            }

            cleanup()
            setIsPaused(false)
            setIsConnected(false)
            setCurrentInterimText('')
            setAudioProcessingHealth('healthy')
            audioResetCountRef.current = 0

            console.log('🏁 stopRecording complete - microphone should be released')
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
                    // Update interim text - trust STT service for final signals
                    interimTranscript = transcript  // Use latest interim, don't accumulate
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

            // Only restart if we're still actively recording AND reference still exists
            if (isRecording && !isPaused && speechRecognitionRef.current) {
                console.log('🔄 Scheduling speech recognition restart...')
                restartTimeoutRef.current = setTimeout(() => {
                    // Triple-check we still need to restart and no recognition is active
                    if (isRecording && !isPaused && !recognitionActiveRef.current && speechRecognitionRef.current) {
                        console.log('🔍 Final check before restart - isRecording:', isRecording, 'isPaused:', isPaused)
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
                if (processorRef.current) {
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
                            const max = Math.max(...Array.from(inputData).map(Math.abs))
                            console.log(`Audio chunk: ${pcmData.byteLength} bytes, avg: ${average.toFixed(6)}, max: ${max.toFixed(6)}`)
                        } catch (error) {
                            console.error('❌ Resume audio processing error:', error)
                        }
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

    // Initialize audio processor for noise reduction
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null
        let isMounted = true

        const initializeAudioProcessor = async () => {
            try {
                if (!isMounted) return

                setNoiseReductionStatus('loading')
                console.log('🔧 Initializing audio processor...')

                const processor = new MedicalAudioProcessor(isNoiseReductionEnabled)

                if (!isMounted) {
                    processor.destroy()
                    return
                }

                audioProcessorRef.current = processor

                // Wait a moment for initialization
                timeoutId = setTimeout(() => {
                    if (!isMounted) return

                    try {
                        if (processor.isNoiseReductionAvailable()) {
                            setNoiseReductionStatus('ready')
                            console.log('✅ Medical Audio Processor with RNNoise ready')
                        } else {
                            setNoiseReductionStatus('error')
                            console.log('⚠️ RNNoise not available, using basic processing')
                        }
                    } catch (err) {
                        console.warn('⚠️ Error checking RNNoise availability:', err)
                        setNoiseReductionStatus('error')
                    }
                }, 1000)

            } catch (error) {
                console.error('❌ Failed to initialize audio processor:', error)
                if (isMounted) {
                    setNoiseReductionStatus('error')
                }
            }
        }

        // Only initialize if noise reduction is enabled
        if (isNoiseReductionEnabled) {
            initializeAudioProcessor()
        } else {
            setNoiseReductionStatus('disabled')
        }

        return () => {
            isMounted = false
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            if (audioProcessorRef.current) {
                audioProcessorRef.current.destroy()
                audioProcessorRef.current = null
            }
        }
    }, [isNoiseReductionEnabled])

    // Enhanced PCM streaming (48kHz with RNNoise) for medical-grade audio quality
    const setupPcmStreaming = (stream: MediaStream) => {
        try {
            const createOrGetAudioContext = (): AudioContext => {
                if (audioContextRef.current) return audioContextRef.current
                // Force 48kHz sample rate for optimal RNNoise performance
                const ctx = new AudioContext({
                    sampleRate: 48000
                })
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

                    // Update audio processing health
                    lastAudioProcessTimeRef.current = Date.now()

                    // Reduced logging - only every 100th frame to prevent performance degradation
                    const frameCount = Math.floor(Date.now() / 100) % 100
                    if (frameCount === 0) {
                        console.log('🎵 Audio processing active, level:', averageLevel.toFixed(4))
                    }

                    // Apply RNNoise processing if available (48kHz optimized)
                    let processedAudio = input
                    if (audioProcessorRef.current && isNoiseReductionEnabled) {
                        try {
                            processedAudio = audioProcessorRef.current.processAudioBuffer(input)
                            if (frameCount === 0) console.log('🔇 RNNoise processing applied')
                        } catch (error) {
                            console.warn('⚠️ RNNoise processing failed, using original audio:', error)
                            processedAudio = input
                            // Consider this a health issue
                            setAudioProcessingHealth('degrading')
                        }
                    }

                    // Keep audio at 48kHz for best STT quality (no downsampling needed)
                    const pcm16 = floatTo16BitPCM(processedAudio)

                    // Reduced debug logging
                    if (frameCount === 0) {
                        console.log(`📊 Audio: ${pcm16.byteLength}B, avg: ${averageLevel.toFixed(4)}, max: ${maxLevel.toFixed(4)}`)
                    }

                    websocketRef.current.send(pcm16)
                } catch (err) {
                    console.error('❌ Main PCM processing error:', err)
                    if (err instanceof Error) {
                        console.error('Error stack:', err.stack)
                    }
                }
            }

            // Start audio health monitoring - reset every 30 seconds to prevent degradation
            audioHealthIntervalRef.current = setInterval(() => {
                const timeSinceLastProcess = Date.now() - lastAudioProcessTimeRef.current

                if (timeSinceLastProcess > 5000) {
                    console.warn('⚠️ Audio processing stalled, triggering reset...')
                    setAudioProcessingHealth('unhealthy')
                    resetAudioProcessing()
                } else if (timeSinceLastProcess > 2000) {
                    setAudioProcessingHealth('degrading')
                } else {
                    setAudioProcessingHealth('healthy')
                }

                // Proactive reset every 30 seconds to prevent degradation
                audioResetCountRef.current += 1
                if (audioResetCountRef.current >= 6) { // 6 * 5 seconds = 30 seconds
                    console.log('🔄 Proactive audio chain reset (30s maintenance)')
                    resetAudioProcessing()
                    audioResetCountRef.current = 0
                }
            }, 5000) // Check every 5 seconds

            console.log('Enhanced PCM streaming initialized (LINEAR16 @48kHz with RNNoise + Health Monitoring)')
        } catch (error) {
            console.error('Error setting up PCM streaming:', error)
            toast.error('Failed to set up PCM streaming')
        }
    }

    // Reset audio processing chain to prevent degradation
    const resetAudioProcessing = () => {
        try {
            console.log('🔧 Resetting audio processing chain...')

            // Clean up existing processor
            if (processorRef.current) {
                processorRef.current.disconnect()
                processorRef.current = null
            }

            // Clean up source
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect()
                sourceNodeRef.current = null
            }

            // Reset RNNoise processor
            if (audioProcessorRef.current) {
                try {
                    audioProcessorRef.current.destroy()
                } catch (e) {
                    console.warn('RNNoise cleanup warning:', e)
                }
                audioProcessorRef.current = null
            }

            // Wait a bit then reinitialize if still recording
            setTimeout(() => {
                if (streamRef.current && isRecording) {
                    console.log('🔄 Reinitializing audio processing...')

                    // Re-setup audio processing chain
                    setupPcmStreaming(streamRef.current)

                    // Re-initialize RNNoise if enabled
                    if (isNoiseReductionEnabled) {
                        import('../../services/rnnoise').then(({ MedicalAudioProcessor }) => {
                            const processor = new MedicalAudioProcessor(true)
                            audioProcessorRef.current = processor
                        }).catch(console.error)
                    }

                    setAudioProcessingHealth('healthy')
                    console.log('✅ Audio processing chain reset complete')
                }
            }, 100)

        } catch (error) {
            console.error('Error resetting audio processing:', error)
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
                        const wordCount = transcriptionData.transcript.split(' ').length
                        console.log(`🎤 INTERIM (${wordCount} words):`, transcriptionData.transcript)
                        setCurrentInterimText(transcriptionData.transcript)
                        onTranscriptionUpdate(transcriptionData.transcript, false)
                    } else if (transcriptionData.type === 'final') {
                        const wordCount = transcriptionData.transcript.split(' ').length
                        console.log(`✅ FINAL (${wordCount} words):`, transcriptionData.transcript)
                        const newChunk: TranscriptionChunk = {
                            text: transcriptionData.transcript,
                            confidence: transcriptionData.confidence,
                            timestamp: transcriptionData.timestamp,
                            isFinal: true
                        }

                        setTranscriptionChunks(prev => {
                            const updatedChunks = [...prev, newChunk]
                            // Send accumulated final text to parent, not just the latest chunk
                            const fullFinalText = updatedChunks.map(chunk => chunk.text).join(' ')
                            onTranscriptionUpdate(transcriptionData.transcript, true) // Send only this chunk for proper accumulation
                            console.log('📝 Final chunk added:', transcriptionData.transcript)
                            console.log('📝 All final chunks so far:', fullFinalText)
                            return updatedChunks
                        })
                        setCurrentInterimText('')
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

    // Expose stopRecording method via ref
    useImperativeHandle(ref, () => ({
        stopRecording
    }), [])

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

                {/* Audio Controls Section */}
                <div className="flex items-center gap-4">
                    {/* Device Selector Toggle - Less prominent during recording */}
                    <button
                        onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                        className="flex items-center gap-2 px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        title="Change microphone input"
                    >
                        <MicrophoneIcon className="h-3 w-3" />
                        Change Input
                    </button>

                    {/* Noise Reduction Controls */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Noise Reduction
                        </label>
                        <button
                            onClick={() => {
                                setIsNoiseReductionEnabled(!isNoiseReductionEnabled)
                                if (audioProcessorRef.current) {
                                    audioProcessorRef.current.setNoiseReduction(!isNoiseReductionEnabled)
                                }
                            }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isNoiseReductionEnabled
                                ? 'bg-blue-600'
                                : 'bg-neutral-300 dark:bg-neutral-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${isNoiseReductionEnabled ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        <div className="flex items-center gap-1">
                            {noiseReductionStatus === 'loading' && (
                                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" title="Initializing noise reduction..." />
                            )}
                            {noiseReductionStatus === 'ready' && (
                                <div className="h-2 w-2 bg-green-500 rounded-full" title="RNNoise ready" />
                            )}
                            {noiseReductionStatus === 'error' && (
                                <div className="h-2 w-2 bg-orange-500 rounded-full" title="Using basic noise reduction" />
                            )}
                            {noiseReductionStatus === 'disabled' && (
                                <div className="h-2 w-2 bg-neutral-400 rounded-full" title="Noise reduction disabled" />
                            )}

                            {/* Audio Processing Health Indicator */}
                            {audioProcessingHealth === 'healthy' && (
                                <div className="h-2 w-2 bg-green-500 rounded-full" title="Audio processing healthy" />
                            )}
                            {audioProcessingHealth === 'degrading' && (
                                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" title="Audio processing degrading" />
                            )}
                            {audioProcessingHealth === 'unhealthy' && (
                                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" title="Audio processing unhealthy - resetting" />
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

            {/* Audio Device Selector Panel */}
            {showDeviceSelector && (
                <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Audio Input Settings
                        </h4>
                        <button
                            onClick={() => setShowDeviceSelector(false)}
                            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <AudioDeviceSelector
                        selectedDeviceId={selectedAudioDevice}
                        onDeviceChange={setSelectedAudioDevice}
                    />
                    <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                            <span>Changes apply to new recording sessions</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

AudioRecorder.displayName = 'AudioRecorder'

export default AudioRecorder
