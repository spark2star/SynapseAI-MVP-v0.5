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
    success: boolean;
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

            // Send audio chunks every 5 seconds
            intervalRef.current = setInterval(() => {
                processAudioBuffer();
            }, 10000);

            console.log('[STT] Recording started successfully');

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
        if (audioBufferRef.current.length === 0) return;

        setIsProcessing(true);

        try {
            // Concatenate all audio chunks
            const totalLength = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);
            const combinedAudio = new Float32Array(totalLength);

            let offset = 0;
            for (const chunk of audioBufferRef.current) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            // Clear buffer
            audioBufferRef.current = [];

            // Convert Float32 to Int16 (LINEAR16 format)
            const int16Audio = new Int16Array(combinedAudio.length);
            for (let i = 0; i < combinedAudio.length; i++) {
                const s = Math.max(-1, Math.min(1, combinedAudio[i]));
                int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Convert to base64
            const bytes = new Uint8Array(int16Audio.buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Audio = btoa(binary);

            console.log(`[STT] Sending ${base64Audio.length} chars to API`);

            // ✅ Get authentication token
            const token = localStorage.getItem('access_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Check if audio has actual content before sending
            const audioArray = new Int16Array(int16Audio);
            // ✅ GOOD - Use reduce instead
            let maxAmplitude = 0;
            for (let i = 0; i < int16Audio.length; i++) {
                const abs = Math.abs(int16Audio[i]);
                if (abs > maxAmplitude) maxAmplitude = abs;
            }

            if (maxAmplitude < 100) {
                console.log('[STT] Audio too quiet, skipping chunk');
                return; // Don't send silent audio
            }


            // Send to backend with auth header
            const formData = new FormData();
            formData.append('session_id', sessionId);
            formData.append('audio_data', base64Audio);

            const response = await fetch('http://localhost:8080/api/v1/transcribe/chunk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // ✅ ADD AUTH HEADER
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result: TranscriptionResponse = await response.json();

            if (result.success && result.transcript.trim()) {
                console.log(`[STT] Got transcript: "${result.transcript}"`);
                onTranscriptUpdate(result.transcript, false);
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
                    Recording...
                </span>
            )}
        </div>
    );
};

export default SimpleAudioRecorder;
