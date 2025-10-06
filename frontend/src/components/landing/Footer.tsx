'use client';

import { useState, useEffect } from 'react';
import MouseFollowGlow from '@/components/animations/MouseFollowGlow';

export default function Footer() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <footer className="relative bg-[#0A4D8B] text-white py-12 px-6 overflow-hidden">
            {/* Mouse-Follow Glow Effect */}
            {mounted && <MouseFollowGlow color="rgba(80, 185, 232, 0.3)" />}

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    {/* Logo & Tagline */}
                    <div>
                        <img
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI"
                            className="w-20 h-20 ..."
                        />
                        <p className="text-white/70 text-sm">
                            Effortless Intelligence, Absolute Security.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-white/70">
                            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                            <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm text-white/70">
                            <li><a href="/demo" className="hover:text-white transition-colors">Request Demo</a></li>
                            <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                {/* Copyright - Full White Text */}
                <div className="border-t border-white/10 pt-8 text-center text-sm">
                    <p className="font-medium text-white">&copy; {new Date().getFullYear()} SynapseAI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

