import apiService from '@/services/api'
import type { SymptomSearchResult, AssignedSymptom, AssignSymptomPayload } from '@/types/symptom'

export const symptomAPI = {
    search: async (query: string): Promise<SymptomSearchResult[]> => {
        const resp = await apiService.get<SymptomSearchResult[]>(`/symptoms/search`, { q: query })
        return resp as unknown as SymptomSearchResult[]
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


