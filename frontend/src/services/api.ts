import axios, { AxiosInstance, AxiosError } from 'axios';
import { Medication, DashboardStatsResponse } from '@/types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

    console.log('🔧 API Service initialized with base URL:', this.baseURL);

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Auth header added for:', config.url);
        }

        console.log('🚀 API Request:', config.method?.toUpperCase(), `${this.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', response.config.url, '- Status', response.status);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ API Error:', error.response?.status, '-', error.config?.url);
        console.error('Response data:', error.response?.data);

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // GENERIC HTTP METHODS
  // ============================================================================

  /**
   * Generic GET request
   */
  async get(endpoint: string, params?: any) {
    const response = await this.api.get(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post(endpoint: string, data?: any) {
    const response = await this.api.post(endpoint, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put(endpoint: string, data?: any) {
    const response = await this.api.put(endpoint, data);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch(endpoint: string, data?: any) {
    const response = await this.api.patch(endpoint, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete(endpoint: string) {
    const response = await this.api.delete(endpoint);
    return response.data;
  }

  // ============================================================================
  // AUTHENTICATION HELPER METHODS
  // ============================================================================

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  /**
   * Clear all authentication tokens and user data
   */
  clearAuthTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('✅ Auth tokens cleared');
  }

  /**
   * Set access token
   */
  setAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Set both access and refresh tokens at once
   */
  setAuthTokens(accessToken: string, refreshToken?: string): void {
    this.setAuthToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
    console.log('✅ Auth tokens set');
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getUserProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  // ============================================================================
  // PATIENT ENDPOINTS
  // ============================================================================

  /**
   * Get paginated list of patients
   */
  async getPatients(params: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const response = await this.api.get('/patients/list/', { params });

    console.log('🔍 API RAW RESPONSE:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data?.data);
    console.log('🔍 Type of response.data:', typeof response.data);

    return response.data.data || response.data;
  }

  /**
   * Create new patient
   */
  async createPatient(patientData: any) {
    const response = await this.api.post('/patients', patientData);
    return response.data;
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string) {
    const response = await this.api.get(`/patients/${patientId}`);
    return response.data;
  }

  /**
   * Get patient sessions
   */
  async getPatientSessions(patientId: string) {
    const response = await this.api.get(`/patients/${patientId}/sessions`);
    return response.data;
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId: string, patientData: Partial<{
    name: string
    age: number
    sex: string
    address: string
    phone: string
    email: string
    illness_duration_value: number
    illness_duration_unit: string
    referred_by: string
    precipitating_factor_narrative: string
    precipitating_factor_tags: string[]
    informants: any
  }>) {
    const response = await this.api.put(`/intake/patients/${patientId}`, patientData);
    return response.data;
  }

  // ============================================================================
  // CONSULTATION ENDPOINTS
  // ============================================================================

  /**
   * Get consultation history for a patient
   */
  async getConsultationHistory(patientId: string) {
    const response = await this.api.get(`/consultation/history/${patientId}`);
    return response.data;
  }

  /**
   * Create new consultation session
   */
  async createConsultation(consultationData: any) {
    const response = await this.api.post('/consultation', consultationData);
    return response.data;
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /**
   * Get doctor applications for admin review
   */
  async getDoctorApplications(status?: string) {
    const params = status ? { status } : {};
    const response = await this.api.get('/admin/doctor-applications', { params });
    return response.data;
  }

  /**
   * Approve doctor application
   */
  async approveDoctorApplication(userId: string) {
    const response = await this.api.post(`/admin/doctor-applications/${userId}/approve`);
    return response.data;
  }

  /**
   * Reject doctor application
   */
  async rejectDoctorApplication(userId: string, reason: string) {
    const response = await this.api.post(`/admin/doctor-applications/${userId}/reject`, { reason });
    return response.data;
  }

  // ============================================================================
  // DEMO & CONTACT FORM ENDPOINTS
  // ============================================================================

  /**
   * Submit demo request
   */
  async submitDemoRequest(data: any) {
    const response = await this.api.post('/forms/demo-requests', data);
    return response.data;
  }

  // Analytics endpoints
  async getPatientStatusStats() {
    const response = await this.api.get('/analytics/patient-status');
    return response.data;
  }

  async getDashboardOverview() {
    const response = await this.api.get('/analytics/overview');
    return response.data;
  }

  /**
   * Get dashboard stats for Clinical Command Center
   * @returns Dashboard statistics including pending patients, reports, and session data
   * @throws {AxiosError} Network or authentication errors
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    try {
      const response = await this.api.get<DashboardStatsResponse>('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get monthly trends data for dashboard graphs
   */
  async getMonthlyTrends(months: number = 6) {
    const response = await this.api.get('/analytics/monthly-trends', {
      params: { months }
    });
    return response.data;
  }

  /**
   * Submit contact message
   */
  async submitContactMessage(data: any) {
    const response = await this.api.post('/forms/contact-messages', data);
    return response.data;
  }

  // ============================================================================
  // STAFF MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Invite a receptionist to join the clinic
   */
  async inviteStaff(email: string) {
    const response = await this.api.post('/staff/invite', { email });
    return response.data;
  }

  /**
   * Check invitation token status
   */
  async checkInvitationStatus(token: string) {
    const response = await this.api.get(`/staff/invite/${token}/status`);
    return response.data;
  }

  /**
   * Accept staff invitation and create account
   */
  async acceptInvitation(token: string, password: string, confirmPassword: string) {
    const response = await this.api.post(`/staff/accept-invite/${token}`, {
      password,
      confirm_password: confirmPassword
    });
    return response.data;
  }

  /**
   * List all staff members in the clinic
   */
  async listStaffMembers() {
    const response = await this.api.get('/staff/list');
    return response.data;
  }

  /**
   * List pending invitations
   */
  async listPendingInvitations() {
    const response = await this.api.get('/staff/pending-invitations');
    return response.data;
  }

  // ============================================================================
  // PATIENT V2 ENDPOINTS (Two-Stage Registration)
  // ============================================================================

  /**
   * Create patient with demographics only (Stage 1)
   */
  async createPatientDemographics(data: any) {
    const response = await this.api.post('/patients/v2/demographics', data);
    return response.data;
  }

  /**
   * Complete patient clinical information (Stage 2)
   */
  async completePatientClinicalInfo(patientId: string, data: any) {
    const response = await this.api.put(`/patients/v2/${patientId}/clinical-info`, data);
    return response.data;
  }

  /**
   * Get list of patients pending clinical review
   */
  async getPendingPatients() {
    const response = await this.api.get('/patients/v2/pending-clinical-review');
    return response.data;
  }

  /**
   * Get patient demographics only
   */
  async getPatientDemographics(patientId: string) {
    const response = await this.api.get(`/patients/v2/${patientId}/demographics`);
    return response.data;
  }

  /**
   * Get complete patient profile
   */
  async getCompletePatient(patientId: string) {
    const response = await this.api.get(`/patients/v2/${patientId}/complete`);
    return response.data;
  }

  // ============================================================================
  // MEDICATION ENDPOINTS
  // ============================================================================

  /**
   * Search medications by name
   * @param query - Search query (minimum 2 characters)
   * @returns Array of matching medications
   */
  async searchMedications(query: string): Promise<Medication[]> {
    // Client-side validation: return empty array if query is too short
    if (query.length < 2) {
      return [];
    }

    try {
      const response = await this.api.get('/medications/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      // Graceful error handling: return empty array on API failures
      console.error('Medication search error:', error);
      return [];
    }
  }

  // ============================================================================
  // PROFILE COMPLETION ENDPOINTS
  // ============================================================================

  /**
   * Complete doctor profile with professional details and file uploads
   * @param formData - Multipart form data containing profile information and files
   * @returns Profile completion response
   */
  async completeProfile(formData: FormData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/profile/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Profile completion error:', error);
      throw error;
    }
  }

  // ============================================================================
  // REPORT SIGNING ENDPOINTS
  // ============================================================================

  /**
   * Sign a clinical report with password verification
   * @param reportId - ID of the report to sign
   * @param password - Doctor's password for authentication
   * @returns Signed report details
   */
  async signReport(reportId: string, password: string) {
    try {
      const response = await this.api.post(`/reports/${reportId}/sign`, {
        password
      });
      return response.data;
    } catch (error: any) {
      console.error('Report signing error:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.detail || 'Report cannot be signed at this time.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to sign this report.');
      } else if (error.response?.status === 404) {
        throw new Error('Report not found.');
      }

      throw new Error('Failed to sign report. Please try again.');
    }
  }
}

// ✅ Export singleton instance as default
const apiClient = new ApiService();
export default apiClient;

// ✅ Also export as named export for compatibility
export const apiService = apiClient;
