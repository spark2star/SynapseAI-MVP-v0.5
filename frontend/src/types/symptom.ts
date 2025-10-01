export type IntensityLevel = 'Mild' | 'Moderate' | 'Severe'
export type SymptomType = 'global' | 'custom'

export interface SymptomSearchResult {
    name: string
    type: SymptomType
    source_id?: number
    category?: string
}

export interface AssignedSymptom {
    id: number
    patient_id: number
    symptom_name: string
    symptom_type: SymptomType
    intensity: IntensityLevel
    duration: string
    recorded_at: string
}

export interface AssignSymptomPayload {
    symptom_name: string
    is_custom: boolean
    intensity: IntensityLevel
    duration: string
}


