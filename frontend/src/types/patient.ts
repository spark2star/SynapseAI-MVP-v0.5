/**
 * Patient Types for Two-Stage Registration
 */

export interface PatientDemographicsRequest {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: string;
    phonePrimary: string;
    phoneSecondary?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceGroupNumber?: string;
    occupation?: string;
    maritalStatus?: string;
    preferredLanguage?: string;
}

export interface PatientClinicalInfoRequest {
    bloodGroup?: string;
    allergies?: string;
    medicalHistory?: string;
    currentMedications?: string;
    notes?: string;
    tags?: string;
}

export interface PatientDemographicsResponse {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    age?: number;
    gender: string;
    phonePrimary: string;
    phoneSecondary?: string;
    email?: string;
    profileStatus: string;
    createdAt: string;
    createdBy: string;
}

export interface PatientCompleteResponse extends PatientDemographicsResponse {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    bloodGroup?: string;
    allergies?: string;
    medicalHistory?: string;
    currentMedications?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceGroupNumber?: string;
    updatedAt: string;
}

export interface PendingPatient {
    id: string;
    patientId: string;
    fullName: string;
    age?: number;
    gender: string;
    phonePrimary: string;
    createdAt: string;
    createdByName?: string;
}

export enum ProfileStatus {
    DEMOGRAPHICS_ONLY = 'DEMOGRAPHICS_ONLY',
    CLINICAL_INFO_COMPLETE = 'CLINICAL_INFO_COMPLETE'
}
