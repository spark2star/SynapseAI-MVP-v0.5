/**
 * Phase 1 MVP: Post-Session Workflow Types
 */

export interface MedicationItem {
    drug_name: string
    dosage: string
    frequency: string
    route?: string
    instructions?: string
}

export interface SessionReportRequest {
    session_id: string
    transcription: string
    medication_plan: MedicationItem[]
    additional_notes?: string
}

export interface ReportData {
    id: number
    session_id: string
    status: string
    report_content: string
    medication_plan: MedicationItem[]
    model_used: string
    created_at: string
    transcription_length: number
}

export interface ReportResponse {
    status: string
    data: ReportData
}


