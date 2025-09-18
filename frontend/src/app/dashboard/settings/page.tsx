'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
    ShieldCheckIcon,
    QrCodeIcon,
    KeyIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import apiService from '@/services/api'

interface MFASetup {
    qr_code: string
    secret: string
    backup_codes: string[]
    instructions: string
}

export default function SettingsPage() {
    const { user } = useAuthStore()
    const [mfaEnabled, setMfaEnabled] = useState(false)
    const [showMFASetup, setShowMFASetup] = useState(false)
    const [mfaSetup, setMfaSetup] = useState<MFASetup | null>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSetupMFA = async () => {
        try {
            setIsLoading(true)
            const response = await apiService.post('/auth/mfa/setup', {})

            if (response.status === 'success') {
                setMfaSetup(response.data)
                setShowMFASetup(true)
                toast.success('MFA setup initiated')
            }
        } catch (error) {
            console.error('MFA setup error:', error)
            toast.error('Failed to setup MFA')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyMFA = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error('Please enter a 6-digit verification code')
            return
        }

        try {
            setIsLoading(true)
            const response = await apiService.post('/auth/mfa/verify-setup', {
                token: verificationCode
            })

            if (response.status === 'success') {
                setMfaEnabled(true)
                setShowMFASetup(false)
                setMfaSetup(null)
                setVerificationCode('')
                toast.success('MFA successfully enabled!')
            }
        } catch (error) {
            console.error('MFA verification error:', error)
            toast.error('Invalid verification code')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDisableMFA = async () => {
        try {
            setIsLoading(true)
            const response = await apiService.post('/auth/mfa/disable', {})

            if (response.status === 'success') {
                setMfaEnabled(false)
                toast.success('MFA disabled')
            }
        } catch (error) {
            console.error('MFA disable error:', error)
            toast.error('Failed to disable MFA')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-all duration-300">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Security Settings</h1>
                    <p className="text-neutral-600 dark:text-neutral-400">Manage your account security and two-factor authentication</p>
                </div>

                {/* MFA Section */}
                <div className="medical-card">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Two-Factor Authentication</h2>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Add an extra layer of security to your account</p>
                            </div>
                        </div>

                        {!mfaEnabled && !showMFASetup && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">MFA Not Enabled</h3>
                                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                                Your account is not protected by two-factor authentication.
                                                Enable MFA to secure your EMR access.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={handleSetupMFA}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    <QrCodeIcon className="h-4 w-4" />
                                    {isLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                                </Button>
                            </div>
                        )}

                        {mfaEnabled && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">MFA Enabled</h3>
                                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                                Your account is protected by two-factor authentication.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="danger"
                                    onClick={handleDisableMFA}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    <ShieldCheckIcon className="h-4 w-4" />
                                    {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                                </Button>
                            </div>
                        )}

                        {showMFASetup && mfaSetup && (
                            <div className="space-y-6">
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">Setup Authenticator App</h3>

                                    {/* Step 1: QR Code */}
                                    <div className="space-y-4">
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Step 1: Scan QR Code</h4>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                                {mfaSetup.instructions}
                                            </p>

                                            <div className="flex justify-center p-4 bg-white dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
                                                <img
                                                    src={mfaSetup.qr_code}
                                                    alt="MFA QR Code"
                                                    className="w-48 h-48"
                                                />
                                            </div>

                                            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded text-center">
                                                <p className="text-xs text-neutral-600 dark:text-neutral-400">Manual entry key:</p>
                                                <code className="text-sm font-mono text-neutral-800 dark:text-neutral-200 break-all">
                                                    {mfaSetup.secret}
                                                </code>
                                            </div>
                                        </div>

                                        {/* Step 2: Verification */}
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Step 2: Verify Setup</h4>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                                Enter the 6-digit code from your authenticator app to complete setup.
                                            </p>

                                            <div className="flex gap-3">
                                                <Input
                                                    placeholder="6-digit code"
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="text-center text-lg tracking-widest font-mono"
                                                    maxLength={6}
                                                />
                                                <Button
                                                    variant="primary"
                                                    onClick={handleVerifyMFA}
                                                    disabled={isLoading || verificationCode.length !== 6}
                                                >
                                                    {isLoading ? 'Verifying...' : 'Verify & Enable'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Backup Codes */}
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Backup Codes</h4>
                                            <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
                                                Save these backup codes in a secure location. Each can be used once if you lose access to your authenticator app.
                                            </p>

                                            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-600">
                                                {mfaSetup.backup_codes.map((code, index) => (
                                                    <div key={index} className="text-center p-1 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded">
                                                        {code}
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(mfaSetup.backup_codes.join('\n'))
                                                    toast.success('Backup codes copied to clipboard')
                                                }}
                                                className="mt-3 flex items-center gap-2"
                                            >
                                                <KeyIcon className="h-4 w-4" />
                                                Copy Backup Codes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Security Settings */}
                <div className="medical-card">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Account Security</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Password</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Last changed: Never</p>
                                </div>
                                <Button variant="secondary" size="sm">
                                    Change Password
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Session Management</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage active sessions</p>
                                </div>
                                <Button variant="secondary" size="sm">
                                    View Sessions
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
