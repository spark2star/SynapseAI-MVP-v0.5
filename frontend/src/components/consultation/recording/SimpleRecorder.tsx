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
    onVolumeChange,      // ✅ ADD
    onNetworkError       // ✅ ADD
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioBufferRef = useRef<Float32Array[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRecordingAudioRef = useRef(false);
    
    // ✅ NEW: Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    // Constants for chunking
    const CHUNK_INTERVAL_MS = 30000;
    const MIN_CHUNK_SIZE = 16000 * 2;
    
    // ✅ NEW: Queue for failed chunks
    const pendingChunksRef = useRef<Array<{ audio: Blob; timestamp: number }>>([]); 
    const volumeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentVolumeRef = useRef<number>(0); // ✅ Store current volume

    // ✅ Handle pause/resume
    useEffect(() => {
        isRecordingAudioRef.current = !isPaused && isRecording;
        console.log(`[STT] ${isPaused ? '⏸️ PAUSED' : '▶️ RECORDING'} - isRecordingAudio: ${isRecordingAudioRef.current}`);
    }, [isPaused, isRecording]);

    // ✅ NEW: Retry function with exponential backoff
    const sendAudioWithRetry = useCallback(async (audioBlob: Blob, retriesLeft: number): Promise<void> => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        for (let attempt = 0; attempt <= retriesLeft; attempt++) {
            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'audio.wav');

                console.log(`[STT] 📤 Sending audio (attempt ${attempt + 1}/${retriesLeft + 1})...`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const response = await fetch(`http://localhost:8080/api/v1/stt/chunk?session_id=${sessionId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                    signal: controller.signal
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
    }, [sessionId, onTranscriptUpdate, onNetworkError]);

    // ✅ Memoize processAudioBuffer
    const processAudioBuffer = useCallback(async () => {
        if (audioBufferRef.current.length === 0) {
            console.log('[STT] No audio buffer to process');
            return;
        }

        const totalLength = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);

        if (totalLength < MIN_CHUNK_SIZE) {
            console.log(`[STT] Buffer too small: ${totalLength} < ${MIN_CHUNK_SIZE}`);
            return;
        }

        setIsProcessing(true);

        try {
            const combinedAudio = new Float32Array(totalLength);
            let offset = 0;
            for (const chunk of audioBufferRef.current) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            audioBufferRef.current = [];

            const int16Audio = new Int16Array(combinedAudio.length);
            for (let i = 0; i < combinedAudio.length; i++) {
                const s = Math.max(-1, Math.min(1, combinedAudio[i]));
                int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            let maxAmplitude = 0;
            for (let i = 0; i < int16Audio.length; i++) {
                const abs = Math.abs(int16Audio[i]);
                if (abs > maxAmplitude) maxAmplitude = abs;
            }

            // ✅ REMOVED AMPLITUDE CHECK - Don't skip quiet audio
            console.log(`[STT] 📊 Audio amplitude: ${maxAmplitude}`);

            const durationInSeconds = int16Audio.length / 16000;
            console.log(`[STT] 📦 Processing ${durationInSeconds.toFixed(1)}s of audio (max amplitude: ${maxAmplitude})`);

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
    }, [sessionId, onError, sendAudioWithRetry]);

    // ✅ Memoize startRecording
    const startRecording = useCallback(async () => {
        try {
            console.log('[STT] 🎤 Starting recording...');

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

            // ✅ FIXED: Only collect audio when not paused + volume monitoring
            processor.onaudioprocess = (e) => {
                if (isRecordingAudioRef.current) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    audioBufferRef.current.push(new Float32Array(inputData));
                    
                    // ✅ NEW: Calculate volume for UI feedback
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sum += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sum / inputData.length);
                    currentVolumeRef.current = Math.min(100, Math.floor(rms * 1000));
                }
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
                if (isRecordingAudioRef.current && !isPaused) {
                    console.log('[STT] ⏱️ 30-second interval triggered, processing chunk...');
                    processAudioBuffer();
                } else {
                    console.log('[STT] ⏸️ Skipping interval - paused or not recording');
                }
            }, CHUNK_INTERVAL_MS);

            console.log('[STT] ✅ Recording started with 30-second auto-chunking');

        } catch (error) {
            console.error('[STT] ❌ Error starting recording:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            onError?.(`Recording failed: ${errorMessage}`);
        }
    }, [onStart, onError, processAudioBuffer, selectedDeviceId, isPaused, onVolumeChange]);

    // ✅ Memoize stopRecording
    const stopRecording = useCallback(() => {
        console.log('[STT] 🛑 Stopping recording...');

        isRecordingAudioRef.current = false;

        // ✅ NEW: Clear volume update interval
        if (volumeUpdateIntervalRef.current) {
            clearInterval(volumeUpdateIntervalRef.current);
            volumeUpdateIntervalRef.current = null;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (audioBufferRef.current.length > 0) {
            console.log('[STT] Processing final audio chunk...');
            processAudioBuffer();
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
        onStop?.();
        console.log('[STT] ✅ Recording stopped');
    }, [onStop, processAudioBuffer]);

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

    return null;
});

SimpleAudioRecorder.displayName = 'SimpleAudioRecorder';

export default SimpleAudioRecorder;
