'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Lock, ShieldCheck } from 'lucide-react';

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
];

export default function SecuritySection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section id="security" ref={ref} className="py-24 px-6 bg-[#E5E7EB]">
            <div className="max-w-5xl mx-auto">
                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[#0A4D8B] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Your Trust is Our Foundation.
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Security isn't an afterthought—it's the cornerstone of everything we build.
                    </p>
                </motion.div>

                {/* Security Features */}
                <div className="grid md:grid-cols-2 gap-8">
                    {securityFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#0A4D8B]/20"
                            >
                                {/* Icon */}
                                <div className="w-20 h-20 bg-[#0A4D8B] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                    <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-base text-gray-600 leading-relaxed">
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
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12 flex flex-wrap justify-center gap-8 items-center"
                >
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
                        <ShieldCheck className="w-6 h-6 text-[#10B981]" strokeWidth={2} />
                        <span className="text-base font-medium text-gray-900">DPDPA Compliant</span>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
                        <ShieldCheck className="w-6 h-6 text-[#10B981]" strokeWidth={2} />
                        <span className="text-base font-medium text-gray-900">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
                        <Lock className="w-6 h-6 text-[#0A4D8B]" strokeWidth={2} />
                        <span className="text-base font-medium text-gray-900">AES-256 Encryption</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

