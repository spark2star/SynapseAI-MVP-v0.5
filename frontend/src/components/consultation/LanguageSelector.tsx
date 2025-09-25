'use client';

import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    disabled?: boolean;
}

const SUPPORTED_LANGUAGES = [
    { code: 'hi-IN', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'Marathi (मराठी)', flag: '🇮🇳' },
    { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' }
];

export default function LanguageSelector({ selectedLanguage, onLanguageChange, disabled = false }: LanguageSelectorProps) {
    const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
    
    return (
        <div className="relative">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                🌍 Primary Language for Speech Recognition
            </label>
            <div className="relative">
                <select
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Select the primary language for speech recognition. The system will automatically detect mixed languages.
            </p>
        </div>
    );
}
