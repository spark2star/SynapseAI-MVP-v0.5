'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import VoiceWaveform from '@/components/animations/VoiceWaveform';
import ParallaxBackground from '@/components/landing/ParallaxBackground';

export default function HeroSection() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <section className="relative min-h-screen h-auto flex flex-col justify-start items-center px-4 sm:px-6 pt-24 pb-16 sm:pt-28 sm:pb-20 overflow-x-hidden bg-white">
            {/* ============================================================================
                PARALLAX BACKGROUND
                ============================================================================ */}
            <ParallaxBackground />

            {/* GLASSMORPHISM NAVIGATION - PREMIUM LOOK */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 border-b"
                style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderColor: 'rgba(80, 185, 232, 0.1)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Logo with Product Name - DARK TEXT FOR VISIBILITY */}
                    <a href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI Logo"
                            width={56}
                            height={56}
                            priority
                            className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span
                                className="text-2xl font-heading font-bold tracking-tight"
                                style={{ color: '#0A4D8B' }}
                            >
                                SynapseAI
                            </span>
                            <span
                                className="text-xs -mt-1"
                                style={{
                                    color: '#4A5568',
                                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em'
                                }}
                            >
                                Effortless Intelligence
                            </span>
                        </div>
                    </a>

                    {/* Navigation Links - DARK TEXT FOR VISIBILITY */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a
                            href="#how-it-works"
                            className="font-medium transition-colors"
                            style={{
                                color: '#1A202C',
                                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                                fontSize: '0.9375rem',
                                fontWeight: 500
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#50B9E8'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#1A202C'}
                        >
                            How It Works
                        </a>
                        <a
                            href="#features"
                            className="font-medium transition-colors"
                            style={{
                                color: '#1A202C',
                                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                                fontSize: '0.9375rem',
                                fontWeight: 500
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#50B9E8'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#1A202C'}
                        >
                            Features
                        </a>
                        <a
                            href="#security"
                            className="font-medium transition-colors"
                            style={{
                                color: '#1A202C',
                                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                                fontSize: '0.9375rem',
                                fontWeight: 500
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#50B9E8'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#1A202C'}
                        >
                            Security
                        </a>

                        {/* Auth Buttons with PROPER CONTRAST */}
                        <div className="flex items-center gap-3 ml-4">
                            <a href="/auth/login">
                                <Button variant="tertiary" size="sm">
                                    Log In
                                </Button>
                            </a>
                            <a href="/register">
                                <Button variant="primary" size="sm" className="shadow-button">
                                    Sign Up Free
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Mobile Menu Button - FUNCTIONAL */}
                    <button
                        onClick={() => {
                            console.log('Menu toggled:', !isMenuOpen);
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors z-50 relative"
                        style={{ color: '#4A5568', pointerEvents: 'auto' }}
                        aria-label="Toggle menu"
                        type="button"
                    >
                        {isMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <div
                    className={`
                        lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t
                        transition-all duration-300 ease-in-out
                        ${isMenuOpen ? 'opacity-100 visible max-h-96' : 'opacity-0 invisible max-h-0'}
                    `}
                    style={{
                        borderColor: 'rgba(80, 185, 232, 0.1)',
                    }}
                >
                    <div className="flex flex-col space-y-4 p-6">
                        <a
                            href="#how-it-works"
                            className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            How It Works
                        </a>
                        <a
                            href="#features"
                            className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </a>
                        <a
                            href="#security"
                            className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Security
                        </a>
                        <div className="pt-4 space-y-3 border-t border-gray-200">
                            <a href="/auth/login" className="block w-full">
                                <Button variant="tertiary" size="sm" className="w-full">
                                    Log In
                                </Button>
                            </a>
                            <a href="/register" className="block w-full">
                                <Button variant="primary" size="sm" className="w-full">
                                    Sign Up Free
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Content - MAXIMUM CONTRAST - Mobile Responsive - Proper Spacing */}
            <div className="w-full max-w-5xl mx-auto text-center relative z-10 px-4 sm:px-6 space-y-6 sm:space-y-8 flex-shrink-0">
                {/* Headline - BLACK TEXT WITH BLUE ACCENTS - Responsive Typography */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="font-heading font-bold mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                    style={{
                        lineHeight: '1.1',
                        color: '#1A202C', // neutralBlack - DARK AND VISIBLE
                    }}
                >
                    Reclaim Your{' '}
                    <span style={{ color: '#50B9E8' }}>Time</span>.{' '}
                    Perfect Your{' '}
                    <span style={{ color: '#50B9E8' }}>Notes</span>.
                </motion.h1>

                {/* Sub-headline - DARK GRAY FOR READABILITY - Responsive */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 sm:mb-10 lg:mb-12 leading-relaxed px-2"
                    style={{
                        color: '#4A5568', // neutralGray-700 - VISIBLE ON WHITE
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        fontWeight: 400,
                        letterSpacing: '-0.01em'
                    }}
                >
                    SynapseAI is an intelligent documentation tool for psychiatrists.
                    Our secure AI transcribes your sessions and generates comprehensive
                    medico-legal reports, so you can focus completely on your patient.
                </motion.p>

                {/* Voice Waveform with VISIBLE COLORS - Responsive Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="my-8 sm:my-10 lg:my-12 flex-shrink-0 w-full max-w-md mx-auto"
                >
                    <VoiceWaveform />
                </motion.div>

                {/* "AI-Powered Voice Recognition" Label - DARK TEXT */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="font-medium mb-6 sm:mb-8"
                    style={{
                        color: '#4A5568',
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        fontSize: '0.9375rem',
                        letterSpacing: '0.02em'
                    }}
                >
                    AI-Powered Voice Recognition
                </motion.p>

                {/* Primary CTA Button - WHITE TEXT ON BLUE BACKGROUND - Responsive */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="pb-8 sm:pb-12"
                >
                    <button
                        onClick={() => window.location.href = '/demo'}
                        className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-button shadow-xl transition-all w-full sm:w-auto max-w-sm mx-auto"
                        style={{
                            backgroundColor: '#50B9E8', // synapseSkyBlue
                            color: '#FFFFFF', // WHITE TEXT - ALWAYS VISIBLE
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0A4D8B'; // synapseDarkBlue on hover
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#50B9E8';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        Request a Demo
                    </button>
                </motion.div>
            </div>

            {/* Scroll Indicator - VISIBLE COLOR */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
            >
                <div className="w-6 h-10 border-2 rounded-full flex justify-center"
                    style={{ borderColor: '#50B9E8' }}
                >
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full mt-2"
                        style={{ backgroundColor: '#50B9E8' }}
                    />
                </div>
            </motion.div>
        </section>
    );
}
