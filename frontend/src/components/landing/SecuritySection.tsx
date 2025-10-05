'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Lock, ShieldCheck, Key, FileCheck } from 'lucide-react';

const securityFeatures = [
    {
        icon: Lock,
        title: 'End-to-End Encryption',
        description: 'Your data is encrypted from the moment it\'s captured. Only you hold the key. We use AES-256 encryption with zero-knowledge architecture.',
    },
    {
        icon: ShieldCheck,
        title: 'Compliance-Ready',
        description: 'Built from the ground up to be compliant with DPDPA and HIPAA standards, ensuring your practice is future-proof and legally secure.',
    },
    {
        icon: Key,
        title: 'Zero-Knowledge Architecture',
        description: 'Your encryption keys never leave your device. We cannot access your data even if we wanted to. True privacy by design.',
    },
    {
        icon: FileCheck,
        title: 'Audit-Ready Logs',
        description: 'Every action is logged and traceable for medico-legal compliance. Complete audit trails for regulatory peace of mind.',
    },
];

export default function SecuritySection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section id="security" ref={ref} className="relative py-24 px-6 overflow-hidden">
            {/* Background Gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(247, 250, 252, 0.5) 50%, #FFFFFF 100%)',
                }}
            />

            {/* Decorative Elements */}
            <div
                className="absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(10, 77, 139, 0.08)' }}
            />
            <div
                className="absolute bottom-10 right-10 w-64 h-64 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(80, 185, 232, 0.08)' }}
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
                        Your Trust. Our Priority.
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto"
                        style={{ color: '#4A5568' }}
                    >
                        Enterprise-grade security and compliance built into every layer. Your patients' privacy is non-negotiable.
                    </p>
                </motion.div>

                {/* Security Features Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {securityFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                className="bg-white rounded-2xl p-8 border-2 transition-all duration-300"
                                style={{
                                    borderColor: 'rgba(10, 77, 139, 0.1)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#0A4D8B';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(10, 77, 139, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(10, 77, 139, 0.1)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Icon */}
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                                    style={{
                                        background: 'linear-gradient(135deg, #0A4D8B 0%, #50B9E8 100%)',
                                        boxShadow: '0 10px 20px rgba(10, 77, 139, 0.2)'
                                    }}
                                >
                                    <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                                </div>

                                {/* Title */}
                                <h3
                                    className="text-2xl font-bold mb-4"
                                    style={{
                                        fontFamily: 'Poppins, sans-serif',
                                        color: '#1A202C'
                                    }}
                                >
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p
                                    className="text-base leading-relaxed"
                                    style={{ color: '#4A5568' }}
                                >
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Additional Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-16 text-center"
                >
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 px-6 sm:px-8 py-4 bg-white rounded-full border-2 max-w-4xl mx-auto"
                        style={{
                            borderColor: 'rgba(80, 185, 232, 0.2)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="#0A4D8B" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-sm sm:text-base whitespace-nowrap" style={{ color: '#0A4D8B' }}>DPDPA Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="#0A4D8B" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-sm sm:text-base whitespace-nowrap" style={{ color: '#0A4D8B' }}>HIPAA Ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="#0A4D8B" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-sm sm:text-base whitespace-nowrap" style={{ color: '#0A4D8B' }}>AES-256</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}