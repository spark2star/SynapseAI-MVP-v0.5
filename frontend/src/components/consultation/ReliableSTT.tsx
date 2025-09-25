'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ReliableSTTProps {
    isRecording: boolean;
    isPaused: boolean;
    language: string;
    onTranscriptionUpdate: (text: string, isFinal: boolean) => void;
    onConnectionChange: (connected: boolean) => void;
}

export class ReliableSTTManager {
    private recognition: any = null;
    private isActive = false;
    private shouldRestart = true;
    private restartTimeout: NodeJS.Timeout | null = null;
    private qualityTimeout: NodeJS.Timeout | null = null;
    
    constructor(
        private language: string,
        private onTranscript: (text: string, isFinal: boolean) => void,
        private onConnectionChange: (connected: boolean) => void
    ) {}
    
    start() {
        console.log('🚀 RELIABLE STT: Starting with language', this.language);
        this.shouldRestart = true;
        this.createFreshRecognition();
    }
    
    stop() {
        console.log('🛑 RELIABLE STT: Stopping');
        this.shouldRestart = false;
        this.clearTimeouts();
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('Stop error:', e);
            }
        }
    }
    
    pause() {
        console.log('⏸️ RELIABLE STT: Pausing');
        this.shouldRestart = false;
        this.clearTimeouts();
        if (this.recognition && this.isActive) {
            this.recognition.stop();
        }
    }
    
    resume() {
        console.log('▶️ RELIABLE STT: Resuming');
        this.shouldRestart = true;
        this.createFreshRecognition();
    }
    
    private createFreshRecognition() {
        this.clearTimeouts();
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            toast.error('Speech recognition not supported. Please use Chrome or Edge.');
            return;
        }
        
        // Clean up old recognition
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        
        this.recognition = new SpeechRecognition();
        
        // OPTIMAL CONFIGURATION FOR MEDICAL TRANSCRIPTION
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;
        this.recognition.maxAlternatives = 1;
        
        this.setupEventHandlers();
        
        try {
            this.recognition.start();
            console.log('🎤 RELIABLE STT: Fresh instance started');
        } catch (error) {
            console.error('Start error:', error);
            this.scheduleRestart();
        }
    }
    
    private setupEventHandlers() {
        this.recognition.onstart = () => {
            console.log('✅ RELIABLE STT: Active and listening');
            this.isActive = true;
            this.onConnectionChange(true);
            
            // PROACTIVE RESTART EVERY 25 SECONDS FOR OPTIMAL QUALITY
            this.qualityTimeout = setTimeout(() => {
                if (this.shouldRestart && this.isActive) {
                    console.log('🔄 PROACTIVE QUALITY RESTART (25s)');
                    this.proactiveRestart();
                }
            }, 25000);
        };
        
        this.recognition.onresult = (event: any) => {
            let finalText = '';
            let interimText = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript.trim();
                
                if (result.isFinal) {
                    finalText += transcript + ' ';
                } else {
                    interimText = transcript; // Use latest interim only
                }
            }
            
            if (finalText) {
                console.log('✅ FINAL:', finalText.substring(0, 50) + '...');
                this.onTranscript(finalText.trim(), true);
            }
            
            if (interimText) {
                this.onTranscript(interimText, false);
            }
        };
        
        this.recognition.onerror = (event: any) => {
            console.error('🚨 STT ERROR:', event.error);
            this.isActive = false;
            this.onConnectionChange(false);
            
            if (event.error === 'not-allowed') {
                toast.error('❌ Microphone permission denied');
                return;
            }
            
            if (event.error === 'audio-capture') {
                toast.error('❌ Cannot access microphone');
                return;
            }
            
            // For recoverable errors, restart
            if (this.shouldRestart) {
                this.scheduleRestart();
            }
        };
        
        this.recognition.onend = () => {
            console.log('⏹️ STT session ended');
            this.isActive = false;
            this.onConnectionChange(false);
            
            if (this.shouldRestart) {
                this.scheduleRestart();
            }
        };
    }
    
    private proactiveRestart() {
        console.log('🔄 Performing proactive quality restart...');
        if (this.recognition && this.isActive) {
            this.recognition.stop(); // Will trigger onend → restart
        }
    }
    
    private scheduleRestart() {
        if (!this.shouldRestart) return;
        
        this.clearTimeouts();
        this.restartTimeout = setTimeout(() => {
            if (this.shouldRestart) {
                console.log('🔄 Automatic restart executing...');
                this.createFreshRecognition();
            }
        }, 1500);
    }
    
    private clearTimeouts() {
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        if (this.qualityTimeout) {
            clearTimeout(this.qualityTimeout);
            this.qualityTimeout = null;
        }
    }
    
    updateLanguage(newLanguage: string) {
        this.language = newLanguage;
        if (this.isActive) {
            console.log('🌍 Language changed to:', newLanguage, '- Restarting STT');
            this.createFreshRecognition();
        }
    }
}

export default function useReliableSTT(props: ReliableSTTProps) {
    const managerRef = useRef<ReliableSTTManager | null>(null);
    
    // Initialize manager
    useEffect(() => {
        managerRef.current = new ReliableSTTManager(
            props.language,
            props.onTranscriptionUpdate,
            props.onConnectionChange
        );
        
        return () => {
            if (managerRef.current) {
                managerRef.current.stop();
            }
        };
    }, []);
    
    // Handle recording state changes
    useEffect(() => {
        const manager = managerRef.current;
        if (!manager) return;
        
        if (props.isRecording && !props.isPaused) {
            manager.start();
        } else if (props.isRecording && props.isPaused) {
            manager.pause();
        } else {
            manager.stop();
        }
    }, [props.isRecording, props.isPaused]);
    
    // Handle language changes
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.updateLanguage(props.language);
        }
    }, [props.language]);
    
    return null; // This is a hook, no UI
}
