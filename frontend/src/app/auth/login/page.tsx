'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
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
    const [error, setError] = useState('');

    // ✅ SINGLE AUTH CHECK - Only on mount, no dependencies
    useEffect(() => {
        // Don't check during submission
        if (isSubmitting) return;

        // If already authenticated, redirect immediately
        if (!isLoading && isAuthenticated && user) {
            const role = user.role || 'doctor';
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
            window.location.href = redirectPath;
        }
    }, []); // ← Run only once on mount

    // Smart redirect handler for logo click
    const handleLogoClick = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            const role = user?.role || 'doctor';
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
            window.location.href = redirectPath;
        } else {
            window.location.href = '/landing';
        }
    };

    // ✅ FIXED LOGIN HANDLER
    const handleLogin = async () => {
        console.log('🚀 === LOGIN FLOW START ===');
        setError('');
        setIsSubmitting(true);

        try {
            console.log('📤 Attempting login via Zustand store...');
            console.log('📧 Email:', email);

            // Get login function from Zustand
            const { login } = useAuthStore.getState();

            // Call login
            const success = await login({ email, password });

            console.log('📥 Login response received:', success);

            if (!success) {
                console.error('❌ Login failed - invalid credentials');
                setError('Invalid email or password');
                toast.error('Invalid email or password');
                setIsSubmitting(false);
                return;
            }

            console.log('✅ Login successful via Zustand!');

            // Get updated auth state
            const { user: loggedInUser } = useAuthStore.getState();
            const role = loggedInUser?.role || 'doctor';

            console.log('👤 User Role:', role);
            console.log('🔐 Password Reset Required:', loggedInUser?.password_reset_required);

            // CHECK IF PASSWORD RESET REQUIRED
            if (loggedInUser?.password_reset_required) {
                console.log('⚠️ Password reset required, redirecting to change password...');
                toast('You must change your password before continuing', {
                    icon: '⚠️',
                    duration: 4000
                });

                setTimeout(() => {
                    window.location.href = '/auth/change-password';
                }, 500);
                return;
            }

            // Determine redirect path
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
            const welcomeMessage = role === 'admin' ? 'Welcome back, Admin!' : 'Welcome back, Doctor!';

            console.log(`🚀 Redirecting to ${redirectPath}...`);

            // Show success message
            toast.success(welcomeMessage);

            // ✅ IMMEDIATE REDIRECT - No setTimeout, no delay
            window.location.href = redirectPath;

        } catch (error) {
            console.error('❌ Login error:', error);

            if (error instanceof Error && error.message.includes('timeout')) {
                toast.error('Login request timed out. Please check your connection.');
                setError('Request timed out. Please try again.');
            } else {
                toast.error('Login failed. Please try again.');
                setError('An error occurred. Please try again.');
            }

            setIsSubmitting(false);
        }
    };

    // Loading state
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
                            <img
                                src="/Logo-MVP-v0.5.png"
                                alt="SynapseAI"
                                className="w-20 h-20 mx-auto brightness-0 invert hover:scale-105 transition-transform"
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
                            <img
                                src="/Logo-MVP-v0.5.png"
                                alt="SynapseAI"
                                className="w-15 h-15 mx-auto hover:scale-105 transition-transform"
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

                    {/* Login Form */}
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
