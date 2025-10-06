'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PractitionerProfile, PractitionerProfileUpdateResponse } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { apiService } from '@/services/api'

interface ValidationErrors {
    [key: string]: string
}

export default function ProfilePage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuthStore()

    // Form data
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        clinic_name: '',
        clinic_address: '',
        phone: '',
        license_number: '',
        specialization: ''
    })

    // File handling
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    // UI states
    const [email, setEmail] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [successMessage, setSuccessMessage] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [updatedAt, setUpdatedAt] = useState<string | null>(null)

    // Fetch profile on mount
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }
        fetchProfile()
    }, [isAuthenticated])

    const fetchProfile = async () => {
        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await apiService.get('/profile/')

            if (response.status !== 'success' || !response.data) {
                throw new Error('Failed to fetch profile')
            }

            const data: PractitionerProfile = response.data

            // Populate form
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                clinic_name: data.clinic_name || '',
                clinic_address: data.clinic_address || '',
                phone: data.phone || '',
                license_number: data.license_number || '',
                specialization: data.specialization || ''
            })

            setEmail(data.email)
            setLogoPreview(data.logo_url || null)
            setUpdatedAt(data.updated_at || null)

        } catch (error: any) {
            console.error('Error fetching profile:', error)
            if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
                router.push('/auth/login')
                return
            }
            setErrorMessage('Failed to load profile data. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }

        // Clear messages
        setSuccessMessage('')
        setErrorMessage('')
    }

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (!file) return

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        const maxSize = 5 * 1024 * 1024 // 5MB

        if (!validTypes.includes(file.type)) {
            setErrorMessage('Please upload a JPG, PNG, or WebP image')
            return
        }

        if (file.size > maxSize) {
            setErrorMessage('Image must be less than 5MB')
            return
        }

        setLogoFile(file)

        // Generate preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        setErrorMessage('')
    }

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {}

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required'
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required'
        }

        if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        // Validate
        if (!validateForm()) {
            setErrorMessage('Please fix the errors below')
            return
        }

        setIsSaving(true)
        setSuccessMessage('')
        setErrorMessage('')

        try {
            // Create FormData
            const formDataToSend = new FormData()
            formDataToSend.append('first_name', formData.first_name)
            formDataToSend.append('last_name', formData.last_name)
            formDataToSend.append('clinic_name', formData.clinic_name)
            formDataToSend.append('clinic_address', formData.clinic_address)
            formDataToSend.append('phone', formData.phone)
            formDataToSend.append('license_number', formData.license_number)
            formDataToSend.append('specialization', formData.specialization)

            if (logoFile) {
                formDataToSend.append('logo', logoFile)
            }

            // Send request using apiService with custom handling for FormData
            const token = apiService.getToken()
            const response = await fetch(`${apiService.getBaseURL()}/profile/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type for FormData - browser sets it with boundary
                },
                body: formDataToSend
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || errorData.message || 'Failed to update profile')
            }

            const result: PractitionerProfileUpdateResponse = await response.json()

            // Update preview with new logo URL if returned
            if (result.data.logo_url) {
                setLogoPreview(result.data.logo_url)
            }

            setUpdatedAt(result.data.updated_at || null)
            setSuccessMessage('Profile updated successfully!')
            setLogoFile(null) // Clear the file input

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' })

        } catch (error) {
            console.error('Error updating profile:', error)
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile. Please try again.')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setIsSaving(false)
        }
    }

    const formatUpdatedAt = (dateString: string | null): string => {
        if (!dateString) return 'Never'

        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

            if (diffInMinutes < 1) return 'Just now'
            if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
            if (diffInMinutes < 1440) {
                const hours = Math.floor(diffInMinutes / 60)
                return `${hours} hour${hours > 1 ? 's' : ''} ago`
            }

            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        } catch {
            return 'Unknown'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="space-y-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i}>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Practitioner Profile
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your professional information for session reports
                    </p>
                    {updatedAt && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                            Last updated: {formatUpdatedAt(updatedAt)}
                        </p>
                    )}
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-800 dark:text-red-200 font-medium">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 space-y-6">
                        {/* Personal Information Section */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        maxLength={100}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${errors.first_name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="John"
                                    />
                                    {errors.first_name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        maxLength={100}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${errors.last_name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Smith"
                                    />
                                    {errors.last_name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name}</p>
                                    )}
                                </div>

                                {/* Email (Read-only) */}
                                <div className="md:col-span-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        maxLength={20}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="+1 234 567 8900"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                                    )}
                                </div>

                                {/* License Number */}
                                <div>
                                    <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        License Number
                                    </label>
                                    <input
                                        type="text"
                                        id="license_number"
                                        name="license_number"
                                        value={formData.license_number}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        maxLength={50}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="MED12345"
                                    />
                                </div>

                                {/* Specialization */}
                                <div className="md:col-span-2">
                                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Specialization
                                    </label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        maxLength={100}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="Internal Medicine, Cardiology, etc."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clinic Information Section */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Clinic Information
                            </h2>

                            <div className="space-y-6">
                                {/* Clinic Name */}
                                <div>
                                    <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Clinic/Practice Name
                                    </label>
                                    <input
                                        type="text"
                                        id="clinic_name"
                                        name="clinic_name"
                                        value={formData.clinic_name}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        maxLength={255}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="City Medical Center"
                                    />
                                </div>

                                {/* Clinic Address */}
                                <div>
                                    <label htmlFor="clinic_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Clinic Address
                                    </label>
                                    <textarea
                                        id="clinic_address"
                                        name="clinic_address"
                                        value={formData.clinic_address}
                                        onChange={handleInputChange}
                                        disabled={isSaving}
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                        placeholder="123 Medical Drive, Suite 100&#10;City, State, ZIP"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {formData.clinic_address.length}/1000 characters
                                    </p>
                                </div>

                                {/* Logo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Professional Logo
                                    </label>
                                    <div className="flex items-start space-x-6">
                                        {/* Preview */}
                                        {logoPreview && (
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                                                />
                                            </div>
                                        )}

                                        {/* Upload button */}
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <label
                                                    htmlFor="logo"
                                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                                </label>
                                                <input
                                                    type="file"
                                                    id="logo"
                                                    accept=".jpg,.jpeg,.png,.webp"
                                                    onChange={handleLogoChange}
                                                    disabled={isSaving}
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                JPG, PNG or WebP. Max size 5MB.
                                            </p>
                                            {logoFile && (
                                                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                                                    Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={fetchProfile}
                            disabled={isSaving}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isLoading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
