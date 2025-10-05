'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * VoiceWaveform Component - HIGHLY VISIBLE VERSION
 * 
 * Enhanced visibility with:
 * - Larger, more prominent microphone icon
 * - Highly visible wave bars with strong colors
 * - More prominent floating particles
 * - Better contrast and visual impact
 */
export default function VoiceWaveform() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full max-w-3xl mx-auto h-64 flex items-center justify-center">
      {/* Background Glow - MORE VISIBLE */}
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(80, 185, 232, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Central Microphone Icon - HIGHLY VISIBLE */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute z-10"
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #50B9E8 0%, #0A4D8B 100%)',
          }}
        >
          <svg className="w-12 h-12" fill="white" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
      </motion.div>

      {/* Sound Wave Bars - HIGHLY VISIBLE */}
      <div className="flex items-center justify-center gap-1.5">
        {[...Array(40)].map((_, i) => {
          const distanceFromCenter = Math.abs(i - 20);
          const baseHeight = 100 - distanceFromCenter * 2.5;

          return (
            <motion.div
              key={i}
              animate={{
                height: [
                  `${baseHeight * 0.4}%`,
                  `${baseHeight}%`,
                  `${baseHeight * 0.6}%`,
                  `${baseHeight * 0.9}%`,
                  `${baseHeight * 0.4}%`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.05,
              }}
              className="w-2 rounded-full"
              style={{
                minHeight: '30%',
                background: 'linear-gradient(to top, #0A4D8B, #50B9E8)',
                boxShadow: '0 0 10px rgba(80, 185, 232, 0.5)',
              }}
            />
          );
        })}
      </div>

      {/* Floating Particles - MORE VISIBLE */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: '#50B9E8',
            boxShadow: '0 0 15px rgba(80, 185, 232, 0.8)',
          }}
          animate={{
            x: [
              Math.cos(i * 30) * 180,
              Math.cos(i * 30 + Math.PI) * 180,
              Math.cos(i * 30) * 180,
            ],
            y: [
              Math.sin(i * 30) * 90,
              Math.sin(i * 30 + Math.PI) * 90,
              Math.sin(i * 30) * 90,
            ],
            opacity: [0.4, 0.9, 0.4],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Ripple Circles - MORE VISIBLE */}
      {[1, 2, 3].map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full"
          style={{
            border: '2px solid rgba(80, 185, 232, 0.4)',
          }}
          animate={{
            width: [0, 450],
            height: [0, 450],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* "Listening..." Indicator - DARK TEXT */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 text-center"
      >
        <p className="text-body flex items-center justify-center gap-2"
          style={{ color: '#4A5568' }}
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#38A169' }}
          />
          Listening...
        </p>
      </motion.div>
    </div>
  );
}