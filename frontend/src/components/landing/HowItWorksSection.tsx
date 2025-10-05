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
        <div className={`flex flex-col md:flex-row items-center gap-8 sm:gap-12 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            {/* Text Content - Responsive */}
            <motion.div
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="flex-1 text-center md:text-left px-4 sm:px-0"
            >
                <div className="flex items-center gap-3 sm:gap-4 mb-4 justify-center md:justify-start">
                    <span
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold"
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: 'rgba(80, 185, 232, 0.2)'
                        }}
                    >
                        {step.number}
                    </span>
                    <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(80, 185, 232, 0.1)' }}
                    >
                        <Icon
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            strokeWidth={2}
                            style={{ color: '#50B9E8' }}
                        />
                    </div>
                </div>

                <h3
                    className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        color: '#1A202C'
                    }}
                >
                    {step.title}
                </h3>

                <p
                    className="text-sm sm:text-base lg:text-lg leading-relaxed"
                    style={{ color: '#4A5568' }}
                >
                    {step.description}
                </p>
            </motion.div>

            {/* Visual - Responsive */}
            <motion.div
                initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 + 0.2 }}
                className="flex-1 flex items-center justify-center w-full px-4 sm:px-0"
            >
                <div
                    className="w-full max-w-sm sm:max-w-md h-48 sm:h-56 lg:h-64 rounded-xl sm:rounded-2xl flex items-center justify-center border-2"
                    style={{
                        background: 'linear-gradient(135deg, rgba(227, 244, 252, 0.5) 0%, #FFFFFF 100%)',
                        borderColor: 'rgba(80, 185, 232, 0.2)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)'
                    }}
                >
                    {/* Placeholder for step-specific visuals */}
                    <Icon
                        className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 opacity-20"
                        strokeWidth={1}
                        style={{ color: '#50B9E8' }}
                    />
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
        <section id="how-it-works" ref={ref} className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 overflow-hidden">
            {/* White Background with Subtle Blue Accents */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(247, 250, 252, 0.5) 50%, #FFFFFF 100%)',
                }}
            />

            {/* Connecting Line */}
            <div
                className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
                style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(80, 185, 232, 0.3), transparent)'
                }}
            />

            {/* Decorative Orb */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(80, 185, 232, 0.05)' }}
            />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Headline - Responsive */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 sm:mb-16 lg:mb-20 px-4"
                >
                    <h2
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: '#0A4D8B'
                        }}
                    >
                        Your Intelligent Co-pilot in Every Session.
                    </h2>
                    <p
                        className="text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#4A5568' }}
                    >
                        SynapseAI works seamlessly in the background, letting you focus on what matters most: your patient.
                    </p>
                </motion.div>

                {/* Steps - Responsive Spacing */}
                <div className="space-y-12 sm:space-y-16 lg:space-y-24">
                    {steps.map((step, index) => (
                        <StepCard key={step.number} step={step} index={index} inView={inView} />
                    ))}
                </div>
            </div>
        </section>
    );
}