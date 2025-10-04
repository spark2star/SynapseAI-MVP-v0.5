'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * ScrollProgressBar Component
 * 
 * Displays a fixed progress bar at the top of the page that fills as the user scrolls.
 * Uses Framer Motion for smooth spring animations.
 * 
 * Features:
 * - Smooth spring physics for natural movement
 * - Gradient color (synapseSkyBlue → synapseDarkBlue)
 * - Fixed positioning at top of viewport
 * - GPU-accelerated transforms
 */
export default function ScrollProgressBar() {
    const { scrollYProgress } = useScroll();

    // Apply spring physics for smooth animation
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-synapseSkyBlue to-synapseDarkBlue origin-left z-50"
            style={{ scaleX }}
        />
    );
}
