import axios, { AxiosInstance, AxiosError } from 'axios';
// import {apiService} from '@/services/api';

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
  // ✅ BETTER FIX - Unwrap in API service:
  async getPatients(params: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const response = await this.api.get('/patients/list/', { params });
    
    // ✅ ADD DEBUG LOGS:
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
}


// Export singleton instance
export const apiService = new ApiService();




// Also export class for testing
export default ApiService;
