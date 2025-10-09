import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface StreamingAudioRecorderProps {
    sessionId: string;
    onTranscriptUpdate: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onStart?: () => void;
    onStop?: () => void;
}

const StreamingAudioRecorder: React.FC<StreamingAudioRecorderProps> = ({
    sessionId,
    onTranscriptUpdate,
    onError,
    onStart,
    onStop,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const lastInterimTextRef = useRef<string>('');

    const startRecording = async () => {
        try {
            console.log('[STREAM STT] Starting streaming recording...');
            setIsConnecting(true);

            // Get auth token
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // ✅ FIX: Correct WebSocket URL (no /stream/{sessionId})
            const wsUrl = `ws://localhost:8080/api/v1/transcribe?token=${token}&session_id=${sessionId}`;
            console.log('[STREAM STT] Connecting to:', wsUrl);
            
            const ws = new WebSocket(wsUrl);
            websocketRef.current = ws;

            ws.onopen = async () => {
                console.log('[STREAM STT] ✅ WebSocket connected successfully');
                setIsConnecting(false);
                setIsRecording(true);
                onStart?.();

                // Start audio capture
                await startAudioCapture(ws);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'transcript' || data.transcript) {
                    const isFinal = data.is_final || false;
                    const transcript = data.transcript || '';

                    console.log(`[STREAM STT] ${isFinal ? 'FINAL' : 'interim'}: "${transcript}"`);

                    if (!isFinal && transcript) {
                        lastInterimTextRef.current = transcript;
                    } else if (isFinal) {
                        lastInterimTextRef.current = '';
                    }

                    onTranscriptUpdate(transcript, isFinal);
                } else if (data.type === 'error' || data.error) {
                    const errorMsg = data.message || data.error || 'Unknown error';
                    
                    if (errorMsg.includes('Stream timed out') || errorMsg.includes('timeout')) {
                        console.log('[STREAM STT] Stream timed out after silence');
                        
                        if (lastInterimTextRef.current) {
                            console.log('[STREAM STT] 🔄 Force-finalizing last interim:', lastInterimTextRef.current);
                            onTranscriptUpdate(lastInterimTextRef.current, true);
                            lastInterimTextRef.current = '';
                        }
                    } else {
                        console.error('[STREAM STT] Error:', errorMsg);
                        onError(errorMsg);
                    }
                } else if (data.status === 'connected') {
                    console.log('[STREAM STT] Backend confirmed connection:', data.message);
                }
            };

            ws.onerror = (error) => {
                console.error('[STREAM STT] ❌ WebSocket error:', error);
                onError('WebSocket connection error');
                stopRecording();
            };

            ws.onclose = (event) => {
                console.log(`[STREAM STT] WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
                
                if (lastInterimTextRef.current) {
                    console.log('[STREAM STT] 🔄 Finalizing remaining text on close:', lastInterimTextRef.current);
                    onTranscriptUpdate(lastInterimTextRef.current, true);
                    lastInterimTextRef.current = '';
                }
                
                stopRecording();
            };

        } catch (error) {
            console.error('[STREAM STT] ❌ Error starting recording:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            onError(`Recording failed: ${errorMessage}`);
            setIsConnecting(false);
        }
    };

    const startAudioCapture = async (ws: WebSocket) => {
        try {
            console.log('[STREAM STT] 🎤 Requesting microphone access...');
            
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            console.log('[STREAM STT] ✅ Microphone access granted');
            streamRef.current = stream;

            // Create audio context
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            let chunkCount = 0;

            // Send audio chunks to WebSocket
            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);

                    // ✅ NEW: Log audio capture every 50 chunks
                    chunkCount++;
                    if (chunkCount % 50 === 0) {
                        console.log(`[STREAM STT] 🎵 Captured ${chunkCount} audio chunks (latest length: ${inputData.length})`);
                    }

                    // Convert to Int16
                    const int16Audio = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    // Send as binary
                    ws.send(int16Audio.buffer);
                } else {
                    console.warn(`[STREAM STT] WebSocket not open (state: ${ws.readyState}), skipping audio chunk`);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            console.log('[STREAM STT] ✅ Audio capture started - sending to backend');
        } catch (error) {
            console.error('[STREAM STT] ❌ Microphone access denied or failed:', error);
            throw error;
        }
    };

    const stopRecording = () => {
        console.log('[STREAM STT] Stopping recording...');

        if (lastInterimTextRef.current) {
            console.log('[STREAM STT] 🔄 Finalizing on stop:', lastInterimTextRef.current);
            onTranscriptUpdate(lastInterimTextRef.current, true);
            lastInterimTextRef.current = '';
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

        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }

        setIsRecording(false);
        setIsConnecting(false);
        onStop?.();
        console.log('[STREAM STT] ✅ Recording stopped');
    };

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
                disabled={isConnecting}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${isRecording
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                ) : (
                    <Mic className="w-4 h-4" />
                )}
                {isConnecting ? 'Connecting...' : isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {isRecording && (
                <span className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Live Streaming...
                </span>
            )}
        </div>
    );
};

export default StreamingAudioRecorder;
