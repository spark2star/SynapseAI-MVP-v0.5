'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

// Updated size classes for transparent logo - slightly larger for better visibility
const sizeClasses = {
  sm: 'h-6 w-6',     // enhanced visibility (24px)
  md: 'h-7 w-7',     // better proportion (28px) 
  lg: 'h-9 w-9',     // improved presence (36px)
  xl: 'h-11 w-11'    // professional scale (44px)
}

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl'
}

export default function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image - Transparent PNG (380x364) with true alpha channel for perfect blending */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/Logo-MVP-v0.5.png"
          alt="SynapseAI Logo"
          fill
          sizes="(max-width: 768px) 48px, 56px"
          className="object-contain transition-all duration-300"
          priority
        />
      </div>

      {/* Brand Text - Sized to match logo */}
      {showText && (
        <div>
          <h1 className={`font-bold ${textSizes[size]} text-neutral-900 dark:text-white leading-none transition-colors duration-300`}>
            Synapse<span className="text-sky-500 dark:text-sky-400">AI</span>
          </h1>
        </div>
      )}
    </div>
  )
}