// API service for making HTTP requests to the backend

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import type { ApiResponse } from '@/types'

class ApiService {
    private api: AxiosInstance
    private _baseURL: string

    constructor() {
        // Get API URL from environment variable with correct fallback
        this._baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

        // Debug log to verify correct URL is being used
        console.log('🔧 API Service initialized with URL:', this._baseURL)
        console.log('📝 Environment variable NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || '(not set - using default)')

        this.api = axios.create({
            baseURL: this._baseURL,
            timeout: 10000, // 10 seconds - optimized for better UX
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })

        this.setupInterceptors()
    }

    private setupInterceptors() {
        // Request interceptor - add auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = this.getAccessToken()
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                    console.log('🔑 Auth header added for:', config.url)
                } else {
                    console.warn('⚠️ No token found for:', config.url)
                }

                // Log full request URL for debugging
                const fullUrl = `${config.baseURL}${config.url}`
                console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${fullUrl}`)

                return config
            },
            (error) => {
                console.error('❌ Request interceptor error:', error)
                return Promise.reject(error)
            }
        )

        // Response interceptor - handle errors and token refresh
        this.api.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log(`✅ API Response: ${response.config.url} - Status ${response.status}`)
                return response
            },
            async (error: AxiosError) => {
                // Enhanced error logging
                if (error.response) {
                    // Server responded with error status
                    console.error(`❌ API Error: ${error.response.status} - ${error.response.config.url}`)
                    console.error('Response data:', error.response.data)
                } else if (error.request) {
                    // Request made but no response received - likely connection refused
                    console.error('❌ Network Error - Cannot connect to backend')
                    console.error('Attempted URL:', error.config?.baseURL)
                    console.error('Check if backend is running on:', this._baseURL)
                    toast.error('Cannot connect to server. Please ensure backend is running on port 8080.')
                } else {
                    console.error('❌ Request Error:', error.message)
                }

                const originalRequest = error.config as any

                // Handle 401 errors (unauthorized)
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true

                    try {
                        // Try to refresh token
                        const refreshToken = this.getRefreshToken()
                        if (refreshToken) {
                            await this.refreshAccessToken(refreshToken)
                            // Retry original request with new token
                            const token = this.getAccessToken()
                            if (token) {
                                originalRequest.headers.Authorization = `Bearer ${token}`
                                return this.api(originalRequest)
                            }
                        }
                    } catch (refreshError) {
                        // Refresh failed, redirect to login
                        this.handleAuthError()
                    }
                }

                // Handle other errors
                this.handleApiError(error)
                return Promise.reject(error)
            }
        )
    }

    private handleApiError(error: AxiosError) {
        const response = error.response?.data as ApiResponse

        if (error.response?.status === 429) {
            toast.error('Too many requests. Please try again later.')
            return
        }

        if (error.response?.status === 500) {
            toast.error('Server error. Please try again later.')
            return
        }

        if (error.response?.status === 503) {
            toast.error('Service temporarily unavailable. Please try again later.')
            return
        }

        // Show specific error message if available
        if (response?.error?.message) {
            toast.error(response.error.message)
        } else if (error.message) {
            toast.error(error.message)
        } else {
            toast.error('An unexpected error occurred')
        }
    }

    private handleAuthError() {
        // Clear tokens
        this.clearTokens()

        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
        }
    }

    private getAccessToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('access_token')
    }

    private getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('refresh_token')
    }

    private setTokens(accessToken: string, refreshToken: string) {
        if (typeof window === 'undefined') return
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
    }

    private clearTokens() {
        if (typeof window === 'undefined') return
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_data')
    }

    private async refreshAccessToken(refreshToken: string) {
        const response = await axios.post(`${this._baseURL}/auth/refresh`, {
            refresh_token: refreshToken
        })

        const data = response.data.data
        this.setTokens(data.access_token, refreshToken)
        return data.access_token
    }

    // Public methods

    public setAuthTokens(accessToken: string, refreshToken: string) {
        this.setTokens(accessToken, refreshToken)
    }

    public clearAuthTokens() {
        this.clearTokens()
    }

    public isAuthenticated(): boolean {
        return !!this.getAccessToken()
    }

    public getToken(): string | null {
        return this.getAccessToken()
    }

    public get baseURL(): string {
        return this._baseURL
    }

    // Generic API methods
    public async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
        const response = await this.api.get(url, { params })
        return response.data
    }

    public async post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
        const response = await this.api.post(url, data, config)
        return response.data
    }

    public async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
        const response = await this.api.put(url, data)
        return response.data
    }

    public async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
        const response = await this.api.patch(url, data)
        return response.data
    }

    public async delete<T = any>(url: string): Promise<ApiResponse<T>> {
        const response = await this.api.delete(url)
        return response.data
    }

    // File upload method
    public async uploadFile<T = any>(
        url: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<T>> {
        const formData = new FormData()
        formData.append('file', file)

        const response = await this.api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    onProgress(progress)
                }
            },
        })

        return response.data
    }

    // Download file method
    public async downloadFile(url: string, filename?: string): Promise<void> {
        const response = await this.api.get(url, {
            responseType: 'blob',
        })

        const blob = new Blob([response.data])
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
    }

    // Health check method
    public async healthCheck(): Promise<boolean> {
        try {
            await this.api.get('/health/check')
            return true
        } catch (error) {
            return false
        }
    }

    // Demo Request
    public async submitDemoRequest(data: {
        full_name: string;
        email: string;
        phone?: string;
        organization?: string;
        job_title?: string;
        message?: string;
        preferred_date?: string;
    }): Promise<ApiResponse> {
        return this.post('/forms/demo-requests', data)
    }

    // Contact Message
    public async submitContactMessage(data: {
        full_name: string;
        email: string;
        phone?: string;
        subject: string;
        message: string;
        category?: string;
    }): Promise<ApiResponse> {
        return this.post('/forms/contact-messages', data)
    }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService
