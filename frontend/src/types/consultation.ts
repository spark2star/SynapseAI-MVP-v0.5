/**
 * TypeScript type definitions for consultation-related API responses
 */

export interface ConsultationHistoryItem {
    id: string;
    session_id: string;
    created_at: string;  // ISO 8601 format from API
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    chief_complaint: string | null;
    status: 'in_progress' | 'completed' | 'cancelled' | 'paused';
    session_type: string;
    has_transcription: boolean;
}

export interface ConsultationHistoryResponse {
    patient_id: string;
    patient_name?: string;
    total_consultations: number;
    consultations: ConsultationHistoryItem[];
}

export interface ConsultationDetailResponse {
    id: string;
    session_id: string;
    patient_id: string;
    doctor_id: string;
    session_type: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    total_duration: number | null;
    chief_complaint: string | null;
    notes: string | null;
    audio_quality_score: number | null;
    transcription_confidence: number | null;
    created_at: string;
    updated_at: string;
}

export interface StartConsultationRequest {
    patient_id: string;
    doctor_id: string;
    chief_complaint: string;
    session_type?: string;
}

export interface StartConsultationResponse {
    status: string;
    data: {
        session_id: string;
        consultation_id: string;
        patient_name: string;
        started_at: string;
        stt_session: any;
        websocket_url: string;
    };
    message: string;
}

