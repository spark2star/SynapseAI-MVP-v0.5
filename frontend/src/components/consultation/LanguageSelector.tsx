'use client'

import React, { useState } from 'react'
import { LanguageIcon } from '@heroicons/react/24/outline'

interface LanguageSelectorProps {
    onLanguageChange: (languageCode: string) => void
    selectedLanguage?: string
}

interface Language {
    code: string
    name: string
    nativeName: string
}

const languages: Language[] = [
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'en-IN', name: 'English', nativeName: 'English' }
]

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    onLanguageChange,
    selectedLanguage
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleLanguageSelect = (languageCode: string) => {
        onLanguageChange(languageCode)
        setIsOpen(false)
    }

    const getSelectedLanguage = (): Language | undefined => {
        return languages.find(lang => lang.code === selectedLanguage)
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <LanguageIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Primary Language:
                </span>
            </div>

            <div className="relative mt-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-neutral-800 py-2 pl-3 pr-10 text-left text-sm border border-neutral-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {selectedLanguage ? (
                        <span className="block truncate">
                            {getSelectedLanguage()?.name} ({getSelectedLanguage()?.nativeName})
                        </span>
                    ) : (
                        <span className="text-neutral-500">Select primary language</span>
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
                    <div className="absolute z-10 mt-1 w-full overflow-auto rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-60">
                        <ul className="py-1">
                            {languages.map((language) => (
                                <li key={language.code}>
                                    <button
                                        onClick={() => handleLanguageSelect(language.code)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${selectedLanguage === language.code
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'text-neutral-900 dark:text-neutral-100'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>
                                                {language.name} ({language.nativeName})
                                            </span>
                                            {selectedLanguage === language.code && (
                                                <svg
                                                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {selectedLanguage && (
                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                        <span>Language selected for STT optimization</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LanguageSelector
