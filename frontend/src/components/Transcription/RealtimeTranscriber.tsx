/**
 * Real-Time Audio Transcription Component
 * 
 * Implements WebSocket-based streaming transcription using Vertex AI STT.
 * Features:
 * - Real-time audio capture and streaming
 * - Multi-language support (Hindi, Marathi, English)
 * - Speaker diarization (Doctor vs Patient)
 * - Auto-reconnection on failures
 * - Word-level timing and confidence scores
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './RealtimeTranscriber.css';

// Types
interface TranscriptionWord {
  word: string;
  start_time: number;
  end_time: number;
  confidence: number;
  speaker_tag?: number;
}

interface TranscriptionResult {
  transcript: string;
  is_final: boolean;
  confidence: number;
  language_code: string;
  speaker_tag: number | null;
  words: TranscriptionWord[];
  timestamp: string;
}

interface TranscriberProps {
  sessionId: string;
  token: string;
  onTranscriptionUpdate?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  websocketUrl?: string;
}

const RealtimeTranscriber: React.FC<TranscriberProps> = ({
  sessionId,
  token,
  onTranscriptionUpdate,
  onError,
  websocketUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000'
}) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [speakerLabels] = useState<{ [key: number]: string }>({
    1: '👨‍⚕️ Doctor',
    2: '🧑‍🤝‍🧑 Patient'
  });
  const [currentLanguage, setCurrentLanguage] = useState<string>('hi-IN');
  const [averageConfidence, setAverageConfidence] = useState<number>(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const confidenceScoresRef = useRef<number[]>([]);
  
  // Constants
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000;
  const AUDIO_CHUNK_INTERVAL = 250; // 250ms chunks
  
  /**
   * Initialize WebSocket connection
   */
  const connectWebSocket = useCallback(() => {
    if (!token || !sessionId) {
      setError('Authentication required');
      return;
    }
    
    setConnectionStatus('connecting');
    
    const wsUrl = `${websocketUrl}/ws/transcribe?token=${token}&session_id=${sessionId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.binaryType = 'arraybuffer';
    
    ws.onopen = () => {
      console.log('[Transcriber] WebSocket connected');
      setConnectionStatus('connected');
      setError(null);
      reconnectAttemptsRef.current = 0;
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle status messages
        if (data.status === 'connected') {
          console.log('[Transcriber] Service ready');
          return;
        }
        
        if (data.status === 'completed') {
          console.log('[Transcriber] Transcription completed');
          return;
        }
        
        // Handle transcription results
        if (data.transcript) {
          const result: TranscriptionResult = data;
          
          // Update language indicator
          if (result.language_code) {
            setCurrentLanguage(result.language_code);
          }
          
          // Update confidence tracking
          if (result.is_final && result.confidence) {
            confidenceScoresRef.current.push(result.confidence);
            const avg = confidenceScoresRef.current.reduce((a, b) => a + b, 0) / 
                       confidenceScoresRef.current.length;
            setAverageConfidence(avg);
          }
          
          if (result.is_final) {
            // Final result - append to full transcript
            const speakerLabel = result.speaker_tag 
              ? speakerLabels[result.speaker_tag] || `Speaker ${result.speaker_tag}` 
              : '';
            
            const formattedTranscript = speakerLabel 
              ? `${speakerLabel}: ${result.transcript}`
              : result.transcript;
            
            setTranscript((prev) => {
              const updated = prev ? `${prev}\n${formattedTranscript}` : formattedTranscript;
              return updated;
            });
            setInterimTranscript('');
            
            // Callback
            if (onTranscriptionUpdate) {
              onTranscriptionUpdate(formattedTranscript, true);
            }
          } else {
            // Interim result - show in progress
            setInterimTranscript(result.transcript);
            
            // Callback
            if (onTranscriptionUpdate) {
              onTranscriptionUpdate(result.transcript, false);
            }
          }
        }
        
        // Handle errors
        if (data.error) {
          console.error('[Transcriber] Error from server:', data);
          const errorMsg = `${data.error}${data.detail ? `: ${data.detail}` : ''}`;
          setError(errorMsg);
          if (onError) {
            onError(errorMsg);
          }
        }
      } catch (err) {
        console.error('[Transcriber] Error parsing message:', err);
      }
    };
    
    ws.onerror = (event) => {
      console.error('[Transcriber] WebSocket error:', event);
      setConnectionStatus('error');
      const errorMsg = 'Connection error occurred';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    };
    
    ws.onclose = (event) => {
      console.log('[Transcriber] WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      
      // Attempt reconnection if recording is still active
      if (isRecording && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        console.log(`[Transcriber] Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, RECONNECT_DELAY);
      } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setError('Failed to reconnect after multiple attempts');
        stopRecording();
      }
    };
    
    websocketRef.current = ws;
  }, [token, sessionId, websocketUrl, isRecording, onTranscriptionUpdate, onError, speakerLabels]);
  
  /**
   * Start audio recording and transcription
   */
  const startRecording = async () => {
    try {
      setError(null);
      confidenceScoresRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioStreamRef.current = stream;
      
      // Check browser support for WEBM_OPUS
      const mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Browser does not support audio/webm;codecs=opus. Please use Chrome or Edge.');
      }
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Connect WebSocket
      connectWebSocket();
      
      // Wait for WebSocket to connect
      await new Promise<void>((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          } else if (websocketRef.current?.readyState === WebSocket.CLOSED) {
            clearInterval(checkConnection);
            reject(new Error('WebSocket failed to connect'));
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error('WebSocket connection timeout'));
        }, 10000);
      });
      
      // Handle audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          // Convert Blob to ArrayBuffer and send
          event.data.arrayBuffer().then((buffer) => {
            websocketRef.current?.send(buffer);
          }).catch((err) => {
            console.error('[Transcriber] Error sending audio:', err);
          });
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('[Transcriber] MediaRecorder error:', event);
        setError('Microphone recording error');
        stopRecording();
      };
      
      // Start recording with chunked output
      mediaRecorder.start(AUDIO_CHUNK_INTERVAL);
      setIsRecording(true);
      
      console.log('[Transcriber] Recording started');
    } catch (err: any) {
      console.error('[Transcriber] Error starting recording:', err);
      const errorMsg = err.message || 'Failed to start recording';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      stopRecording();
    }
  };
  
  /**
   * Stop audio recording and transcription
   */
  const stopRecording = useCallback(() => {
    console.log('[Transcriber] Stopping recording');
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    
    // Close WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsRecording(false);
    setConnectionStatus('disconnected');
    setInterimTranscript('');
  }, []);
  
  /**
   * Clear transcript
   */
  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    confidenceScoresRef.current = [];
    setAverageConfidence(0);
  };
  
  /**
   * Get language display name
   */
  const getLanguageName = (code: string): string => {
    const languages: { [key: string]: string } = {
      'hi-IN': '🇮🇳 Hindi',
      'mr-IN': '🇮🇳 Marathi',
      'en-IN': '🇮🇳 English'
    };
    return languages[code] || code;
  };
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);
  
  return (
    <div className="transcriber-container">
      <div className="transcriber-header">
        <div>
          <h3>🎙️ Real-Time Transcription</h3>
          <p className="session-info">Session: {sessionId}</p>
        </div>
        
        <div className="status-indicators">
          <div className={`connection-status status-${connectionStatus}`}>
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'disconnected' && '⚪ Disconnected'}
            {connectionStatus === 'error' && '🔴 Error'}
          </div>
          
          {isRecording && (
            <>
              <div className="language-indicator">
                {getLanguageName(currentLanguage)}
              </div>
              
              {averageConfidence > 0 && (
                <div className="confidence-indicator">
                  📊 {(averageConfidence * 100).toFixed(1)}% confidence
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      <div className="transcriber-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`btn btn-lg ${isRecording ? 'btn-danger recording' : 'btn-primary'}`}
          disabled={connectionStatus === 'connecting'}
        >
          {isRecording ? (
            <>
              <span className="recording-indicator">🔴</span>
              Stop Recording
            </>
          ) : (
            <>
              🎤 Start Recording
            </>
          )}
        </button>
        
        <button
          onClick={clearTranscript}
          className="btn btn-secondary"
          disabled={isRecording || !transcript}
        >
          🗑️ Clear
        </button>
      </div>
      
      <div className="transcript-display">
        <div className="transcript-content">
          {transcript && (
            <div className="final-transcript">
              {transcript.split('\n').map((line, idx) => (
                <p key={idx} className="transcript-line">
                  {line}
                </p>
              ))}
            </div>
          )}
          
          {interimTranscript && (
            <div className="interim-transcript">
              <em>💭 {interimTranscript}</em>
            </div>
          )}
          
          {!transcript && !interimTranscript && (
            <div className="placeholder">
              Click "Start Recording" to begin transcription...
              <div className="placeholder-features">
                <p>✨ Multi-language support (Hindi, Marathi, English)</p>
                <p>👥 Speaker diarization (Doctor/Patient)</p>
                <p>⚡ Real-time streaming transcription</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="transcriber-footer">
        <p className="help-text">
          💡 Speak clearly into your microphone. The system will automatically detect language changes.
        </p>
      </div>
    </div>
  );
};

export default RealtimeTranscriber;
