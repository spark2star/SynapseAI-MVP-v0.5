'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Button from '@/components/ui/Button';
import { ArrowRight, Mail } from 'lucide-react';

export default function CTASection() {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section id="demo" ref={ref} className="py-24 px-6 bg-gradient-to-br from-[#0A4D8B] via-[#50B9E8] to-[#0A4D8B] relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-10">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3 + i * 0.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute w-2 h-2 bg-white rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-6"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                    See the Difference in Your First Session.
                </motion.h2>

                {/* Sub-headline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto"
                >
                    Reduce documentation time, eliminate compliance risks, and dedicate your full attention to patient care.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => window.location.href = 'mailto:demo@synapseai.com'}
                        className="shadow-2xl"
                    >
                        <span>Request a Free Demo</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <a
                        href="mailto:contact@synapseai.com"
                        className="text-white/90 hover:text-white font-medium flex items-center gap-2 transition-colors"
                    >
                        <Mail className="w-5 h-5" />
                        <span>Have questions? Contact us</span>
                    </a>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-12 flex flex-wrap justify-center gap-8 text-white/80 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Setup in under 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Cancel anytime</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

