'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Clock, AlertTriangle, Frown } from 'lucide-react';

const problems = [
    {
        icon: Clock,
        title: 'Hours Lost',
        description: 'Spend hours on notes after your sessions are over.',
        color: '#50B9E8',
        bgColor: 'rgba(80, 185, 232, 0.1)',
    },
    {
        icon: AlertTriangle,
        title: 'Critical Risks',
        description: 'Worry about missing key details for medico-legal compliance.',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
        icon: Frown,
        title: 'Clunky Software',
        description: 'Fight with generic EMRs not designed for mental health.',
        color: '#0A4D8B',
        bgColor: 'rgba(10, 77, 139, 0.1)',
    },
];

export default function ProblemSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section ref={ref} className="relative py-24 px-6 overflow-hidden">
            {/* Subtle Blue Background with Gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, #F7FAFC 0%, rgba(227, 244, 252, 0.3) 50%, #F7FAFC 100%)',
                }}
            />

            {/* Decorative Orbs */}
            <div
                className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(80, 185, 232, 0.08)' }}
            />
            <div
                className="absolute bottom-20 left-10 w-96 h-96 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(10, 77, 139, 0.08)' }}
            />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold text-center mb-4"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        color: '#0A4D8B'
                    }}
                >
                    Stop Practicing Paperwork.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg text-center mb-16 max-w-3xl mx-auto"
                    style={{ color: '#4A5568' }}
                >
                    You became a psychiatrist to help people, not to drown in documentation.
                </motion.p>

                {/* Three-Column Layout */}
                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => {
                        const Icon = problem.icon;
                        return (
                            <motion.div
                                key={problem.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                className="group"
                            >
                                <div
                                    className="bg-white rounded-2xl p-8 h-full transition-all duration-300 border-2"
                                    style={{
                                        borderColor: 'transparent',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = problem.color;
                                        e.currentTarget.style.boxShadow = `0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`;
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Icon */}
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                                        style={{ backgroundColor: problem.bgColor }}
                                    >
                                        <Icon
                                            className="w-8 h-8"
                                            strokeWidth={2}
                                            style={{ color: problem.color }}
                                        />
                                    </div>

                                    {/* Title */}
                                    <h3
                                        className="text-2xl font-bold mb-3"
                                        style={{
                                            fontFamily: 'Poppins, sans-serif',
                                            color: '#1A202C'
                                        }}
                                    >
                                        {problem.title}
                                    </h3>

                                    {/* Description */}
                                    <p
                                        className="text-base leading-relaxed"
                                        style={{ color: '#4A5568' }}
                                    >
                                        {problem.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}