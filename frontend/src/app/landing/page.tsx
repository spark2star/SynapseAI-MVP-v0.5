'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmittingContact, setIsSubmittingContact] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmittingEmail(true);
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (response.ok) {
                toast.success(
                    'Thank you for your curiosity! 🎉\n\nWe\'ll notify you as soon as SynapseAI is ready to revolutionize healthcare.',
                    {
                        duration: 5000,
                        style: {
                            background: '#f0f9ff',
                            border: '1px solid #0ea5e9',
                            padding: '16px',
                            color: '#0c4a6e',
                        },
                    }
                );
                setEmail('');
            } else {
                throw new Error('Failed to subscribe');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again later.');
        } finally {
            setIsSubmittingEmail(false);
        }
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
            toast.error('Please fill in all required fields.');
            return;
        }

        setIsSubmittingContact(true);
        try {
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm),
            });

            if (response.ok) {
                toast.success(
                    'Thank you for reaching out!\n\nWe appreciate your interest in SynapseAI. Our team will get back to you within 24 hours.',
                    {
                        duration: 5000,
                        style: {
                            background: '#f0f9ff',
                            border: '1px solid #0ea5e9',
                            color: '#0c4a6e',
                        },
                        iconTheme: {
                            primary: '#0ea5e9',
                            secondary: '#f0f9ff',
                        },
                    }
                );
                setContactForm({ name: '', email: '', subject: '', message: '' });
            } else {
                const errorData = await response.json();
                toast.error(`Failed to send message: ${errorData.message || 'Unknown error'}`, {
                    duration: 5000,
                    style: {
                        background: '#fff0f0',
                        border: '1px solid #ef4444',
                        color: '#7f1d1d',
                    },
                });
            }
        } catch (error) {
            toast.error('Network error. Please try again later.');
        } finally {
            setIsSubmittingContact(false);
        }
    };

    // Smooth scroll setup
    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => {
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    // Vision section auto-scroll
    useEffect(() => {
        const timer = setTimeout(() => {
            const slides = document.querySelectorAll('.vision-slide') as NodeListOf<HTMLElement>;
            console.log('🎯 Vision slides found:', slides.length);
            if (slides.length === 0) {
                console.error('❌ No vision slides found!');
                return;
            }

            let currentSlide = 0;
            let slideInterval: NodeJS.Timeout | null = null;

            function showSlide(index: number) {
                console.log('🔄 Showing slide:', index + 1);
                slides.forEach((slide, i) => {
                    if (slide) {
                        if (i === index) {
                            slide.style.opacity = '1';
                            slide.style.transform = 'translateY(0px)';
                        } else {
                            slide.style.opacity = '0';
                            slide.style.transform = 'translateY(10px)';
                        }
                    }
                });
            }

            function nextSlide() {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            }

            showSlide(0);
            console.log('🚀 Starting vision card carousel - cycling every 4 seconds');
            slideInterval = setInterval(() => {
                nextSlide();
            }, 4000);

            const visionSection = document.getElementById('vision');
            const pauseSlideShow = () => {
                if (slideInterval) {
                    clearInterval(slideInterval);
                    slideInterval = null;
                }
            };

            const resumeSlideShow = () => {
                if (!slideInterval) {
                    slideInterval = setInterval(nextSlide, 4000);
                }
            };

            if (visionSection) {
                visionSection.addEventListener('mouseenter', pauseSlideShow);
                visionSection.addEventListener('mouseleave', resumeSlideShow);
            }

            return () => {
                if (slideInterval) clearInterval(slideInterval);
                if (visionSection) {
                    visionSection.removeEventListener('mouseenter', pauseSlideShow);
                    visionSection.removeEventListener('mouseleave', resumeSlideShow);
                }
            };
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <div className="text-black bg-slate-50" style={{ colorScheme: 'light', color: '#000000' }}>
                {/* Header */}
                <header className="sticky top-0 left-0 right-0 z-20 py-4 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-sm border-b border-slate-200">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/logo-transparent-manual.png"
                                alt="SynapseAI Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                            />
                            <h1 className="text-2xl font-bold text-black" style={{ color: '#000000' }}>SynapseAI</h1>
                        </Link>
                        <nav className="hidden md:flex items-center space-x-6">
                            <a href="#vision" className="scroll-smooth text-black hover:text-sky-500 transition-colors" style={{ color: '#000000' }}>Vision</a>
                            <a href="#contact" className="scroll-smooth text-black hover:text-sky-500 transition-colors" style={{ color: '#000000' }}>Contact</a>
                            <Link href="/auth/login" className="ml-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600 transition-all shadow-sm">
                                Wanna see a demo?
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
                    {/* Decorative background circles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -left-10 w-48 h-48 md:w-96 md:h-96 bg-sky-100 rounded-full opacity-50 animate-pulse"></div>
                        <div className="absolute top-20 -right-10 w-32 h-32 md:w-64 md:h-64 bg-blue-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute -bottom-10 left-1/3 w-40 h-40 md:w-80 md:h-80 bg-indigo-100 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

                        {/* Medical cross patterns */}
                        <div className="hidden md:block absolute top-1/4 right-1/4 w-8 h-8 text-sky-200 transform rotate-45" style={{ animationDelay: '0.5s' }}>
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="hidden md:block absolute bottom-1/4 left-1/4 w-6 h-6 text-blue-200 transform rotate-12">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </div>

                        {/* Trust and innovation dots */}
                        <div className="hidden md:block absolute top-1/3 left-1/5">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-emerald-300 rounded-full opacity-60"></div>
                                <div className="w-2 h-2 bg-emerald-300 rounded-full opacity-40"></div>
                                <div className="w-2 h-2 bg-emerald-300 rounded-full opacity-20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto text-center relative z-10">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight" style={{ color: '#000000' }}>
                            Revolutionizing Healthcare with
                            <span className="text-sky-500 block mt-2">Artificial Intelligence</span>
                        </h1>
                        <p className="text-lg md:text-xl text-black mb-8 max-w-3xl mx-auto leading-relaxed" style={{ color: '#000000' }}>
                            SynapseAI transforms medical consultations with intelligent speech recognition,
                            real-time transcription, and AI-powered insights for healthcare professionals.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/auth/login" className="inline-flex items-center justify-center px-6 py-3 border border-sky-500 text-base font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600 transition-all shadow-sm">
                                <span>Wanna see a demo?</span>
                                <svg className="ml-2 -mr-1 h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </div>

                        {/* Newsletter Signup */}
                        <div className="mt-8 bg-sky-50 rounded-lg p-6 max-w-md mx-auto">
                            <h3 className="text-lg font-semibold text-black mb-3" style={{ color: '#000000' }}>Get Early Access</h3>
                            <form onSubmit={handleEmailSubmit} className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500"
                                    style={{ backgroundColor: 'white', color: '#000000' }}
                                    disabled={isSubmittingEmail}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmittingEmail}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50"
                                >
                                    {isSubmittingEmail ? '...' : 'Notify Me'}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Vision Section */}
                <section id="vision" className="py-20 bg-slate-100">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-12" style={{ color: '#000000' }}>Our Vision</h2>
                        <div className="relative bg-white rounded-xl p-8 shadow-lg min-h-[200px]">
                            <div className="vision-slide opacity-0 transition-all duration-500">
                                <h3 className="text-xl font-semibold text-black mb-4" style={{ color: '#000000' }}>Intelligent Documentation</h3>
                                <p className="text-black leading-relaxed" style={{ color: '#000000' }}>
                                    Transform medical conversations into structured, actionable documentation with our advanced AI-powered transcription and analysis system.
                                </p>
                            </div>
                            <div className="vision-slide opacity-0 transition-all duration-500 absolute top-8 left-8 right-8">
                                <h3 className="text-xl font-semibold text-black mb-4" style={{ color: '#000000' }}>Seamless Workflow</h3>
                                <p className="text-black leading-relaxed" style={{ color: '#000000' }}>
                                    Integrate effortlessly with existing healthcare systems while reducing administrative burden and improving patient care quality.
                                </p>
                            </div>
                            <div className="vision-slide opacity-0 transition-all duration-500 absolute top-8 left-8 right-8">
                                <h3 className="text-xl font-semibold text-black mb-4" style={{ color: '#000000' }}>Privacy First</h3>
                                <p className="text-black leading-relaxed" style={{ color: '#000000' }}>
                                    Built with healthcare security standards in mind, ensuring patient data privacy and compliance with medical regulations.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-12" style={{ color: '#000000' }}>Features</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg hover:shadow-xl transition-all duration-300 border border-blue-100 group">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-black mb-4" style={{ color: '#000000' }}>Real-time Transcription</h3>
                                <p className="text-black mb-4" style={{ color: '#000000' }}>
                                    Convert speech to text instantly with high accuracy, supporting multiple languages including Hindi, Marathi, and English.
                                </p>
                                <div className="inline-flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    HIPAA Compliant
                                </div>
                            </div>
                            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-xl transition-all duration-300 border border-purple-100 group">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 text-white rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-black mb-4" style={{ color: '#000000' }}>AI-Powered Analysis</h3>
                                <p className="text-black mb-4" style={{ color: '#000000' }}>
                                    Generate intelligent medical reports and insights using advanced natural language processing and medical knowledge.
                                </p>
                                <div className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Doctor Approved
                                </div>
                            </div>
                            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg hover:shadow-xl transition-all duration-300 border border-emerald-100 group">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 text-white rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-black mb-4" style={{ color: '#000000' }}>Secure & Compliant</h3>
                                <p className="text-black mb-4" style={{ color: '#000000' }}>
                                    Enterprise-grade encryption and access controls ensure patient data protection with full regulatory compliance.
                                </p>
                                <div className="inline-flex items-center text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                    Bank-Level Security
                                </div>
                            </div>
                        </div>

                        {/* Trust Badge Section */}
                        <div className="mt-16 pt-12 border-t border-gray-200">
                            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>HIPAA Compliant</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>ISO 27001 Certified</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Doctor Approved</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                    </svg>
                                    <span>Enterprise Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-20 bg-slate-100">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-12" style={{ color: '#000000' }}>Contact Us</h2>
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <form onSubmit={handleContactSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2" style={{ color: '#000000' }}>
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                            style={{ backgroundColor: 'white', color: '#000000' }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2" style={{ color: '#000000' }}>
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                            style={{ backgroundColor: 'white', color: '#000000' }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2" style={{ color: '#000000' }}>
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={contactForm.subject}
                                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                        style={{ backgroundColor: 'white', color: '#000000' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2" style={{ color: '#000000' }}>
                                        Message *
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                                        style={{ backgroundColor: 'white', color: '#000000' }}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingContact}
                                    className="w-full py-3 px-4 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmittingContact ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-800 text-white py-8">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p style={{ color: '#ffffff' }}>&copy; 2024 SynapseAI. All rights reserved.</p>
                    </div>
                </footer>
            </div>
            <Toaster position="top-right" />
        </>
    );
}
