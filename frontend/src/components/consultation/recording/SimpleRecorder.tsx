import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface SimpleAudioRecorderProps {
    sessionId: string
    onTranscriptUpdate: (data: {
        transcript: string
        isFinal: boolean
        currentFinal?: string
        currentLive?: string
    }) => void
    onError?: (error: any) => void
    onStart?: () => void
    onStop?: () => void
    isPaused?: boolean
    selectedDeviceId?: string
    autoStart?: boolean
    onVolumeChange?: (volume: number) => void
    onNetworkError?: (error: string) => void
    continuousMode?: boolean  // NEW - Always send chunks, even during silence
    primaryLanguage?: string  // NEW - Primary language for transcription (e.g., 'en-IN', 'hi-IN', 'mr-IN')
}

interface TranscriptionResponse {
    transcript: string;
    confidence: number;
    language_code: string;
    status: string;
}

// Helper function to create WAV blob
function createWavBlob(samples: Int16Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset + i * 2, samples[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = memo(({
    sessionId,
    onTranscriptUpdate,
    onError,
    onStart,
    onStop,
    isPaused = false,
    selectedDeviceId,
    autoStart = true,
    onVolumeChange,
    onNetworkError,
    continuousMode = true,  // ✅ Default to continuous mode for better capture
    primaryLanguage = 'hi-IN'  // ✅ Default to Hindi if not specified
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isManualMode, setIsManualMode] = useState<boolean>(false);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioBufferRef = useRef<Float32Array[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRecordingAudioRef = useRef(false);
    const isStoppingRef = useRef(false); // CRITICAL: Track stopping state
    const abortControllerRef = useRef<AbortController | null>(null); // CRITICAL: For request cancellation

    // ✅ NEW: Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    // Constants for chunking
    const CHUNK_INTERVAL_MS = 30000; // 30 seconds - better for long paragraphs
    const MIN_CHUNK_SIZE = 16000 * 2;
    const OVERLAP_SECONDS = 0.5; // 500ms overlap to prevent missing audio at boundaries

    // ✅ NEW: Queue for failed chunks
    const pendingChunksRef = useRef<Array<{ audio: Blob; timestamp: number }>>([]);
    const volumeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentVolumeRef = useRef<number>(0); // ✅ Store current volume
    const previousChunkBufferRef = useRef<Float32Array | null>(null); // ✅ Store overlap buffer

    // ✅ Handle pause/resume
    useEffect(() => {
        isRecordingAudioRef.current = !isPaused && isRecording;
        console.log(`[STT] ${isPaused ? '⏸️ PAUSED' : '▶️ RECORDING'} - isRecordingAudio: ${isRecordingAudioRef.current}`);
    }, [isPaused, isRecording]);

    // ✅ NEW: Duration tracker
    useEffect(() => {
        let durationInterval: NodeJS.Timeout | null = null;

        if (isRecording && !isPaused) {
            setRecordingDuration(0); // Reset when starting
            durationInterval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else if (isPaused) {
            // Keep duration but stop incrementing
            if (durationInterval) clearInterval(durationInterval);
        } else {
            // Reset when stopped
            setRecordingDuration(0);
            if (durationInterval) clearInterval(durationInterval);
        }

        return () => {
            if (durationInterval) clearInterval(durationInterval);
        };
    }, [isRecording, isPaused]);

    // ✅ NEW: Retry function with exponential backoff + abort support
    const sendAudioWithRetry = useCallback(async (audioBlob: Blob, retriesLeft: number): Promise<void> => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        for (let attempt = 0; attempt <= retriesLeft; attempt++) {
            try {
                // CRITICAL: Check if we should abort
                if (isStoppingRef.current) {
                    console.log('[STT] 🚫 Request cancelled - stopping');
                    return;
                }

                const formData = new FormData();
                formData.append('audio', audioBlob, 'audio.wav');

                console.log(`[STT] 📤 Sending audio (attempt ${attempt + 1}/${retriesLeft + 1})...`);
                console.log(`[STT] 🗣️ Primary language: ${primaryLanguage}`);

                // CRITICAL: Create new AbortController for this request
                abortControllerRef.current = new AbortController();
                const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 30000);

                const response = await fetch(`http://localhost:8080/api/v1/stt/chunk?session_id=${sessionId}&language=${primaryLanguage}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                    signal: abortControllerRef.current.signal // CRITICAL: Use the ref's signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const result: TranscriptionResponse = await response.json();
                console.log('[STT] 📦 Full response:', JSON.stringify(result));

                if (result.status === "success" && result.transcript && result.transcript.trim()) {
                    console.log(`[STT] ✅ Got transcript: "${result.transcript}"`);

                    onTranscriptUpdate({
                        transcript: result.transcript,
                        isFinal: true,
                        currentFinal: result.transcript,
                        currentLive: ''
                    });
                } else {
                    console.log('[STT] ⚠️ No transcript in response');
                }

                // ✅ SUCCESS - return
                return;

            } catch (error) {
                // CRITICAL: Handle abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log('[STT] 🚫 Request aborted');
                    return;
                }

                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[STT] ❌ Attempt ${attempt + 1} failed:`, errorMessage);

                // If this was the last attempt, queue for later
                if (attempt === retriesLeft) {
                    console.log('[STT] 💾 Saving chunk to retry queue...');
                    pendingChunksRef.current.push({
                        audio: audioBlob,
                        timestamp: Date.now()
                    });

                    onNetworkError?.(`Network issue - ${pendingChunksRef.current.length} chunks queued`);
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
                console.log(`[STT] ⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, [sessionId, primaryLanguage, onTranscriptUpdate, onNetworkError]);

    // ✅ Memoize processAudioBuffer
    const processAudioBuffer = useCallback(async () => {
        if (audioBufferRef.current.length === 0) {
            console.log('[STT] No audio buffer to process');
            return;
        }

        const totalLength = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);

        if (!continuousMode && totalLength < MIN_CHUNK_SIZE) {
            console.log(`[STT] Buffer too small: ${totalLength} < ${MIN_CHUNK_SIZE}`);
            return;
        }

        setIsProcessing(true);

        try {
            let combinedAudio = new Float32Array(totalLength);
            let offset = 0;
            for (const chunk of audioBufferRef.current) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            audioBufferRef.current = [];

            // ✅ ADD OVERLAP: Keep last 500ms of previous chunk to prevent missing audio at boundaries
            const overlapSamples = Math.floor(OVERLAP_SECONDS * 16000);
            if (previousChunkBufferRef.current && previousChunkBufferRef.current.length > 0) {
                const overlapData = previousChunkBufferRef.current.slice(-overlapSamples);
                const combinedWithOverlap = new Float32Array(overlapData.length + combinedAudio.length);
                combinedWithOverlap.set(overlapData, 0);
                combinedWithOverlap.set(combinedAudio, overlapData.length);
                combinedAudio = combinedWithOverlap;
                console.log(`[STT] 🔗 Added ${overlapSamples} samples (${OVERLAP_SECONDS}s) overlap`);
            }

            // Store for next chunk
            previousChunkBufferRef.current = combinedAudio;

            const int16Audio = new Int16Array(combinedAudio.length);
            for (let i = 0; i < combinedAudio.length; i++) {
                const s = Math.max(-1, Math.min(1, combinedAudio[i]));
                int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // ✅ IMPROVED AMPLITUDE ANALYSIS
            let maxAmplitude = 0;
            let sumAmplitude = 0;
            for (let i = 0; i < int16Audio.length; i++) {
                const abs = Math.abs(int16Audio[i]);
                if (abs > maxAmplitude) maxAmplitude = abs;
                sumAmplitude += abs;
            }
            const avgAmplitude = sumAmplitude / int16Audio.length;

            // ✅ LOWER THRESHOLD - accept quieter audio
            const AMPLITUDE_THRESHOLD = 500; // Lower threshold
            if (maxAmplitude < AMPLITUDE_THRESHOLD) {
                console.log(`[STT] ⚠️ Audio quiet (max: ${maxAmplitude}), but sending anyway for STT analysis`);
            }

            const durationInSeconds = int16Audio.length / 16000;
            console.log(`[STT] 📦 Processing ${durationInSeconds.toFixed(1)}s of audio | max=${maxAmplitude} avg=${avgAmplitude.toFixed(0)}`);

            const wavBlob = createWavBlob(int16Audio, 16000);

            // ✅ CHANGED: Use retry logic instead of direct fetch
            try {
                await sendAudioWithRetry(wavBlob, MAX_RETRIES);
            } catch (error) {
                console.error('[STT] ❌ Failed after all retries');
                // Error already handled by sendAudioWithRetry
            }

        } catch (error) {
            console.error('[STT] ❌ Error processing audio:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            onError?.(`Transcription failed: ${errorMessage}`);

        } finally {
            setIsProcessing(false);
        }
    }, [sessionId, onError, sendAudioWithRetry, continuousMode]);

    // ✅ Memoize startRecording
    const startRecording = useCallback(async () => {
        try {
            console.log('[STT] 🎤 Starting recording...');

            // CRITICAL: Clear any existing intervals before starting
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                console.log('[STT] 🧹 Cleared existing interval');
            }

            if (volumeUpdateIntervalRef.current) {
                clearInterval(volumeUpdateIntervalRef.current);
                volumeUpdateIntervalRef.current = null;
            }

            // CRITICAL: Reset stopping flag
            isStoppingRef.current = false;

            const constraints: MediaStreamConstraints = {
                audio: selectedDeviceId
                    ? {
                        deviceId: { exact: selectedDeviceId },
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                    }
                    : {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                    }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            // ✅ FIXED: Only collect audio when not paused + volume monitoring + stopping check
            processor.onaudioprocess = (e) => {
                // CRITICAL: Check stopping flag
                if (isStoppingRef.current || !isRecordingAudioRef.current) {
                    return;
                }

                const inputData = e.inputBuffer.getChannelData(0);
                audioBufferRef.current.push(new Float32Array(inputData));

                // ✅ NEW: Calculate volume for UI feedback
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                currentVolumeRef.current = Math.min(100, Math.floor(rms * 1000));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);
            isRecordingAudioRef.current = true;
            onStart?.();

            // ✅ NEW: Start volume update interval
            volumeUpdateIntervalRef.current = setInterval(() => {
                onVolumeChange?.(currentVolumeRef.current);
            }, 100);

            intervalRef.current = setInterval(() => {
                // CRITICAL: Double-check state before processing
                if (isStoppingRef.current || isPaused || !isRecordingAudioRef.current || isManualMode) {
                    if (isManualMode) {
                        console.log('[STT] ⏸️ Skipping interval - manual mode enabled');
                    } else {
                        console.log('[STT] ⏸️ Skipping interval - stopped/paused');
                    }
                    return;
                }

                console.log('[STT] ⏱️ 30-second interval triggered, processing chunk...');
                processAudioBuffer();
            }, CHUNK_INTERVAL_MS);

            console.log('[STT] ✅ Recording started with 30-second auto-chunking');

        } catch (error) {
            console.error('[STT] ❌ Error starting recording:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            onError?.(`Recording failed: ${errorMessage}`);
        }
    }, [onStart, onError, processAudioBuffer, selectedDeviceId, isPaused, onVolumeChange]);

    // ✅ Memoize stopRecording
    const stopRecording = useCallback(async () => {
        console.log('[STT] 🛑 Stopping recording...');

        // CRITICAL: Set stopping flag IMMEDIATELY to prevent new chunks
        isStoppingRef.current = true;
        isRecordingAudioRef.current = false;
        setIsRecording(false);

        // CRITICAL: Cancel in-flight requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            console.log('[STT] 🚫 Cancelled in-flight requests');
        }

        // CRITICAL: Clear interval timer IMMEDIATELY
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('[STT] ✅ Interval timer cleared');
        }

        // ✅ Clear volume update interval
        if (volumeUpdateIntervalRef.current) {
            clearInterval(volumeUpdateIntervalRef.current);
            volumeUpdateIntervalRef.current = null;
        }

        // Disconnect audio processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop audio tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Process final chunk if exists
        if (audioBufferRef.current.length > 0) {
            console.log('[STT] 📦 Processing final chunk...');
            await processAudioBuffer();
        }

        // Clear buffers
        audioBufferRef.current = [];
        previousChunkBufferRef.current = null;

        onStop?.();
        console.log('[STT] ✅ Recording stopped completely');
    }, [onStop, processAudioBuffer]);

    // ✅ NEW: Manual chunk sending function
    const sendChunkManually = useCallback(async () => {
        if (!isRecording) {
            console.log('[STT] ⚠️ Cannot send chunk - not recording');
            return;
        }

        if (audioBufferRef.current.length === 0) {
            console.log('[STT] ⚠️ Cannot send chunk - no audio data collected');
            return;
        }

        console.log('[STT] 📤 Manual send triggered - processing current buffer...');
        await processAudioBuffer();
    }, [isRecording, processAudioBuffer]);

    // ✅ NEW: Process pending chunks when connection is restored
    useEffect(() => {
        if (pendingChunksRef.current.length === 0 || isProcessing) {
            return;
        }

        const processQueue = async () => {
            console.log(`[STT] 🔄 Processing ${pendingChunksRef.current.length} queued chunks...`);

            while (pendingChunksRef.current.length > 0) {
                const chunk = pendingChunksRef.current.shift();
                if (chunk) {
                    try {
                        await sendAudioWithRetry(chunk.audio, MAX_RETRIES);
                        console.log(`[STT] ✅ Queued chunk processed. ${pendingChunksRef.current.length} remaining`);
                    } catch (error) {
                        console.error('[STT] ❌ Failed to process queued chunk, re-queuing...');
                        pendingChunksRef.current.unshift(chunk);
                        break;
                    }
                }
            }
        };

        const queueInterval = setInterval(processQueue, 10000);

        return () => clearInterval(queueInterval);
    }, [isProcessing, sendAudioWithRetry]);

    // ✅ Auto-start recording when sessionId is available
    useEffect(() => {
        if (autoStart && sessionId && !isRecording) {
            console.log('[STT] 🚀 Auto-starting recording for session:', sessionId);
            startRecording();
        }

        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, [sessionId, autoStart]);

    // CRITICAL: Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('[STT] 🧹 Component unmounting, cleaning up...');

            // Clear intervals
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (volumeUpdateIntervalRef.current) {
                clearInterval(volumeUpdateIntervalRef.current);
                volumeUpdateIntervalRef.current = null;
            }

            // Cancel requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            // Stop audio
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Helper function to format duration as MM:SS
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="simple-recorder-controls">
            <style>{`
                .simple-recorder-controls {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    min-width: 280px;
                }

                .recording-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }

                .btn-send-chunk {
                    background: #2563eb;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-send-chunk:hover:not(:disabled) {
                    background: #1d4ed8;
                }

                .btn-send-chunk:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .mode-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    user-select: none;
                }

                .mode-toggle input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }

                .mode-toggle label {
                    cursor: pointer;
                    font-weight: 500;
                }

                .duration-display {
                    font-size: 24px;
                    font-weight: 600;
                    color: #dc2626;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    padding: 8px;
                    background: #fef2f2;
                    border-radius: 6px;
                }

                .manual-mode-indicator {
                    font-size: 12px;
                    color: #2563eb;
                    font-weight: 500;
                    text-align: center;
                    margin-top: 4px;
                }

                .recording-status {
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                    padding: 4px 8px;
                    background: #f3f4f6;
                    border-radius: 4px;
                }
            `}</style>

            {isRecording && (
                <div className="recording-controls">
                    {/* Duration Display */}
                    <div>
                        <div className="duration-display">
                            {formatDuration(recordingDuration)}
                        </div>
                        {isManualMode && (
                            <div className="manual-mode-indicator">
                                Manual Mode Active
                            </div>
                        )}
                    </div>

                    {/* Manual Mode Toggle */}
                    <div className="mode-toggle">
                        <input
                            type="checkbox"
                            id="manual-mode-toggle"
                            checked={isManualMode}
                            onChange={(e) => setIsManualMode(e.target.checked)}
                            aria-label="Enable manual chunking mode"
                        />
                        <label htmlFor="manual-mode-toggle">
                            Manual Chunking Mode
                        </label>
                    </div>

                    {/* Send Now Button */}
                    <button
                        className="btn-send-chunk"
                        onClick={sendChunkManually}
                        disabled={!isRecording || isProcessing || audioBufferRef.current.length === 0}
                        aria-label="Send current audio chunk for transcription"
                        title="Send current audio chunk for transcription"
                    >
                        📤 Send Now
                        {isProcessing && ' (Processing...)'}
                    </button>

                    {/* Status Indicator */}
                    <div className="recording-status">
                        {isProcessing && '🔄 Processing...'}
                        {!isProcessing && isManualMode && '⏱️ Recording - Click "Send Now" when ready'}
                        {!isProcessing && !isManualMode && `⏱️ Auto-send every 30s`}
                    </div>
                </div>
            )}
        </div>
    );
});

SimpleAudioRecorder.displayName = 'SimpleAudioRecorder';

export default SimpleAudioRecorder;
