'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const SPECIALIZATIONS = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Urology',
    'Other'
];

export default function CompleteProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        clinic_name: '',
        clinic_address: '',
        specializations: [] as string[],
        years_of_experience: '',
        phone_number: '',
        alternate_email: ''
    });

    // Check if user is authenticated and has correct status
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/auth/login');
        }
    }, [router]);

    const handleSpecializationToggle = (spec: string) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.clinic_name.trim()) {
            setError('Clinic name is required');
            return;
        }
        if (!formData.clinic_address.trim()) {
            setError('Clinic address is required');
            return;
        }
        if (formData.specializations.length === 0) {
            setError('Please select at least one specialization');
            return;
        }
        if (!formData.years_of_experience || parseInt(formData.years_of_experience) < 0) {
            setError('Please enter valid years of experience');
            return;
        }
        if (!formData.phone_number.trim()) {
            setError('Phone number is required');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            const response = await axios.put(
                `${API_URL}/doctor/profile`,
                {
                    clinic_name: formData.clinic_name,
                    clinic_address: formData.clinic_address,
                    specializations: formData.specializations,
                    years_of_experience: parseInt(formData.years_of_experience),
                    phone_number: formData.phone_number,
                    alternate_email: formData.alternate_email || null
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 'success') {
                // Profile completed successfully
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error('Profile completion error:', err);
            setError(err.response?.data?.error?.message || 'Failed to complete profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-600 text-lg">
                        Welcome! Please provide additional information to complete your registration.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-4 text-red-900 hover:text-red-700 font-medium">
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                    {/* Clinic Information */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Clinic Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Clinic Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.clinic_name}
                                    onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="e.g., City Medical Center"
                                    maxLength={255}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Clinic Address <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.clinic_address}
                                    onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Full clinic address including city, state, and PIN code"
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Professional Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Specializations <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {SPECIALIZATIONS.map((spec) => (
                                        <button
                                            key={spec}
                                            type="button"
                                            onClick={() => handleSpecializationToggle(spec)}
                                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${formData.specializations.includes(spec)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                }`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Selected: {formData.specializations.length > 0 ? formData.specializations.join(', ') : 'None'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Years of Experience <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.years_of_experience}
                                    onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="e.g., 5"
                                    min="0"
                                    max="70"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="pb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="e.g., +91 9876543210"
                                    maxLength={20}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alternate Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.alternate_email}
                                    onChange={(e) => setFormData({ ...formData, alternate_email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="alternate@example.com"
                                    maxLength={255}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving Profile...
                                </span>
                            ) : (
                                'Complete Profile & Continue'
                            )}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Why do we need this information?</p>
                                <p>This information helps us personalize your experience and is displayed on your profile and reports. You can update it anytime from your profile settings.</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

