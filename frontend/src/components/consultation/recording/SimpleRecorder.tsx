import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface SimpleAudioRecorderProps {
    sessionId: string;
    onTranscriptUpdate: (transcript: string, isLive: boolean) => void;
    onError: (error: string) => void;
    onStart?: () => void;
    onStop?: () => void;
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

    // Write WAV header
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);  // Subchunk1Size
    view.setUint16(20, 1, true);   // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true);   // NumChannels (mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);  // ByteRate
    view.setUint16(32, 2, true);   // BlockAlign
    view.setUint16(34, 16, true);  // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset + i * 2, samples[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = ({
    sessionId,
    onTranscriptUpdate,
    onError,
    onStart,
    onStop,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioBufferRef = useRef<Float32Array[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Constants for chunking
    const CHUNK_INTERVAL_MS = 30000; // 30 seconds (safe under 60s limit)
    const MIN_CHUNK_SIZE = 16000 * 2; // 2 seconds minimum

    const startRecording = async () => {
        try {
            console.log('[STT] Starting recording...');

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            streamRef.current = stream;

            // Create audio context for processing
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            // Collect audio data
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                audioBufferRef.current.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);
            onStart?.();

            // Auto-send chunks every 30 seconds
            intervalRef.current = setInterval(() => {
                console.log('[STT] 30-second interval triggered, processing chunk...');
                processAudioBuffer();
            }, CHUNK_INTERVAL_MS);

            console.log('[STT] Recording started with 30-second auto-chunking');

        } catch (error) {
            console.error('[STT] Error starting recording:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            onError(`Recording failed: ${errorMessage}`);
        }
    };

    const stopRecording = () => {
        console.log('[STT] Stopping recording...');

        // Stop interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Process remaining audio
        if (audioBufferRef.current.length > 0) {
            console.log('[STT] Processing final audio chunk...');
            processAudioBuffer();
        }

        // Stop audio processing
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
        console.log('[STT] Recording stopped');
    };

    const processAudioBuffer = async () => {
        // Skip if buffer is too small
        if (audioBufferRef.current.length === 0) {
            console.log('[STT] No audio buffer to process');
            return;
        }

        const totalLength = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);

        // Skip if less than 2 seconds of audio
        if (totalLength < MIN_CHUNK_SIZE) {
            console.log('[STT] Audio chunk too small, skipping');
            return;
        }

        setIsProcessing(true);

        try {
            // Concatenate all audio chunks
            const combinedAudio = new Float32Array(totalLength);

            let offset = 0;
            for (const chunk of audioBufferRef.current) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            // Clear buffer immediately to avoid duplicates
            audioBufferRef.current = [];

            // Convert Float32 to Int16 (LINEAR16 format)
            const int16Audio = new Int16Array(combinedAudio.length);
            for (let i = 0; i < combinedAudio.length; i++) {
                const s = Math.max(-1, Math.min(1, combinedAudio[i]));
                int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Check audio amplitude before sending
            let maxAmplitude = 0;
            for (let i = 0; i < int16Audio.length; i++) {
                const abs = Math.abs(int16Audio[i]);
                if (abs > maxAmplitude) maxAmplitude = abs;
            }

            if (maxAmplitude < 100) {
                console.log('[STT] Audio too quiet, skipping chunk');
                return;
            }

            const durationInSeconds = int16Audio.length / 16000;
            console.log(`[STT] Processing ${durationInSeconds.toFixed(1)}s of audio (max amplitude: ${maxAmplitude})`);

            // Create WAV blob
            const wavBlob = createWavBlob(int16Audio, 16000);

            // Get authentication token
            const token = localStorage.getItem('access_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Create FormData with WAV blob
            const formData = new FormData();
            formData.append('audio', wavBlob, 'audio.wav');

            const response = await fetch(`http://localhost:8080/api/v1/stt/chunk?session_id=${sessionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result: TranscriptionResponse = await response.json();
            console.log('[STT] 📦 Full response:', JSON.stringify(result));

            if (result.status === "success" && result.transcript && result.transcript.trim()) {
                console.log(`[STT] ✅ Got transcript: "${result.transcript}"`);
                onTranscriptUpdate(result.transcript, false);
            } else {
                console.log('[STT] No transcript in response');
            }

        } catch (error) {
            console.error('[STT] Error processing audio:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            onError(`Transcription failed: ${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${isRecording
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            >
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                ) : (
                    <Mic className="w-4 h-4" />
                )}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {isProcessing && (
                <span className="text-sm text-gray-500">Processing...</span>
            )}

            {isRecording && !isProcessing && (
                <span className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Recording (auto-chunks every 30s)
                </span>
            )}
        </div>
    );
};

export default SimpleAudioRecorder;
