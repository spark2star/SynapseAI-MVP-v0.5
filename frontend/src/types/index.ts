// Common types and interfaces for the EMR system

export type ApiStatus = 'success' | 'accepted' | 'error' | 'pending'

export interface ApiResponse<T = any> {
    status: ApiStatus
    data?: T
    error?: {
        code: string
        message: string
        details?: any
    }
    metadata?: {
        timestamp: string
        version: string
    }
}

export interface User {
    id: string
    email: string
    role: 'admin' | 'doctor' | 'receptionist'
    is_verified: boolean
    is_active: boolean
    password_reset_required?: boolean
    created_at: string
    updated_at: string
}

export interface UserProfile {
    id: string
    user_id: string
    first_name: string
    last_name: string
    phone?: string
    license_number?: string
    specialization?: string
    timezone: string
    language: string
    created_at: string
    updated_at: string
}

export interface PractitionerProfile {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    clinic_name?: string | null
    clinic_address?: string | null
    phone?: string | null
    license_number?: string | null
    specialization?: string | null
    logo_url?: string | null
    avatar_url?: string | null
    updated_at?: string | null
}

export interface PractitionerProfileUpdate {
    first_name?: string
    last_name?: string
    clinic_name?: string
    clinic_address?: string
    phone?: string
    license_number?: string
    specialization?: string
}

export interface PractitionerProfileUpdateResponse {
    success: boolean
    message: string
    data: PractitionerProfile
}

export interface Patient {
    id: string
    patient_id: string
    first_name: string
    last_name: string
    full_name: string
    date_of_birth: string
    age?: number
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
    phone_primary?: string
    phone_secondary?: string
    email?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relationship?: string
    blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown'
    allergies?: string
    medical_history?: string
    current_medications?: string
    insurance_provider?: string
    insurance_policy_number?: string
    insurance_group_number?: string
    occupation?: string
    marital_status?: string
    preferred_language?: string
    notes?: string
    tags?: string
    created_by: string
    created_at: string
    updated_at: string
}

export interface PatientCreate {
    first_name: string
    last_name: string
    date_of_birth: string
    gender: Patient['gender']
    phone_primary?: string
    phone_secondary?: string
    email?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relationship?: string
    blood_group?: Patient['blood_group']
    allergies?: string
    medical_history?: string
    current_medications?: string
    insurance_provider?: string
    insurance_policy_number?: string
    insurance_group_number?: string
    occupation?: string
    marital_status?: string
    preferred_language?: string
    notes?: string
    tags?: string
}

export interface LoginCredentials {
    email: string
    password: string
    remember_me?: boolean
}

export interface AuthTokens {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    user_id: string
    role: string
    requires_mfa: boolean
}

export interface PaginatedResponse<T> {
    items: T[]
    total_count: number
    limit: number
    offset: number
}

export interface SearchParams {
    query?: string
    search_type?: 'name' | 'phone' | 'email'
    limit?: number
    offset?: number
}

// Form validation types
export interface ValidationError {
    field: string
    message: string
}

export interface FormState {
    isSubmitting: boolean
    errors: ValidationError[]
    isDirty: boolean
}

// Navigation types
export interface NavItem {
    name: string
    href: string
    icon: any // React component
    current?: boolean
    badge?: string | number
}

// Table types
export interface TableColumn<T = any> {
    key: keyof T | string
    label: string
    sortable?: boolean
    render?: (value: any, item: T) => React.ReactNode
    className?: string
}

export interface TableProps<T = any> {
    data: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    onRowClick?: (item: T) => void
    emptyMessage?: string
    className?: string
}

// Modal types
export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    children: React.ReactNode
}

// Toast notification types
export interface ToastOptions {
    title?: string
    description?: string
    variant?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
}

// Theme types
export interface Theme {
    colors: {
        primary: string
        secondary: string
        success: string
        warning: string
        error: string
        info: string
    }
    breakpoints: {
        sm: string
        md: string
        lg: string
        xl: string
    }
}

// Environment types
export interface Environment {
    API_URL: string
    APP_ENV: 'development' | 'staging' | 'production'
    APP_VERSION: string
}
