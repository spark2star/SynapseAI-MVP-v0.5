'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Clock, AlertTriangle, Frown } from 'lucide-react';

const problems = [
    {
        icon: Clock,
        title: 'Hours Lost',
        description: 'Spend hours on notes after your sessions are over.',
        color: 'text-[#50B9E8]',
        bgColor: 'bg-[#E3F4FC]',
    },
    {
        icon: AlertTriangle,
        title: 'Critical Risks',
        description: 'Worry about missing key details for medico-legal compliance.',
        color: 'text-[#F59E0B]',
        bgColor: 'bg-amber-50',
    },
    {
        icon: Frown,
        title: 'Clunky Software',
        description: 'Fight with generic EMRs not designed for mental health.',
        color: 'text-[#0A4D8B]',
        bgColor: 'bg-blue-50',
    },
];

export default function ProblemSection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section ref={ref} className="py-20 px-6 bg-[#F9FAFB]">
            <div className="max-w-6xl mx-auto">
                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold text-center text-[#0A4D8B] mb-16"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                    Stop Practicing Paperwork.
                </motion.h2>

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
                                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#50B9E8] h-full">
                                    {/* Icon */}
                                    <div className={`w-16 h-16 ${problem.bgColor} rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                                        <Icon className={`w-8 h-8 ${problem.color}`} strokeWidth={2} />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        {problem.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-base text-gray-600 leading-relaxed">
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

