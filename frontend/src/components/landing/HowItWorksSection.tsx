'use client';

import { motion } from 'framer-motion';
import { Mic, Brain, FileText } from 'lucide-react';

export default function HowItWorksSection() {
    const steps = [
        {
            number: '01',
            icon: Mic,
            title: 'Record with Clarity',
            description: 'Our integrated hardware and AI work together to accurately and securely capture every detail of the conversation.',
        },
        {
            number: '02',
            icon: Brain,
            title: 'Generate in Minutes',
            description: 'SynapseAI transcribes, structures, and analyzes the conversation, generating a comprehensive report.',
        },
        {
            number: '03',
            icon: FileText,
            title: 'Review & Export',
            description: 'Review your AI-generated report, make any necessary edits, and export in your preferred format.',
        },
    ];

    return (
        <section id="how-it-works" className="relative py-16 lg:py-24 overflow-hidden">
            {/* ============================================================================
                SUBTLE GRADIENT BACKGROUND
                ============================================================================ */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#F8FCFF] via-white to-[#F5FBFE]" />
                
                <div 
                    className="absolute top-0 -right-40 w-[600px] h-[600px] opacity-15"
                    style={{
                        background: 'radial-gradient(circle at 40% 40%, rgba(77, 184, 232, 0.15) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <div 
                    className="absolute bottom-0 -left-40 w-[700px] h-[700px] opacity-15"
                    style={{
                        background: 'radial-gradient(circle at 60% 50%, rgba(77, 184, 232, 0.12) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Your Intelligent Co-pilot in{' '}
                        <span className="text-[#4DB8E8]">Every Session</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        SynapseAI works seamlessly in the background, letting you focus on what matters most: your patient.
                    </p>
                </motion.div>

                {/* Steps - ZIG-ZAG LAYOUT */}
                <div className="space-y-16 lg:space-y-20">
                    {steps.map((step, index) => {
                        const isEven = index % 2 === 0;
                        
                        return (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                                    !isEven ? 'lg:grid-flow-dense' : ''
                                }`}
                            >
                                {/* Text Content */}
                                <div className={`space-y-4 ${!isEven ? 'lg:col-start-2' : ''}`}>
                                    {/* Step Number with Icon */}
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {/* Large step number background - smaller */}
                                            <span className="text-7xl md:text-8xl font-bold text-[#4DB8E8]/10 leading-none absolute -top-5 -left-2">
                                                {step.number}
                                            </span>
                                            {/* Icon badge - smaller */}
                                            <div className="relative bg-gradient-to-br from-[#4DB8E8]/20 to-[#3DA8D8]/20 p-3 rounded-xl backdrop-blur-sm border border-[#4DB8E8]/20 shadow-lg">
                                                <step.icon className="w-6 h-6 text-[#4DB8E8]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title - smaller */}
                                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Illustration/Visual - SMALLER CARDS */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}
                                >
                                    {/* Enhanced Card with Glassmorphism */}
                                    <div className="relative group">
                                        {/* Main card - reduced padding and height */}
                                        <div 
                                            className="relative rounded-2xl p-8 backdrop-blur-sm border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.9) 100%)',
                                            }}
                                        >
                                            {/* Gradient accent */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4DB8E8] to-[#3DA8D8] rounded-t-2xl" />
                                            
                                            {/* Illustration - smaller size */}
                                            <div className="flex items-center justify-center h-48 lg:h-56">
                                                <div className="relative">
                                                    {/* Icon container - smaller */}
                                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#4DB8E8]/20 to-[#3DA8D8]/20 flex items-center justify-center backdrop-blur-sm border border-[#4DB8E8]/30">
                                                        <step.icon className="w-16 h-16 text-[#4DB8E8]" />
                                                    </div>
                                                    
                                                    {/* Glow effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#4DB8E8]/20 to-transparent rounded-full blur-2xl" />
                                                </div>
                                            </div>

                                            {/* Hover glow */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#4DB8E8]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        {/* Floating shadow */}
                                        <div className="absolute -bottom-4 left-8 right-8 h-8 bg-gradient-to-b from-[#4DB8E8]/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
