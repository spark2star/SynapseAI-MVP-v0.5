'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { LoginCredentials } from '@/types';

interface LoginFormData {
    email: string;
    password: string;
    remember_me: boolean;
}

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<LoginFormData>();

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true);

        try {
            // Call the API directly to get full response with role and status
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    remember_me: data.remember_me
                })
            });

            const result = await response.json();

            // Handle 403 Forbidden (pending/rejected doctors)
            if (response.status === 403) {
                const detail = result.detail || result.error?.message || {};

                if (typeof detail === 'object' && detail.code === 'APPLICATION_PENDING') {
                    toast.error('Your application is pending admin approval. You will receive an email once verified.', {
                        duration: 6000
                    });
                    setError('email', { message: 'Application pending verification' });
                } else if (typeof detail === 'object' && detail.code === 'APPLICATION_REJECTED') {
                    toast.error(`Your application was rejected. Reason: ${detail.reason || 'Please contact support.'}`, {
                        duration: 8000
                    });
                    setError('email', { message: 'Application rejected' });
                } else {
                    toast.error('Access denied. Please contact support.', { duration: 5000 });
                    setError('email', { message: 'Access denied' });
                }
                setIsSubmitting(false);
                return;
            }

            // Handle other errors
            if (!response.ok || result.status !== 'success') {
                setError('email', { message: 'Invalid email or password' });
                setError('password', { message: 'Invalid email or password' });
                toast.error('Invalid credentials. Please try again.');
                setIsSubmitting(false);
                return;
            }

            // Successful login - now update auth store
            const success = await login(data as LoginCredentials);

            if (success) {
                const { role, doctor_status, profile_completed, password_reset_required } = result.data;

                // Role-based routing
                if (role === 'admin') {
                    toast.success('Welcome back, Admin!');
                    router.push('/admin/dashboard');
                } else if (role === 'doctor') {
                    if (password_reset_required) {
                        toast.success('Welcome! Please reset your temporary password.');
                        router.push('/auth/reset-password');
                    } else if (doctor_status === 'verified' && !profile_completed) {
                        toast.success('Welcome! Please complete your profile to get started.');
                        router.push('/doctor/complete-profile');
                    } else if (doctor_status === 'verified' && profile_completed) {
                        toast.success('Welcome back, Doctor!');
                        router.push('/dashboard');
                    } else {
                        toast.error('Account verification pending.');
                        setIsSubmitting(false);
                        return;
                    }
                } else {
                    toast.success('Welcome back!');
                    router.push('/dashboard');
                }
            } else {
                setError('email', { message: 'Invalid email or password' });
                setError('password', { message: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="h-4 bg-neutralGray-300 rounded mb-4 w-48"></div>
                    <div className="h-4 bg-neutralGray-300 rounded mb-2 w-64"></div>
                    <div className="h-4 bg-neutralGray-300 rounded w-48"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* ============================================================================
                LEFT SIDE: BRANDING & VISUALS
                ============================================================================ */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-synapseSkyBlue to-synapseDarkBlue relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                            backgroundSize: '40px 40px',
                        }}
                    />
                </div>

                {/* Animated Floating Orbs */}
                <motion.div
                    className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                    animate={{
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                    animate={{
                        y: [0, 30, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-md"
                    >
                        {/* Logo */}
                        <Image
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI"
                            width={80}
                            height={80}
                            className="mb-8 mx-auto brightness-0 invert"
                        />

                        {/* Headline */}
                        <h2 className="text-4xl font-heading font-bold mb-4">
                            Welcome Back to SynapseAI
                        </h2>

                        {/* Sub-headline */}
                        <p className="text-xl text-white/80 mb-8">
                            Your intelligent co-pilot for psychiatric documentation
                        </p>

                        {/* Features */}
                        <div className="space-y-4 text-left">
                            {[
                                'AI-powered voice transcription',
                                'Comprehensive medico-legal reports',
                                'DPDPA compliant & secure',
                                'Focus on your patients, not paperwork'
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircleIcon className="w-6 h-6 text-white flex-shrink-0" />
                                    <span className="text-white/90">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ============================================================================
                RIGHT SIDE: LOGIN FORM
                ============================================================================ */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-md">
                    {/* Back to Home Link */}
                    <Link
                        href="/landing"
                        className="inline-flex items-center gap-2 text-body text-neutralGray-700 hover:text-synapseSkyBlue transition-colors mb-8"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Home
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Image
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI"
                            width={60}
                            height={60}
                            className="mx-auto mb-4"
                        />
                        <h2 className="text-2xl font-heading font-bold text-synapseDarkBlue">
                            Sign In to SynapseAI
                        </h2>
                    </div>

                    {/* Desktop Heading */}
                    <div className="hidden lg:block mb-8">
                        <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue mb-2">
                            Sign In
                        </h1>
                        <p className="text-body text-neutralGray-700">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {/* Demo Credentials Notice */}
                    <div className="mb-6 p-4 bg-synapseSkyBlue/10 border border-synapseSkyBlue/20 rounded-lg">
                        <p className="text-sm text-synapseDarkBlue font-medium">
                            <span className="font-bold">Demo Admin:</span> test.doctor@example.com / SecurePass123!
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="doctor@example.com"
                            error={errors.email?.message}
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Please enter a valid email address'
                                }
                            })}
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                error={errors.password?.message}
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters'
                                    }
                                })}
                            />

                            <button
                                type="button"
                                className="absolute right-3 top-9 text-neutralGray-700 hover:text-synapseSkyBlue transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-synapseSkyBlue border-neutralGray-300 rounded focus:ring-synapseSkyBlue"
                                    {...register('remember_me')}
                                />
                                <span className="text-body text-neutralGray-700">Remember me</span>
                            </label>

                            <Link
                                href="/auth/forgot-password"
                                className="text-body text-synapseSkyBlue hover:text-synapseDarkBlue transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutralGray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-neutralGray-700">Or</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-body text-neutralGray-700">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-synapseSkyBlue hover:text-synapseDarkBlue transition-colors"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 pt-8 border-t border-neutralGray-300">
                        <p className="text-sm text-neutralGray-700 text-center mb-3">
                            Trusted by psychiatrists across India
                        </p>
                        <div className="flex justify-center gap-4 text-xs text-neutralGray-700">
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-successGreen" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>DPDPA Compliant</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-successGreen" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>256-bit Encryption</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}