'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * ParallaxBackground Component - HIGHLY VISIBLE VERSION
 * 
 * Enhanced multi-layered animated background with:
 * 1. Increased opacity for better visibility
 * 2. Stronger gradient overlays
 * 3. More prominent floating orbs
 * 4. Visible grid pattern
 * 5. Scroll-triggered parallax motion for depth
 * 
 * Performance: GPU-accelerated, 60fps animations
 * Accessibility: Respects prefers-reduced-motion
 */
export default function ParallaxBackground() {
    const [mounted, setMounted] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Framer Motion scroll hooks for parallax effect
    const { scrollY } = useScroll();

    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
    const y3 = useTransform(scrollY, [0, 1000], [0, 100]);

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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* ============================================================================
                LAYER 1: BASE GRADIENT - SUBTLE BUT VISIBLE
                ============================================================================ */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, #F7FAFC 0%, #E3F4FC 50%, #F7FAFC 100%)',
                }}
            />

            {/* ============================================================================
                LAYER 2: HIGHLY VISIBLE Floating Orbs
                ============================================================================ */}
            <motion.div
                className="absolute -top-40 -left-40 rounded-full blur-3xl"
                style={{
                    width: '500px',
                    height: '500px',
                    backgroundColor: 'rgba(80, 185, 232, 0.25)', // MORE OPACITY
                    y: prefersReducedMotion ? 0 : y1,
                }}
            />

            <motion.div
                className="absolute top-20 right-20 rounded-full blur-2xl"
                style={{
                    width: '400px',
                    height: '400px',
                    backgroundColor: 'rgba(10, 77, 139, 0.2)', // MORE OPACITY
                    y: prefersReducedMotion ? 0 : y2,
                }}
            />

            <motion.div
                className="absolute bottom-10 left-10 rounded-full blur-xl"
                style={{
                    width: '350px',
                    height: '350px',
                    backgroundColor: 'rgba(80, 185, 232, 0.3)', // MORE OPACITY
                    y: prefersReducedMotion ? 0 : y3,
                }}
            />

            {/* ============================================================================
                LAYER 3: MESH GRADIENT OVERLAY - MORE VISIBLE
                ============================================================================ */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(at 25% 35%, rgba(80, 185, 232, 0.15) 0px, transparent 50%),
                        radial-gradient(at 75% 25%, rgba(10, 77, 139, 0.12) 0px, transparent 50%),
                        radial-gradient(at 45% 75%, rgba(80, 185, 232, 0.10) 0px, transparent 50%)
                    `,
                }}
            />

            {/* ============================================================================
                LAYER 4: GRID PATTERN - VISIBLE
                ============================================================================ */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(80, 185, 232, 0.08) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(80, 185, 232, 0.08) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />
        </div>
    );
}