'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { Mic2, FileText, Brain, Shield } from 'lucide-react';

const features = [
    {
        id: 'transcription',
        icon: Mic2,
        title: 'AI-Powered Transcription',
        benefit: 'Focus on your patient, not on your notes.',
        details: 'Our advanced AI captures every word with medical-grade accuracy, understanding psychiatric terminology and context. Never miss a critical detail again.',
    },
    {
        id: 'reports',
        icon: FileText,
        title: 'Comprehensive Reports',
        benefit: 'Cover all critical details for medical and legal peace of mind.',
        details: 'Automatically structured reports include patient history, mental status examination, diagnosis, treatment plan, and follow-up recommendations.',
    },
    {
        id: 'intelligence',
        icon: Brain,
        title: 'Clinical Intelligence',
        benefit: 'Instantly flag critical information from past reports.',
        details: 'SynapseAI analyzes historical data to highlight patterns, risk factors, and treatment efficacy, helping you make better-informed decisions.',
    },
    {
        id: 'security',
        icon: Shield,
        title: 'Unbreakable Security',
        benefit: 'Your data is yours alone. Not even we can access it.',
        details: 'End-to-end encryption with zero-knowledge architecture. Your encryption keys never leave your device. DPDPA and HIPAA compliant by design.',
    },
];

export default function FeaturesSection() {
    const [activeFeature, setActiveFeature] = useState(features[0].id);
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const currentFeature = features.find(f => f.id === activeFeature) || features[0];
    const Icon = currentFeature.icon;

    return (
        <section id="features" ref={ref} className="py-24 px-6 bg-[#F9FAFB] relative overflow-hidden">
            {/* Background Gradient Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#50B9E8]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0A4D8B]/10 rounded-full blur-3xl" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[#0A4D8B] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        A Smarter Way to Document.
                    </h2>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {features.map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                            <button
                                key={feature.id}
                                onClick={() => setActiveFeature(feature.id)}
                                className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 ${activeFeature === feature.id
                                        ? 'bg-[#50B9E8] text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-600 hover:bg-white/80 hover:text-[#50B9E8]'
                                    }`}
                            >
                                <FeatureIcon className="w-5 h-5" strokeWidth={2} />
                                <span className="hidden sm:inline">{feature.title}</span>
                            </button>
                        );
                    })}
                </motion.div>

                {/* Feature Content - Glassmorphism Card */}
                <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                    {/* Glassmorphism Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/40 relative overflow-hidden">
                        {/* Gradient Overlay */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#50B9E8]/20 to-transparent rounded-full blur-3xl" />

                        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                            {/* Left: Icon and Text */}
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-[#50B9E8] rounded-2xl flex items-center justify-center shadow-lg">
                                        <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            {currentFeature.title}
                                        </h3>
                                        <p className="text-base text-[#50B9E8] font-medium">
                                            {currentFeature.benefit}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {currentFeature.details}
                                </p>
                            </div>

                            {/* Right: Visual Mockup */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-full max-w-sm h-80 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-6">
                                    {/* Placeholder for feature-specific UI mockup */}
                                    <div className="h-full flex flex-col justify-between">
                                        <div className="space-y-3">
                                            {[100, 90, 85, 95].map((width, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${width}%` }}
                                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                                    className="h-3 bg-gradient-to-r from-[#E3F4FC] to-[#50B9E8]/30 rounded"
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <Icon className="w-32 h-32 text-[#50B9E8]/20" strokeWidth={1} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

