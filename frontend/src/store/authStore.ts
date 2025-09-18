// Authentication store using Zustand

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import apiService from '@/services/api'
import type { User, UserProfile, LoginCredentials, AuthTokens } from '@/types'

interface AuthState {
    // State
    user: User | null
    profile: UserProfile | null
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    login: (credentials: LoginCredentials) => Promise<boolean>
    logout: () => void
    checkAuth: () => Promise<void>
    updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>
    refreshToken: () => Promise<boolean>
    fetchUserProfile: () => Promise<void>

    // Helpers
    hasRole: (role: string) => boolean
    hasAnyRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false, // Start with false to prevent initial loading state

            // Login action
            login: async (credentials: LoginCredentials): Promise<boolean> => {
                try {
                    set({ isLoading: true })

                    const response = await apiService.post('/auth/login', credentials)

                    if (response.status === 'success' && response.data) {
                        const {
                            access_token,
                            refresh_token,
                            user_id,
                            role
                        } = response.data

                        // Store tokens in API service
                        apiService.setAuthTokens(access_token, refresh_token)

                        // Create user object
                        const user: User = {
                            id: user_id,
                            email: credentials.email,
                            role: role as User['role'],
                            is_verified: true, // Assuming verified if login succeeded
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false
                        })

                        // Fetch user profile
                        await get().fetchUserProfile()

                        return true
                    }

                    set({ isLoading: false })
                    return false
                } catch (error) {
                    console.error('Login error:', error)
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false
                    })
                    return false
                }
            },

            // Logout action
            logout: () => {
                try {
                    // Call logout endpoint (fire and forget)
                    apiService.post('/auth/logout').catch(console.error)
                } catch (error) {
                    console.error('Logout error:', error)
                } finally {
                    // Clear local state regardless of API call result
                    apiService.clearAuthTokens()
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false
                    })
                }
            },

            // Check authentication status
            checkAuth: async (): Promise<void> => {
                try {
                    set({ isLoading: true })

                    if (!apiService.isAuthenticated()) {
                        set({
                            user: null,
                            profile: null,
                            isAuthenticated: false,
                            isLoading: false
                        })
                        return
                    }

                    // Validate token with backend
                    const response = await apiService.get('/auth/validate-token')

                    if (response.status === 'success' && response.data?.valid) {
                        const { user_id, role, email } = response.data

                        const user: User = {
                            id: user_id,
                            email: email || '',
                            role: role as User['role'],
                            is_verified: true,
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false
                        })

                        // Fetch user profile
                        await get().fetchUserProfile()
                    } else {
                        // Token is invalid
                        apiService.clearAuthTokens()
                        set({
                            user: null,
                            profile: null,
                            isAuthenticated: false,
                            isLoading: false
                        })
                    }
                } catch (error) {
                    console.error('Auth check error:', error)
                    apiService.clearAuthTokens()
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false
                    })
                }
            },

            // Fetch user profile (internal method)
            fetchUserProfile: async (): Promise<void> => {
                try {
                    const response = await apiService.get('/users/profile')

                    if (response.status === 'success' && response.data) {
                        set({ profile: response.data })
                    }
                } catch (error) {
                    console.error('Profile fetch error:', error)
                    // Don't set profile if fetch fails, but don't logout either
                }
            },

            // Update user profile
            updateProfile: async (profileData: Partial<UserProfile>): Promise<boolean> => {
                try {
                    const response = await apiService.put('/users/profile', profileData)

                    if (response.status === 'success') {
                        // Refresh profile data
                        await get().fetchUserProfile()
                        return true
                    }

                    return false
                } catch (error) {
                    console.error('Profile update error:', error)
                    return false
                }
            },

            // Refresh authentication token
            refreshToken: async (): Promise<boolean> => {
                try {
                    const response = await apiService.post('/auth/refresh')

                    if (response.status === 'success' && response.data) {
                        const { access_token } = response.data
                        // API service will handle token storage
                        return true
                    }

                    return false
                } catch (error) {
                    console.error('Token refresh error:', error)
                    // If refresh fails, logout user
                    get().logout()
                    return false
                }
            },

            // Check if user has specific role
            hasRole: (role: string): boolean => {
                const { user } = get()
                return user?.role === role
            },

            // Check if user has any of the specified roles
            hasAnyRole: (roles: string[]): boolean => {
                const { user } = get()
                return user ? roles.includes(user.role) : false
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => {
                // Use sessionStorage for security in medical app
                if (typeof window !== 'undefined') {
                    return window.sessionStorage
                }
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            }),
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
