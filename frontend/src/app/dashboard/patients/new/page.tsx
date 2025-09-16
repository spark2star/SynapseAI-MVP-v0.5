'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    HeartIcon,
    ShieldExclamationIcon,
    CreditCardIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import apiService from '@/services/api'
import type { PatientCreate } from '@/types'

interface PatientFormData extends PatientCreate {
    // Additional form-specific fields if needed
}

const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const bloodGroupOptions = [
    { value: '', label: 'Select blood group' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'unknown', label: 'Unknown' },
]

const maritalStatusOptions = [
    { value: '', label: 'Select status' },
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'other', label: 'Other' },
]

const relationshipOptions = [
    { value: '', label: 'Select relationship' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' },
]

export default function NewPatientPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentSection, setCurrentSection] = useState(0)

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        trigger,
    } = useForm<PatientFormData>()

    const sections = [
        {
            title: 'Personal Information',
            icon: UserIcon,
            fields: ['first_name', 'last_name', 'date_of_birth', 'gender'],
        },
        {
            title: 'Contact Information',
            icon: PhoneIcon,
            fields: ['phone_primary', 'phone_secondary', 'email', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'],
        },
        {
            title: 'Emergency Contact',
            icon: ShieldExclamationIcon,
            fields: ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'],
        },
        {
            title: 'Medical Information',
            icon: HeartIcon,
            fields: ['blood_group', 'allergies', 'medical_history', 'current_medications'],
        },
        {
            title: 'Insurance & Other',
            icon: CreditCardIcon,
            fields: ['insurance_provider', 'insurance_policy_number', 'insurance_group_number', 'occupation', 'marital_status', 'preferred_language'],
        },
    ]

    const onSubmit = async (data: PatientFormData) => {
        setIsSubmitting(true)

        try {
            const response = await apiService.post('/patients/create', data)

            if (response.status === 'success') {
                toast.success('Patient registered successfully!')
                router.push(`/dashboard/patients/${response.data?.id}`)
            } else {
                toast.error('Failed to register patient. Please try again.')
            }
        } catch (error) {
            toast.error('Registration failed. Please check your information and try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const nextSection = async () => {
        const fieldsToValidate = sections[currentSection].fields
        const isValid = await trigger(fieldsToValidate as any)

        if (isValid) {
            setCurrentSection(Math.min(currentSection + 1, sections.length - 1))
        }
    }

    const prevSection = () => {
        setCurrentSection(Math.max(currentSection - 1, 0))
    }

    const renderSection = () => {
        switch (currentSection) {
            case 0: // Personal Information
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="First Name"
                                placeholder="Enter first name"
                                error={errors.first_name?.message}
                                {...register('first_name', {
                                    required: 'First name is required',
                                    minLength: {
                                        value: 2,
                                        message: 'First name must be at least 2 characters'
                                    }
                                })}
                            />

                            <Input
                                label="Last Name"
                                placeholder="Enter last name"
                                error={errors.last_name?.message}
                                {...register('last_name', {
                                    required: 'Last name is required',
                                    minLength: {
                                        value: 2,
                                        message: 'Last name must be at least 2 characters'
                                    }
                                })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Date of Birth"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                error={errors.date_of_birth?.message}
                                {...register('date_of_birth', {
                                    required: 'Date of birth is required'
                                })}
                            />

                            <Select
                                label="Gender"
                                options={genderOptions}
                                placeholder="Select gender"
                                error={errors.gender?.message}
                                {...register('gender', {
                                    required: 'Gender is required'
                                })}
                            />
                        </div>
                    </div>
                )

            case 1: // Contact Information
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Primary Phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                error={errors.phone_primary?.message}
                                {...register('phone_primary')}
                            />

                            <Input
                                label="Secondary Phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                error={errors.phone_secondary?.message}
                                {...register('phone_secondary')}
                            />
                        </div>

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="patient@example.com"
                            error={errors.email?.message}
                            {...register('email', {
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Please enter a valid email address'
                                }
                            })}
                        />

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-neutral-900">Address</h4>
                            <Input
                                label="Address Line 1"
                                placeholder="Street address"
                                error={errors.address_line1?.message}
                                {...register('address_line1')}
                            />

                            <Input
                                label="Address Line 2"
                                placeholder="Apartment, suite, etc. (optional)"
                                error={errors.address_line2?.message}
                                {...register('address_line2')}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Input
                                    label="City"
                                    placeholder="City"
                                    error={errors.city?.message}
                                    {...register('city')}
                                />

                                <Input
                                    label="State/Province"
                                    placeholder="State"
                                    error={errors.state?.message}
                                    {...register('state')}
                                />

                                <Input
                                    label="Postal Code"
                                    placeholder="12345"
                                    error={errors.postal_code?.message}
                                    {...register('postal_code')}
                                />
                            </div>

                            <Input
                                label="Country"
                                placeholder="Country"
                                error={errors.country?.message}
                                {...register('country')}
                            />
                        </div>
                    </div>
                )

            case 2: // Emergency Contact
                return (
                    <div className="space-y-6">
                        <Input
                            label="Emergency Contact Name"
                            placeholder="Full name of emergency contact"
                            error={errors.emergency_contact_name?.message}
                            {...register('emergency_contact_name')}
                        />

                        <Input
                            label="Emergency Contact Phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            error={errors.emergency_contact_phone?.message}
                            {...register('emergency_contact_phone')}
                        />

                        <Select
                            label="Relationship"
                            options={relationshipOptions}
                            placeholder="Select relationship"
                            error={errors.emergency_contact_relationship?.message}
                            {...register('emergency_contact_relationship')}
                        />
                    </div>
                )

            case 3: // Medical Information
                return (
                    <div className="space-y-6">
                        <Select
                            label="Blood Group"
                            options={bloodGroupOptions}
                            error={errors.blood_group?.message}
                            {...register('blood_group')}
                        />

                        <Input
                            label="Known Allergies"
                            placeholder="List any known allergies (comma separated)"
                            error={errors.allergies?.message}
                            {...register('allergies')}
                        />

                        <div>
                            <label className="input-label">Medical History</label>
                            <textarea
                                className="input-field min-h-[100px] resize-vertical"
                                placeholder="Previous surgeries, chronic conditions, significant medical events..."
                                {...register('medical_history')}
                            />
                            {errors.medical_history && (
                                <p className="error-message">{errors.medical_history.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="input-label">Current Medications</label>
                            <textarea
                                className="input-field min-h-[80px] resize-vertical"
                                placeholder="List current medications, dosages, and frequency..."
                                {...register('current_medications')}
                            />
                            {errors.current_medications && (
                                <p className="error-message">{errors.current_medications.message}</p>
                            )}
                        </div>
                    </div>
                )

            case 4: // Insurance & Other
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-neutral-900">Insurance Information</h4>
                            <Input
                                label="Insurance Provider"
                                placeholder="Insurance company name"
                                error={errors.insurance_provider?.message}
                                {...register('insurance_provider')}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Policy Number"
                                    placeholder="Policy number"
                                    error={errors.insurance_policy_number?.message}
                                    {...register('insurance_policy_number')}
                                />

                                <Input
                                    label="Group Number"
                                    placeholder="Group number"
                                    error={errors.insurance_group_number?.message}
                                    {...register('insurance_group_number')}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-neutral-900">Additional Information</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Occupation"
                                    placeholder="Patient's occupation"
                                    error={errors.occupation?.message}
                                    {...register('occupation')}
                                />

                                <Select
                                    label="Marital Status"
                                    options={maritalStatusOptions}
                                    error={errors.marital_status?.message}
                                    {...register('marital_status')}
                                />
                            </div>

                            <Input
                                label="Preferred Language"
                                placeholder="English, Spanish, etc."
                                error={errors.preferred_language?.message}
                                {...register('preferred_language')}
                            />
                        </div>

                        <div>
                            <label className="input-label">Additional Notes</label>
                            <textarea
                                className="input-field min-h-[80px] resize-vertical"
                                placeholder="Any additional notes or special considerations..."
                                {...register('notes')}
                            />
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-neutral-900">
                        Register New Patient
                    </h1>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center space-x-2">
                    {sections.map((section, index) => (
                        <div key={index} className="flex items-center">
                            <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${index === currentSection
                                    ? 'bg-primary-600 text-white'
                                    : index < currentSection
                                        ? 'bg-primary-100 text-primary-800'
                                        : 'bg-neutral-200 text-neutral-600'
                                }
              `}>
                                {index + 1}
                            </div>
                            {index < sections.length - 1 && (
                                <div className={`
                  w-12 h-0.5 mx-2
                  ${index < currentSection ? 'bg-primary-600' : 'bg-neutral-200'}
                `} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Current section */}
                <div className="medical-card">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <sections[currentSection].icon className="h-6 w-6 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-900">
                            {sections[currentSection].title}
                        </h2>
                    </div>

                    {renderSection()}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={prevSection}
                        disabled={currentSection === 0}
                    >
                        Previous
                    </Button>

                    <div className="flex space-x-3">
                        {currentSection < sections.length - 1 ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={nextSection}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Register Patient
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            {/* Security notice */}
            <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-start space-x-3">
                    <ShieldExclamationIcon className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-primary-900">
                            Privacy & Security
                        </h3>
                        <p className="text-sm text-primary-700 mt-1">
                            All patient information is encrypted and stored securely in compliance with HIPAA regulations.
                            Only authorized healthcare providers have access to this data.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
