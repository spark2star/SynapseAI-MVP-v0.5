'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * ParallaxBackground Component
 * 
 * Enhanced multi-layered animated background with:
 * 1. Animated gradient base layer with mesh overlay (Dia Browser style)
 * 2. Multiple floating blurred shapes at different depths
 * 3. Scroll-triggered parallax motion for depth perception
 * 4. Subtle grid pattern and noise texture
 * 5. Vignette effect for focus
 * 
 * Performance: GPU-accelerated, 60fps animations
 * Accessibility: Respects prefers-reduced-motion
 */
export default function ParallaxBackground() {
    const [mounted, setMounted] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Framer Motion scroll hooks for parallax effect
    const { scrollY } = useScroll();

    // Multiple parallax layers at different speeds for depth
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);   // Slowest (furthest back)
    const y2 = useTransform(scrollY, [0, 1000], [0, -150]);  // Medium speed
    const y3 = useTransform(scrollY, [0, 1000], [0, 100]);   // Faster (closer)

    useEffect(() => {
        setMounted(true);

        // Check for reduced motion preference (accessibility)
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = () => {
            setPrefersReducedMotion(mediaQuery.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Don't render on server to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            {/* ============================================================================
          LAYER 1: BASE GRADIENT (Animated)
          ============================================================================ */}
            <div
                className={`absolute inset-0 bg-gradient-to-br from-white via-synapseSkyBlue/5 to-synapseDarkBlue/10 ${prefersReducedMotion ? '' : 'animate-gradientMove'
                    }`}
                style={{ backgroundSize: '400% 400%' }}
            />

            {/* ============================================================================
          LAYER 2: MESH GRADIENT OVERLAY (Dia Browser Style)
          ============================================================================ */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: `
            radial-gradient(at 20% 30%, rgba(80, 185, 232, 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 20%, rgba(10, 77, 139, 0.12) 0px, transparent 50%),
            radial-gradient(at 40% 70%, rgba(80, 185, 232, 0.10) 0px, transparent 50%),
            radial-gradient(at 90% 80%, rgba(10, 77, 139, 0.08) 0px, transparent 50%)
          `,
                }}
                aria-hidden="true"
            />

            {/* ============================================================================
          LAYER 3: FLOATING ORBS (Multiple sizes for depth)
          ============================================================================ */}
            {/* Large orb - far back */}
            <motion.div
                className={`absolute -top-40 -left-40 w-[600px] h-[600px] bg-synapseSkyBlue/8 rounded-full blur-3xl ${prefersReducedMotion ? '' : 'animate-float'
                    }`}
                style={{
                    y: prefersReducedMotion ? 0 : y1,
                    willChange: 'transform',
                }}
                aria-hidden="true"
            />

            {/* Medium orb - middle layer */}
            <motion.div
                className={`absolute top-20 right-10 w-96 h-96 bg-synapseDarkBlue/10 rounded-full blur-2xl ${prefersReducedMotion ? '' : 'animate-float-delay'
                    }`}
                style={{
                    y: prefersReducedMotion ? 0 : y2,
                    willChange: 'transform',
                }}
                aria-hidden="true"
            />

            {/* Small orb - closest */}
            <motion.div
                className={`absolute bottom-20 left-20 w-64 h-64 bg-synapseSkyBlue/15 rounded-full blur-xl ${prefersReducedMotion ? '' : 'animate-float'
                    }`}
                style={{
                    y: prefersReducedMotion ? 0 : y3,
                    willChange: 'transform',
                }}
                aria-hidden="true"
            />

            {/* ============================================================================
          LAYER 4: SUBTLE GRID PATTERN (Depth cue)
          ============================================================================ */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(80, 185, 232, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80, 185, 232, 0.3) 1px, transparent 1px)
          `,
                    backgroundSize: '80px 80px',
                }}
                aria-hidden="true"
            />

            {/* ============================================================================
          LAYER 5: NOISE TEXTURE (Adds richness)
          ============================================================================ */}
            <div
                className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
                }}
                aria-hidden="true"
            />

            {/* ============================================================================
          LAYER 6: VIGNETTE EFFECT (Focuses attention center)
          ============================================================================ */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 77, 139, 0.1) 100%)',
                }}
                aria-hidden="true"
            />
        </div>
    );
}

