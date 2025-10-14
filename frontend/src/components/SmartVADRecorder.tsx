'use client';

import { useEffect, useRef, useState } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';

interface SmartVADRecorderProps {
  sessionId: string;
  isActive: boolean;
  onTranscriptReceived: (transcript: string) => void;
  doctorMicDeviceId?: string;
}

export const SmartVADRecorder = ({
  sessionId,
  isActive,
  onTranscriptReceived,
  doctorMicDeviceId
}: SmartVADRecorderProps) => {

  const [isRecording, setIsRecording] = useState(false);
  const speechStartTimeRef = useRef<number>(0);

  // ✅ VAD Configuration for MENTAL HEALTH / PSYCHIATRIC SESSIONS
  const vad = useMicVAD({
    // ⚙️ OPTIMIZED FOR EMOTIONAL SPEECH: Patients cry, pause, hesitate during therapy
    // These settings are tolerant of natural emotional patterns in therapeutic conversations
    positiveSpeechThreshold: 0.75,    // ⬆️ Higher = more confident (less false triggers from crying/sobbing)
    negativeSpeechThreshold: 0.2,     // ⬇️ Very low = very tolerant of pauses (patient thinking/crying)
    minSpeechMs: 160,                  // ⬆️ Require substantial speech before triggering
    redemptionMs: 600,                 // ⬆️ Allow LONGER pauses (30 frames * 20ms = 600ms for emotional moments)
    preSpeechPadMs: 100,               // ⬆️ Capture more at start (emotional onset, hesitation)

    // 🎯 Speech detection callbacks
    onSpeechStart: () => {
      console.log('[VAD] 🎤 Doctor started speaking');
      speechStartTimeRef.current = Date.now();
      setIsRecording(true);
    },

    onSpeechEnd: async (audio: Float32Array) => {
      const duration = Date.now() - speechStartTimeRef.current;
      console.log(`[VAD] 🔇 Doctor stopped speaking (${duration}ms)`);

      // Accept shorter segments to avoid missing speech
      if (duration < 50) {  // Changed from 100ms to 50ms
        console.log('[VAD] ⚠️ Too short, ignoring');
        setIsRecording(false);
        return;
      }

      setIsRecording(false);

      // ✅ Send to backend
      await sendAudioToBackend(audio);
    },

    onVADMisfire: () => {
      console.log('[VAD] ⚠️ False positive detected');
    },

  } as any); // Note: Model files auto-loaded from /public folder (silero_vad.onnx, vad.worklet.bundle.min.js)

  // ✅ Convert Float32Array to WAV and send to backend
  const sendAudioToBackend = async (audioData: Float32Array) => {
    try {
      console.log(`[VAD] 📤 Sending ${audioData.length} samples to backend`);

      // Convert Float32Array to WAV
      const wavBlob = float32ToWav(audioData, 16000);

      // Send to backend
      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');

      const response = await fetch(
        `http://localhost:8080/api/v1/stt/chunk?session_id=${sessionId}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[VAD] ✅ Transcription:', result.transcript);

      if (result.transcript) {
        onTranscriptReceived(result.transcript);
      }

    } catch (error) {
      console.error('[VAD] ❌ Error sending audio:', error);
    }
  };

  // ✅ Start/stop VAD based on session state
  useEffect(() => {
    if (isActive) {
      vad.start();
      console.log('[VAD] ▶️ VAD started');
    } else {
      vad.pause();
      console.log('[VAD] ⏸️ VAD paused');
    }

    return () => {
      vad.pause();
    };
  }, [isActive, vad]);

  return (
    <div className="fixed top-4 right-4 z-50">
      {isRecording && (
        <div className="recording-badge bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <span className="w-3 h-3 bg-white rounded-full"></span>
          🎤 Recording Doctor's Voice...
        </div>
      )}
      {vad.listening && !isRecording && (
        <div className="listening-badge bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
          👂 Listening for Doctor...
        </div>
      )}
    </div>
  );
};

// ✅ Helper: Convert Float32Array to WAV blob
function float32ToWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert float32 to int16
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
