'use client'

import React, { useState, useEffect } from 'react'
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'

interface AudioDevice {
    deviceId: string
    label: string
    kind: string
}

interface AudioDeviceSelectorProps {
    onDeviceChange: (deviceId: string) => void
    selectedDeviceId?: string
}

const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
    onDeviceChange,
    selectedDeviceId
}) => {
    const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Debounce device loading to prevent continuous re-renders
        const timeoutId = setTimeout(() => {
            loadAudioDevices()
        }, 100)

        return () => clearTimeout(timeoutId)
    }, [])

    const loadAudioDevices = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Request microphone permissions first
            await navigator.mediaDevices.getUserMedia({ audio: true })

            // Get all audio input devices
            const devices = await navigator.mediaDevices.enumerateDevices()
            const audioInputs = devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
                    kind: device.kind
                }))

            setAudioDevices(audioInputs)

            // If no device is selected and we have devices, select the first one
            if (!selectedDeviceId && audioInputs.length > 0) {
                onDeviceChange(audioInputs[0].deviceId)
            }

            console.log('🎤 Available audio devices:', audioInputs)
        } catch (err) {
            console.error('❌ Failed to load audio devices:', err)
            setError('Failed to access microphone devices. Please check permissions.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeviceSelect = (deviceId: string) => {
        onDeviceChange(deviceId)
        setIsOpen(false)
    }

    const getSelectedDevice = () => {
        return audioDevices.find(device => device.deviceId === selectedDeviceId)
    }

    const refreshDevices = () => {
        loadAudioDevices()
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <MicrophoneIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                <button
                    onClick={refreshDevices}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <MicrophoneIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Microphone:
                </span>
            </div>

            <div className="relative mt-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isLoading}
                    className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-neutral-800 py-2 pl-3 pr-10 text-left text-sm border border-neutral-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="text-neutral-500">Loading devices...</span>
                    ) : (
                        <span className="block truncate">
                            {getSelectedDevice()?.label || 'Select microphone'}
                        </span>
                    )}
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                            className={`h-4 w-4 text-neutral-400 transform transition-transform ${isOpen ? 'rotate-180' : ''
                                }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </button>

                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-600">
                        <div className="max-h-60 rounded-md py-1 text-sm overflow-auto">
                            {audioDevices.length === 0 ? (
                                <div className="py-2 px-3 text-neutral-500">No microphones found</div>
                            ) : (
                                audioDevices.map((device) => (
                                    <button
                                        key={device.deviceId}
                                        onClick={() => handleDeviceSelect(device.deviceId)}
                                        className={`relative w-full cursor-pointer select-none py-2 pl-3 pr-9 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 ${device.deviceId === selectedDeviceId
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300'
                                            : 'text-neutral-900 dark:text-neutral-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <MicrophoneIcon className="h-4 w-4 text-neutral-500" />
                                            <span className="block truncate">{device.label}</span>
                                            {device.deviceId === selectedDeviceId && (
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                        {device.deviceId === selectedDeviceId && (
                                            <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                                Currently selected
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}

                            <div className="border-t border-neutral-200 dark:border-neutral-600 mt-1 pt-1">
                                <button
                                    onClick={refreshDevices}
                                    className="w-full py-2 px-3 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh devices
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Device Info */}
            {selectedDeviceId && !isLoading && (
                <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                        <SpeakerWaveIcon className="h-3 w-3" />
                        <span>ID: {selectedDeviceId.slice(0, 12)}...</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AudioDeviceSelector
