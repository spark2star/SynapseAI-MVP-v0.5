import apiService from '@/services/api'
import type { SymptomSearchResult, AssignedSymptom, AssignSymptomPayload } from '@/types/symptom'

export const symptomAPI = {
    search: async (query: string): Promise<SymptomSearchResult[]> => {
        const resp = await apiService.get<any>(`/intake/symptoms`, { q: query })
        // Backend returns { status, data: { symptoms: [...] } }
        if (resp.status === 'success' && resp.data?.symptoms) {
            return resp.data.symptoms as SymptomSearchResult[]
        }
        return []
    },

    assignToPatient: async (patientId: number, payload: AssignSymptomPayload): Promise<AssignedSymptom> => {
        const resp = await apiService.post<AssignedSymptom>(`/patients/${patientId}/symptoms`, payload)
        return resp as unknown as AssignedSymptom
    },

    getPatientSymptoms: async (patientId: number): Promise<AssignedSymptom[]> => {
        const resp = await apiService.get<AssignedSymptom[]>(`/patients/${patientId}/symptoms`)
        return resp as unknown as AssignedSymptom[]
    },

    deletePatientSymptom: async (patientSymptomId: number): Promise<void> => {
        await apiService.delete(`/patient_symptoms/${patientSymptomId}`)
    }
}


