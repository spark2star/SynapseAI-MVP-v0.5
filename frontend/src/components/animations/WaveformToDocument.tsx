'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function WaveformToDocument() {
    const [animationPhase, setAnimationPhase] = useState<'waveform' | 'transition' | 'document'>('waveform');

    useEffect(() => {
        const timer1 = setTimeout(() => setAnimationPhase('transition'), 2000);
        const timer2 = setTimeout(() => setAnimationPhase('document'), 3500);
        const timer3 = setTimeout(() => setAnimationPhase('waveform'), 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [animationPhase]);

    return (
        <div className="relative w-full max-w-2xl mx-auto h-64 flex items-center justify-center">
            {/* Waveform Phase */}
            {animationPhase === 'waveform' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-end justify-center gap-1 h-32"
                >
                    {[...Array(24)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                height: [
                                    `${20 + Math.sin(i * 0.5) * 40}%`,
                                    `${60 + Math.sin(i * 0.5 + 1) * 40}%`,
                                    `${20 + Math.sin(i * 0.5 + 2) * 40}%`,
                                ],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: i * 0.05,
                            }}
                            className="w-2 bg-gradient-to-t from-[#0A4D8B] to-[#50B9E8] rounded-full"
                        />
                    ))}
                </motion.div>
            )}

            {/* Transition Phase - Synapse/Brain */}
            {animationPhase === 'transition' && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="relative"
                >
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        {/* Neural network nodes */}
                        <circle cx="60" cy="30" r="8" fill="#50B9E8" />
                        <circle cx="30" cy="60" r="8" fill="#50B9E8" />
                        <circle cx="90" cy="60" r="8" fill="#50B9E8" />
                        <circle cx="60" cy="90" r="8" fill="#0A4D8B" />

                        {/* Connecting lines with animation */}
                        <motion.line
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5 }}
                            x1="60" y1="30" x2="30" y2="60"
                            stroke="#50B9E8" strokeWidth="2"
                        />
                        <motion.line
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            x1="60" y1="30" x2="90" y2="60"
                            stroke="#50B9E8" strokeWidth="2"
                        />
                        <motion.line
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            x1="30" y1="60" x2="60" y2="90"
                            stroke="#0A4D8B" strokeWidth="2"
                        />
                        <motion.line
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            x1="90" y1="60" x2="60" y2="90"
                            stroke="#0A4D8B" strokeWidth="2"
                        />
                    </svg>
                </motion.div>
            )}

            {/* Document Phase */}
            {animationPhase === 'document' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-72 bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
                >
                    {/* Document Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                        <div className="w-10 h-10 bg-[#E3F4FC] rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#0A4D8B]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Session Report</p>
                            <p className="text-xs text-gray-600">Patient #12345</p>
                        </div>
                    </div>

                    {/* Document Lines with Animation */}
                    {[100, 85, 90, 75].map((width, i) => (
                        <motion.div
                            key={i}
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: `${width}%`, opacity: 1 }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            className="h-2 bg-gray-200 rounded mb-2"
                        />
                    ))}

                    {/* Checkmark */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        className="mt-4 flex items-center gap-2 text-[#10B981]"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Report Ready</span>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

