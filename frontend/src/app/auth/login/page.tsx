'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const [email, setEmail] = useState('doc@demo.com');
    const [password, setPassword] = useState('password123');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState('');

    // Smart redirect handler for logo click
    const handleLogoClick = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Redirect to dashboard if logged in
            const role = user?.role || 'doctor';
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
            window.location.href = redirectPath;
        } else {
            // Redirect to landing page if not logged in
            window.location.href = '/landing';
        }
    };

    // Redirect if already authenticated (on page load only)
    useEffect(() => {
        if (!isLoading && isAuthenticated && !isSubmitting && !isRedirecting) {
            console.log('🔄 Already authenticated, redirecting...');
            const role = user?.role || 'doctor';
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
            window.location.href = redirectPath;
        }
    }, [isLoading]); // Only run on mount and when loading state changes

    // NUCLEAR FIX: Direct button click handler (no form submission)
    const handleLogin = async () => {
        console.log('🚀 === LOGIN FLOW START ===');
        setError('');
        setIsSubmitting(true);
        setIsRedirecting(true);

        try {
            // Step 1: Direct API call to get full response
            console.log('📤 Step 1: Calling login API...');
            console.log('📧 Email:', email);
            console.log('🔒 Password:', password ? '***' : 'empty');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    remember_me: rememberMe
                })
            });

            console.log('📥 Step 2: Response received, status:', response.status);
            const result = await response.json();
            console.log('📦 Step 3: Response data:', result);

            // Handle 403 Forbidden
            if (response.status === 403) {
                const detail = result.detail || result.error?.message || {};
                if (typeof detail === 'object' && detail.code === 'APPLICATION_PENDING') {
                    toast.error('Your application is pending admin approval.', { duration: 6000 });
                } else if (typeof detail === 'object' && detail.code === 'APPLICATION_REJECTED') {
                    toast.error(`Application rejected: ${detail.reason || 'Contact support'}`, { duration: 8000 });
                } else {
                    toast.error('Access denied. Please contact support.', { duration: 5000 });
                }
                setIsSubmitting(false);
                setIsRedirecting(false);
                return;
            }

            // Handle other errors
            if (!response.ok || result.status !== 'success') {
                console.error('❌ Login failed:', result);
                const errorMsg = result.error?.message || 'Invalid credentials. Please try again.';
                setError(errorMsg);
                toast.error(errorMsg);
                setIsSubmitting(false);
                setIsRedirecting(false);
                return;
            }

            // Extract data from response
            const { role, doctor_status, profile_completed, password_reset_required, access_token, refresh_token } = result.data;

            console.log('✅ Step 4: Login successful!');
            console.log('👤 User Role:', role);
            console.log('🏥 Doctor Status:', doctor_status);
            console.log('📋 Profile Completed:', profile_completed);
            console.log('🔑 Has Token:', !!access_token);

            // Step 2: Save tokens to localStorage AND cookies
            console.log('💾 Step 5: Saving auth data...');

            if (access_token) {
                // Save to localStorage
                localStorage.setItem('access_token', access_token);
                if (refresh_token) {
                    localStorage.setItem('refresh_token', refresh_token);
                }

                // CRITICAL: Save to cookies for middleware
                document.cookie = `access_token=${access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                if (refresh_token) {
                    document.cookie = `refresh_token=${refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
                }

                console.log('✅ Tokens saved to localStorage AND cookies');
                console.log('🍪 Cookie set for middleware');
            } else {
                console.error('❌ No access_token in response!');
                toast.error('Login failed - no token received');
                setIsSubmitting(false);
                setIsRedirecting(false);
                return;
            }

            console.log('✅ Step 6: Auth data saved');

            // CRITICAL: Wait for cookies to be written (middleware needs them!)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Role-based redirect
            console.log('🎯 Step 7: Determining redirect path...');

            let redirectPath = '/dashboard';
            let welcomeMessage = 'Welcome back!';

            if (role === 'admin') {
                redirectPath = '/admin/dashboard';
                welcomeMessage = 'Welcome back, Admin!';
                console.log('🔐 Admin user detected → /admin/dashboard');
            } else if (role === 'doctor') {
                if (password_reset_required) {
                    redirectPath = '/auth/reset-password';
                    welcomeMessage = 'Please reset your temporary password.';
                    console.log('🔒 Password reset required → /auth/reset-password');
                } else if (doctor_status === 'verified' && !profile_completed) {
                    redirectPath = '/doctor/complete-profile';
                    welcomeMessage = 'Please complete your profile to get started.';
                    console.log('📝 Profile incomplete → /doctor/complete-profile');
                } else if (doctor_status === 'verified' && profile_completed) {
                    redirectPath = '/dashboard';
                    welcomeMessage = 'Welcome back, Doctor!';
                    console.log('✅ Verified doctor → /dashboard');
                } else {
                    console.log('⚠️ Doctor not verified yet');
                    toast.error('Account verification pending.');
                    setIsSubmitting(false);
                    setIsRedirecting(false);
                    return;
                }
            }

            console.log(`🚀 Step 8: Redirecting to ${redirectPath}...`);
            toast.success(welcomeMessage);

            // CRITICAL: Use replace() to prevent any history/back button issues
            // and ensure navigation happens immediately without refresh
            const redirectTimer = setTimeout(() => {
                console.log('⚡ Executing redirect NOW...');
                window.location.replace(redirectPath);
            }, 250); // Small delay for toast to show

            // Prevent form from doing anything else
            console.log('🛑 Stopping all further form processing...');
            return false;

        } catch (error) {
            console.error('❌ Login error:', error);
            toast.error('Login failed. Please try again.');
            setIsSubmitting(false);
            setIsRedirecting(false);
        }
        // Note: No finally block - don't reset state after successful redirect
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
                        {/* Logo - Clickable */}
                        <div onClick={handleLogoClick} className="cursor-pointer inline-block mb-8">
                            <Image
                                src="/Logo-MVP-v0.5.png"
                                alt="SynapseAI"
                                width={80}
                                height={80}
                                className="mx-auto brightness-0 invert hover:scale-105 transition-transform"
                            />
                        </div>

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
                        className="inline-flex items-center gap-2 text-gray-800 hover:text-blue-600 transition-colors mb-8"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Home
                    </Link>

                    {/* Mobile Logo - Clickable */}
                    <div className="lg:hidden mb-8 text-center">
                        <div onClick={handleLogoClick} className="cursor-pointer inline-block mb-4">
                            <Image
                                src="/Logo-MVP-v0.5.png"
                                alt="SynapseAI"
                                width={60}
                                height={60}
                                className="mx-auto hover:scale-105 transition-transform"
                            />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-gray-900">
                            Sign In to SynapseAI
                        </h2>
                    </div>

                    {/* Desktop Heading */}
                    <div className="hidden lg:block mb-8">
                        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                            Sign In
                        </h1>
                        <p className="text-gray-700">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {/* Admin Credentials Notice */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-gray-900 font-medium mb-2">
                            <span className="font-bold">🔑 Admin Access:</span>
                        </p>
                        <p className="text-xs text-gray-800 font-mono">
                            Email: admin@synapseai.com<br />
                            Password: SynapseAdmin2025!
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Login Form - NUCLEAR FIX: Using div instead of form to prevent page reload */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="doc@demo.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isSubmitting}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleLogin();
                                    }
                                }}
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                disabled={isSubmitting}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleLogin();
                                    }
                                }}
                            />

                            <button
                                type="button"
                                className="absolute right-3 top-10 text-gray-600 hover:text-blue-600 transition-colors"
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
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Remember me</span>
                            </label>

                            <Link
                                href="/auth/forgot-password"
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            onClick={handleLogin}
                            variant="primary"
                            className="w-full"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-700">Or</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-gray-700">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 pt-8 border-t border-gray-300">
                        <div className="flex justify-center gap-4 text-xs text-gray-700">
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>DPDPA Compliant</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
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