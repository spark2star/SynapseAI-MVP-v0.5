'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MouseFollowGlow({ color = 'rgba(80, 185, 232, 0.3)' }: { color?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30 });
    const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
                background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${color}, transparent 80%)`,
                ['--mouse-x' as any]: smoothX,
                ['--mouse-y' as any]: smoothY,
            }}
        />
    );
}

