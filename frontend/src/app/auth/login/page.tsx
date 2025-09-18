'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { HeartIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/solid'

import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'
import type { LoginCredentials } from '@/types'

interface LoginFormData {
    email: string
    password: string
    remember_me: boolean
}

export default function LoginPage() {
    const router = useRouter()
    const { login, isAuthenticated, isLoading } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<LoginFormData>()

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true)

        try {
            const success = await login(data as LoginCredentials)

            if (success) {
                toast.success('Welcome back to your EMR system!')
                router.push('/dashboard')
            } else {
                setError('email', { message: 'Invalid email or password' })
                setError('password', { message: 'Invalid email or password' })
            }
        } catch (error) {
            toast.error('Login failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center transition-all duration-300">
                <div className="animate-pulse">
                    <div className="medical-card p-8 w-96">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-800 flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-6">
                <div className="flex items-center">
                    <Logo size="lg" showText={true} />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-lg w-full">
                    {/* Login Card */}
                    <div className="medical-card p-8 sm:p-10">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                Welcome Back
                            </h2>
                            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                                Sign in to your secure EMR system
                            </p>
                            <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                                <p className="text-sky-700 dark:text-sky-300 text-sm font-medium">
                                    Demo: doctor@demo.com / password123
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <Input
                                label="Email Address"
                                type="email"
                                autoComplete="email"
                                placeholder="doctor@hospital.com"
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
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
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
                                    className="absolute right-3 top-8 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200"
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

                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                    <input
                                        id="remember_me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded"
                                        {...register('remember_me')}
                                    />
                                    <label htmlFor="remember_me" className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a
                                        href="/auth/forgot-password"
                                        className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                    className="py-4 text-base font-semibold"
                                >
                                    Sign In Securely
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Security Features */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                            <ShieldCheckIcon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    HIPAA Compliant
                                </h3>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    End-to-end encryption
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <SparklesIcon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    AI Powered
                                </h3>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Smart transcription
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <HeartIcon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    Patient First
                                </h3>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Privacy by design
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Demo Credentials */}
                    {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
                        <div className="mt-8 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">
                                Demo Credentials
                            </h4>
                            <div className="text-sm text-amber-700 dark:text-amber-400 space-y-2">
                                <p><strong>Doctor:</strong> doctor@demo.com / password123</p>
                                <p><strong>Admin:</strong> admin@demo.com / password123</p>
                                <p><strong>Reception:</strong> reception@demo.com / password123</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
