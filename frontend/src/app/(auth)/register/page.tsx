'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Indian State Medical Councils
const MEDICAL_COUNCILS = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
];

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
    requirements: {
        length: boolean;
        uppercase: boolean;
        number: boolean;
        special: boolean;
    };
}

export default function DoctorRegistrationPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        medicalRegistrationNumber: '',
        stateMedicalCouncil: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength calculation
    const calculatePasswordStrength = (password: string): PasswordStrength => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
        };

        const score = Object.values(requirements).filter(Boolean).length;

        let label = 'Weak';
        let color = 'bg-red-500';

        if (score === 4) {
            label = 'Strong';
            color = 'bg-green-500';
        } else if (score === 3) {
            label = 'Good';
            color = 'bg-yellow-500';
        } else if (score === 2) {
            label = 'Fair';
            color = 'bg-orange-500';
        }

        return { score, label, color, requirements };
    };

    const passwordStrength = calculatePasswordStrength(formData.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (passwordStrength.score < 4) {
            setError('Password must meet all requirements');
            return;
        }

        if (!formData.stateMedicalCouncil) {
            setError('Please select your state medical council');
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(`${API_URL}/doctor/register`, {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                medicalRegistrationNumber: formData.medicalRegistrationNumber,
                stateMedicalCouncil: formData.stateMedicalCouncil
            });

            if (response.data.status === 'success') {
                setApplicationId(response.data.data.application_id);
                setSuccess(true);

                // Redirect to login after 5 seconds
                setTimeout(() => {
                    router.push('/auth/login');
                }, 5000);
            }
        } catch (err: any) {
            console.error('Registration error:', err);

            if (err.response?.data?.error?.message) {
                const errorMsg = err.response.data.error.message;
                if (typeof errorMsg === 'object') {
                    setError(errorMsg.message || 'Registration failed');
                } else {
                    setError(errorMsg);
                }
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-fadeIn">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800 mb-3">
                        Application Received!
                    </h2>

                    <p className="text-gray-600 mb-4 leading-relaxed">
                        Thank you for applying to join SynapseAI. We will verify your credentials and get back to you within <strong>2-3 business days</strong>.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800 font-medium mb-1">Application ID</p>
                        <p className="text-xs text-blue-600 font-mono break-all">{applicationId}</p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>You will receive an email once your application is reviewed</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Check your spam folder if you don't see our email</span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500">
                        Redirecting to login page in 5 seconds...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Doctor Registration
                    </h1>
                    <p className="text-gray-600">
                        Join SynapseAI as a verified psychiatrist
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            minLength={3}
                            maxLength={255}
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Dr. John Doe"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="doctor@example.com"
                        />
                    </div>

                    {/* Medical Registration Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medical Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            minLength={5}
                            maxLength={100}
                            value={formData.medicalRegistrationNumber}
                            onChange={(e) => setFormData({ ...formData, medicalRegistrationNumber: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono"
                            placeholder="e.g., 12345/A/2020"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your unique medical registration number from your state medical council
                        </p>
                    </div>

                    {/* State Medical Council */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State Medical Council <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.stateMedicalCouncil}
                            onChange={(e) => setFormData({ ...formData, stateMedicalCouncil: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option value="">Select your state medical council</option>
                            {MEDICAL_COUNCILS.map((council) => (
                                <option key={council} value={council}>
                                    {council} Medical Council
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                                placeholder="Min 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-700">Password Strength:</span>
                                    <span className={`text-xs font-medium ${passwordStrength.score === 4 ? 'text-green-600' :
                                            passwordStrength.score === 3 ? 'text-yellow-600' :
                                                passwordStrength.score === 2 ? 'text-orange-600' :
                                                    'text-red-600'
                                        }`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    {[
                                        { key: 'length', label: 'At least 8 characters' },
                                        { key: 'uppercase', label: 'One uppercase letter' },
                                        { key: 'number', label: 'One number' },
                                        { key: 'special', label: 'One special character (!@#$%^&*...)' }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            {passwordStrength.requirements[key as keyof typeof passwordStrength.requirements] ? (
                                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className={passwordStrength.requirements[key as keyof typeof passwordStrength.requirements] ? 'text-gray-700' : 'text-gray-500'}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                                placeholder="Re-enter password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Passwords do not match
                            </p>
                        )}
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Passwords match
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || passwordStrength.score < 4}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Submitting Application...
                            </span>
                        ) : (
                            'Submit Application'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-sm text-gray-600 mt-6 text-center">
                    Already have an account?{' '}
                    <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        Login here
                    </a>
                </p>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        By submitting this application, you agree to our Terms of Service and Privacy Policy.
                        Your information will be verified and kept confidential.
                    </p>
                </div>
            </div>
        </div>
    );
}

