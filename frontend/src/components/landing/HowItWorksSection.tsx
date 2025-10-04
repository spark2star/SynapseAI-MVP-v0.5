'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Mic, Brain, FileCheck } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Mic,
        title: 'Record with Clarity',
        description: 'Our integrated hardware and AI work together to accurately and securely capture every detail of the conversation.',
        visual: 'waveform',
    },
    {
        number: '02',
        icon: Brain,
        title: 'Generate in Minutes',
        description: 'SynapseAI transcribes, structures, and analyzes the conversation, generating a comprehensive report.',
        visual: 'process',
    },
    {
        number: '03',
        icon: FileCheck,
        title: 'Review & Finalize',
        description: 'Your draft is ready. Quickly review, edit if needed, and finalize your notes in a fraction of the time.',
        visual: 'document',
    },
];

function StepCard({ step, index, inView }: { step: typeof steps[0]; index: number; inView: boolean }) {
    const Icon = step.icon;
    const isEven = index % 2 === 0;

    return (
        <div className={`flex flex-col md:flex-row items-center gap-12 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            {/* Text Content */}
            <motion.div
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="flex-1"
            >
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-6xl font-bold text-[#E3F4FC]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {step.number}
                    </span>
                    <div className="w-12 h-12 bg-[#50B9E8]/10 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#50B9E8]" strokeWidth={2} />
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {step.title}
                </h3>

                <p className="text-lg text-gray-600 leading-relaxed">
                    {step.description}
                </p>
            </motion.div>

            {/* Visual */}
            <motion.div
                initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 + 0.2 }}
                className="flex-1 flex items-center justify-center"
            >
                <div className="w-full max-w-md h-64 bg-gradient-to-br from-[#E3F4FC] to-white rounded-2xl shadow-xl border border-[#50B9E8]/20 flex items-center justify-center">
                    {/* Placeholder for step-specific visuals */}
                    <Icon className="w-24 h-24 text-[#50B9E8] opacity-20" strokeWidth={1} />
                </div>
            </motion.div>
        </div>
    );
}

export default function HowItWorksSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section id="how-it-works" ref={ref} className="py-24 px-6 bg-white relative overflow-hidden">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#50B9E8]/30 to-transparent hidden md:block" />

            <div className="max-w-6xl mx-auto">
                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[#0A4D8B] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Your Intelligent Co-pilot in Every Session.
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        SynapseAI works seamlessly in the background, letting you focus on what matters most: your patient.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="space-y-24">
                    {steps.map((step, index) => (
                        <StepCard key={step.number} step={step} index={index} inView={inView} />
                    ))}
                </div>
            </div>
        </section>
    );
}

