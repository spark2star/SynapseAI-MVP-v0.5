'use client';

import React, { useRef, useState } from 'react';

export default function SimpleSTT() {
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            console.log('🎤 SIMPLE STT STARTED');
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            console.log('📝 RESULTS RECEIVED:', event.results.length);
            let finalText = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                
                if (result.isFinal) {
                    finalText += text + ' ';
                    console.log('✅ FINAL:', text);
                }
            }
            
            if (finalText) {
                setTranscript(prev => prev + finalText);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('❌ STT ERROR:', event.error);
        };

        recognition.onend = () => {
            console.log('⏹️ STT ENDED');
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return (
        <div className="p-4 border rounded">
            <h3 className="text-lg font-bold mb-4">Simple STT Test</h3>
            <div className="mb-4">
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-2 rounded ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
            </div>
            <div className="mb-2">
                <strong>Status:</strong> {isRecording ? 'Recording...' : 'Stopped'}
            </div>
            <div className="border p-2 min-h-[100px] bg-gray-50">
                <strong>Transcript:</strong>
                <p>{transcript || 'No transcript yet...'}</p>
            </div>
            <button 
                onClick={() => setTranscript('')}
                className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
                Clear
            </button>
        </div>
    );
}
