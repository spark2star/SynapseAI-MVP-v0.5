/**
 * Consultation API service
 * Handles all consultation-related API calls
 */

import apiService from './api';
import type {
    ConsultationHistoryResponse,
    ConsultationDetailResponse,
    StartConsultationRequest,
    StartConsultationResponse
} from '@/types/consultation';

export const consultationService = {
    /**
     * Fetch consultation history for a patient
     */
    getHistory: async (patientId: string): Promise<ConsultationHistoryResponse> => {
        const response = await apiService.get<any>(`/consultation/history/${patientId}`);

        if (response.status === 'success' && response.data) {
            return response.data as ConsultationHistoryResponse;
        }

        // Return empty history if no data
        return {
            patient_id: patientId,
            total_consultations: 0,
            consultations: []
        };
    },

    /**
     * Get detailed consultation information
     */
    getDetail: async (consultationId: string): Promise<ConsultationDetailResponse> => {
        const response = await apiService.get<any>(`/consultation/detail/${consultationId}`);

        if (response.status === 'success' && response.data) {
            return response.data as ConsultationDetailResponse;
        }

        throw new Error('Failed to fetch consultation details');
    },

    /**
     * Start a new consultation session
     */
    start: async (data: StartConsultationRequest): Promise<StartConsultationResponse> => {
        const response = await apiService.post<any>('/consultation/start', data);

        if (response.status === 'success') {
            return response as StartConsultationResponse;
        }

        throw new Error(response.error?.message || 'Failed to start consultation');
    },

    /**
     * Stop/end a consultation session
     */
    stop: async (sessionId: string, notes?: string): Promise<any> => {
        const response = await apiService.post<any>(`/consultation/${sessionId}/stop`, {
            notes: notes || ''
        });

        return response;
    }
};

export default consultationService;

