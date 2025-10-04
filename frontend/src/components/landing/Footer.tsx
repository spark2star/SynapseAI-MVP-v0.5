'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
                        <Image
                            src="/Logo-MVP-v0.5.png"
                            alt="SynapseAI"
                            width={150}
                            height={32}
                            className="h-8 w-auto mb-4 brightness-0 invert"
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

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-white/70">
                            <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="mailto:contact@synapseai.com" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50">
                    <p>&copy; {new Date().getFullYear()} SynapseAI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

