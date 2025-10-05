'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Indian State Medical Councils
const MEDICAL_COUNCILS = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal'
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
    const [responseData, setResponseData] = useState<any>(null);
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
        let color = '#E53E3E';

        if (score === 4) {
            label = 'Strong';
            color = '#38A169';
        } else if (score === 3) {
            label = 'Good';
            color = '#F59E0B';
        } else if (score === 2) {
            label = 'Fair';
            color = '#F97316';
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
                setResponseData(response.data.data);
                setSuccess(true);
                // ✅ NO AUTO-REDIRECT - User controls when to leave via "Back to Home" button
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
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, rgba(227, 244, 252, 0.5) 0%, #F7FAFC 50%, rgba(227, 244, 252, 0.5) 100%)',
                    }}
                />
                <div
                    className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: 'rgba(80, 185, 232, 0.15)' }}
                />
                <div
                    className="absolute bottom-10 left-10 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: 'rgba(10, 77, 139, 0.15)' }}
                />

                <div className="bg-white p-8 rounded-2xl max-w-2xl w-full relative z-10 border-2"
                    style={{
                        borderColor: 'rgba(80, 185, 232, 0.2)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)'
                    }}
                >
                    {/* Success Icon */}
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
                        style={{ backgroundColor: 'rgba(56, 161, 105, 0.1)' }}
                    >
                        <svg className="w-12 h-12" fill="#38A169" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>

                    {/* Main Message */}
                    <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: '#0A4D8B' }}>
                        Application Submitted Successfully!
                    </h2>

                    <p className="text-lg text-center mb-8 leading-relaxed" style={{ color: '#4A5568' }}>
                        Thank you for applying to join SynapseAI as a verified psychiatrist.
                        We&apos;ve received your application and will review it shortly.
                    </p>

                    {/* What Happens Next Section */}
                    <div className="rounded-2xl p-6 mb-8 border-2" style={{ backgroundColor: '#F7FAFC', borderColor: '#E2E8F0' }}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#0A4D8B' }}>
                            <svg className="w-5 h-5" fill="#50B9E8" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            What Happens Next?
                        </h3>
                        <ol className="space-y-3 text-sm" style={{ color: '#4A5568' }}>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: '#50B9E8' }}>
                                    1
                                </span>
                                <span><strong>Credential Verification:</strong> Our team will verify your medical registration with your State Medical Council</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: '#50B9E8' }}>
                                    2
                                </span>
                                <span><strong>Application Review:</strong> We&apos;ll review your application within 2-3 business days</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: '#50B9E8' }}>
                                    3
                                </span>
                                <span><strong>Email Notification:</strong> You&apos;ll receive an approval email once your application is verified</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: '#50B9E8' }}>
                                    4
                                </span>
                                <span><strong>Account Activation:</strong> After approval, you can log in and start using SynapseAI</span>
                            </li>
                        </ol>
                    </div>

                    {/* Email Confirmation Notice */}
                    <div className="rounded-2xl p-4 mb-8 border-2" style={{ backgroundColor: 'rgba(80, 185, 232, 0.05)', borderColor: 'rgba(80, 185, 232, 0.2)' }}>
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 flex-shrink-0" fill="#50B9E8" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <div className="text-left">
                                <p className="text-sm font-medium" style={{ color: '#0A4D8B' }}>
                                    Confirmation email sent!
                                </p>
                                <p className="text-xs" style={{ color: '#4A5568' }}>
                                    Check your inbox for detailed application status and next steps.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* System Information - Clearly Labeled */}
                    <div className="rounded-lg border-l-4 p-4 mb-8"
                        style={{ backgroundColor: '#F7FAFC', borderColor: '#CBD5E0' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: '#4A5568' }}>
                            📋 System Information (for internal tracking only)
                        </p>
                        <div className="text-xs space-y-1" style={{ color: '#718096' }}>
                            <p>Application ID: {responseData?.user_id || 'Generated automatically'}</p>
                            <p>Submitted: {new Date().toLocaleString()}</p>
                            <p className="italic">
                                ⚠️ Note: These details are for our internal tracking. You don&apos;t need to save or remember them.
                            </p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="text-center mb-8">
                        <p className="text-sm mb-2" style={{ color: '#4A5568' }}>
                            Questions about your application?
                        </p>
                        <a
                            href="mailto:support@synapseai.com"
                            className="text-sm font-medium hover:underline transition-all"
                            style={{ color: '#50B9E8' }}
                        >
                            📧 support@synapseai.com
                        </a>
                    </div>

                    {/* Back to Home Button - NO AUTO REDIRECT */}
                    <div className="text-center">
                        <Link href="/">
                            <button
                                className="py-3 px-8 rounded-lg font-semibold transition-all duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, #50B9E8 0%, #0A4D8B 100%)',
                                    color: '#FFFFFF',
                                    boxShadow: '0 10px 15px -3px rgba(80, 185, 232, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(80, 185, 232, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(80, 185, 232, 0.3)';
                                }}
                            >
                                Back to Home
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(227, 244, 252, 0.5) 0%, #F7FAFC 50%, rgba(227, 244, 252, 0.5) 100%)',
                }}
            />

            {/* Decorative Orbs */}
            <div
                className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(80, 185, 232, 0.15)' }}
            />
            <div
                className="absolute bottom-10 left-10 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(10, 77, 139, 0.15)' }}
            />

            <div className="bg-white p-8 rounded-2xl max-w-2xl w-full relative z-10 border-2"
                style={{
                    borderColor: 'rgba(80, 185, 232, 0.2)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)'
                }}
            >
                {/* Header with Logo */}
                <div className="text-center mb-8">
                    <Link href="/landing" className="inline-block mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                        <Image
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI Logo"
                            width={64}
                            height={64}
                            className="h-16 w-auto"
                        />
                    </Link>
                    <h1
                        className="text-3xl font-bold mb-2"
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: '#0A4D8B'
                        }}
                    >
                        Doctor Registration
                    </h1>
                    <p style={{ color: '#4A5568' }}>
                        Join SynapseAI as a verified psychiatrist
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="border-l-4 px-4 py-3 rounded-lg mb-6 flex items-start gap-3"
                        style={{
                            backgroundColor: 'rgba(229, 62, 62, 0.05)',
                            borderColor: '#E53E3E',
                            color: '#E53E3E'
                        }}
                    >
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
                        <label className="block text-sm font-medium mb-2" style={{ color: '#4A5568' }}>
                            Full Name <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            minLength={3}
                            maxLength={255}
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-lg transition-all"
                            style={{
                                borderColor: '#CBD5E0',
                                color: '#1A202C'
                            }}
                            placeholder="Dr. John Doe"
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#50B9E8';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(80, 185, 232, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#CBD5E0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#4A5568' }}>
                            Email Address <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-lg transition-all"
                            style={{
                                borderColor: '#CBD5E0',
                                color: '#1A202C'
                            }}
                            placeholder="doctor@example.com"
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#50B9E8';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(80, 185, 232, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#CBD5E0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Medical Registration Number */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#4A5568' }}>
                            Medical Registration Number <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            minLength={5}
                            maxLength={100}
                            value={formData.medicalRegistrationNumber}
                            onChange={(e) => setFormData({ ...formData, medicalRegistrationNumber: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 border-2 rounded-lg transition-all font-mono"
                            style={{
                                borderColor: '#CBD5E0',
                                color: '#1A202C'
                            }}
                            placeholder="e.g., 12345/A/2020"
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#50B9E8';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(80, 185, 232, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#CBD5E0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                        <p className="text-xs mt-1" style={{ color: '#4A5568' }}>
                            Your unique medical registration number from your state medical council
                        </p>
                    </div>

                    {/* State Medical Council */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#4A5568' }}>
                            State Medical Council <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <select
                            required
                            value={formData.stateMedicalCouncil}
                            onChange={(e) => setFormData({ ...formData, stateMedicalCouncil: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-lg transition-all"
                            style={{
                                borderColor: '#CBD5E0',
                                color: '#1A202C'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#50B9E8';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(80, 185, 232, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#CBD5E0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
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
                        <label className="block text-sm font-medium mb-2" style={{ color: '#4A5568' }}>
                            Password <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 border-2 rounded-lg transition-all pr-12"
                                style={{
                                    borderColor: '#CBD5E0',
                                    color: '#1A202C'
                                }}
                                placeholder="Min 8 characters"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#50B9E8';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(80, 185, 232, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#CBD5E0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: '#4A5568' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#1A202C'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#4A5568'}
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
                                    <span className="text-xs font-medium" style={{ color: '#4A5568' }}>Password Strength:</span>
                                    <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                    <div
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(passwordStrength.score / 4) * 100}%`,
                                            backgroundColor: passwordStrength.color
                                        }}
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
                                                <svg className="w-4 h-4" fill="#38A169" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="#CBD5E0" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span style={{ color: passwordStrength.requirements[key as keyof typeof passwordStrength.requirements] ? '#1A202C' : '#4A5568' }}>
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
                        <label className="block text-sm font-medium mb-2" style={{ color: '#4A5568' }}>
                            Confirm Password <span style={{ color: '#E53E3E' }}>*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 border-2 rounded-lg transition-all pr-12"
                                style={{
                                    borderColor: '#CBD5E0',
                                    color: '#1A202C'
                                }}
                                placeholder="Re-enter password"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#50B9E8';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(80, 185, 232, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#CBD5E0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: '#4A5568' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#1A202C'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#4A5568'}
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
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#E53E3E' }}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Passwords do not match
                            </p>
                        )}
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#38A169' }}>
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
                        className="w-full py-3 rounded-lg font-semibold transition-all duration-200"
                        style={{
                            background: loading || passwordStrength.score < 4 ? '#CBD5E0' : 'linear-gradient(135deg, #50B9E8 0%, #0A4D8B 100%)',
                            color: '#FFFFFF',
                            opacity: loading || passwordStrength.score < 4 ? 0.6 : 1,
                            cursor: loading || passwordStrength.score < 4 ? 'not-allowed' : 'pointer',
                            boxShadow: loading || passwordStrength.score < 4 ? 'none' : '0 10px 15px -3px rgba(80, 185, 232, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && passwordStrength.score >= 4) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(80, 185, 232, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = loading || passwordStrength.score < 4 ? 'none' : '0 10px 15px -3px rgba(80, 185, 232, 0.3)';
                        }}
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
                <p className="text-sm mt-6 text-center" style={{ color: '#4A5568' }}>
                    Already have an account?{' '}
                    <a
                        href="/auth/login"
                        className="font-medium hover:underline"
                        style={{ color: '#50B9E8' }}
                    >
                        Login here
                    </a>
                </p>

                <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E2E8F0' }}>
                    <p className="text-xs text-center" style={{ color: '#4A5568' }}>
                        By submitting this application, you agree to our Terms of Service and Privacy Policy.
                        Your information will be verified and kept confidential.
                    </p>
                </div>
            </div>
        </div>
    );
}