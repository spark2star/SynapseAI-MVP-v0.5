'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import apiService from '@/services/api'

interface NewPatientForm {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    address: string
    emergencyContact: string
    emergencyPhone: string
    medicalHistory: string
    allergies: string
    currentMedications: string
}

export default function NewPatientPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<NewPatientForm>()

    const onSubmit = async (data: NewPatientForm) => {
        setIsSubmitting(true)
        try {
            const response = await apiService.post('/patients', {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                phone: data.phone,
                date_of_birth: data.dateOfBirth,
                gender: data.gender,
                address: data.address,
                emergency_contact_name: data.emergencyContact,
                emergency_contact_phone: data.emergencyPhone,
                medical_history: data.medicalHistory,
                allergies: data.allergies,
                current_medications: data.currentMedications
            })

            if (response.status === 'success') {
                toast.success('Patient created successfully!')
                router.push(`/dashboard/patients/${response.data.id}`)
            } else {
                throw new Error('Failed to create patient')
            }
        } catch (error) {
            console.error('Error creating patient:', error)
            toast.error('Failed to create patient. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                            Add New Patient
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Create a new patient record in the EMR system
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="medical-card p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                    Personal Information
                                </h2>
                            </div>

                            <Input
                                label="First Name"
                                {...register('firstName', { required: 'First name is required' })}
                                error={errors.firstName?.message}
                            />

                            <Input
                                label="Last Name"
                                {...register('lastName', { required: 'Last name is required' })}
                                error={errors.lastName?.message}
                            />

                            <Input
                                label="Email"
                                type="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                                error={errors.email?.message}
                            />

                            <Input
                                label="Phone"
                                type="tel"
                                {...register('phone', { required: 'Phone number is required' })}
                                error={errors.phone?.message}
                            />

                            <Input
                                label="Date of Birth"
                                type="date"
                                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                                error={errors.dateOfBirth?.message}
                            />

                            <Select
                                label="Gender"
                                {...register('gender', { required: 'Gender is required' })}
                                error={errors.gender?.message}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </Select>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                Contact Information
                            </h2>

                            <Input
                                label="Address"
                                {...register('address')}
                                error={errors.address?.message}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Emergency Contact Name"
                                    {...register('emergencyContact')}
                                    error={errors.emergencyContact?.message}
                                />

                                <Input
                                    label="Emergency Contact Phone"
                                    type="tel"
                                    {...register('emergencyPhone')}
                                    error={errors.emergencyPhone?.message}
                                />
                            </div>
                        </div>

                        {/* Medical Information */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                Medical Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Medical History
                                    </label>
                                    <textarea
                                        {...register('medicalHistory')}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-200"
                                        placeholder="Previous medical conditions, surgeries, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Allergies
                                    </label>
                                    <textarea
                                        {...register('allergies')}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-200"
                                        placeholder="Known allergies to medications, foods, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Current Medications
                                    </label>
                                    <textarea
                                        {...register('currentMedications')}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-200"
                                        placeholder="Current medications and dosages"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Create Patient
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
