'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import VoiceWaveform from '@/components/animations/VoiceWaveform';

export default function HeroSection() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <section className="relative min-h-screen flex flex-col overflow-hidden">
            {/* ============================================================================
                GRADIENT BACKGROUND WITH FLOWING WAVES
                ============================================================================ */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Base gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F9] via-[#F5FBFE] to-[#E0F2F9]" />

                {/* Large wave layer 1 - Top right flowing wave */}
                <div
                    className="absolute -top-20 -right-40 w-[800px] h-[800px] opacity-40"
                    style={{
                        background: 'radial-gradient(circle at 30% 40%, rgba(189, 227, 245, 0.8) 0%, rgba(189, 227, 245, 0.4) 40%, transparent 70%)',
                        filter: 'blur(60px)',
                        transform: 'rotate(-15deg)',
                    }}
                />

                {/* Large wave layer 2 - Center flowing wave */}
                <div
                    className="absolute top-20 left-10 w-[900px] h-[700px] opacity-30"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(212, 234, 245, 0.9) 0%, rgba(197, 231, 247, 0.5) 50%, transparent 80%)',
                        filter: 'blur(80px)',
                        transform: 'rotate(25deg)',
                    }}
                />

                {/* Wave layer 3 - Bottom left gentle wave */}
                <div
                    className="absolute -bottom-32 -left-32 w-[700px] h-[600px] opacity-35"
                    style={{
                        background: 'radial-gradient(circle at 60% 40%, rgba(197, 231, 247, 0.7) 0%, rgba(189, 227, 245, 0.3) 60%, transparent 85%)',
                        filter: 'blur(70px)',
                        transform: 'rotate(10deg)',
                    }}
                />

                {/* Wave layer 4 - Right side gentle curve */}
                <div
                    className="absolute top-1/3 -right-20 w-[600px] h-[500px] opacity-25"
                    style={{
                        background: 'radial-gradient(ellipse at 30% 50%, rgba(224, 239, 248, 0.8) 0%, rgba(212, 234, 245, 0.4) 55%, transparent 80%)',
                        filter: 'blur(65px)',
                        transform: 'rotate(-20deg)',
                    }}
                />

                {/* Additional soft overlay for depth */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: 'radial-gradient(ellipse at 20% 30%, rgba(189, 227, 245, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(197, 231, 247, 0.3) 0%, transparent 50%)',
                        filter: 'blur(40px)',
                    }}
                />

                {/* Subtle grain/noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Subtle white highlights for depth */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full opacity-5 filter blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-white rounded-full opacity-5 filter blur-2xl" />

                {/* Tiny sparkle dots */}
                <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-white rounded-full opacity-40 animate-twinkle" />
                <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-30 animate-twinkle animation-delay-1000" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full opacity-50 animate-twinkle animation-delay-2000" />
            </div>

            {/* ============================================================================
                GLASSMORPHISM NAVIGATION
                ============================================================================ */}
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2 sm:gap-3 group">
                        <img
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI"
                            className="w-16 h-16 sm:w-20 sm:h-20"
                        />
                        <div className="flex flex-col">
                            <span className="text-lg sm:text-2xl font-heading font-bold tracking-tight text-[#0A4D8B]">
                                SynapseAI
                            </span>
                            <span className="text-[10px] sm:text-xs -mt-1 text-[#4A5568] font-medium">
                                Effortless Intelligence
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a
                            href="#how-it-works"
                            className="text-[#1A202C] font-medium transition-colors hover:text-[#50B9E8]"
                        >
                            How It Works
                        </a>
                        <a
                            href="#features"
                            className="text-[#1A202C] font-medium transition-colors hover:text-[#50B9E8]"
                        >
                            Features
                        </a>
                        <a
                            href="#security"
                            className="text-[#1A202C] font-medium transition-colors hover:text-[#50B9E8]"
                        >
                            Security
                        </a>

                        {/* Auth Buttons */}
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
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
                    style={{ borderColor: 'rgba(80, 185, 232, 0.1)' }}
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

            {/* ============================================================================
                HERO CONTENT - Mobile Optimized Single Column on Small Screens
                ============================================================================ */}
            <div className="relative z-10 flex-1 flex items-center pt-16 sm:pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 w-full">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                        {/* LEFT COLUMN - Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center lg:text-left space-y-4 sm:space-y-6"
                        >
                            {/* Main Headline - Responsive sizing */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                                <span className="text-[#1A202C]">Reclaim Your</span>
                                <br />
                                <span className="text-[#4DB8E8]">Time</span>
                                <span className="text-[#1A202C]">. Perfect</span>
                                <br />
                                <span className="text-[#1A202C]">Your </span>
                                <span className="text-[#4DB8E8]">Notes</span>
                            </h1>

                            {/* Color code */}
                            {/* <p className="text-[#4DB8E8] text-xs sm:text-sm font-mono">
                                #4DB8E43
                            </p> */}

                            {/* Description - Responsive sizing */}
                            <p className="text-[#4A5568] text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                                SynapseAI is an intelligent documentation tool for psychiatrists.
                                Our secure AI transcribes your sessions and generates comprehensive
                                medico-legal reports, so you can focus completely on your patient.
                            </p>

                            {/* CTA Buttons - Stack on mobile */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center lg:justify-start">
                                <button
                                    onClick={() => window.location.href = '/demo'}
                                    className="bg-[#4DB8E8] hover:bg-[#3DA8D8] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all hover:shadow-xl hover:scale-105"
                                >
                                    Request a Demo
                                </button>
                                <button
                                    onClick={() => window.location.href = '/register'}
                                    className="bg-white hover:bg-gray-50 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border-2 border-gray-200 transition-all hover:shadow-lg"
                                >
                                    Sign Up (Free)
                                </button>
                            </div>
                        </motion.div>

                        {/* RIGHT COLUMN - Voice Waveform - Hidden on mobile, shown on lg+ */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative hidden lg:flex items-center justify-center"
                        >
                            {/* Glow effect container */}
                            <div className="relative w-full max-w-md">
                                {/* Background glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#4DB8E8]/20 to-[#2A9BD8]/20 rounded-full filter blur-3xl" />

                                {/* Voice Waveform Component with floating animation */}
                                <motion.div
                                    animate={{
                                        y: [0, -20, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="relative z-10"
                                >
                                    <VoiceWaveform />
                                </motion.div>

                                {/* Floating shadow */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.3, 0.5, 0.3]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-gray-400/30 rounded-full filter blur-2xl"
                                />
                            </div>

                            {/* "AI-Powered Voice Recognition" Label */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-[#4A5568] font-medium text-sm whitespace-nowrap"
                            >
                                AI-Powered Voice Recognition
                            </motion.p>
                        </motion.div>

                        {/* MOBILE ONLY - Compact Waveform below text */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="lg:hidden flex flex-col items-center space-y-4 mt-4"
                        >
                            <div className="w-full max-w-xs">
                                <VoiceWaveform />
                            </div>
                            <p className="text-[#4A5568] font-medium text-sm">
                                AI-Powered Voice Recognition
                            </p>
                        </motion.div>

                    </div>
                </div>
            </div>

            {/* Scroll Indicator - Hidden on mobile */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
            >
                <div className="w-6 h-10 border-2 rounded-full flex justify-center border-[#50B9E8]">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full mt-2 bg-[#50B9E8]"
                    />
                </div>
            </motion.div>
        </section>
    );
}
