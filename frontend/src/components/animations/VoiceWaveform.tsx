'use client';

import { motion } from 'framer-motion';

/**
 * VoiceWaveform Component
 * 
 * Advanced sound wave visualization inspired by modern voice recognition UIs
 * 
 * Features:
 * - Organic wave animation with variable amplitude
 * - Glowing particle trail system
 * - Smooth color gradients (synapseSkyBlue to synapseDarkBlue)
 * - GPU-accelerated rendering
 * - Pulsing microphone icon
 * - Ripple effects
 */
export default function VoiceWaveform() {
  return (
    <div className="relative w-full max-w-3xl mx-auto h-64 flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-synapseSkyBlue/10 to-transparent blur-3xl" />

      {/* Main Waveform Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Central Microphone Icon (Pulsing) */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute z-10"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-synapseSkyBlue to-synapseDarkBlue flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </motion.div>

        {/* Wave Bars (Symmetrical from center) */}
        <div className="flex items-center justify-center gap-1">
          {[...Array(40)].map((_, i) => {
            // Calculate distance from center (20 bars on each side)
            const distanceFromCenter = Math.abs(i - 20);

            // Amplitude decreases with distance from center
            const baseHeight = 100 - distanceFromCenter * 3;

            return (
              <motion.div
                key={i}
                animate={{
                  height: [
                    `${baseHeight * 0.3}%`,
                    `${baseHeight}%`,
                    `${baseHeight * 0.5}%`,
                    `${baseHeight * 0.8}%`,
                    `${baseHeight * 0.3}%`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.05, // Stagger effect
                }}
                className="w-1.5 bg-gradient-to-t from-synapseDarkBlue via-synapseSkyBlue to-synapseSkyBlue/50 rounded-full"
                style={{
                  minHeight: '20%',
                  filter: 'drop-shadow(0 0 8px rgba(80, 185, 232, 0.6))',
                }}
              />
            );
          })}
        </div>

        {/* Floating Particles (Glowing Orbs) */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full bg-synapseSkyBlue"
            animate={{
              x: [
                Math.cos(i * 30) * 150,
                Math.cos(i * 30 + Math.PI) * 150,
                Math.cos(i * 30) * 150,
              ],
              y: [
                Math.sin(i * 30) * 80,
                Math.sin(i * 30 + Math.PI) * 80,
                Math.sin(i * 30) * 80,
              ],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              filter: 'blur(2px)',
              boxShadow: '0 0 20px rgba(80, 185, 232, 0.8)',
            }}
          />
        ))}

        {/* Ripple Effect (Expanding Circles) */}
        {[1, 2, 3].map((_, i) => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute rounded-full border-2 border-synapseSkyBlue/30"
            animate={{
              width: [0, 400],
              height: [0, 400],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Bottom Text Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 text-center"
      >
        <p className="text-sm text-neutralGray-700 flex items-center justify-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-successGreen"
          />
          AI-Powered Voice Recognition
        </p>
      </motion.div>
    </div>
  );
}

