'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import apiClient from '@/services/api';

// Validation schema
const profileCompletionSchema = z.object({
    qualifications: z.string()
        .min(1, 'Qualifications are required')
        .max(255, 'Qualifications must be less than 255 characters'),
    clinic_name: z.string()
        .min(1, 'Clinic name is required')
        .max(255, 'Clinic name must be less than 255 characters'),
    clinic_address: z.string()
        .min(1, 'Clinic address is required')
        .max(1000, 'Clinic address must be less than 1000 characters'),
    phone: z.string()
        .min(1, 'Phone number is required')
        .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (e.g., +919876543210)'),
    logo: z.any().optional(),
    digital_signature: z.any()
        .refine((files) => files?.length > 0, 'Digital signature is required')
        .refine(
            (files) => files?.[0]?.size <= 5 * 1024 * 1024,
            'Signature file must be less than 5MB'
        )
        .refine(
            (files) => ['image/jpeg', 'image/jpg', 'image/png'].includes(files?.[0]?.type),
            'Only JPG, JPEG, and PNG formats are allowed'
        ),
});

type ProfileCompletionForm = z.infer<typeof profileCompletionSchema>;

interface UserInfo {
    full_name: string;
    medical_registration_number?: string;
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<ProfileCompletionForm>({
        resolver: zodResolver(profileCompletionSchema),
    });

    const logoFiles = watch('logo');
    const signatureFiles = watch('digital_signature');

    // Check authentication and fetch user info
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        // Decode JWT to get user info
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserInfo({
                full_name: payload.full_name || 'Doctor',
                medical_registration_number: payload.medical_registration_number,
            });
        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }, [router]);

    // Handle logo preview
    useEffect(() => {
        if (logoFiles && logoFiles.length > 0) {
            const file = logoFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setLogoPreview(null);
        }
    }, [logoFiles]);

    // Handle signature preview
    useEffect(() => {
        if (signatureFiles && signatureFiles.length > 0) {
            const file = signatureFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignaturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setSignaturePreview(null);
        }
    }, [signatureFiles]);

    const onSubmit = async (data: ProfileCompletionForm) => {
        setLoading(true);

        try {
            // Build multipart form data
            const formData = new FormData();
            formData.append('qualifications', data.qualifications);
            formData.append('clinic_name', data.clinic_name);
            formData.append('clinic_address', data.clinic_address);
            formData.append('phone', data.phone);

            // Add logo if provided
            if (data.logo && data.logo.length > 0) {
                formData.append('logo', data.logo[0]);
            }

            // Add digital signature
            if (data.digital_signature && data.digital_signature.length > 0) {
                formData.append('digital_signature', data.digital_signature[0]);
            }

            // Submit to API using the API client
            const result = await apiClient.completeProfile(formData);

            // Show success message
            toast.success(result.message || 'Profile completed successfully!');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (error: any) {
            console.error('Profile completion error:', error);
            toast.error(error.message || 'Failed to complete profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#50B9E8] to-[#0A4D8B] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Complete Your Profile
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Welcome{userInfo?.full_name ? `, Dr. ${userInfo.full_name}` : ''}! Please provide your professional details to get started.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="space-y-6">
                        {/* Practice Details Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#50B9E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Practice Details
                            </h2>

                            <div className="space-y-4">
                                {/* Clinic Logo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Clinic Logo (Optional)
                                    </label>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                {...register('logo')}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50B9E8] focus:border-[#50B9E8] transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#50B9E8] file:text-white hover:file:bg-[#0A4D8B]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                JPG, JPEG, or PNG. Max 5MB.
                                            </p>
                                        </div>
                                        {logoPreview && (
                                            <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Clinic Name */}
                                <Input
                                    label="Clinic Name"
                                    placeholder="e.g., City Medical Center"
                                    {...register('clinic_name')}
                                    error={errors.clinic_name?.message}
                                    required
                                />

                                {/* Clinic Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Clinic Address <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        {...register('clinic_address')}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50B9E8] focus:border-[#50B9E8] transition"
                                        placeholder="Full clinic address including city, state, and PIN code"
                                    />
                                    {errors.clinic_address && (
                                        <p className="text-sm text-red-600 mt-1">{errors.clinic_address.message}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="e.g., +919876543210"
                                    {...register('phone')}
                                    error={errors.phone?.message}
                                    helperText="Include country code (e.g., +91 for India)"
                                    required
                                />
                            </div>
                        </div>

                        {/* Professional Details Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#50B9E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Professional Details
                            </h2>

                            <div className="space-y-4">
                                {/* Qualifications */}
                                <Input
                                    label="Qualifications"
                                    placeholder="e.g., MBBS, MD (Psychiatry), DPM"
                                    {...register('qualifications')}
                                    error={errors.qualifications?.message}
                                    helperText="Your medical degrees and certifications"
                                    required
                                />

                                {/* Read-only fields */}
                                {userInfo && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                                                {userInfo.full_name}
                                            </div>
                                        </div>
                                        {userInfo.medical_registration_number && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Medical Registration Number
                                                </label>
                                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                                                    {userInfo.medical_registration_number}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Digital Signature Section */}
                        <div className="pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#50B9E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Digital Signature
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Your Signature <span className="text-red-600">*</span>
                                </label>
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            {...register('digital_signature')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50B9E8] focus:border-[#50B9E8] transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#50B9E8] file:text-white hover:file:bg-[#0A4D8B]"
                                        />
                                        {errors.digital_signature && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {errors.digital_signature.message as string}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            JPG, JPEG, or PNG. Max 5MB. This will be used on your reports.
                                        </p>
                                    </div>
                                    {signaturePreview && (
                                        <div className="w-48 h-24 border-2 border-gray-200 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                                            <img
                                                src={signaturePreview}
                                                alt="Signature preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                isLoading={loading}
                                className="w-full"
                            >
                                {loading ? 'Saving Profile...' : 'Save and Continue'}
                            </Button>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-[#50B9E8] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Why do we need this information?</p>
                                    <p>
                                        This information will be displayed on all your clinical reports and prescriptions.
                                        Your digital signature ensures document authenticity and legal compliance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
}
