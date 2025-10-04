'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import VoiceWaveform from '@/components/animations/VoiceWaveform';
import ParallaxBackground from '@/components/landing/ParallaxBackground';

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 py-20 overflow-hidden bg-white">
            {/* ============================================================================
                PARALLAX BACKGROUND
                ============================================================================ */}
            <ParallaxBackground />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-neutralGray-300/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    {/* ============================================================================
                        ENHANCED LOGO WITH PRODUCT NAME
                        ============================================================================ */}
                    <a href="/" className="flex items-center gap-3 group cursor-pointer">
                        {/* Logo Image */}
                        <Image
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI Logo"
                            width={56}
                            height={56}
                            priority
                            className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Product Name */}
                        <div className="flex flex-col">
                            <span className="text-2xl font-heading font-bold text-synapseDarkBlue tracking-tight">
                                SynapseAI
                            </span>
                            <span className="text-xs font-body text-neutralGray-700 -mt-1">
                                Effortless Intelligence
                            </span>
                        </div>
                    </a>

                    {/* Navigation Links */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a
                            href="#how-it-works"
                            className="text-body font-medium text-neutralGray-700 hover:text-synapseSkyBlue transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="#features"
                            className="text-body font-medium text-neutralGray-700 hover:text-synapseSkyBlue transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#security"
                            className="text-body font-medium text-neutralGray-700 hover:text-synapseSkyBlue transition-colors"
                        >
                            Security
                        </a>

                        {/* ============================================================================
                            AUTH BUTTONS
                            ============================================================================ */}
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
                    <button className="lg:hidden p-2 text-neutralGray-700 hover:text-synapseSkyBlue transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="max-w-5xl mx-auto text-center mt-20 relative z-10">
                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
                    style={{
                        fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                        letterSpacing: '-0.02em',
                        color: '#1A202C',
                        textShadow: '0 2px 10px rgba(255, 255, 255, 0.3)'
                    }}
                >
                    Reclaim Your{' '}
                    <span
                        className="text-synapseSkyBlue"
                        style={{ textShadow: '0 2px 20px rgba(80, 185, 232, 0.4)' }}
                    >
                        Time
                    </span>.{' '}
                    Perfect Your{' '}
                    <span
                        className="text-synapseSkyBlue"
                        style={{ textShadow: '0 2px 20px rgba(80, 185, 232, 0.4)' }}
                    >
                        Notes
                    </span>.
                </motion.h1>

                {/* Sub-headline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    className="text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
                    style={{
                        fontFamily: 'var(--font-lato), Lato, sans-serif',
                        color: '#4A5568',
                        textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)'
                    }}
                >
                    SynapseAI is an intelligent documentation tool for psychiatrists.
                    Our secure AI transcribes your sessions and generates comprehensive
                    medico-legal reports, so you can focus completely on your patient.
                </motion.p>

                {/* Animated Visual - Voice Waveform */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    className="mb-12"
                >
                    <VoiceWaveform />
                </motion.div>

                {/* Primary CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                >
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => window.location.href = '#demo'}
                        className="shadow-xl hover:shadow-2xl"
                    >
                        Request a Demo
                    </Button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
            >
                <div className="w-6 h-10 border-2 border-[#50B9E8] rounded-full flex justify-center">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-[#50B9E8] rounded-full mt-2"
                    />
                </div>
            </motion.div>
        </section>
    );
}
