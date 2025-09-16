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
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="medical-card p-8 w-96">
                        <div className="h-4 bg-neutral-200 rounded mb-4"></div>
                        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4">
                <div className="flex items-center">
                    <div className="flex items-center space-x-2">
                        <HeartIcon className="h-8 w-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-gradient-primary">
                            Intelligent EMR
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    {/* Login Card */}
                    <div className="medical-card">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                                Welcome Back
                            </h2>
                            <p className="text-neutral-600">
                                Sign in to your secure EMR system
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                    className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-600"
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
                                <div className="flex items-center">
                                    <input
                                        id="remember_me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                                        {...register('remember_me')}
                                    />
                                    <label htmlFor="remember_me" className="ml-2 text-sm text-neutral-700">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a
                                        href="/auth/forgot-password"
                                        className="font-medium text-primary-600 hover:text-primary-500"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Sign In Securely
                            </Button>
                        </form>
                    </div>

                    {/* Security Features */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col items-center space-y-2">
                            <ShieldCheckIcon className="h-8 w-8 text-primary-500" />
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900">
                                    HIPAA Compliant
                                </h3>
                                <p className="text-xs text-neutral-600">
                                    End-to-end encryption
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <SparklesIcon className="h-8 w-8 text-primary-500" />
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900">
                                    AI Powered
                                </h3>
                                <p className="text-xs text-neutral-600">
                                    Smart transcription
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <HeartIcon className="h-8 w-8 text-primary-500" />
                            <div>
                                <h3 className="text-sm font-medium text-neutral-900">
                                    Patient First
                                </h3>
                                <p className="text-xs text-neutral-600">
                                    Privacy by design
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Demo Credentials */}
                    {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h4 className="text-sm font-medium text-amber-800 mb-2">
                                Demo Credentials
                            </h4>
                            <div className="text-xs text-amber-700 space-y-1">
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
