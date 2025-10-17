// Authentication store using Zustand

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { apiService } from '@/services/api'
import type { User, UserProfile, LoginCredentials, AuthTokens } from '@/types'

// Global auth check lock to prevent multiple simultaneous calls
let authCheckInProgress = false

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
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>

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
            isLoading: false, // Start with false to prevent infinite loading

            // Login action
            login: async (credentials: LoginCredentials): Promise<boolean> => {
                try {
                    set({ isLoading: true })

                    console.log('🔐 Attempting login for:', credentials.email)

                    const response = await apiService.post('/auth/login', credentials)

                    if (response.status === 'success' && response.data) {
                        const {
                            access_token,
                            refresh_token,
                            user_id,
                            role,
                            password_reset_required
                        } = response.data

                        console.log('✅ Login successful, storing tokens...')
                        console.log('📦 Access Token:', access_token ? 'EXISTS' : 'MISSING')
                        console.log('📦 Refresh Token:', refresh_token ? 'EXISTS' : 'MISSING')
                        console.log('🔐 Password Reset Required:', password_reset_required || false)

                        // Store tokens in API service (localStorage)
                        apiService.setAuthTokens(access_token, refresh_token)

                        // ✅ ALSO store tokens in cookies (for middleware)
                        document.cookie = `access_token=${access_token}; path=/; max-age=1800; SameSite=Lax`;
                        document.cookie = `refresh_token=${refresh_token}; path=/; max-age=604800; SameSite=Lax`;

                        console.log('🍪 Tokens stored in both localStorage AND cookies')

                        // Verify token was stored
                        const storedToken = localStorage.getItem('access_token')
                        console.log('🔍 Stored token verified:', storedToken ? 'YES ✅' : 'NO ❌')
                        console.log('🔍 Cookie set verified:', document.cookie.includes('access_token') ? 'YES ✅' : 'NO ❌')

                        // Create user object
                        const user: User = {
                            id: user_id,
                            email: credentials.email,
                            role: role as User['role'],
                            is_verified: true,
                            is_active: true,
                            password_reset_required: password_reset_required || false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false
                        })

                        console.log('✅ Auth state updated, user authenticated')

                        // Fetch user profile
                        await get().fetchUserProfile()

                        return true
                    }

                    console.log('❌ Login failed: Invalid response')
                    set({ isLoading: false })
                    return false
                } catch (error) {
                    console.error('❌ Login error:', error)
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
                    if (apiService.isAuthenticated()) {
                        console.log('🚪 Logging out with valid token...')
                        apiService.post('/auth/logout').catch(console.error)
                    }
                } catch (error) {
                    console.error('Logout error:', error)
                } finally {
                    console.log('🧹 Clearing all auth data...')

                    // Clear API service tokens
                    apiService.clearAuthTokens()

                    // Clear localStorage
                    localStorage.clear()
                    sessionStorage.clear()

                    // Clear ALL cookies (more aggressive)
                    const cookies = document.cookie.split(";");
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i];
                        const eqPos = cookie.indexOf("=");
                        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

                        // Delete cookie for all paths
                        document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
                        document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    }

                    // Clear state
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false
                    })

                    // Verify cookies are cleared
                    setTimeout(() => {
                        console.log('🔍 After clear - Cookies:', document.cookie);
                        console.log('🔍 After clear - LocalStorage:', Object.keys(localStorage));
                        console.log('🏠 Redirecting to home page...')

                        // Force reload to clear everything
                        window.location.replace('/')
                    }, 100)
                }
            },


            // Check authentication status
            checkAuth: async (): Promise<void> => {
                // Prevent multiple simultaneous auth checks globally
                if (authCheckInProgress) {
                    console.log('⏳ Auth check already in progress globally, skipping...')
                    return
                }

                const currentState = get()
                if (currentState.isLoading) {
                    console.log('⏳ Auth check already in progress locally, skipping...')
                    return
                }

                // Check if token exists first
                if (!apiService.isAuthenticated()) {
                    console.log('❌ No token found, user not authenticated')
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false
                    })
                    return
                }

                authCheckInProgress = true
                set({ isLoading: true })

                try {
                    console.log('🔐 Validating auth token...')

                    // Add timeout to prevent hanging
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
                    )

                    // Validate token with backend
                    const response = await Promise.race([
                        apiService.get('/auth/validate-token'),
                        timeoutPromise
                    ]) as any

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

                        console.log('✅ Auth validated, user:', user.email)

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false
                        })

                        // Fetch user profile in background (non-blocking)
                        get().fetchUserProfile().catch(err =>
                            console.warn('⚠️ Profile fetch failed:', err)
                        )
                    } else {
                        console.log('❌ Token validation failed')
                        throw new Error('Token invalid')
                    }
                } catch (error) {
                    console.error('❌ Auth check error:', error)

                    // Clear auth on any error
                    apiService.clearAuthTokens()
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false
                    })
                } finally {
                    authCheckInProgress = false
                    // Force set loading to false as safety net
                    set({ isLoading: false })
                }
            },


            // Fetch user profile (internal method)
            fetchUserProfile: async (): Promise<void> => {
                try {
                    const response = await apiService.get('/users/profile')

                    if (response.status === 'success' && response.data) {
                        set({ profile: response.data.profile })
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

            // Change password
            changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
                try {
                    console.log('🔐 Changing password...')

                    const response = await apiService.post('/auth/change-password', {
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: newPassword
                    })

                    if (response.status === 'success') {
                        console.log('✅ Password changed successfully')

                        // Update user state to clear password_reset_required
                        const currentUser = get().user
                        if (currentUser) {
                            set({
                                user: {
                                    ...currentUser,
                                    password_reset_required: false
                                }
                            })
                        }

                        return { success: true }
                    }

                    return { success: false, error: 'Failed to change password' }
                } catch (error: any) {
                    console.error('❌ Password change error:', error)
                    return {
                        success: false,
                        error: error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to change password'
                    }
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
                    return window.localStorage
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
