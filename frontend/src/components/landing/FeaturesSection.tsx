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
        <section id="features" ref={ref} className="relative py-24 px-6 overflow-hidden">
            {/* Background with Blue Gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(227, 244, 252, 0.3) 0%, #F7FAFC 50%, rgba(227, 244, 252, 0.3) 100%)',
                }}
            />

            {/* Background Gradient Blobs */}
            <div
                className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(80, 185, 232, 0.12)' }}
            />
            <div
                className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(10, 77, 139, 0.12)' }}
            />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-4"
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: '#0A4D8B'
                        }}
                    >
                        A Smarter Way to Document.
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto"
                        style={{ color: '#4A5568' }}
                    >
                        Everything you need to deliver exceptional care while staying protected.
                    </p>
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
                        const isActive = activeFeature === feature.id;
                        return (
                            <button
                                key={feature.id}
                                onClick={() => setActiveFeature(feature.id)}
                                className="flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 border-2"
                                style={{
                                    backgroundColor: isActive ? '#50B9E8' : '#FFFFFF',
                                    borderColor: isActive ? '#50B9E8' : 'rgba(80, 185, 232, 0.2)',
                                    color: isActive ? '#FFFFFF' : '#1A202C',
                                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                    boxShadow: isActive ? '0 10px 15px -3px rgba(80, 185, 232, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.borderColor = '#50B9E8';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.borderColor = 'rgba(80, 185, 232, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}
                            >
                                <FeatureIcon
                                    className="w-5 h-5"
                                    strokeWidth={2}
                                    style={{ color: isActive ? '#FFFFFF' : '#50B9E8' }}
                                />
                                <span className="font-medium">{feature.title}</span>
                            </button>
                        );
                    })}
                </motion.div>

                {/* Feature Details */}
                <motion.div
                    key={currentFeature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl p-12 border-2"
                    style={{
                        borderColor: 'rgba(80, 185, 232, 0.2)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Icon */}
                        <div
                            className="w-32 h-32 rounded-3xl flex items-center justify-center flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #50B9E8 0%, #0A4D8B 100%)',
                                boxShadow: '0 20px 25px -5px rgba(80, 185, 232, 0.4)'
                            }}
                        >
                            <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3
                                className="text-3xl font-bold mb-3"
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    color: '#0A4D8B'
                                }}
                            >
                                {currentFeature.title}
                            </h3>
                            <p
                                className="text-xl mb-4 font-medium"
                                style={{ color: '#50B9E8' }}
                            >
                                {currentFeature.benefit}
                            </p>
                            <p
                                className="text-lg leading-relaxed"
                                style={{ color: '#4A5568' }}
                            >
                                {currentFeature.details}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}